import { useState, useEffect } from "react";
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
  onBack,
}) {
  const [activeTemplate, setActiveTemplate] = useState(template);
  const [deviceMode, setDeviceMode] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
  const [viewMode, setViewMode] = useState("preview"); // 'preview' | 'code'
  const [downloading, setDownloading] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [serverHtml, setServerHtml] = useState("");
  const [htmlCache, setHtmlCache] = useState({});

  const businessName = businessData?.business_name || "Your Business";
  const category = businessData?.category || "Professional Services";
  const location = businessData?.location || "Regional City";
  const hours = businessData?.hours || "Regular Operating Hours";
  const contact = businessData?.contact || "";
  const products = businessData?.products || [];

  // Content fallbacks
  const heroTitle = websiteContent?.hero_title || `Premier ${category} in ${location}`;
  const heroDesc = websiteContent?.hero_description || `Delivering trusted, top-tier ${category.lower ? category.toLowerCase() : category} solutions designed to exceed your expectations.`;
  const aboutText = websiteContent?.about || `At ${businessName}, we take pride in delivering honest, reliable, and high-impact services across ${location}. Founded on trust and customer satisfaction.`;
  
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

  const cta = sanitizeCta(websiteContent?.cta, "Connect With Us Today");

  const services = (websiteContent?.services && websiteContent.services.length > 0)
    ? websiteContent.services
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

  const features = websiteContent?.features || [
    { title: "Trusted Reliability", description: "Consistent, dependable service you can always rely on." },
    { title: "Community Focused", description: `Proudly serving customers across ${location}.` },
    { title: "Direct Communication", description: "Transparent, honest, and responsive client care." },
  ];

  const faqs = websiteContent?.faqs || [
    { question: `Where is ${businessName} located?`, answer: `We are located in ${location}. Contact us anytime during: ${hours}.` },
    { question: "How do I get in touch?", answer: `You can reach out directly via ${contact || "our contact options"} or visit us during operating hours.` },
  ];

  // Fetch server-rendered HTML for pixel-perfect standalone export
  useEffect(() => {
    let isCurrent = true;
    fetch("http://127.0.0.1:8000/generate-html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_data: businessData,
        content: websiteContent || {},
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

    return () => {
      isCurrent = false;
    };
  }, [businessData, websiteContent, activeTemplate]);

  // Clean filename generator
  const getSafeFileName = (name) => {
    return String(name || "website")
      .trim()
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
  };

  // Generate complete HTML backup if server fetch failed
  const getCompleteHtml = () => {
    if (serverHtml) return serverHtml;

    // Fallback standalone HTML
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

  // Fetch freshest server HTML for the selected template or fallback
  const getOrFetchHtml = async () => {
    if (htmlCache[activeTemplate] && htmlCache[activeTemplate].trim()) {
      return htmlCache[activeTemplate];
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_data: businessData,
          content: websiteContent || {},
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

  return (
    <div className="preview-viewport-shell">
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

      {/* Copy Toast Alert */}
      {copiedToast && (
        <div className="copy-toast-banner">
          ✓ Standalone HTML copied to clipboard!
        </div>
      )}

      {/* ============================================================
          MAIN PREVIEW CANVAS AREA
      ============================================================ */}
      <main className="preview-canvas-container">
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
            <div className={`rendered-website template-skin-${activeTemplate}`}>
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
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --------------------------------------------------------------------
// Template Skin Dispatcher & Component Renderers
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
  } = props;

  return (
    <div className={`tpl-body tpl-${templateId}`}>
      {/* Sticky Navigation */}
      <nav className="tpl-nav">
        <div className="tpl-nav-inner">
          <div className="tpl-brand-cluster">
            <span className="tpl-brand-name">{businessName}</span>
            <span className="tpl-brand-badge">{category}</span>
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
          <div className="tpl-eyebrow-pill">
            <span className="eyebrow-dot"></span> Verified Profile &bull; {location}
          </div>

          <h1 className="tpl-hero-headline">{heroTitle}</h1>
          <p className="tpl-hero-subtext">{heroDesc}</p>

          <div className="tpl-hero-actions">
            <button className="tpl-btn-primary" onClick={onContactClick}>
              {cta} &darr;
            </button>
            <button className="tpl-btn-secondary" onClick={onContactClick}>
              📍 View Details &bull; {location}
            </button>
          </div>

          {/* Quick Business Ribbon */}
          <div className="tpl-info-ribbon">
            <div className="ribbon-card" onClick={onContactClick} style={{ cursor: "pointer" }}>
              <span className="ribbon-icon">📍</span>
              <div>
                <span className="ribbon-label">Location</span>
                <strong className="ribbon-val">{location}</strong>
              </div>
            </div>

            <div className="ribbon-card" onClick={onContactClick} style={{ cursor: "pointer" }}>
              <span className="ribbon-icon">🕒</span>
              <div>
                <span className="ribbon-label">Hours</span>
                <strong className="ribbon-val">{hours}</strong>
              </div>
            </div>

            <div className="ribbon-card" onClick={onContactClick} style={{ cursor: "pointer" }}>
              <span className="ribbon-icon">📞</span>
              <div>
                <span className="ribbon-label">Direct Contact</span>
                <strong className="ribbon-val">{contact || "Available on request"}</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="tpl-section tpl-about-section" id="about">
        <div className="tpl-container">
          <div className="tpl-about-card">
            <div className="tpl-about-header">
              <span className="tpl-section-badge">Our Story</span>
              <h2>About {businessName}</h2>
            </div>
            <p className="tpl-about-text">{aboutText}</p>
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
              <div key={sIdx} className="tpl-service-card">
                <div className="service-card-header">
                  <span className="service-number">0{sIdx + 1}</span>
                  <span className="service-accent-dot"></span>
                </div>
                <h3>{svc.name}</h3>
                <p>{svc.description}</p>
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
                <div key={fIdx} className="tpl-feature-card">
                  <div className="feature-check-icon">✓</div>
                  <div>
                    <h4>{feat.title}</h4>
                    <p>{feat.description}</p>
                  </div>
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
                <div key={qIdx} className="tpl-faq-card">
                  <h4>{faq.question}</h4>
                  <p>{faq.answer}</p>
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
              <div className="tpl-contact-detail-item">
                <span className="detail-icon">📍</span>
                <div>
                  <span className="detail-label">Physical Location</span>
                  <strong>{location}</strong>
                </div>
              </div>

              <div className="tpl-contact-detail-item">
                <span className="detail-icon">🕒</span>
                <div>
                  <span className="detail-label">Operating Schedule</span>
                  <strong>{hours}</strong>
                </div>
              </div>

              <div className="tpl-contact-detail-item">
                <span className="detail-icon">📞</span>
                <div>
                  <span className="detail-label">Direct Contact</span>
                  <strong>{contact || "Available during open hours"}</strong>
                </div>
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