import { useState, useEffect } from "react";
import "./App.css";

import WebsitePreview from "./components/WebsitePreview";
import TemplateSelector from "./components/TemplateSelector";
import VoiceInput from "./components/VoiceInput";
import FloatingShapes from "./components/FloatingShapes";
import logoImg from "./assets/logo.png";
import logoDarkImg from "./assets/logo-dark.png";
import logoMarkImg from "./assets/logo-mark.png";
import {
  checkHealth,
  extractBusinessInfo,
  updateBusinessInfo,
  generateWebsiteContent as apiGenerateWebsiteContent,
  API_BASE_URL,
} from "./api";

const questions = {
  business_name: "What is the official name of your business?",
  category: "What category or industry best describes your business?",
  location: "Where is your business physically located or operating?",
  contact: "Please enter your official business phone number or email address (Compulsory):",
};

const SAMPLE_PROMPTS = [
  {
    label: "Artisan Cafe",
    text: "I run an artisan coffee roastery and bakery called Bean & Bloom in Bandra, Mumbai. We operate from 7:30 AM to 10:00 PM every day. We serve handcrafted espresso, single-origin pour-overs, organic sourdough croissants, and vegan pastries. Contact us at hello@beanandbloom.in.",
  },
  {
    label: "Cyber Cafe",
    text: "Mera naam Harsh hai. Mai Harsh Cyber Cafe chalata hu CG Road Ahmedabad mai. We are open 9:00 AM to 10:00 PM. Hum high-speed internet, color printing, document scanning, passport photo, aur online exam form submission services provide karte hai. Phone: +91 9876543210.",
  },
  {
    label: "Wellness Spa",
    text: "We run a luxury holistic wellness and Ayurvedic therapy sanctuary called Nirvana Spa in Indiranagar, Bengaluru. Open Tuesday to Sunday from 8:00 AM to 8:30 PM. We offer deep tissue massage, organic herbal facials, steam baths, and sound meditation. Reach us at booking@nirvanaspa.com.",
  },
  {
    label: "Financial Advisory",
    text: "Harsh Capital is a premier financial planning and wealth advisory firm located in Connaught Place, New Delhi. Open Monday to Friday 9:30 AM to 6:30 PM. We specialize in mutual fund portfolio management, tax advisory, retirement planning, and corporate insurance. Contact: contact@harshcapital.com.",
  },
];

// ----------------------------------------------------
// Client-side Input Validation Heuristics
// Rejects keyboard mash, pure numbers, and off-topic prompts
// ----------------------------------------------------
function validateInputHeuristics(text) {
  const clean = text.trim();
  if (!clean) {
    return { valid: false, error: "Please describe your business in a few sentences to get started." };
  }
  if (clean.length < 15) {
    return { valid: false, error: "Your description is too brief. Please share at least 2-3 sentences about your business name, what services or products you offer, and where you are located." };
  }

  // Pure numbers or punctuation
  if (/^[\d\s.,!?:;+\-()]+$/.test(clean)) {
    return { valid: false, error: "Your input consists entirely of numbers or punctuation. Please describe your business in words (e.g., 'We operate an artisan bakery in Bandra baking fresh sourdough croissants and pour-over coffee')." };
  }

  // Keyboard walk detection
  const lower = clean.toLowerCase().replace(/[^a-z0-9]/g, "");
  const walks = ["asdfghjkl", "qwertyuiop", "zxcvbnm", "12345678", "09876543", "lkjhgfdsa", "poiuytrewq"];
  for (const walk of walks) {
    if (lower.includes(walk)) {
      return { valid: false, error: "The input appears to contain keyboard mash (e.g., 'asdfghjkl'). Please provide genuine details about your business." };
    }
  }

  // Repeated character spam (e.g., 'aaaaa', 'zzzzz')
  if (/([a-zA-Z])\1{3,}/.test(clean)) {
    return { valid: false, error: "Your description contains repeated spam characters. Please describe your actual business services or products." };
  }

  // Consonant clusters with zero vowels in longer words (e.g., 'ajhsdahj', 'sdkfjhsdf')
  const words = clean.split(/\s+/).filter((w) => w.length >= 5);
  const vowels = /[aeiouyAEIOUY]/;
  const gibberishWords = words.filter((w) => {
    const lettersOnly = w.replace(/[^a-zA-Z]/g, "");
    return lettersOnly.length >= 6 && !vowels.test(lettersOnly);
  });
  if (gibberishWords.length > 0 && gibberishWords.length >= words.length * 0.5) {
    return { valid: false, error: "Your text contains unrecognized random keystrokes. Please tell us about your actual business." };
  }

  // Off-topic general queries
  const offTopicPatterns = [
    /^(who is|what is|tell me a joke|write python|how to code|who won)/i,
    /^(translate this|summarize|write an essay|solve this math)/i,
  ];
  if (offTopicPatterns.some((p) => p.test(clean))) {
    return { valid: false, error: "MakeSite is built specifically to generate websites for businesses, shops, and professional services. Please describe your business or commercial enterprise." };
  }

  return { valid: true };
}

