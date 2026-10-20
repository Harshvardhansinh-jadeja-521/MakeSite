import { useState, useEffect, useRef } from "react";
import "./WebsitePreview.css";
import JSZip from "jszip";

const TEMPLATE_OPTIONS = [
  { id: "modern-dark", name: "Neon Cyber", icon: "⚡" },
  { id: "minimal-clean", name: "Minimal Studio", icon: "◻️" },
  { id: "vibrant-gradient", name: "Aurora Vibrant", icon: "✨" },
  { id: "corporate-pro", name: "Enterprise Pro", icon: "💼" },
  { id: "warm-artisan", name: "Sunset Bistro", icon: "☕" },
  { id: "emerald-wellness", name: "Emerald Oasis", icon: "🌿" },
  { id: "tech-bold", name: "Cyber Engine", icon: "🔥" },
];

function WebsitePreview({
  businessData,
  websiteContent,
  template = "modern-dark",
  onUpdateBusinessData,
  onUpdateWebsiteContent,
  onBack,
}) {
  const [activeTemplate, setActiveTemplate] = useState(template);
  const [deviceMode, setDeviceMode] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
  const [viewMode, setViewMode] = useState("preview"); // 'preview' | 'code'
  const [downloading, setDownloading] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [serverHtml, setServerHtml] = useState("");
  const [htmlCache, setHtmlCache] = useState({});

  // ----------------------------------------------------
  // Interactive Editing State
  // ----------------------------------------------------
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState("hero"); // 'hero' | 'about' | 'services' | 'features' | 'faqs' | 'contact'
  const [polishingField, setPolishingField] = useState(null);
  const [polishResult, setPolishResult] = useState(null); // { field, improved, alternatives }

  // Initial and editable data state
  const [currentBusinessData, setCurrentBusinessData] = useState(() => ({ ...(businessData || {}) }));
  const [currentContent, setCurrentContent] = useState(() => ({ ...(websiteContent || {}) }));

  // Keep permanent backup of initial AI generated content for "Reset"
  const initialDataRef = useRef(JSON.parse(JSON.stringify(businessData || {})));
  const initialContentRef = useRef(JSON.parse(JSON.stringify(websiteContent || {})));

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // ----------------------------------------------------
  // Extract and Sanitize Fields
  // ----------------------------------------------------
  const businessName = currentBusinessData?.business_name || "Your Business";
  const category = currentBusinessData?.category || "Professional Services";
  const location = currentBusinessData?.location || "Regional City";
  const hours = currentBusinessData?.hours || "Regular Operating Hours";
  const contact = currentBusinessData?.contact || "";
  const products = currentBusinessData?.products || [];

  // Content fallbacks
  const heroTitle = currentContent?.hero_title || `Premier ${category} in ${location}`;
  const heroDesc = currentContent?.hero_description || `Delivering trusted, top-tier ${typeof category === "string" ? category.toLowerCase() : category} solutions designed to exceed your expectations.`;
  const aboutText = currentContent?.about || `At ${businessName}, we take pride in delivering honest, reliable, and high-impact services across ${location}. Founded on trust and customer satisfaction.`;

  const sanitizeCta = (text, fallback = "Connect With Us Today") => {
    if (!text || typeof text !== "string" || !text.trim()) return fallback;
    const forbidden = [
      "shop now", "buy now", "order now", "add to cart", "cart",
      "purchase", "checkout", "shop online", "order online", "order & visit",
      "order today", "buy online", "shop"
    ];
    const lower = text.toLowerCase();
    for (const f of forbidden) {
      if (lower.includes(f)) {
        return fallback;
      }
    }
    return text.trim();
  };

  const cta = sanitizeCta(currentContent?.cta, "Connect With Us Today");

  const services = (currentContent?.services && currentContent.services.length > 0)
    ? currentContent.services
    : products.length > 0
    ? products.map((p) => ({
        name: typeof p === "string" ? p : "Service",
        description: `High-quality ${p} tailored with precision and exceptional care.`,
      }))
    : [
        { name: "Core Services", description: `Specialized and dependable ${category} solutions.` },
        { name: "Expert Consultation", description: "Informed guidance to help you make confident decisions." },
        { name: "Dedicated Support", description: "Customer-first assistance whenever you need it." },
      ];

  const features = (currentContent?.features && currentContent.features.length > 0)
    ? currentContent.features
    : [
        { title: "Trusted Reliability", description: "Consistent, dependable service you can always rely on." },
        { title: "Community Focused", description: `Proudly serving customers across ${location}.` },
        { title: "Direct Communication", description: "Transparent, honest, and responsive client care." },
      ];

  const faqs = (currentContent?.faqs && currentContent.faqs.length > 0)
    ? currentContent.faqs
    : [
        { question: `Where is ${businessName} located?`, answer: `We are located in ${location}. Contact us anytime during: ${hours}.` },
        { question: "How do I get in touch?", answer: `You can reach out directly via ${contact || "our contact options"} or visit us during operating hours.` },
      ];

  // ----------------------------------------------------
  // Update State Handlers
  // ----------------------------------------------------
  const handleUpdateDataField = (field, value) => {
    setCurrentBusinessData((prev) => {
      const next = { ...prev, [field]: value };
      if (onUpdateBusinessData) onUpdateBusinessData(next);
      return next;
    });
    setHtmlCache({});
  };

  const handleUpdateContentField = (field, value) => {
    setCurrentContent((prev) => {
      const next = { ...prev, [field]: value };
      if (onUpdateWebsiteContent) onUpdateWebsiteContent(next);
      return next;
    });
    setHtmlCache({});
  };

  // Services
  const handleUpdateService = (idx, key, value) => {
    const list = [...services];
    list[idx] = { ...list[idx], [key]: value };
    handleUpdateContentField("services", list);
  };

  const handleAddService = () => {
    const list = [...services];
    list.push({
      name: `Specialized ${category} Service`,
      description: "Dedicated, premium quality solutions delivered by experienced professionals.",
    });
    handleUpdateContentField("services", list);
    showToast("✓ Added new service");
  };

  const handleDeleteService = (idx) => {
    if (services.length <= 1) {
      alert("A website should have at least one service offering.");
      return;
    }
    const list = services.filter((_, i) => i !== idx);
    handleUpdateContentField("services", list);
    showToast("🗑️ Removed service");
  };

  // Features
  const handleUpdateFeature = (idx, key, value) => {
    const list = [...features];
    list[idx] = { ...list[idx], [key]: value };
    handleUpdateContentField("features", list);
  };

  const handleAddFeature = () => {
    const list = [...features];
    list.push({
      title: "Guaranteed Satisfaction",
      description: "Unwavering commitment to client success and transparent communication.",
    });
    handleUpdateContentField("features", list);
    showToast("✓ Added new feature highlight");
  };

  const handleDeleteFeature = (idx) => {
    const list = features.filter((_, i) => i !== idx);
    handleUpdateContentField("features", list);
    showToast("🗑️ Removed highlight");
  };

  // FAQs
  const handleUpdateFaq = (idx, key, value) => {
    const list = [...faqs];
    list[idx] = { ...list[idx], [key]: value };
    handleUpdateContentField("faqs", list);
  };

  const handleAddFaq = () => {
    const list = [...faqs];
    list.push({
      question: "How do I book an appointment or consultation?",
      answer: `Reach out to our team at ${contact || "our office"} or visit us during open hours.`,
    });
    handleUpdateContentField("faqs", list);
    showToast("✓ Added new FAQ");
  };

  const handleDeleteFaq = (idx) => {
    const list = faqs.filter((_, i) => i !== idx);
    handleUpdateContentField("faqs", list);
    showToast("🗑️ Removed FAQ");
  };

  // Reset to AI original
  const handleResetToOriginal = () => {
    if (window.confirm("Revert all customizations back to the initial AI-generated version?")) {
      const origData = JSON.parse(JSON.stringify(initialDataRef.current));
      const origContent = JSON.parse(JSON.stringify(initialContentRef.current));
      setCurrentBusinessData(origData);
      setCurrentContent(origContent);
      if (onUpdateBusinessData) onUpdateBusinessData(origData);
      if (onUpdateWebsiteContent) onUpdateWebsiteContent(origContent);
      setHtmlCache({});
      setPolishResult(null);
      showToast("↺ Reset back to initial AI version!");
    }
  };

  // ----------------------------------------------------
  // AI Polish Assist
  // ----------------------------------------------------
  const handleAiPolish = async (sectionKey, currentVal, tone = "modern and punchy") => {
    if (!currentVal || !String(currentVal).trim()) {
      showToast("⚠️ Please enter some text first to polish.");
      return;
    }
    setPolishingField(sectionKey);
    setPolishResult(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/rephrase-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: sectionKey,
          text: currentVal,
          business_name: businessName,
          category: category,
          style: tone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const allSuggestions = [data.improved, ...(data.alternatives || [])].filter(
          (item, idx, self) => item && typeof item === "string" && self.indexOf(item) === idx
        );

        setPolishResult({
          field: sectionKey,
          suggestions: allSuggestions,
        });
        showToast("✨ AI Suggestions ready! Choose below.");
      } else {
        showToast("⚠️ AI Polish request failed");
      }
    } catch (err) {
      console.warn("AI Polish error:", err);
      showToast("⚠️ Could not reach AI polish service");
    } finally {
      setPolishingField(null);
    }
  };

  const applyPolishSuggestion = (fieldKey, suggestedText) => {
    if (fieldKey === "business_name" || fieldKey === "category" || fieldKey === "location" || fieldKey === "hours" || fieldKey === "contact") {
      handleUpdateDataField(fieldKey, suggestedText);
    } else {
      handleUpdateContentField(fieldKey, suggestedText);
    }
    setPolishResult(null);
    showToast("✓ Applied AI suggestion!");
  };

  // ----------------------------------------------------
  // Fetch Server-Rendered HTML (Debounced & Cached)
  // ----------------------------------------------------
  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(() => {
      fetch("http://127.0.0.1:8000/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_data: currentBusinessData,
          content: {
            ...currentContent,
            hero_title: heroTitle,
            hero_description: heroDesc,
            about: aboutText,
            cta: cta,
            services: services,
            features: features,
            faqs: faqs,
          },
          template_id: activeTemplate,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isCurrent && data && data.html) {
            setServerHtml(data.html);
            setHtmlCache((prev) => ({ ...prev, [activeTemplate]: data.html }));
          }
        })
        .catch((err) => {
          console.warn("Could not fetch server-rendered HTML:", err);
        });
    }, 400);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [currentBusinessData, currentContent, activeTemplate, heroTitle, heroDesc, aboutText, cta, services, features, faqs]);

  // Clean filename generator
  const getSafeFileName = (name) => {
    return String(name || "website")
      .trim()
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
  };

  // Fallback complete HTML if backend is offline
  const getCompleteHtml = () => {
    if (serverHtml) return serverHtml;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(businessName)} | ${escapeHtml(heroTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    html { scroll-behavior: smooth; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; margin:0; padding:40px 20px; background:#08090d; color:#f8fafc; line-height:1.6; }
    .container { max-width: 900px; margin:0 auto; }
    h1 { font-size: 2.8rem; margin: 16px 0; color: #ffffff; }
    .btn { display: inline-block; background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; cursor: pointer; border: none; }
    .btn:hover { background: #1d4ed8; }
    .card { background: #11141d; padding: 24px; border-radius: 12px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.08); }
    .highlight-pulse { animation: staticPulse 1.8s ease-in-out !important; }
    @keyframes staticPulse {
      0% { transform: scale(1); outline: 3px solid transparent; }
      25% { transform: scale(1.02); outline: 3px solid #3b82f6; box-shadow: 0 0 35px rgba(59, 130, 246, 0.6); }
      60% { transform: scale(1.01); outline: 2px solid #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
      100% { transform: scale(1); outline: 3px solid transparent; }
    }
  </style>
</head>
<body>
  <div class="container">
    <p style="text-transform:uppercase; color:#38bdf8; letter-spacing:1px; font-weight:700;">${escapeHtml(category)}</p>
    <h1>${escapeHtml(heroTitle)}</h1>
    <p style="font-size:1.2rem; color:#94a3b8;">${escapeHtml(heroDesc)}</p>
    <a href="#contact" class="btn">${escapeHtml(cta)} &rarr;</a>
    <div class="card" style="margin-top:40px;">
      <h2>About ${escapeHtml(businessName)}</h2>
      <p>${escapeHtml(aboutText)}</p>
    </div>
    <h2>Services</h2>
    ${services.map((s) => `<div class="card"><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description)}</p></div>`).join("")}
    <div class="card" id="contact">
      <h2>Visit & Contact Details</h2>
      <p>📍 <strong>Location:</strong> ${escapeHtml(location)}</p>
      <p>🕒 <strong>Hours:</strong> ${escapeHtml(hours)}</p>
      <p>📞 <strong>Direct Contact:</strong> ${escapeHtml(contact || "Available upon request")}</p>
      <button type="button" class="btn btn-copy-contact" data-contact="${escapeHtml(contact || location)}" style="margin-top:14px;">📋 Copy Contact Info</button>
    </div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('a[href^="#"]').forEach(function(el) {
        el.addEventListener('click', function(e) {
          var targetId = this.getAttribute('href').substring(1);
          var targetEl = document.getElementById(targetId || 'contact');
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.classList.remove('highlight-pulse');
            void targetEl.offsetWidth;
            targetEl.classList.add('highlight-pulse');
            setTimeout(function() { targetEl.classList.remove('highlight-pulse'); }, 2000);
          }
        });
      });
      document.querySelectorAll('.btn-copy-contact').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var val = this.getAttribute('data-contact') || '';
          if (val && navigator.clipboard) {
            navigator.clipboard.writeText(val).then(function() {
              alert('✓ Copied to clipboard: ' + val);
            });
          }
        });
      });
    });
  </script>
</body>
</html>`;
  };

  // Fetch freshest server HTML or fallback
  const getOrFetchHtml = async () => {
    if (htmlCache[activeTemplate] && htmlCache[activeTemplate].trim()) {
      return htmlCache[activeTemplate];
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_data: currentBusinessData,
          content: {
            ...currentContent,
            hero_title: heroTitle,
            hero_description: heroDesc,
            about: aboutText,
            cta: cta,
            services: services,
            features: features,
            faqs: faqs,
          },
          template_id: activeTemplate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.html) {
          setServerHtml(data.html);
          setHtmlCache((prev) => ({ ...prev, [activeTemplate]: data.html }));
          return data.html;
        }
      }
    } catch (e) {
      console.warn("Could not fetch server HTML, using client generator:", e);
    }

    if (serverHtml && serverHtml.trim()) {
      return serverHtml;
    }

    return getCompleteHtml();
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const htmlContent = await getOrFetchHtml();
      const zip = new JSZip();

      zip.file("index.html", htmlContent);
      zip.file(
        "README.txt",
        `============================================================
${businessName.toUpperCase()} — OFFICIAL WEBSITE
============================================================
Generated autonomously by MakeSite AI.
Customized & Crafted in MakeSite Studio.
Architecture: ${activeTemplate}
Category: ${category}
Location: ${location}
Contact: ${contact || "Provided on site"}

DEPLOYMENT INSTRUCTIONS:
1. Extract all files from this ZIP.
2. Double-click "index.html" to test in any web browser.
3. Every button uses smooth in-page scrolling to #contact.
4. To host online, upload "index.html" directly to Vercel, Netlify,
   GitHub Pages, or any web hosting provider.

Built with MakeSite AI Engine.
`
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${getSafeFileName(businessName)}-website-${activeTemplate}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("✓ ZIP package exported successfully!");
    } catch (err) {
      console.error("ZIP export failed:", err);
      alert("Export failed. You can also use 'Copy HTML' to copy the code directly.");
    } finally {
      setDownloading(false);
    }
  };

  // Download single HTML file
  const handleDownloadHtml = async () => {
    try {
      const htmlContent = await getOrFetchHtml();
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${getSafeFileName(businessName)}-index.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("✓ Saved standalone index.html");
    } catch (err) {
      console.error("HTML download failed:", err);
    }
  };

  // Copy HTML to clipboard
  const handleCopyCode = async () => {
    try {
      const htmlContent = await getOrFetchHtml();
      await navigator.clipboard.writeText(htmlContent);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
      showToast("✓ Standalone HTML copied to clipboard!");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleContactClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const contactElem = document.getElementById("contact");
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: "smooth", block: "center" });
      contactElem.classList.add("highlight-pulse");
      setTimeout(() => {
        contactElem.classList.remove("highlight-pulse");
      }, 1500);
    }
  };

  // Focus a specific field in the editor panel when user clicks an inline element
  const handleFocusFieldFromCanvas = (tabName, fieldId) => {
    if (!isEditing) setIsEditing(true);
    setActiveEditorTab(tabName);
    setTimeout(() => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.classList.add("field-spotlight");
        setTimeout(() => input.classList.remove("field-spotlight"), 1800);
      }
    }, 150);
  };

  return (
    <div className={`preview-viewport-shell ${isEditing ? "is-editing-mode" : ""}`}>
      {/* ============================================================
          TOP CONTROL TOOLBAR
      ============================================================ */}
      <header className="preview-top-toolbar">
        <div className="toolbar-left">
          <button className="tb-btn tb-back" onClick={onBack} title="Return to template picker">
            <span>←</span> Back to Templates
          </button>

          <div className="tb-divider"></div>

          {/* Template Switcher Dropdown */}
          <div className="tb-template-select-wrap">
            <span className="tb-label">Theme:</span>
            <select
              value={activeTemplate}
              onChange={(e) => setActiveTemplate(e.target.value)}
              className="tb-template-dropdown"
              id="preview-template-dropdown"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="tb-divider"></div>

          {/* EDIT MODE TOGGLE BUTTON */}
          <button
            className={`tb-btn tb-edit-toggle ${isEditing ? "active" : ""}`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? "Close visual editor and view website" : "Edit website text, services, and brand details"}
            id="toggle-edit-mode-btn"
          >
            {isEditing ? (
              <>
                <span className="tb-edit-dot">●</span>
                <span>👁️ Close Editor</span>
              </>
            ) : (
              <>
                <span>✏️ Edit Website</span>
              </>
            )}
          </button>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="toolbar-center">
          <div className="device-pills">
            <button
              className={`device-btn ${deviceMode === "desktop" ? "active" : ""}`}
              onClick={() => setDeviceMode("desktop")}
              title="Desktop Fullscreen View"
            >
              🖥️ <span className="device-label">Desktop</span>
            </button>
            <button
              className={`device-btn ${deviceMode === "tablet" ? "active" : ""}`}
              onClick={() => setDeviceMode("tablet")}
              title="Tablet 768px View"
            >
              📱 <span className="device-label">Tablet</span>
            </button>
            <button
              className={`device-btn ${deviceMode === "mobile" ? "active" : ""}`}
              onClick={() => setDeviceMode("mobile")}
              title="Mobile 390px View"
            >
              📲 <span className="device-label">Mobile</span>
            </button>
          </div>

          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === "preview" ? "active" : ""}`}
              onClick={() => setViewMode("preview")}
            >
              Preview
            </button>
            <button
              className={`view-btn ${viewMode === "code" ? "active" : ""}`}
              onClick={() => setViewMode("code")}
            >
              Code
            </button>
          </div>
        </div>

        {/* Right: Export & Copy Actions */}
        <div className="toolbar-right">
          {isEditing && (
            <button
              className="tb-btn tb-reset"
              onClick={handleResetToOriginal}
              title="Revert all changes back to initial AI generation"
            >
              ↺ Reset
            </button>
          )}

          <button className="tb-btn tb-copy" onClick={handleCopyCode} title="Copy standalone HTML">
            📋 Copy HTML
          </button>

          <button className="tb-btn tb-html" onClick={handleDownloadHtml} title="Save single .html file">
            ↓ .HTML
          </button>

          <button
            className="tb-btn tb-download-zip"
            onClick={handleDownloadZip}
            disabled={downloading}
            id="download-website-zip-btn"
          >
            {downloading ? "Packaging..." : "↓ Download ZIP"}
          </button>
        </div>
      </header>

      {/* Copy / Action Toast Alert */}
      {(copiedToast || toastMessage) && (
        <div className="copy-toast-banner">
          {toastMessage || "✓ Standalone HTML copied to clipboard!"}
        </div>
      )}

      {/* ============================================================
          MAIN WORKSPACE LAYOUT (SIDEBAR EDITOR + PREVIEW CANVAS)
      ============================================================ */}
      <div className={`preview-workspace-layout ${isEditing ? "editor-open" : ""}`}>
        {/* ============================================================
            CUSTOMIZER & CONTENT EDITOR SIDEBAR (When Edit Mode Active)
        ============================================================ */}
        {isEditing && (
          <aside className="site-editor-sidebar" id="site-editor-sidebar">
            <div className="editor-sidebar-header">
              <div className="editor-title-wrap">
                <h3>✏️ Website Editor</h3>
                <span className="live-sync-indicator">
                  <span className="live-pulse-dot"></span> Live Sync
                </span>
              </div>
              <div className="editor-quick-actions">
                <button
                  type="button"
                  className="editor-btn-secondary"
                  onClick={handleResetToOriginal}
                  title="Revert all fields back to initial AI generated content"
                >
                  ↺ Reset
                </button>
                <button
                  type="button"
                  className="editor-btn-primary"
                  onClick={() => setIsEditing(false)}
                  title="Finish editing"
                >
                  ✓ Done
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="editor-nav-tabs">
              <button
                type="button"
                className={`tab-btn ${activeEditorTab === "hero" ? "active" : ""}`}
                onClick={() => setActiveEditorTab("hero")}
              >
                🏷️ Hero & Brand
              </button>
              <button
                type="button"
                className={`tab-btn ${activeEditorTab === "about" ? "active" : ""}`}
                onClick={() => setActiveEditorTab("about")}
              >
                📖 About
              </button>
              <button
                type="button"
                className={`tab-btn ${activeEditorTab === "services" ? "active" : ""}`}
                onClick={() => setActiveEditorTab("services")}
              >
                ⚡ Services ({services.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeEditorTab === "features" ? "active" : ""}`}
                onClick={() => setActiveEditorTab("features")}
              >
                ✨ Highlights & FAQs
              </button>
              <button
                type="button"
                className={`tab-btn ${activeEditorTab === "contact" ? "active" : ""}`}
                onClick={() => setActiveEditorTab("contact")}
              >
                📍 Contact & Hours
              </button>
            </div>

            {/* Editor Scrollable Body */}
            <div className="editor-scroll-body">
              {/* ------------------------------------
                  TAB 1: HERO & BRAND
              ------------------------------------ */}
              {activeEditorTab === "hero" && (
                <div className="editor-tab-pane">
                  <div className="editor-field-card">
                    <h4>Brand Identity</h4>

                    <div className="editor-input-group">
                      <label htmlFor="edit-business-name">Official Business Name</label>
                      <input
                        id="edit-business-name"
                        type="text"
                        value={businessName}
                        onChange={(e) => handleUpdateDataField("business_name", e.target.value)}
                        placeholder="e.g. Bean & Bloom Coffee"
                      />
                    </div>

                    <div className="editor-input-group">
                      <label htmlFor="edit-category">Category / Industry Tag</label>
                      <input
                        id="edit-category"
                        type="text"
                        value={category}
                        onChange={(e) => handleUpdateDataField("category", e.target.value)}
                        placeholder="e.g. Artisan Cafe & Roastery"
                      />
                    </div>
                  </div>

                  <div className="editor-field-card">
                    <div className="field-card-header">
                      <h4>Hero Section Headline</h4>
                      <button
                        type="button"
                        className="btn-ai-polish"
                        onClick={() => handleAiPolish("hero_title", heroTitle, "punchy, memorable, and modern")}
                        disabled={polishingField === "hero_title"}
                      >
                        {polishingField === "hero_title" ? "✨ Polishing..." : "✨ AI Polish"}
                      </button>
                    </div>

                    <div className="editor-input-group">
                      <input
                        id="edit-hero-title"
                        type="text"
                        value={heroTitle}
                        onChange={(e) => handleUpdateContentField("hero_title", e.target.value)}
                        placeholder="e.g. Handcrafted Espresso & Organic Artisan Pastries"
                      />
                    </div>

                    {polishResult && polishResult.field === "hero_title" && (
                      <div className="ai-suggestions-panel">
                        <span className="suggestions-badge">✨ AI Suggestions</span>
                        <div className="suggestions-list">
                          {polishResult.suggestions.map((sug, sIdx) => (
                            <div key={sIdx} className="suggestion-item" onClick={() => applyPolishSuggestion("hero_title", sug)}>
                              <span>{sug}</span>
                              <button type="button" className="btn-apply-suggestion">Use</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="field-card-header" style={{ marginTop: "16px" }}>
                      <h4>Hero Subtitle / Description</h4>
                      <button
                        type="button"
                        className="btn-ai-polish"
                        onClick={() => handleAiPolish("hero_description", heroDesc, "compelling value proposition")}
                        disabled={polishingField === "hero_description"}
                      >
                        {polishingField === "hero_description" ? "✨ Polishing..." : "✨ AI Polish"}
                      </button>
                    </div>

                    <div className="editor-input-group">
                      <textarea
                        id="edit-hero-desc"
                        rows={3}
                        value={heroDesc}
                        onChange={(e) => handleUpdateContentField("hero_description", e.target.value)}
                        placeholder="e.g. Delivering trusted, top-tier solutions designed to exceed your expectations."
                      />
                    </div>

                    {polishResult && polishResult.field === "hero_description" && (
                      <div className="ai-suggestions-panel">
                        <span className="suggestions-badge">✨ AI Suggestions</span>
                        <div className="suggestions-list">
                          {polishResult.suggestions.map((sug, sIdx) => (
                            <div key={sIdx} className="suggestion-item" onClick={() => applyPolishSuggestion("hero_description", sug)}>
                              <span>{sug}</span>
                              <button type="button" className="btn-apply-suggestion">Use</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="editor-input-group" style={{ marginTop: "16px" }}>
                      <label htmlFor="edit-hero-cta">CTA Button Text (Informational)</label>
                      <input
                        id="edit-hero-cta"
                        type="text"
                        value={cta}
                        onChange={(e) => handleUpdateContentField("cta", e.target.value)}
                        placeholder="e.g. Connect With Our Team"
                      />
                      <small className="field-hint">Smoothly scrolls visitors directly to contact & hours.</small>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------
                  TAB 2: ABOUT STORY
              ------------------------------------ */}
              {activeEditorTab === "about" && (
                <div className="editor-tab-pane">
                  <div className="editor-field-card">
                    <div className="field-card-header">
                      <h4>Business Story & Mission</h4>
                      <button
                        type="button"
                        className="btn-ai-polish"
                        onClick={() => handleAiPolish("about", aboutText, "warm, authentic, and trust-building")}
                        disabled={polishingField === "about"}
                      >
                        {polishingField === "about" ? "✨ Polishing..." : "✨ AI Polish"}
                      </button>
                    </div>

                    <div className="editor-input-group">
                      <textarea
                        id="edit-about-text"
                        rows={6}
                        value={aboutText}
                        onChange={(e) => handleUpdateContentField("about", e.target.value)}
                        placeholder="Tell your story, your commitment to quality, and community trust..."
                      />
                    </div>

                    {polishResult && polishResult.field === "about" && (
                      <div className="ai-suggestions-panel">
                        <span className="suggestions-badge">✨ AI Suggestions</span>
                        <div className="suggestions-list">
                          {polishResult.suggestions.map((sug, sIdx) => (
                            <div key={sIdx} className="suggestion-item" onClick={() => applyPolishSuggestion("about", sug)}>
                              <span>{sug}</span>
                              <button type="button" className="btn-apply-suggestion">Use</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------
                  TAB 3: SERVICES
              ------------------------------------ */}
              {activeEditorTab === "services" && (
                <div className="editor-tab-pane">
                  <div className="pane-header-row">
                    <h4>Service Capabilities ({services.length})</h4>
                    <button type="button" className="btn-add-item-sm" onClick={handleAddService}>
                      + Add Service
                    </button>
                  </div>

                  <div className="services-edit-stack">
                    {services.map((svc, idx) => (
                      <div key={idx} className="service-edit-card" id={`edit-service-card-${idx}`}>
                        <div className="service-card-top-bar">
                          <span className="card-number-badge">#{idx + 1}</span>
                          <button
                            type="button"
                            className="btn-card-delete"
                            onClick={() => handleDeleteService(idx)}
                            title="Remove this service"
                          >
                            🗑️
                          </button>
                        </div>

                        <div className="editor-input-group">
                          <label>Service Title</label>
                          <input
                            type="text"
                            value={svc.name || ""}
                            onChange={(e) => handleUpdateService(idx, "name", e.target.value)}
                            placeholder="e.g. Espresso Crafting"
                          />
                        </div>

                        <div className="editor-input-group" style={{ marginTop: "10px" }}>
                          <label>Service Description</label>
                          <textarea
                            rows={2}
                            value={svc.description || ""}
                            onChange={(e) => handleUpdateService(idx, "description", e.target.value)}
                            placeholder="Explain the offering and customer benefit..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="btn-add-item-full" onClick={handleAddService}>
                    + Add Another Service
                  </button>
                </div>
              )}

              {/* ------------------------------------
                  TAB 4: HIGHLIGHTS & FAQS
              ------------------------------------ */}
              {activeEditorTab === "features" && (
                <div className="editor-tab-pane">
                  {/* Features / Why Choose Us */}
                  <div className="pane-header-row">
                    <h4>Why Choose Us ({features.length})</h4>
                    <button type="button" className="btn-add-item-sm" onClick={handleAddFeature}>
                      + Add Highlight
                    </button>
                  </div>

                  <div className="features-edit-stack">
                    {features.map((feat, fIdx) => (
                      <div key={fIdx} className="feature-edit-card" id={`edit-feature-card-${fIdx}`}>
                        <div className="service-card-top-bar">
                          <span className="card-number-badge">Highlight #{fIdx + 1}</span>
                          <button
                            type="button"
                            className="btn-card-delete"
                            onClick={() => handleDeleteFeature(fIdx)}
                            title="Remove highlight"
                          >
                            🗑️
                          </button>
                        </div>
                        <input
                          type="text"
                          value={feat.title || ""}
                          onChange={(e) => handleUpdateFeature(fIdx, "title", e.target.value)}
                          placeholder="Headline (e.g. Trusted Reliability)"
                        />
                        <textarea
                          rows={2}
                          style={{ marginTop: "8px" }}
                          value={feat.description || ""}
                          onChange={(e) => handleUpdateFeature(fIdx, "description", e.target.value)}
                          placeholder="Description..."
                        />
                      </div>
                    ))}
                  </div>

                  {/* FAQs */}
                  <div className="pane-header-row" style={{ marginTop: "24px" }}>
                    <h4>Frequently Asked Questions ({faqs.length})</h4>
                    <button type="button" className="btn-add-item-sm" onClick={handleAddFaq}>
                      + Add FAQ
                    </button>
                  </div>

                  <div className="faqs-edit-stack">
                    {faqs.map((faq, qIdx) => (
                      <div key={qIdx} className="faq-edit-card" id={`edit-faq-card-${qIdx}`}>
                        <div className="service-card-top-bar">
                          <span className="card-number-badge">FAQ #{qIdx + 1}</span>
                          <button
                            type="button"
                            className="btn-card-delete"
                            onClick={() => handleDeleteFaq(qIdx)}
                            title="Remove FAQ"
                          >
                            🗑️
                          </button>
                        </div>
                        <input
                          type="text"
                          value={faq.question || ""}
                          onChange={(e) => handleUpdateFaq(qIdx, "question", e.target.value)}
                          placeholder="Question..."
                        />
                        <textarea
                          rows={2}
                          style={{ marginTop: "8px" }}
                          value={faq.answer || ""}
                          onChange={(e) => handleUpdateFaq(qIdx, "answer", e.target.value)}
                          placeholder="Helpful answer..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------
                  TAB 5: CONTACT & HOURS
              ------------------------------------ */}
              {activeEditorTab === "contact" && (
                <div className="editor-tab-pane">
                  <div className="editor-field-card">
                    <h4>Location & Operating Schedule</h4>

                    <div className="editor-input-group">
                      <label htmlFor="edit-location">Physical Location / Operating Area</label>
                      <input
                        id="edit-location"
                        type="text"
                        value={location}
                        onChange={(e) => handleUpdateDataField("location", e.target.value)}
                        placeholder="e.g. Bandra West, Mumbai"
                      />
                    </div>

                    <div className="editor-input-group" style={{ marginTop: "14px" }}>
                      <label htmlFor="edit-hours">Operating Hours & Schedule</label>
                      <input
                        id="edit-hours"
                        type="text"
                        value={hours}
                        onChange={(e) => handleUpdateDataField("hours", e.target.value)}
                        placeholder="e.g. Mon - Sat: 9:00 AM - 9:00 PM"
                      />
                    </div>

                    <div className="editor-input-group" style={{ marginTop: "14px" }}>
                      <label htmlFor="edit-contact">Direct Contact (Compulsory on Site)</label>
                      <input
                        id="edit-contact"
                        type="text"
                        value={contact}
                        onChange={(e) => handleUpdateDataField("contact", e.target.value)}
                        placeholder="e.g. +91 9876543210 or hello@brand.com"
                      />
                      <small className="field-hint">Visitors can copy this with one tap on the site.</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ============================================================
            MAIN PREVIEW CANVAS AREA
        ============================================================ */}
        <main className={`preview-canvas-container ${isEditing ? "with-sidebar-open" : ""}`}>
          {viewMode === "code" ? (
            <div className="code-viewer-panel">
              <div className="code-viewer-header">
                <span>Standalone Production HTML ({serverHtml.length} characters)</span>
                <button className="tb-btn tb-copy-small" onClick={handleCopyCode}>
                  Copy Entire Code
                </button>
              </div>
              <pre className="code-viewer-content">
                <code>{getCompleteHtml()}</code>
              </pre>
            </div>
          ) : (
            <div className={`device-frame device-frame-${deviceMode}`}>
              {deviceMode !== "desktop" && (
                <div className="device-notch-bar">
                  <span className="notch-camera"></span>
                  <span className="notch-speaker"></span>
                </div>
              )}

              {/* Template Render Container */}
              <div className={`rendered-website template-skin-${activeTemplate} ${isEditing ? "live-editing-active" : ""}`}>
                {renderTemplateSkin({
                  templateId: activeTemplate,
                  businessName,
                  category,
                  location,
                  hours,
                  contact,
                  heroTitle,
                  heroDesc,
                  aboutText,
                  cta,
                  services,
                  features,
                  faqs,
                  onContactClick: handleContactClick,
                  isEditing,
                  onUpdateDataField: handleUpdateDataField,
                  onUpdateContentField: handleUpdateContentField,
                  onUpdateService: handleUpdateService,
                  onUpdateFeature: handleUpdateFeature,
                  onUpdateFaq: handleUpdateFaq,
                  onFocusField: handleFocusFieldFromCanvas,
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------
// Template Skin Dispatcher & Component Renderers
// Supports direct inline editing and instant live preview
// --------------------------------------------------------------------
function renderTemplateSkin(props) {
  const {
    templateId,
    businessName,
    category,
    location,
    hours,
    contact,
    heroTitle,
    heroDesc,
    aboutText,
    cta,
    services,
    features,
    faqs,
    onContactClick,
    isEditing,
    onUpdateDataField,
    onUpdateContentField,
    onUpdateService,
    onUpdateFeature,
    onUpdateFaq,
    onFocusField,
  } = props;

  return (
    <div className={`tpl-body tpl-${templateId}`}>
      {/* Sticky Navigation */}
      <nav className="tpl-nav">
        <div className="tpl-nav-inner">
          <div
            className={`tpl-brand-cluster ${isEditing ? "editable-inline-block" : ""}`}
            onClick={isEditing ? () => onFocusField("hero", "edit-business-name") : undefined}
            title={isEditing ? "Click to edit brand details in sidebar" : ""}
          >
            <span
              className="tpl-brand-name"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => onUpdateDataField("business_name", e.currentTarget.innerText.trim())}
            >
              {businessName}
            </span>
            <span
              className="tpl-brand-badge"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => onUpdateDataField("category", e.currentTarget.innerText.trim())}
            >
              {category}
            </span>
            {isEditing && <span className="inline-pen-badge">✎</span>}
          </div>
          <div className="tpl-nav-links">
            <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }); }}>About</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}>Services</a>
            {features && features.length > 0 && (
              <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}>Features</a>
            )}
            <a href="#contact" className="tpl-nav-cta" onClick={onContactClick}>Contact &darr;</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="tpl-hero-section">
        <div className="tpl-container">
          <div
            className={`tpl-eyebrow-pill ${isEditing ? "editable-inline-block" : ""}`}
            onClick={isEditing ? () => onFocusField("contact", "edit-location") : undefined}
          >
            <span className="eyebrow-dot"></span> Verified Profile &bull;{" "}
            <span
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => onUpdateDataField("location", e.currentTarget.innerText.trim())}
            >
              {location}
            </span>
            {isEditing && <span className="inline-pen-badge">✎</span>}
          </div>

          <div
            className={`hero-headline-wrap ${isEditing ? "editable-inline-block" : ""}`}
            onClick={isEditing ? () => onFocusField("hero", "edit-hero-title") : undefined}
            title={isEditing ? "Click to edit hero title" : ""}
          >
            <h1
              className="tpl-hero-headline"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => onUpdateContentField("hero_title", e.currentTarget.innerText.trim())}
            >
              {heroTitle}
            </h1>
            {isEditing && <span className="inline-pen-badge">✎</span>}
          </div>

          <div
            className={`hero-subtext-wrap ${isEditing ? "editable-inline-block" : ""}`}
            onClick={isEditing ? () => onFocusField("hero", "edit-hero-desc") : undefined}
            title={isEditing ? "Click to edit hero description" : ""}
          >
            <p
              className="tpl-hero-subtext"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => onUpdateContentField("hero_description", e.currentTarget.innerText.trim())}
            >
              {heroDesc}
            </p>
            {isEditing && <span className="inline-pen-badge">✎</span>}
          </div>

          <div className="tpl-hero-actions">
            <div
              className={`hero-cta-btn-wrap ${isEditing ? "editable-inline-block" : ""}`}
              onClick={isEditing ? () => onFocusField("hero", "edit-hero-cta") : undefined}
            >
              <button
                className="tpl-btn-primary"
                onClick={!isEditing ? onContactClick : undefined}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => onUpdateContentField("cta", e.currentTarget.innerText.trim())}
              >
                {cta} &darr;
              </button>
              {isEditing && <span className="inline-pen-badge">✎</span>}
            </div>

            <button className="tpl-btn-secondary" onClick={onContactClick}>
              📍 View Details &bull; {location}
            </button>
          </div>

          {/* Quick Business Ribbon */}
          <div className="tpl-info-ribbon">
            <div
              className={`ribbon-card ${isEditing ? "editable-inline-block" : ""}`}
              onClick={isEditing ? () => onFocusField("contact", "edit-location") : onContactClick}
              style={{ cursor: "pointer" }}
            >
              <span className="ribbon-icon">📍</span>
              <div>
                <span className="ribbon-label">Location</span>
                <strong
                  className="ribbon-val"
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => onUpdateDataField("location", e.currentTarget.innerText.trim())}
                >
                  {location}
                </strong>
              </div>
              {isEditing && <span className="inline-pen-badge">✎</span>}
            </div>

            <div
              className={`ribbon-card ${isEditing ? "editable-inline-block" : ""}`}
              onClick={isEditing ? () => onFocusField("contact", "edit-hours") : onContactClick}
              style={{ cursor: "pointer" }}
            >
              <span className="ribbon-icon">🕒</span>
              <div>
                <span className="ribbon-label">Hours</span>
                <strong
                  className="ribbon-val"
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => onUpdateDataField("hours", e.currentTarget.innerText.trim())}
                >
                  {hours}
                </strong>
              </div>
              {isEditing && <span className="inline-pen-badge">✎</span>}
            </div>

            <div
              className={`ribbon-card ${isEditing ? "editable-inline-block" : ""}`}
              onClick={isEditing ? () => onFocusField("contact", "edit-contact") : onContactClick}
              style={{ cursor: "pointer" }}
            >
              <span className="ribbon-icon">📞</span>
              <div>
                <span className="ribbon-label">Direct Contact</span>
                <strong
                  className="ribbon-val"
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => onUpdateDataField("contact", e.currentTarget.innerText.trim())}
                >
                  {contact || "Available on request"}
                </strong>
              </div>
              {isEditing && <span className="inline-pen-badge">✎</span>}
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="tpl-section tpl-about-section" id="about">
        <div className="tpl-container">
          <div
            className={`tpl-about-card ${isEditing ? "editable-inline-block" : ""}`}
            onClick={isEditing ? () => onFocusField("about", "edit-about-text") : undefined}
          >
            <div className="tpl-about-header">
              <span className="tpl-section-badge">Our Story</span>
              <h2>About {businessName}</h2>
            </div>
            <p
              className="tpl-about-text"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) => onUpdateContentField("about", e.currentTarget.innerText.trim())}
            >
              {aboutText}
            </p>
            {isEditing && <span className="inline-pen-badge">✎</span>}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="tpl-section tpl-services-section" id="services">
        <div className="tpl-container">
          <div className="tpl-section-header">
            <span className="tpl-section-badge">Capabilities & Offerings</span>
            <h2>Our Core Services</h2>
            <p>Designed with meticulous attention to detail and personalized care for every customer.</p>
          </div>

          <div className="tpl-services-grid">
            {services.map((svc, sIdx) => (
              <div
                key={sIdx}
                className={`tpl-service-card ${isEditing ? "editable-inline-block" : ""}`}
                onClick={isEditing ? () => onFocusField("services", `edit-service-card-${sIdx}`) : undefined}
              >
                <div className="service-card-header">
                  <span className="service-number">0{sIdx + 1}</span>
                  <span className="service-accent-dot"></span>
                </div>
                <h3
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => onUpdateService(sIdx, "name", e.currentTarget.innerText.trim())}
                >
                  {svc.name}
                </h3>
                <p
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => onUpdateService(sIdx, "description", e.currentTarget.innerText.trim())}
                >
                  {svc.description}
                </p>
                {isEditing && <span className="inline-pen-badge">✎</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Why Choose Us */}
      {features && features.length > 0 && (
        <section className="tpl-section tpl-features-section" id="features">
          <div className="tpl-container">
            <div className="tpl-section-header">
              <span className="tpl-section-badge">Why Choose Us</span>
              <h2>Built for Excellence</h2>
            </div>

            <div className="tpl-features-grid">
              {features.map((feat, fIdx) => (
                <div
                  key={fIdx}
                  className={`tpl-feature-card ${isEditing ? "editable-inline-block" : ""}`}
                  onClick={isEditing ? () => onFocusField("features", `edit-feature-card-${fIdx}`) : undefined}
                >
                  <div className="feature-check-icon">✓</div>
                  <div>
                    <h4
                      contentEditable={isEditing}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => onUpdateFeature(fIdx, "title", e.currentTarget.innerText.trim())}
                    >
                      {feat.title}
                    </h4>
                    <p
                      contentEditable={isEditing}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => onUpdateFeature(fIdx, "description", e.currentTarget.innerText.trim())}
                    >
                      {feat.description}
                    </p>
                  </div>
                  {isEditing && <span className="inline-pen-badge">✎</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs Section */}
      {faqs && faqs.length > 0 && (
        <section className="tpl-section tpl-faqs-section">
          <div className="tpl-container">
            <div className="tpl-section-header">
              <span className="tpl-section-badge">Common Inquiries</span>
              <h2>Frequently Asked Questions</h2>
            </div>

            <div className="tpl-faqs-list">
              {faqs.map((faq, qIdx) => (
                <div
                  key={qIdx}
                  className={`tpl-faq-card ${isEditing ? "editable-inline-block" : ""}`}
                  onClick={isEditing ? () => onFocusField("features", `edit-faq-card-${qIdx}`) : undefined}
                >
                  <h4
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => onUpdateFaq(qIdx, "question", e.currentTarget.innerText.trim())}
                  >
                    {faq.question}
                  </h4>
                  <p
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => onUpdateFaq(qIdx, "answer", e.currentTarget.innerText.trim())}
                  >
                    {faq.answer}
                  </p>
                  {isEditing && <span className="inline-pen-badge">✎</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Details Card */}
      <section className="tpl-section tpl-cta-section" id="contact">
        <div className="tpl-container">
          <div className="tpl-cta-box">
            <h2>Visit & Connect with {businessName}</h2>
            <p>We are happily serving customers across {location}. Check our full schedule and details below:</p>

            <div className="tpl-contact-details-grid">
              <div
                className={`tpl-contact-detail-item ${isEditing ? "editable-inline-block" : ""}`}
                onClick={isEditing ? () => onFocusField("contact", "edit-location") : undefined}
              >
                <span className="detail-icon">📍</span>
                <div>
                  <span className="detail-label">Physical Location</span>
                  <strong
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => onUpdateDataField("location", e.currentTarget.innerText.trim())}
                  >
                    {location}
                  </strong>
                </div>
                {isEditing && <span className="inline-pen-badge">✎</span>}
              </div>

              <div
                className={`tpl-contact-detail-item ${isEditing ? "editable-inline-block" : ""}`}
                onClick={isEditing ? () => onFocusField("contact", "edit-hours") : undefined}
              >
                <span className="detail-icon">🕒</span>
                <div>
                  <span className="detail-label">Operating Schedule</span>
                  <strong
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => onUpdateDataField("hours", e.currentTarget.innerText.trim())}
                  >
                    {hours}
                  </strong>
                </div>
                {isEditing && <span className="inline-pen-badge">✎</span>}
              </div>

              <div
                className={`tpl-contact-detail-item ${isEditing ? "editable-inline-block" : ""}`}
                onClick={isEditing ? () => onFocusField("contact", "edit-contact") : undefined}
              >
                <span className="detail-icon">📞</span>
                <div>
                  <span className="detail-label">Direct Contact</span>
                  <strong
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => onUpdateDataField("contact", e.currentTarget.innerText.trim())}
                  >
                    {contact || "Available during open hours"}
                  </strong>
                </div>
                {isEditing && <span className="inline-pen-badge">✎</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="tpl-footer">
        <div className="tpl-container tpl-footer-inner">
          <div className="footer-left">
            <strong className="footer-brand">{businessName}</strong>
            <p>&copy; 2026 {businessName}. All rights reserved.</p>
          </div>
          <div className="footer-right">
            <span>Powered by MakeSite AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function escapeHtml(val) {
  if (val == null) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default WebsitePreview;