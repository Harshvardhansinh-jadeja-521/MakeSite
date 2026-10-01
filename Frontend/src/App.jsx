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
    label: "☕ Artisan Cafe",
    text: "I run an artisan coffee roastery and bakery called Bean & Bloom in Bandra, Mumbai. We operate from 7:30 AM to 10:00 PM every day. We serve handcrafted espresso, single-origin pour-overs, organic sourdough croissants, and vegan pastries. Contact us at hello@beanandbloom.in.",
  },
  {
    label: "💻 Cyber Cafe & Print Hub",
    text: "Mera naam Harsh hai. Mai Harsh Cyber Cafe chalata hu CG Road Ahmedabad mai. We are open 9:00 AM to 10:00 PM. Hum high-speed internet, color printing, document scanning, passport photo, aur online exam form submission services provide karte hai. Phone: +91 9876543210.",
  },
  {
    label: "🌿 Wellness Spa",
    text: "We run a luxury holistic wellness and Ayurvedic therapy sanctuary called Nirvana Spa in Indiranagar, Bengaluru. Open Tuesday to Sunday from 8:00 AM to 8:30 PM. We offer deep tissue massage, organic herbal facials, steam baths, and sound meditation. Reach us at booking@nirvanaspa.com.",
  },
  {
    label: "💼 Financial Advisory",
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
    } catch (error) {
      console.error(error);
      setResult({
        error: "Could not connect to the MakeSite backend engine. Ensure the FastAPI server is running on port 8000.",
      });
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  // --------------------------------
  // Submit Clarification
  // --------------------------------
  const handleClarificationSubmit = async () => {
    if (!clarificationAnswer.trim()) {
      alert("Please enter a response for this field.");
      return;
    }

    if (!result?.data || !currentField) return;

    setLoading(true);
    setLoadingStage("Updating business profile...");

    try {
      const response = await fetch("http://127.0.0.1:8000/update-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_data: result.data,
          field: currentField,
          value: clarificationAnswer.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Backend update failed");
      }

      setResult(data);
      setClarificationAnswer("");

      const missing = [...(data.missing_fields || [])];
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
    } catch (error) {
      console.error(error);
      setResult({
        error: "Could not update business details.",
      });
      setCurrentField(null);
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  // --------------------------------
  // Direct Field Edit Update
  // --------------------------------
  const handleFieldChange = (field, value) => {
    if (!result?.data) return;
    const updated = { ...result.data, [field]: value };
    setResult((prev) => ({
      ...prev,
      data: updated,
    }));
    if (field === "contact" && value && value.trim() && currentField === "contact") {
      setCurrentField(null);
    }
  };

  // --------------------------------
  // Generate AI Website Content
  // --------------------------------
  const generateWebsiteContent = async () => {
    if (!result?.data) return;

    setLoading(true);
    setLoadingStage("Synthesizing tailored website copy & structure...");

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Content generation failed");
      }

      setWebsiteContent(data.content);
      setShowTemplates(true);
    } catch (error) {
      console.error(error);
      alert("Could not generate AI website copy. Please verify your backend server.");
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  // --------------------------------
  // Reset & Start Again
  // --------------------------------
  const handleStartAgain = () => {
    setDescription("");
    setResult(null);
    setCurrentField(null);
    setClarificationAnswer("");
    setShowWebsite(false);
    setShowTemplates(false);
    setSelectedTemplate("modern-dark");
    setWebsiteContent(null);
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
    <div className="studio-app">
      <FloatingShapes />

      {/* Top Studio Navigation Bar */}
      <header className="studio-topbar">
        <div className="topbar-inner">
          <div className="brand-group">
            <div className="brand-logo">
              <span className="brand-spark">✦</span>
              <span className="brand-name">MakeSite</span>
            </div>
            <span className="brand-tag">Studio v2.4</span>
          </div>

          {/* Interactive Step Navigator */}
          <nav className="step-navigator" aria-label="Creation stages">
            <button
              type="button"
              className={`nav-step ${activeStep >= 1 ? "completed" : ""} ${activeStep === 1 ? "current" : ""}`}
              onClick={() => {
                if (result?.data) {
                  setShowTemplates(false);
                  setShowWebsite(false);
                }
              }}
            >
              <span className="nav-step-index">01</span>
              <span className="nav-step-label">Business Brief</span>
            </button>

            <span className="nav-step-arrow">→</span>

            <button
              type="button"
              className={`nav-step ${activeStep >= 2 ? "completed" : ""} ${activeStep === 2 ? "current" : ""}`}
              disabled={!result?.data}
              onClick={() => {
                setShowTemplates(false);
                setShowWebsite(false);
              }}
            >
              <span className="nav-step-index">02</span>
              <span className="nav-step-label">Blueprint</span>
            </button>

            <span className="nav-step-arrow">→</span>

            <button
              type="button"
              className={`nav-step ${activeStep >= 3 ? "completed" : ""} ${activeStep === 3 ? "current" : ""}`}
              disabled={!result?.data}
              onClick={() => {
                if (result?.data) {
                  setShowTemplates(true);
                  setShowWebsite(false);
                }
              }}
            >
              <span className="nav-step-index">03</span>
              <span className="nav-step-label">Architecture</span>
            </button>

            <span className="nav-step-arrow">→</span>

            <button
              type="button"
              className={`nav-step ${activeStep >= 4 ? "completed" : ""} ${activeStep === 4 ? "current" : ""}`}
              disabled={!websiteContent}
            >
              <span className="nav-step-index">04</span>
              <span className="nav-step-label">Live Canvas</span>
            </button>
          </nav>

          {/* Engine Health & Action */}
          <div className="topbar-actions">
            <div className={`engine-status-pill status-${apiHealth.status}`}>
              <span className="status-indicator-dot" />
              <span className="status-indicator-text">
                {apiHealth.status === "healthy"
                  ? "Groq Engine Active"
                  : apiHealth.status === "checking"
                  ? "Connecting Engine..."
                  : "Engine Local Mode"}
              </span>
            </div>

            {result && (
              <button
                type="button"
                className="btn-studio-ghost"
                onClick={handleStartAgain}
                title="Reset and start over"
              >
                ↺ Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Studio Dual-Column Workspace */}
      <main className="studio-main-container">
        {/* ============================================================
            STEP 1: DESCRIPTION INPUT WORKSPACE
        ============================================================ */}
        {!result && (
          <div className="studio-workspace">
            {/* Left Column: Input & Controls */}
            <div className="studio-col studio-editor-col">
              <div className="studio-panel">
                <div className="panel-header">
                  <div className="panel-title-group">
                    <span className="panel-eyebrow">Input Parameters</span>
                    <h2 className="panel-title">Describe Your Business</h2>
                  </div>
                  <span className="lang-pill">English • Hindi • Hinglish</span>
                </div>

                <p className="panel-description">
                  Tell MakeSite what your business does, where you operate, what services you provide, and your contact info. The engine automatically extracts and organizes your profile.
                </p>

                {/* Sample Prompt Chips */}
                <div className="prompt-presets-section">
                  <div className="presets-label-row">
                    <span className="presets-label">Prompt Presets:</span>
                    <span className="presets-hint">Click any preset to test immediately</span>
                  </div>
                  <div className="presets-grid">
                    {SAMPLE_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="preset-chip"
                        onClick={() => setDescription(p.text)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea Input Card */}
                <div className="editor-textarea-wrap">
                  <textarea
                    id="business-description-input"
                    className="studio-textarea"
                    placeholder="Example: I run an artisan specialty coffee roastery called Bean & Bloom in Bandra, Mumbai. We operate from 7:30 AM to 10:00 PM every day. We serve handcrafted espresso, single-origin pour-overs, and sourdough pastries. Contact us at hello@beanandbloom.in."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />

                  <div className="textarea-footer">
                    <div className="textarea-meta">
                      <span className="char-counter">{description.length} characters</span>
                      {description.trim() && (
                        <button
                          type="button"
                          className="btn-clear-text"
                          onClick={() => setDescription("")}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <VoiceInput
                      onTranscript={(text) => {
                        setDescription((prev) => (prev ? `${prev} ${text}` : text));
                      }}
                    />
                  </div>
                </div>

                {/* Submit Action CTA */}
                <button
                  type="button"
                  className="btn-studio-primary"
                  onClick={handleSubmit}
                  disabled={loading || !description.trim()}
                  id="extract-info-btn"
                >
                  {loading ? (
                    <span className="btn-loading-state">
                      <span className="studio-spinner" />
                      {loadingStage || "Analyzing description..."}
                    </span>
                  ) : (
                    <span className="btn-idle-state">
                      <span>Analyze & Extract Business Profile</span>
                      <span className="btn-arrow">→</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Engine Specifications & Architecture Guarantees */}
            <div className="studio-col studio-spec-col">
              <div className="studio-panel spec-panel">
                <div className="spec-header">
                  <span className="spec-badge">Engine Architecture</span>
                  <h3 className="spec-title">Production Design Guarantees</h3>
                  <p className="spec-subtitle">
                    Websites generated by MakeSite adhere to strict static presentation standards engineered for fast deployment and academic demonstration.
                  </p>
                </div>

                <div className="spec-feature-list">
                  <div className="spec-feature-item">
                    <div className="feature-icon-box">📌</div>
                    <div className="feature-details">
                      <h4>100% Strictly Static Presentation</h4>
                      <p>
                        Zero shopping carts or "Shop Now" checkout traps. Action buttons smoothly scroll down to verified in-page contact details with highlight animation.
                      </p>
                    </div>
                  </div>

                  <div className="spec-feature-item">
                    <div className="feature-icon-box">🎨</div>
                    <div className="feature-details">
                      <h4>7 Handcrafted Template Engines</h4>
                      <p>
                        Choose from Dark Luxe, Minimalist Studio, Aurora Vibrant, Enterprise Executive, Sunset Bistro, Emerald Oasis, and Cyber Engine.
                      </p>
                    </div>
                  </div>

                  <div className="spec-feature-item">
                    <div className="feature-icon-box">🧠</div>
                    <div className="feature-details">
                      <h4>Natural Entity Normalization</h4>
                      <p>
                        Groq-powered entity parser recognizes business identity, operating schedules, physical addresses, and services across multilingual prompts.
                      </p>
                    </div>
                  </div>

                  <div className="spec-feature-item">
                    <div className="feature-icon-box">📦</div>
                    <div className="feature-details">
                      <h4>Self-Contained Standalone Export</h4>
                      <p>
                        Export clean standalone single-file HTML or complete ZIP archives with zero external runtime dependencies.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Metric Card */}
                <div className="spec-metrics-card">
                  <div className="metric-col">
                    <span className="metric-val">100%</span>
                    <span className="metric-key">Static Compliance</span>
                  </div>
                  <div className="metric-col-divider" />
                  <div className="metric-col">
                    <span className="metric-val">7</span>
                    <span className="metric-key">Layout Engines</span>
                  </div>
                  <div className="metric-col-divider" />
                  <div className="metric-col">
                    <span className="metric-val">&lt; 1.5s</span>
                    <span className="metric-key">Parsing Latency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            ERROR STATE
        ============================================================ */}
        {result && result.error && (
          <div className="studio-error-container">
            <div className="studio-error-card">
              <span className="error-icon-badge">⚠️</span>
              <h3>Extraction Engine Notice</h3>
              <p>{result.error}</p>
              <button
                type="button"
                className="btn-studio-primary error-retry-btn"
                onClick={handleStartAgain}
              >
                ↺ Try Again
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 2: EXTRACTED BLUEPRINT & REVIEW WORKSPACE
        ============================================================ */}
        {result && result.data && (
          <div className="studio-workspace">
            {/* Left Column: Blueprint Field Inspector */}
            <div className="studio-col studio-editor-col">
              <div className="studio-panel">
                <div className="panel-header">
                  <div className="panel-title-group">
                    <span className="panel-eyebrow">Entity Blueprint</span>
                    <h2 className="panel-title">Extracted Business Details</h2>
                  </div>

                  <button
                    type="button"
                    className={`btn-edit-toggle ${isEditingInfo ? "active" : ""}`}
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                  >
                    {isEditingInfo ? "✓ Done Editing" : "✏️ Edit Fields"}
                  </button>
                </div>

                <p className="panel-description">
                  Review the structured entities extracted from your prompt. You can adjust any field below before generating the final website copy.
                </p>

                {/* 2-Column Structured Info Grid */}
                <div className="blueprint-fields-grid">
                  <BlueprintField
                    label="Business Name"
                    field="business_name"
                    value={result.data.business_name}
                    icon="🏢"
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                  />

                  <BlueprintField
                    label="Category / Industry"
                    field="category"
                    value={result.data.category}
                    icon="📁"
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                  />

                  <BlueprintField
                    label="Physical Location"
                    field="location"
                    value={result.data.location}
                    icon="📍"
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                  />

                  <BlueprintField
                    label="Operating Hours"
                    field="hours"
                    value={result.data.hours}
                    icon="🕒"
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                  />

                  <BlueprintField
                    label="Direct Contact"
                    field="contact"
                    value={result.data.contact}
                    icon="📞"
                    isRequired={true}
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                  />

                  <BlueprintField
                    label="Owner / Founder"
                    field="owner_name"
                    value={result.data.owner_name}
                    icon="👤"
                    isEditing={isEditingInfo}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Services & Offerings Tag Cloud */}
                <div className="blueprint-services-box">
                  <div className="services-box-header">
                    <span className="services-box-title">
                      Detected Offerings & Services ({result.data.products?.length || 0})
                    </span>
                  </div>

                  {result.data.products && result.data.products.length > 0 ? (
                    <div className="services-chip-cloud">
                      {result.data.products.map((item, index) => (
                        <span className="service-chip" key={index}>
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="services-empty-note">
                      No explicit services declared. MakeSite will automatically craft industry-tailored services!
                    </p>
                  )}
                </div>

                {/* Clarification Box if required field missing */}
                {currentField && (
                  <div className="clarification-drawer">
                    <div className="clarification-drawer-header">
                      <span className="clarification-pill">Required Detail</span>
                      <h4>{questions[currentField] || `Please specify ${currentField}`}</h4>
                    </div>

                    <div className="clarification-drawer-input-row">
                      <input
                        type="text"
                        className="clarification-input"
                        placeholder="Type answer here..."
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
                        className="btn-studio-primary clarification-submit-btn"
                        onClick={handleClarificationSubmit}
                        disabled={loading || !clarificationAnswer.trim()}
                      >
                        {loading ? "Saving..." : "Save & Update →"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Blueprint Readiness & Synthesis Action */}
            <div className="studio-col studio-spec-col">
              <div className="studio-panel readiness-panel">
                <div className="readiness-header">
                  <div className="readiness-score-badge">
                    <span className="score-num">{completeness}%</span>
                    <span className="score-label">Profile Readiness</span>
                  </div>
                  <h3 className="readiness-title">Blueprint Verified</h3>
                  <p className="readiness-desc">
                    Your profile data is structured and ready for AI content synthesis. Our copywriting model will craft customized headlines, service features, and hero statements.
                  </p>
                </div>

                {/* Entity Checklist */}
                <div className="entity-checklist">
                  <div className="checklist-row">
                    <span className={`check-icon ${result.data.business_name ? "is-valid" : ""}`}>
                      {result.data.business_name ? "✓" : "○"}
                    </span>
                    <span className="check-text">Business Name: {result.data.business_name || "Missing"}</span>
                  </div>

                  <div className="checklist-row">
                    <span className={`check-icon ${result.data.category ? "is-valid" : ""}`}>
                      {result.data.category ? "✓" : "○"}
                    </span>
                    <span className="check-text">Category: {result.data.category || "Missing"}</span>
                  </div>

                  <div className="checklist-row">
                    <span className={`check-icon ${result.data.location ? "is-valid" : ""}`}>
                      {result.data.location ? "✓" : "○"}
                    </span>
                    <span className="check-text">Location: {result.data.location || "Missing"}</span>
                  </div>

                  <div className="checklist-row">
                    <span className={`check-icon ${result.data.contact ? "is-valid" : "is-required"}`}>
                      {result.data.contact ? "✓" : "!"}
                    </span>
                    <span className="check-text">
                      Contact (Compulsory): {result.data.contact || <strong style={{ color: "#ef4444" }}>Missing — Required</strong>}
                    </span>
                  </div>
                </div>

                {!result.data.contact && (
                  <div style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171", fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>
                      <span>⚠️</span> Contact Details are Compulsory
                    </div>
                    <p style={{ color: "#cbd5e1", fontSize: "12px", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                      Please provide an official phone number or email address to generate your static website.
                    </p>
                    <button
                      type="button"
                      className="btn-studio-secondary"
                      style={{ width: "100%", borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}
                      onClick={() => setCurrentField("contact")}
                    >
                      + Enter Contact Details
                    </button>
                  </div>
                )}

                {/* Synthesis Action Button */}
                <div className="readiness-actions">
                  <button
                    type="button"
                    className="btn-studio-primary btn-synthesize"
                    onClick={generateWebsiteContent}
                    disabled={loading || !!currentField || !result.data.contact}
                    id="generate-website-btn"
                  >
                    {loading ? (
                      <span className="btn-loading-state">
                        <span className="studio-spinner" />
                        {loadingStage || "Synthesizing website copy..."}
                      </span>
                    ) : (
                      <span className="btn-idle-state">
                        <span>Continue to Template Architecture</span>
                        <span className="btn-arrow">→</span>
                      </span>
                    )}
                  </button>

                  <div className="secondary-action-row">
                    <button
                      type="button"
                      className="btn-studio-secondary"
                      onClick={() => {
                        setResult(null);
                        setCurrentField(null);
                      }}
                    >
                      ← Edit Prompt Brief
                    </button>

                    <button
                      type="button"
                      className="btn-studio-secondary btn-danger-soft"
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

// --------------------------------------------------------------------
// Structured Blueprint Field Component
// --------------------------------------------------------------------
function BlueprintField({ label, field, value, icon, isRequired, isEditing, onChange }) {
  return (
    <div className={`blueprint-field-card ${isEditing ? "is-editing" : ""} ${isRequired && !value ? "field-required-missing" : ""}`}>
      <div className="field-card-top">
        <span className="field-icon">{icon}</span>
        <span className="field-label">{label}</span>
        {isRequired && (
          <span style={{
            fontSize: "10px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5",
            padding: "2px 6px",
            borderRadius: "4px",
            fontWeight: 700,
            marginLeft: "auto"
          }}>
            Compulsory
          </span>
        )}
      </div>

      <div className="field-card-body">
        {isEditing ? (
          <input
            type="text"
            className="field-edit-input"
            value={value || ""}
            placeholder={`Enter ${label.toLowerCase()}...`}
            onChange={(e) => onChange(field, e.target.value)}
          />
        ) : (
          <div className={`field-value-text ${!value ? "is-empty" : ""}`}>
            {value || (isRequired ? "⚠️ Contact details required" : "Not specified")}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;