// Recommend template dynamically based on trade category
function recommendTemplateForCategory(cat) {
  if (!cat) return "warm-artisan";
  const c = String(cat).toLowerCase();
  if (c.includes("cafe") || c.includes("coffee") || c.includes("bakery") || c.includes("restaurant") || c.includes("bistro") || c.includes("tea") || c.includes("chai")) return "warm-artisan";
  if (c.includes("spa") || c.includes("salon") || c.includes("wellness") || c.includes("clinic") || c.includes("yoga") || c.includes("massage") || c.includes("beauty")) return "emerald-wellness";
  if (c.includes("finance") || c.includes("wealth") || c.includes("capital") || c.includes("consult") || c.includes("tax") || c.includes("legal") || c.includes("advisory")) return "corporate-pro";
  if (c.includes("tech") || c.includes("cyber") || c.includes("software") || c.includes("dev") || c.includes("it")) return "tech-bold";
  if (c.includes("boutique") || c.includes("design") || c.includes("studio") || c.includes("fashion")) return "minimal-clean";
  return "warm-artisan";
}

function App() {
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [showWebsite, setShowWebsite] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("warm-artisan");
  const [websiteContent, setWebsiteContent] = useState(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [clarificationError, setClarificationError] = useState("");
  const [isValidatingClarification, setIsValidatingClarification] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [apiHealth, setApiHealth] = useState({ status: "checking", groq: false });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [confirmedFields, setConfirmedFields] = useState(new Set(["business_name", "location"]));
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("makesite-theme") || "dark";
    }
    return "dark";
  });

  // Toggle owner confirmation for a field
  const handleToggleConfirmField = (field) => {
    setConfirmedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("makesite-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Ping backend health on mount
  useEffect(() => {
    checkHealth()
      .then((data) => {
        if (data) {
          setApiHealth({
            status: data.status === "healthy" ? "healthy" : "degraded",
            groq: data.groq_api_status === "configured",
            version: data.version,
          });
        }
      })
      .catch(() => {
        setApiHealth({ status: "offline", groq: false });
      });
  }, []);

  // --------------------------------
  // Extract Business Information
  // --------------------------------
  const handleSubmit = async () => {
    const heuristicCheck = validateInputHeuristics(description);
    if (!heuristicCheck.valid) {
      setDescriptionError(heuristicCheck.error);
      return;
    }

    setLoading(true);
    setLoadingStage("Analyzing trade brief & verifying facts...");
    setDescriptionError("");
    setResult(null);
    setCurrentField(null);
    setClarificationAnswer("");
    setClarificationError("");
    setWebsiteContent(null);

    try {
      const data = await extractBusinessInfo(description);

      setResult(data);

      // Auto-recommend template based on trade category
      if (data.data?.category) {
        setSelectedTemplate(recommendTemplateForCategory(data.data.category));
      }

      // Pre-confirm fields that are properly formatted
      const preConfirmed = new Set(
        ["business_name", "category", "location", "hours", "contact"].filter(
          (k) => data.data?.[k] && String(data.data[k]).trim().length >= 3
        )
      );
      setConfirmedFields(preConfirmed);

      const missing = [...(data.missing_fields || [])];
      // Strictly guarantee contact is treated as compulsory
      if (!data.data?.contact || !String(data.data.contact).trim()) {
        if (!missing.includes("contact")) {
          missing.push("contact");
        }
      }

      if (missing.length > 0) {
        setCurrentField(missing[0]);
      } else {
        setCurrentField(null);
      }
    } catch (err) {
      console.error("Extraction error:", err);
      const reqInfo = err.requestId ? ` (Request ID: ${err.requestId})` : "";
      if (err.status && err.detail) {
        setDescriptionError(`${err.detail}${reqInfo}`);
      } else {
        setDescriptionError(
          `Unable to connect to MakeSite AI backend. Ensure backend is running at ${API_BASE_URL}.${reqInfo}`
        );
      }
      setResult(null);
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  // --------------------------------
  // Clarification Input Submission (Smart Validation)
  // --------------------------------
  const handleClarificationSubmit = async () => {
    if (!clarificationAnswer.trim() || isValidatingClarification) return;

    setIsValidatingClarification(true);
    setClarificationError("");

    try {
      const data = await updateBusinessInfo(
        result.data,
        currentField,
        clarificationAnswer.trim()
      );

      // Validated successfully!
      const missing = [...(data.missing_fields || [])];
      if (!data.data?.contact || !String(data.data.contact).trim()) {
        if (!missing.includes("contact")) {
          missing.push("contact");
        }
      }

      setResult({
        ...result,
        data: data.data,
        missing_fields: missing,
        is_complete: missing.length === 0,
      });

      setClarificationAnswer("");
      setClarificationError("");

      if (missing.length > 0) {
        setCurrentField(missing[0]);
      } else {
        setCurrentField(null);
      }
    } catch (err) {
      console.error("Clarification update error:", err);
      const reqInfo = err.requestId ? ` [Ref: ${err.requestId}]` : "";
      setClarificationError(
        `${err.detail || `Invalid ${currentField.replace("_", " ")}. Please try again.`}${reqInfo}`
      );
    } finally {
      setIsValidatingClarification(false);
    }
  };

  // --------------------------------
  // Generate Website Content
  // --------------------------------
  const generateWebsiteContent = async () => {
    if (!result?.data) return;

    // Compulsory validation guard
    const required = ["business_name", "category", "location", "contact"];
    const missing = required.filter(
      (f) => !result.data[f] || !String(result.data[f]).trim()
    );
    if (missing.length > 0) {
      setCurrentField(missing[0]);
      alert(
        `The following required business information is missing or invalid: ${missing
          .map((f) => f.replace("_", " "))
          .join(", ")}. Please provide all required details before generating the website.`
      );
      return;
    }

    setLoading(true);
    setLoadingStage("Generating website content...");

    try {
      const data = await apiGenerateWebsiteContent(result.data);
      setWebsiteContent(data.content);
      setShowTemplates(true);
    } catch (err) {
      console.error("Content generation error:", err);
      // Fallback content so user can proceed
      setWebsiteContent({
        hero_title: `Welcome to ${result.data.business_name || "Our Business"}`,
        hero_description: `Premier ${result.data.category || "service"} provider proudly based in ${result.data.location || "your community"}.`,
        cta: "Connect With Our Team",
        about: `${result.data.business_name || "Our business"} is dedicated to delivering excellence, precision, and reliable customer service across ${result.data.location || "the region"}.`,
        services: (result.data.products || []).map((p) => ({
          name: typeof p === "string" ? p : "Service Offering",
          description: `Professional, dependable ${p} delivered with expert care.`,
        })),
        features: [
          {
            title: "Verified Excellence",
            description: "High-grade service standards with transparent client care.",
          },
          {
            title: "Locally Established",
            description: `Proudly operating in ${result.data.location || "the area"}.`,
          },
          {
            title: "Direct Communication",
            description: "Direct assistance with fast, responsive support.",
          },
        ],
        faqs: [
          {
            question: `Where are you located?`,
            answer: `Find us in ${result.data.location || "our central location"}. Operating hours: ${result.data.hours || "regular hours"}.`,
          },
          {
            question: `How do I reach out?`,
            answer: `You can reach out directly via ${result.data.contact || "our contact options"} or visit us during hours.`,
          },
        ],
      });
      setShowTemplates(true);
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  const handleFieldChange = (field, value) => {
    setResult((prev) => {
      const updatedData = {
        ...prev.data,
        [field]: value,
      };
      const required = ["business_name", "category", "location", "contact"];
      const missing = required.filter(
        (f) => !updatedData[f] || !String(updatedData[f]).trim()
      );
      return {
        ...prev,
        data: updatedData,
        missing_fields: missing,
        is_complete: missing.length === 0,
      };
    });
  };

  const handleStartAgain = () => {
    setResult(null);
    setDescription("");
    setDescriptionError("");
    setShowWebsite(false);
    setShowTemplates(false);
    setWebsiteContent(null);
    setCurrentField(null);
    setClarificationAnswer("");
    setClarificationError("");
    setIsEditingInfo(false);
  };

  // Active step calculation (1..4)
  const getActiveStep = () => {
    if (showWebsite) return 4;
    if (showTemplates) return 3;
    if (result?.data) return 2;
    return 1;
  };

  // Calculate profile completeness %
  const calculateCompleteness = () => {
    if (!result?.data) return 0;
    const fields = ["business_name", "category", "location", "hours", "contact"];
    const filled = fields.filter((f) => result.data[f] && String(result.data[f]).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  // --------------------------------
  // View 3: Template Selector
  // --------------------------------
  if (showTemplates && result?.data) {
    return (
      <TemplateSelector
        selectedTemplate={selectedTemplate}
        onSelect={setSelectedTemplate}
        onContinue={() => {
          setShowTemplates(false);
          setShowWebsite(true);
        }}
        onBack={() => {
          setShowTemplates(false);
        }}
      />
    );
  }

  const handleUpdateBusinessData = (newData) => {
    setResult((prev) => ({
      ...prev,
      data: newData,
    }));
  };

  const handleUpdateWebsiteContent = (newContent) => {
    setWebsiteContent(newContent);
  };

  // --------------------------------
  // View 4: Live Website Preview
  // --------------------------------
  if (showWebsite && result?.data) {
    return (
      <WebsitePreview
        businessData={result.data}
        websiteContent={websiteContent}
        template={selectedTemplate}
        confirmedFields={confirmedFields}
        onUpdateBusinessData={handleUpdateBusinessData}
        onUpdateWebsiteContent={handleUpdateWebsiteContent}
        onBack={() => {
          setShowWebsite(false);
          setShowTemplates(true);
        }}
      />
    );
  }

  // --------------------------------
  // Main Studio UI (Steps 1 & 2)
  // --------------------------------
  const activeStep = getActiveStep();
  const completeness = calculateCompleteness();

  return (
    <div className="app">
      <FloatingShapes />

      {/* Top Navigation */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-group">
            <img
              src={theme === "dark" ? logoDarkImg : logoImg}
              alt="MakeSite"
              className="brand-full-logo"
            />
            <span className="brand-badge">Studio</span>
          </div>

          {/* Step Navigator */}
          <nav className="stepper" aria-label="Creation stages">
            <button
              type="button"
              className={`stepper-step ${activeStep >= 1 ? "completed" : ""} ${activeStep === 1 ? "current" : ""}`}
              onClick={() => {
                if (result?.data) {
                  setShowTemplates(false);
                  setShowWebsite(false);
                }
              }}
            >
              <span className="stepper-num">1</span>
              <span>Prompt</span>
            </button>
            <span className="stepper-divider" />
            <button
              type="button"
              className={`stepper-step ${activeStep >= 2 ? "completed" : ""} ${activeStep === 2 ? "current" : ""}`}
              disabled={!result?.data}
              onClick={() => {
                setShowTemplates(false);
                setShowWebsite(false);
              }}
            >
              <span className="stepper-num">2</span>
              <span>Blueprint</span>
            </button>
            <span className="stepper-divider" />
            <button
              type="button"
              className={`stepper-step ${activeStep >= 3 ? "completed" : ""} ${activeStep === 3 ? "current" : ""}`}
              disabled={!result?.data}
              onClick={() => {
                if (result?.data) {
                  setShowTemplates(true);
                  setShowWebsite(false);
                }
              }}
            >
              <span className="stepper-num">3</span>
              <span>Templates</span>
            </button>
            <span className="stepper-divider" />
            <button
              type="button"
              className={`stepper-step ${activeStep >= 4 ? "completed" : ""} ${activeStep === 4 ? "current" : ""}`}
              disabled={!websiteContent}
            >
              <span className="stepper-num">4</span>
              <span>Preview</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="topbar-actions">
            {/* Theme Toggle */}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <div className="theme-toggle-track">
                <div className="theme-toggle-thumb">
                  {theme === "dark" ? "🌙" : "☀️"}
                </div>
              </div>
            </button>

            <div className={`engine-status status-${apiHealth.status}`}>
              <span className="engine-dot" />
              <span>
                {apiHealth.status === "healthy"
                  ? "AI Active"
                  : apiHealth.status === "checking"
                    ? "Connecting..."
                    : "Offline"}
              </span>
            </div>

            {result && (
              <button
                type="button"
                className="btn-ghost"
                onClick={handleStartAgain}
                title="Reset and start over"
              >
                ↺ Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Connected Stage Progression Ribbon */}
        <div className="stage-ribbon" role="region" aria-label="Creation stage explanation">
          <div className="stage-ribbon-inner">
            <div className="stage-pill">
              <span className="stage-pill-num">0{activeStep}</span>
              <span className="stage-pill-name">
                {activeStep === 1 && "TRADE DISCOVERY"}
                {activeStep === 2 && "FACT VERIFICATION"}
                {activeStep === 3 && "INDUSTRY CURATION"}
                {activeStep === 4 && "LIVE VIEWPORT & EXPORT"}
              </span>
            </div>
            <p className="stage-explanation">
              {activeStep === 1 && "Describe your trade in plain English or Hinglish. Our engine uses heuristic NLP to extract your brand facts, operating schedule, and verified contact channels."}
              {activeStep === 2 && "Review and verify extracted profile data. Confirm each detail with one click so your static website reflects 100% accurate trade facts."}
              {activeStep === 3 && "Select an architectural layout customized for your trade, from warm café menus to high-trust corporate advisors."}
              {activeStep === 4 && "Interact with your live site, test responsive viewports, edit copy inline, and export a 100% self-contained static bundle."}
            </p>
          </div>
        </div>

        {/* ============ STEP 1: DESCRIPTION INPUT ============ */}
        {!result && (
          <div className="hero">
            <div className="hero-header">
              <div className="hero-tag">
                <img src={logoMarkImg} alt="" className="hero-tag-logo" />
                <span>STUDIO ARCHIVE // AUTONOMOUS STATIC ENGINE</span>
              </div>
              <h1 className="hero-title">
                Build High-Impact Websites <span className="hero-title-accent">in Seconds</span>
              </h1>
              <p className="hero-subtitle">
                Describe your business in plain English or Hinglish. MakeSite extracts your trade DNA and constructs an authentic, production-ready static website in seconds.
              </p>
            </div>

            <div className="input-card">
              <div className="input-card-header">
                <div className="input-card-meta">
                  <span className="meta-indicator" />
                  <span className="meta-title">PROMPT STREAM // NLP EXTRACTION</span>
                </div>
                <div className="input-card-badge">AUTO-DETECT LANG</div>
              </div>

              {/* Presets */}
              <div className="presets">
                <span className="presets-label">Curated Briefs:</span>
                {SAMPLE_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-btn"
                    onClick={() => setDescription(p.text)}
                  >
                    <span className="preset-tag">{p.tag}</span>
                    <span className="preset-name">{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="textarea-wrap">
                <textarea
                  id="business-description-input"
                  className="textarea"
                  placeholder="Tell MakeSite about your business — name, location, products, hours, and contact details..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (descriptionError) setDescriptionError("");
                  }}
                  rows={5}
                />
                <div className="textarea-toolbar">
                  <div className="toolbar-left">
                    <span className="char-count">{description.length} chars</span>
                    {description.trim() && (
                      <button
                        type="button"
                        className="btn-clear"
                        onClick={() => {
                          setDescription("");
                          setDescriptionError("");
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div>
                    <VoiceInput
                      onTranscript={(text) => {
                        setDescription((prev) => (prev ? `${prev} ${text}` : text));
                        if (descriptionError) setDescriptionError("");
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Friendly Validation Error for Business Description */}
              {descriptionError && (
                <div className="description-error-banner" role="alert">
                  <span className="description-error-icon">⚠️</span>
                  <div className="description-error-content">
                    <div className="description-error-title">Please check your business description</div>
                    <p className="description-error-text">{descriptionError}</p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading || !description.trim()}
                id="extract-info-btn"
              >
                {loading ? (
                  <span className="btn-content">
                    <span className="spinner" />
                    <span>{loadingStage || "Analyzing..."}</span>
                  </span>
                ) : (
                  <span className="btn-content">
                    <span>Generate Website</span>
                    <span className="btn-arrow">→</span>
                  </span>
                )}
              </button>
            </div>

            {/* Feature Cards */}
            <div className="features-row">
              <div className="feature-card">
                <div className="feature-index">[01]</div>
                <div className="feature-accent-line" />
                <h3 className="feature-title">Pure Static Architecture</h3>
                <p className="feature-desc">
                  Zero server lock-in, zero runtime dependencies. Lightning-fast in-page navigation with verified business contact channels.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-index">[02]</div>
                <div className="feature-accent-line" />
                <h3 className="feature-title">Heuristic Fact Validation</h3>
                <p className="feature-desc">
                  Deep parsing validates phone numbers, emails, addresses, and hours against realistic trade categories.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-index">[03]</div>
                <div className="feature-accent-line" />
                <h3 className="feature-title">Self-Contained ZIP Export</h3>
                <p className="feature-desc">
                  Instantly package HTML5, vanilla CSS, and media into an offline-ready bundle deployable to GitHub, Vercel, or Netlify.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============ ERROR STATE ============ */}
        {result && result.error && (
          <div className="error-wrap">
            <div className="error-card">
              <h3>Something went wrong</h3>
              <p>{result.error}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleStartAgain}
              >
                ↺ Try Again
              </button>
            </div>
          </div>
        )}

        {/* ============ STEP 2: BLUEPRINT REVIEW ============ */}
        {result && result.data && (
          <div className="blueprint-layout">
            {/* Left: Blueprint Data */}
            <div>
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="panel-tag">Structured Data &bull; Step 02</span>
                    <h2 className="panel-title">Business Blueprint & Fact Manifest</h2>
                  </div>
                  <button
                    type="button"
                    className={`btn-edit ${isEditingInfo ? "active" : ""}`}
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                  >
                    {isEditingInfo ? "✓ Done" : "✏️ Edit Details"}
                  </button>
                </div>

                <p className="panel-desc">
                  MakeSite extracted and verified these trade facts. Click on any confirmation badge to verify it before proceeding to templates.
                </p>

                {/* Fields Grid with Fact Verification Badges */}
                <div className="fields-grid">
                  <BlueprintField
                    label="Business Name"
                    field="business_name"
                    value={result.data.business_name}
                    isRequired={true}
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                    isConfirmed={confirmedFields.has("business_name")}
                    onToggleConfirm={handleToggleConfirmField}
                  />
                  <BlueprintField
                    label="Category"
                    field="category"
                    value={result.data.category}
                    isRequired={true}
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                    isConfirmed={confirmedFields.has("category")}
                    onToggleConfirm={handleToggleConfirmField}
                  />
                  <BlueprintField
                    label="Location"
                    field="location"
                    value={result.data.location}
                    isRequired={true}
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                    isConfirmed={confirmedFields.has("location")}
                    onToggleConfirm={handleToggleConfirmField}
                  />
                  <BlueprintField
                    label="Hours"
                    field="hours"
                    value={result.data.hours}
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                    isConfirmed={confirmedFields.has("hours")}
                    onToggleConfirm={handleToggleConfirmField}
                  />
                  <BlueprintField
                    label="Contact"
                    field="contact"
                    value={result.data.contact}
                    isRequired={true}
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                    isConfirmed={confirmedFields.has("contact")}
                    onToggleConfirm={handleToggleConfirmField}
                  />
                  <BlueprintField
                    label="Owner"
                    field="owner_name"
                    value={result.data.owner_name}
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                    isConfirmed={confirmedFields.has("owner_name")}
                    onToggleConfirm={handleToggleConfirmField}
                  />
                </div>

                {/* Services */}
                <div className="services-section">
                  <span className="services-title">
                    Extracted Offerings ({result.data.products?.length || 0})
                  </span>
                  {result.data.products && result.data.products.length > 0 ? (
                    <div className="services-chips">
                      {result.data.products.map((item, index) => (
                        <span className="service-tag" key={index}>{item}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="services-empty">
                      No services detected. MakeSite will generate category-appropriate defaults.
                    </p>
                  )}
                </div>

                {/* Clarification Box */}
                {currentField && (
                  <div className="clarification-box">
                    <div className="clarification-header">
                      <span className="clarification-tag">Required</span>
                      <h4>{questions[currentField] || `Please specify ${currentField.replace('_', ' ')}`}</h4>
                    </div>
                    <div className="clarification-input-row">
                      <input
                        type="text"
                        className={`text-input ${clarificationError ? "has-error" : ""}`}
                        placeholder="Type your answer..."
                        value={clarificationAnswer}
                        onChange={(e) => {
                          setClarificationAnswer(e.target.value);
                          if (clarificationError) setClarificationError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isValidatingClarification && clarificationAnswer.trim()) {
                            handleClarificationSubmit();
                          }
                        }}
                        autoFocus
                        disabled={isValidatingClarification}
                      />
                      <div className="clarification-voice-btn-wrap">
                        <VoiceInput
                          onTranscript={(text) => {
                            setClarificationAnswer(text);
                            if (clarificationError) setClarificationError("");
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-primary btn-save"
                        onClick={handleClarificationSubmit}
                        disabled={isValidatingClarification || !clarificationAnswer.trim()}
                      >
                        {isValidatingClarification ? "Validating..." : "Save →"}
                      </button>
                    </div>
                    {clarificationError && (
                      <div className="clarification-error-banner" role="alert">
                        <span className="error-icon">⚠️</span>
                        <span>{clarificationError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Readiness Sidebar */}
            <div>
              <div className="panel readiness-panel">
                <div className="readiness-header">
                  <div className="score-ring-svg-wrap">
                    <svg className="score-svg" viewBox="0 0 100 100">
                      <circle className="score-svg-bg" cx="50" cy="50" r="42" />
                      <circle
                        className="score-svg-progress"
                        cx="50"
                        cy="50"
                        r="42"
                        style={{
                          strokeDasharray: 264,
                          strokeDashoffset: 264 - (264 * completeness) / 100,
                        }}
                      />
                    </svg>
                    <div className="score-svg-content">
                      <span className="score-value">{completeness}%</span>
                      <span className="score-sub">READY</span>
                    </div>
                  </div>
                  <h3 className="readiness-title">Profile Readiness</h3>
                  <p className="readiness-desc">
                    Extracted metadata structured and primed for full static site synthesis.
                  </p>
                </div>

                {/* Trust Verification Summary */}
                <div className="trust-summary-card">
                  <div className="trust-summary-header">
                    <span className="trust-summary-badge">Trust & Verification</span>
                  </div>
                  <div className="trust-stats-grid">
                    <div className="trust-stat-box">
                      <strong className="stat-number">{Array.from(confirmedFields).filter((f) => Boolean(result.data[f])).length} / 5</strong>
                      <span className="stat-caption">Confirmed Facts</span>
                    </div>
                    <div className="trust-stat-box">
                      <strong className="stat-number">{result.data.contact ? "✓ Verified" : "⚠️ Missing"}</strong>
                      <span className="stat-caption">Contact Channel</span>
                    </div>
                  </div>
                </div>

                <div className="checklist">
                  <div className="check-item">
                    <span className={`check-dot ${result.data.business_name ? "active" : "missing"}`} />
                    <span>
                      Name: {result.data.business_name || <strong style={{ color: "var(--accent-secondary)" }}>Required</strong>}
                    </span>
                  </div>
                  <div className="check-item">
                    <span className={`check-dot ${result.data.category ? "active" : "missing"}`} />
                    <span>
                      Category: {result.data.category || <strong style={{ color: "var(--accent-secondary)" }}>Required</strong>}
                    </span>
                  </div>
                  <div className="check-item">
                    <span className={`check-dot ${result.data.location ? "active" : "missing"}`} />
                    <span>
                      Location: {result.data.location || <strong style={{ color: "var(--accent-secondary)" }}>Required</strong>}
                    </span>
                  </div>
                  <div className="check-item">
                    <span className={`check-dot ${result.data.contact ? "active" : "missing"}`} />
                    <span>
                      Contact: {result.data.contact || <strong style={{ color: "var(--accent-secondary)" }}>Required</strong>}
                    </span>
                  </div>
                </div>

                {(!result.data.business_name || !result.data.category || !result.data.location || !result.data.contact) && (
                  <div className="warning-box">
                    <div className="warning-title">
                      <span>⚠️</span> Required Details Missing
                    </div>
                    <p className="warning-text">
                      Please provide all required business details ({[
                        !result.data.business_name && "Name",
                        !result.data.category && "Category",
                        !result.data.location && "Location",
                        !result.data.contact && "Contact",
                      ].filter(Boolean).join(", ")}) to generate your website.
                    </p>
                    {!currentField && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          const reqs = ["business_name", "category", "location", "contact"];
                          const firstMissing = reqs.find((f) => !result.data[f] || !String(result.data[f]).trim());
                          if (firstMissing) setCurrentField(firstMissing);
                        }}
                      >
                        + Complete Missing Info
                      </button>
                    )}
                  </div>
                )}

                <div className="action-group">
                  <button
                    type="button"
                    className="btn-primary btn-full"
                    onClick={generateWebsiteContent}
                    disabled={
                      loading ||
                      !!currentField ||
                      !result.data.business_name ||
                      !result.data.category ||
                      !result.data.location ||
                      !result.data.contact ||
                      (result.missing_fields && result.missing_fields.length > 0)
                    }
                    id="generate-website-btn"
                  >
                    {loading ? (
                      <span className="btn-content">
                        <span className="spinner" />
                        <span>{loadingStage || "Generating..."}</span>
                      </span>
                    ) : (
                      <span className="btn-content">
                        <span>Continue to Templates</span>
                        <span className="btn-arrow">→</span>
                      </span>
                    )}
                  </button>

                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setResult(null);
                        setCurrentField(null);
                      }}
                    >
                      ← Edit Brief
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleStartAgain}
                    >
                      ↺ Start Over
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Studio Full-Width Footer */}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="footer-left">
            <img src={logoMarkImg} alt="MakeSite" className="footer-logo-mark" />
            <span className="footer-brand-tag">MakeSite Studio</span>
            <span className="footer-sep">•</span>
            <span className="footer-desc">Autonomous Static Web Generator</span>
          </div>
          <div className="footer-center">
            <span className="footer-status-pill">
              <span className="footer-status-dot" />
              Engine Online &bull; v2.0
            </span>
          </div>
          <div className="footer-right">
            <span>&copy; {new Date().getFullYear()} MakeSite. Crafted for speed & precision.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Blueprint Field Component with Fact Verification Badges
function BlueprintField({
  label,
  field,
  value,
  isRequired,
  isEditing,
  onChange,
  isConfirmed,
  onToggleConfirm,
}) {
  const hasValue = Boolean(value && String(value).trim().length > 0);
  return (
    <div className={`field-card ${isEditing ? "editing" : ""} ${isRequired && !hasValue ? "required-missing" : ""}`}>
      <div className="field-header">
        <span className="field-label">{label}</span>
        <div className="field-tags-group">
          {isRequired && !hasValue && <span className="field-required">Required</span>}
          {hasValue && (
            <button
              type="button"
              className={`field-verify-pill ${isConfirmed ? "confirmed" : "pending"}`}
              onClick={() => onToggleConfirm && onToggleConfirm(field)}
              title={isConfirmed ? "Confirmed by you. Click to toggle." : "Click to confirm this fact is accurate"}
            >
              {isConfirmed ? "✓ Confirmed" : "⚠️ Unconfirmed"}
            </button>
          )}
        </div>
      </div>
      <div>
        {isEditing ? (
          <input
            type="text"
            className="field-input"
            value={value || ""}
            placeholder={`Enter ${label.toLowerCase()}...`}
            onChange={(e) => onChange(field, e.target.value)}
          />
        ) : (
          <div className={`field-value ${!hasValue ? "empty" : ""}`}>
            {value || (isRequired ? "Required — please enter" : "Not specified")}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;