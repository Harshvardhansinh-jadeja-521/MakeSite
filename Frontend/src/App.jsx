import { useState, useEffect } from "react";
import "./App.css";

import WebsitePreview from "./components/WebsitePreview";
import TemplateSelector from "./components/TemplateSelector";
import VoiceInput from "./components/VoiceInput";
import FloatingShapes from "./components/FloatingShapes";

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

function App() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [showWebsite, setShowWebsite] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern-dark");
  const [websiteContent, setWebsiteContent] = useState(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [currentField, setCurrentField] = useState(null);
  const [apiHealth, setApiHealth] = useState({ status: "checking", groq: false });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("makesite-theme") || "dark";
    }
    return "dark";
  });

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
    fetch("http://127.0.0.1:8000/health")
      .then((res) => (res.ok ? res.json() : null))
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
    if (!description.trim()) {
      alert("Please provide a description of your business first.");
      return;
    }

    setLoading(true);
    setLoadingStage("Analyzing description & extracting entities...");
    setResult(null);
    setCurrentField(null);
    setClarificationAnswer("");
    setWebsiteContent(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Backend extraction request failed");
      }

      setResult(data);

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
      setResult({
        error:
          err.message ||
          "Unable to extract business data. Ensure backend is running at http://127.0.0.1:8000.",
      });
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  // --------------------------------
  // Clarification Input Submission
  // --------------------------------
  const handleClarificationSubmit = () => {
    if (!clarificationAnswer.trim()) return;

    const updatedData = {
      ...result.data,
      [currentField]: clarificationAnswer.trim(),
    };

    let remainingMissing = (result.missing_fields || []).filter(
      (f) => f !== currentField
    );

    // Re-verify contact requirement
    if (currentField !== "contact" && (!updatedData.contact || !String(updatedData.contact).trim())) {
      if (!remainingMissing.includes("contact")) {
        remainingMissing.push("contact");
      }
    }

    setResult({
      ...result,
      data: updatedData,
      missing_fields: remainingMissing,
      is_complete: remainingMissing.length === 0,
    });

    setClarificationAnswer("");

    if (remainingMissing.length > 0) {
      setCurrentField(remainingMissing[0]);
    } else {
      setCurrentField(null);
    }
  };

  // --------------------------------
  // Generate Website Content
  // --------------------------------
  const generateWebsiteContent = async () => {
    if (!result?.data) return;

    // Compulsory contact validation guard
    if (!result.data.contact || !String(result.data.contact).trim()) {
      setCurrentField("contact");
      alert("Contact details (phone number or email) are compulsory before generating the website.");
      return;
    }

    setLoading(true);
    setLoadingStage("Generating website content...");

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Content generation failed");
      }

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
    setResult((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  const handleStartAgain = () => {
    setResult(null);
    setDescription("");
    setShowWebsite(false);
    setShowTemplates(false);
    setWebsiteContent(null);
    setCurrentField(null);
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

  // --------------------------------
  // View 4: Live Website Preview
  // --------------------------------
  if (showWebsite && result?.data) {
    return (
      <WebsitePreview
        businessData={result.data}
        websiteContent={websiteContent}
        template={selectedTemplate}
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
            <div className="brand-icon-box">M</div>
            <span className="brand-name">MakeSite</span>
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
        {/* ============ STEP 1: DESCRIPTION INPUT ============ */}
        {!result && (
          <div className="hero">
            <div className="hero-header">
              <div className="hero-tag">
                <span className="hero-tag-dot" />
                <span>AI Website Generator</span>
              </div>
              <h1 className="hero-title">
                Build Static Websites{" "}
                <span className="hero-title-accent">in Seconds</span>
              </h1>
              <p className="hero-subtitle">
                Describe your business in plain English or Hinglish. MakeSite extracts your information and generates a production-ready static website.
              </p>
            </div>

            <div className="input-card">
              {/* Presets */}
              <div className="presets">
                <span className="presets-label">Try:</span>
                {SAMPLE_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-btn"
                    onClick={() => setDescription(p.text)}
                  >
                    {p.label}
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
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
                <div className="textarea-toolbar">
                  <div className="toolbar-left">
                    <span className="char-count">{description.length} chars</span>
                    {description.trim() && (
                      <button
                        type="button"
                        className="btn-clear"
                        onClick={() => setDescription("")}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div>
                    <VoiceInput
                      onTranscript={(text) => {
                        setDescription((prev) => (prev ? `${prev} ${text}` : text));
                      }}
                    />
                  </div>
                </div>
              </div>

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
                <div className="feature-accent-line" />
                <h3 className="feature-title">Pure Static Output</h3>
                <p className="feature-desc">
                  No broken redirects. Smooth in-page scrolling with verified contact details built in.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-accent-line" />
                <h3 className="feature-title">Contact Validated</h3>
                <p className="feature-desc">
                  Phone or email is validated upfront so every visitor can connect directly.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-accent-line" />
                <h3 className="feature-title">ZIP Export</h3>
                <p className="feature-desc">
                  Download a complete offline-ready bundle with zero external dependencies.
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
                    <span className="panel-tag">Structured Data</span>
                    <h2 className="panel-title">Business Blueprint</h2>
                  </div>
                  <button
                    type="button"
                    className={`btn-edit ${isEditingInfo ? "active" : ""}`}
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                  >
                    {isEditingInfo ? "✓ Done" : "✏️ Edit"}
                  </button>
                </div>

                <p className="panel-desc">
                  Review the structured data extracted from your description. Edit any field before proceeding.
                </p>

                {/* Fields Grid */}
                <div className="fields-grid">
                  <BlueprintField label="Business Name" field="business_name" value={result.data.business_name} isEditing={isEditingInfo} onChange={handleFieldChange} />
                  <BlueprintField label="Category" field="category" value={result.data.category} isEditing={isEditingInfo} onChange={handleFieldChange} />
                  <BlueprintField label="Location" field="location" value={result.data.location} isEditing={isEditingInfo} onChange={handleFieldChange} />
                  <BlueprintField label="Hours" field="hours" value={result.data.hours} isEditing={isEditingInfo} onChange={handleFieldChange} />
                  <BlueprintField label="Contact" field="contact" value={result.data.contact} isRequired={true} isEditing={isEditingInfo} onChange={handleFieldChange} />
                  <BlueprintField label="Owner" field="owner_name" value={result.data.owner_name} isEditing={isEditingInfo} onChange={handleFieldChange} />
                </div>

                {/* Services */}
                <div className="services-section">
                  <span className="services-title">
                    Services ({result.data.products?.length || 0})
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

                {/* Clarification */}
                {currentField && (
                  <div className="clarification-box">
                    <div className="clarification-header">
                      <span className="clarification-tag">Required</span>
                      <h4>{questions[currentField] || `Please specify ${currentField}`}</h4>
                    </div>
                    <div className="clarification-input-row">
                      <input
                        type="text"
                        className="text-input"
                        placeholder="Type your answer..."
                        value={clarificationAnswer}
                        onChange={(e) => setClarificationAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !loading) {
                            handleClarificationSubmit();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-primary btn-save"
                        onClick={handleClarificationSubmit}
                        disabled={loading || !clarificationAnswer.trim()}
                      >
                        {loading ? "Saving..." : "Save →"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Readiness Sidebar */}
            <div>
              <div className="panel readiness-panel">
                <div className="readiness-header">
                  <div className="score-ring">
                    <span className="score-value">{completeness}%</span>
                  </div>
                  <h3 className="readiness-title">Readiness</h3>
                  <p className="readiness-desc">
                    Profile data structured and ready for content generation.
                  </p>
                </div>

                <div className="checklist">
                  <div className="check-item">
                    <span className={`check-dot ${result.data.business_name ? "active" : ""}`} />
                    <span>Name: {result.data.business_name || "Missing"}</span>
                  </div>
                  <div className="check-item">
                    <span className={`check-dot ${result.data.category ? "active" : ""}`} />
                    <span>Category: {result.data.category || "Missing"}</span>
                  </div>
                  <div className="check-item">
                    <span className={`check-dot ${result.data.location ? "active" : ""}`} />
                    <span>Location: {result.data.location || "Missing"}</span>
                  </div>
                  <div className="check-item">
                    <span className={`check-dot ${result.data.contact ? "active" : "missing"}`} />
                    <span>
                      Contact: {result.data.contact || <strong style={{ color: "var(--accent-secondary)" }}>Required</strong>}
                    </span>
                  </div>
                </div>

                {!result.data.contact && (
                  <div className="warning-box">
                    <div className="warning-title">
                      <span>⚠️</span> Contact Required
                    </div>
                    <p className="warning-text">
                      Enter a phone number or email to continue.
                    </p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setCurrentField("contact")}
                    >
                      + Add Contact
                    </button>
                  </div>
                )}

                <div className="action-group">
                  <button
                    type="button"
                    className="btn-primary btn-full"
                    onClick={generateWebsiteContent}
                    disabled={loading || !!currentField || !result.data.contact}
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
    </div>
  );
}

// Blueprint Field Component
function BlueprintField({ label, field, value, isRequired, isEditing, onChange }) {
  return (
    <div className={`field-card ${isEditing ? "editing" : ""} ${isRequired && !value ? "required-missing" : ""}`}>
      <div className="field-header">
        <span className="field-label">{label}</span>
        {isRequired && <span className="field-required">Required</span>}
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
          <div className={`field-value ${!value ? "empty" : ""}`}>
            {value || (isRequired ? "Required — please enter" : "Not specified")}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;