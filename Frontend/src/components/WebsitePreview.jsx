import { useState, useEffect, useRef } from "react";
import "./WebsitePreview.css";
import JSZip from "jszip";
import { rephraseSection, generateWebsiteHtml } from "../api";
import { detectIndustryArchetype, getArchetypeConfig } from "../utils/industryArchetypes";

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
  confirmedFields,
  onUpdateBusinessData,
  onUpdateWebsiteContent,
  onBack,
}) {
  const confirmedSet = confirmedFields instanceof Set
    ? confirmedFields
    : new Set(Array.isArray(confirmedFields) ? confirmedFields : ["business_name", "category", "location", "hours", "contact"]);

  const [activeTemplate, setActiveTemplate] = useState(template);
  const [deviceMode, setDeviceMode] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
  const [frameScrollMode, setFrameScrollMode] = useState("screen"); // 'screen' | 'full'
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
  const industry = detectIndustryArchetype(category, businessName, products);
  const archetypeConfig = getArchetypeConfig(industry, currentBusinessData, currentContent);

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
      const data = await rephraseSection({
        section: sectionKey,
        text: currentVal,
        businessName: businessName,
        category: category,
        style: tone,
      });

      const allSuggestions = [data.improved, ...(data.alternatives || [])].filter(
        (item, idx, self) => item && typeof item === "string" && self.indexOf(item) === idx
      );

      setPolishResult({
        field: sectionKey,
        suggestions: allSuggestions,
      });
      showToast("✨ AI Suggestions ready! Choose below.");
    } catch (err) {
      console.warn("AI Polish error:", err);
      const reqInfo = err?.requestId ? ` (Ref: ${err.requestId})` : "";
      showToast(`${err?.detail || "⚠️ Could not reach AI polish service"}${reqInfo}`);
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
      const contentPayload = {
        ...currentContent,
        hero_title: heroTitle,
        hero_description: heroDesc,
        about: aboutText,
        cta: cta,
        services: services,
        features: features,
        faqs: faqs,
      };

      generateWebsiteHtml(currentBusinessData, contentPayload, activeTemplate)
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

    const verifiedCount = ["business_name", "category", "location", "hours", "contact"].filter((f) =>
      Boolean(
        f === "business_name"
          ? confirmedSet?.has("business_name")
          : f === "category"
          ? confirmedSet?.has("category")
          : f === "location"
          ? confirmedSet?.has("location")
          : f === "hours"
          ? confirmedSet?.has("hours")
          : confirmedSet?.has("contact") && contact
      )
    ).length;

    let industryHtml = "";
    if (industry === "salon") {
      const treatmentCards = (archetypeConfig.treatmentMenu || []).map((t) => `
        <div class="card" style="border-left: 4px solid #10b981; background: #0c1514; margin: 12px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:0.8rem; font-weight:700; color:#34d399; text-transform:uppercase;">⏱️ ${escapeHtml(t.duration)}</span>
            <span style="background:rgba(16,185,129,0.2); color:#34d399; font-weight:800; padding:2px 10px; border-radius:999px; font-size:0.85rem;">${escapeHtml(t.price)}</span>
          </div>
          <h3 style="margin: 4px 0 6px;">${escapeHtml(t.name)}</h3>
          <p style="color:#94a3b8; font-size:0.9rem; margin:0 0 8px;">${escapeHtml(t.description)}</p>
          <a href="#book-appointment" style="color:#34d399; font-size:0.85rem; font-weight:700; text-decoration:none;">Book This Slot &rarr;</a>
        </div>
      `).join("");

      const stylistsCards = (archetypeConfig.stylists || []).map((s) => `
        <div class="card" style="text-align:center; background:#121817; padding:16px;">
          <div style="font-size:2rem; margin-bottom:8px;">✂️</div>
          <strong>${escapeHtml(s.name)}</strong>
          <small style="display:block; color:#94a3b8; margin:4px 0;">${escapeHtml(s.role)} &bull; ${escapeHtml(s.exp)}</small>
          <span style="font-size:0.75rem; color:#34d399;">${escapeHtml(s.spec)}</span>
        </div>
      `).join("");

      industryHtml = `
      <div id="treatment-menu" style="margin: 36px 0;">
        <span style="font-size:0.85rem; font-weight:700; color:#34d399; text-transform:uppercase;">🌿 Sanctuary Rituals & Aesthetic Care</span>
        <h2 style="margin: 8px 0 16px;">Treatment Menu & Holistic Care</h2>
        ${treatmentCards}
      </div>
      <div id="stylists" style="margin: 36px 0;">
        <h2 style="margin-bottom:16px;">Master Stylists & Aesthetic Team</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px;">
          ${stylistsCards}
        </div>
      </div>
      <div id="book-appointment" class="card" style="border:1px solid #10b981; background:#0c1514; padding:28px; margin:36px 0;">
        <h2 style="margin-top:0; color:#34d399;">📅 Reserve Your Treatment Slot</h2>
        <p style="color:#94a3b8;">Select your preferred ritual and time. Our concierge will confirm immediately.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:16px;">
          <input type="text" placeholder="Your Full Name" style="padding:10px; background:#18201f; border:1px solid #283735; color:#fff; border-radius:6px;" />
          <input type="tel" placeholder="Phone Number" style="padding:10px; background:#18201f; border:1px solid #283735; color:#fff; border-radius:6px;" />
          <input type="date" style="padding:10px; background:#18201f; border:1px solid #283735; color:#fff; border-radius:6px;" />
          <select style="padding:10px; background:#18201f; border:1px solid #283735; color:#fff; border-radius:6px;">
            <option>Morning (10:00 AM - 01:00 PM)</option>
            <option>Afternoon (01:00 PM - 05:00 PM)</option>
            <option>Evening (05:00 PM - 08:30 PM)</option>
          </select>
        </div>
        <button type="button" class="btn" style="background:#10b981; margin-top:16px; width:100%;" onclick="alert('✓ Appointment slot reserved! Concierge will confirm via SMS.')">Confirm Appointment Slot &rarr;</button>
      </div>`;
    } else if (industry === "cafe") {
      const menuSections = (archetypeConfig.menuCategories || []).map((cat) => `
        <div style="margin:20px 0;">
          <h3 style="color:#e5a93b; border-bottom:1px solid rgba(229,169,59,0.3); padding-bottom:6px;">${escapeHtml(cat.name)}</h3>
          ${(cat.items || []).map((item) => `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; background:#181513; margin:8px 0; padding:14px 18px;">
              <div>
                <strong style="font-size:1rem;">${escapeHtml(item.name)}</strong>
                <span style="font-size:0.75rem; background:rgba(229,169,59,0.15); color:#e5a93b; padding:2px 8px; border-radius:999px; margin-left:8px;">${escapeHtml(item.tag)}</span>
                <p style="color:#94a3b8; font-size:0.85rem; margin:4px 0 0;">${escapeHtml(item.desc)}</p>
              </div>
              <strong style="color:#e5a93b; font-size:1.1rem; white-space:nowrap; margin-left:14px;">${escapeHtml(item.price)}</strong>
            </div>
          `).join("")}
        </div>
      `).join("");

      industryHtml = `
      <div id="roast-spotlight" class="card" style="border-left:4px solid #e05638; background:#181412; margin:28px 0;">
        <span style="font-size:0.85rem; font-weight:700; color:#e5a93b; text-transform:uppercase;">☕ Today's Roast Spotlight</span>
        <h2 style="margin:6px 0;">${escapeHtml(archetypeConfig.roastSpotlight?.bean || "Single Origin Reserve")}</h2>
        <p style="color:#94a3b8;">${escapeHtml(archetypeConfig.roastSpotlight?.notes || "Rich cacao and fruit notes")} &bull; ${escapeHtml(archetypeConfig.roastSpotlight?.altitude || "High Altitude")}</p>
        <small style="color:#e05638; font-weight:700;">${escapeHtml(archetypeConfig.roastSpotlight?.roastDate || "Roasted In-House Weekly")}</small>
      </div>
      <div id="cafe-menu" style="margin:36px 0;">
        <span style="font-size:0.85rem; font-weight:700; color:#e5a93b; text-transform:uppercase;">☕ Artisan Roastery & Daily Bakes</span>
        <h2 style="margin:6px 0 16px;">Daily Tasting Menu & Fresh Hearth</h2>
        ${menuSections}
      </div>
      <div id="directions" class="card" style="background:#15171e; margin:28px 0; border:1px solid rgba(255,255,255,0.1);">
        <h2 style="margin-top:0;">📍 Directions & Transit</h2>
        <p><strong>Address:</strong> ${escapeHtml(location)}</p>
        <p style="color:#94a3b8; font-size:0.9rem;">${escapeHtml(archetypeConfig.directionsGuide?.transit || "Close to public transit with customer parking.")}</p>
        <p style="color:#94a3b8; font-size:0.9rem;"><strong>Dine-In Hours:</strong> ${escapeHtml(hours)}</p>
        <a href="https://maps.google.com/?q=${encodeURIComponent(location + ' ' + businessName)}" target="_blank" rel="noopener noreferrer" class="btn" style="background:#e05638; margin-top:12px; display:inline-block;">🗺️ Open in Google Maps</a>
      </div>
      <div id="table-reservation" class="card" style="border:1px solid #e05638; background:#181211; padding:28px; margin:36px 0;">
        <h2 style="margin-top:0; color:#e05638;">☕ Reserve a Table or Pre-Order</h2>
        <p style="color:#94a3b8;">Skip the queue. Reserve your table or notify the barista for takeaway pickup.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:16px;">
          <input type="text" placeholder="Your Name" style="padding:10px; background:#221817; border:1px solid #3c2522; color:#fff; border-radius:6px;" />
          <input type="tel" placeholder="Mobile Number" style="padding:10px; background:#221817; border:1px solid #3c2522; color:#fff; border-radius:6px;" />
          <select style="padding:10px; background:#221817; border:1px solid #3c2522; color:#fff; border-radius:6px;">
            <option>Table for 2 Guests</option>
            <option>Table for 4 Guests</option>
            <option>Table for 6+ Guests</option>
            <option>Takeaway Pre-Order Pickup</option>
          </select>
          <input type="time" style="padding:10px; background:#221817; border:1px solid #3c2522; color:#fff; border-radius:6px;" />
        </div>
        <button type="button" class="btn" style="background:#e05638; margin-top:16px; width:100%;" onclick="alert('✓ Table reservation confirmed! We look forward to welcoming you.')">Confirm Reservation &rarr;</button>
      </div>`;
    } else if (industry === "boutique") {
      const lookbookCards = (archetypeConfig.lookbookItems || []).map((item) => `
        <div class="card" style="background:#15121b; border:1px solid rgba(192,132,252,0.2);">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:0.75rem; background:rgba(192,132,252,0.15); color:#c084fc; padding:2px 8px; border-radius:999px;">${escapeHtml(item.tag)}</span>
            <strong style="color:#c084fc; font-size:1.05rem;">${escapeHtml(item.price)}</strong>
          </div>
          <h3 style="margin:4px 0;">${escapeHtml(item.name)}</h3>
          <small style="color:#a855f7; display:block; margin:4px 0 8px;">🧵 ${escapeHtml(item.fabric)}</small>
          <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 12px;">${escapeHtml(item.desc)}</p>
          <a href="#fitting" style="color:#c084fc; font-size:0.85rem; font-weight:700; text-decoration:none;">Reserve for In-Store Fitting &rarr;</a>
        </div>
      `).join("");

      industryHtml = `
      <div id="lookbook" style="margin:36px 0;">
        <span style="font-size:0.85rem; font-weight:700; color:#c084fc; text-transform:uppercase;">✨ Curated Seasonal Atelier</span>
        <h2 style="margin:6px 0 16px;">The Signature Collection & Lookbook</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
          ${lookbookCards}
        </div>
      </div>
      <div id="craft" class="card" style="border-left:4px solid #c084fc; background:#14111c; margin:28px 0;">
        <h2 style="margin-top:0;">🧵 Artisan Provenance & Craft Pillars</h2>
        <p style="color:#94a3b8;">Direct collaboration with traditional weaving clusters, zero synthetic polymers, and complimentary bespoke master alterations with every ensemble.</p>
      </div>
      <div id="fitting" class="card" style="border:1px solid #c084fc; background:#14111c; padding:28px; margin:36px 0;">
        <h2 style="margin-top:0; color:#c084fc;">✂️ Book a Private In-Store Fitting Suite</h2>
        <p style="color:#94a3b8;">Enjoy personalized styling guidance and our master tailor in a private lounge suite.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:16px;">
          <input type="text" placeholder="Your Name" style="padding:10px; background:#1e1828; border:1px solid #3c2a52; color:#fff; border-radius:6px;" />
          <input type="tel" placeholder="Mobile Number" style="padding:10px; background:#1e1828; border:1px solid #3c2a52; color:#fff; border-radius:6px;" />
          <input type="date" style="padding:10px; background:#1e1828; border:1px solid #3c2a52; color:#fff; border-radius:6px;" />
          <input type="text" placeholder="Pieces of Interest / Size" style="padding:10px; background:#1e1828; border:1px solid #3c2a52; color:#fff; border-radius:6px;" />
        </div>
        <button type="button" class="btn" style="background:#a855f7; margin-top:16px; width:100%;" onclick="alert('✓ Private fitting reserved! Our stylist will prepare your pieces.')">Reserve Private Suite &rarr;</button>
      </div>`;
    } else if (industry === "tuition") {
      const statsHtml = (archetypeConfig.resultsCounters || []).map((s) => `
        <div class="card" style="text-align:center; background:#121824; padding:18px;">
          <span style="font-size:2rem; font-weight:800; color:#38bdf8; display:block;">${escapeHtml(s.number)}</span>
          <small style="color:#94a3b8; font-size:0.8rem;">${escapeHtml(s.label)}</small>
        </div>
      `).join("");

      const batchCards = (archetypeConfig.curriculumBatches || []).map((b) => `
        <div class="card" style="border-left:4px solid #38bdf8; background:#0f172a; margin:12px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <h3 style="margin:0;">${escapeHtml(b.grade)}</h3>
            <span style="background:rgba(56,189,248,0.15); color:#38bdf8; font-size:0.75rem; padding:2px 8px; border-radius:999px;">${escapeHtml(b.badge)}</span>
          </div>
          <p style="color:#38bdf8; font-weight:600; font-size:0.9rem; margin:4px 0;">📖 ${escapeHtml(b.subjects)}</p>
          <small style="display:block; color:#fbbf24; margin:4px 0 8px;">🕒 ${escapeHtml(b.schedule)}</small>
          <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 10px;">${escapeHtml(b.features)}</p>
          <a href="#demo-class" style="color:#38bdf8; font-size:0.85rem; font-weight:700; text-decoration:none;">Enroll in Free Demo &rarr;</a>
        </div>
      `).join("");

      industryHtml = `
      <div id="results" style="margin:36px 0;">
        <span style="font-size:0.85rem; font-weight:700; color:#38bdf8; text-transform:uppercase;">🎓 Proven Academic Track Record</span>
        <h2 style="margin:6px 0 16px;">Student Distinctions & Academic Outcomes</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
          ${statsHtml}
        </div>
      </div>
      <div id="curriculum" style="margin:36px 0;">
        <h2 style="margin-bottom:16px;">Grade Curriculum & Batch Schedule</h2>
        ${batchCards}
      </div>
      <div id="demo-class" class="card" style="border:1px solid #38bdf8; background:#0f172a; padding:28px; margin:36px 0;">
        <h2 style="margin-top:0; color:#38bdf8;">📝 Book a Free Diagnostic Demo Class</h2>
        <p style="color:#94a3b8;">Attend one full concept lecture + receive a free diagnostic performance assessment with our senior faculty.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:16px;">
          <input type="text" placeholder="Student Name" style="padding:10px; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px;" />
          <input type="tel" placeholder="Parent / Student Mobile" style="padding:10px; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px;" />
          <select style="padding:10px; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px;">
            <option>Class 9 - 10 Foundation</option>
            <option>Class 11 - 12 Board Prep</option>
            <option>Target JEE / NEET Wing</option>
          </select>
          <input type="text" placeholder="Target Subject Focus" style="padding:10px; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px;" />
        </div>
        <button type="button" class="btn" style="background:#0284c7; margin-top:16px; width:100%;" onclick="alert('✓ Demo seat reserved! Admissions desk will SMS the class entry pass.')">Claim Free Demo Seat &rarr;</button>
      </div>`;
    } else if (industry === "local_service") {
      const rateCards = (archetypeConfig.rateCard || []).map((item) => `
        <div class="card" style="border-left:4px solid #ef4444; background:#181112; margin:12px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <h3 style="margin:0;">${escapeHtml(item.name)}</h3>
            <strong style="color:#ef4444; font-size:1.1rem;">${escapeHtml(item.price)}</strong>
          </div>
          <small style="color:#94a3b8; display:block; margin:2px 0 6px;">⏱️ ${escapeHtml(item.duration)} &bull; 🛡️ ${escapeHtml(item.warranty)}</small>
          <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 8px;">${escapeHtml(item.desc)}</p>
          <a href="#dispatch-form" style="color:#ef4444; font-size:0.85rem; font-weight:700; text-decoration:none;">Request This Job &rarr;</a>
        </div>
      `).join("");

      industryHtml = `
      <div id="emergency-ribbon" class="card" style="border:1px solid #ef4444; background:rgba(239,68,68,0.1); margin:24px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <span style="color:#ef4444; font-weight:800; text-transform:uppercase;">🚨 24/7 Rapid Dispatch Active</span>
          <p style="margin:4px 0 0; color:#94a3b8; font-size:0.9rem;">Technicians on standby in ${escapeHtml(location)}. Average 38-minute arrival.</p>
        </div>
        <a href="${contact ? `tel:${contact.replace(/[^0-9+]/g, '')}` : '#dispatch-form'}" class="btn" style="background:#ef4444;">📞 Call Dispatch Now</a>
      </div>
      <div id="pricing-guide" style="margin:36px 0;">
        <span style="font-size:0.85rem; font-weight:700; color:#ef4444; text-transform:uppercase;">🛠️ Transparent Diagnostics</span>
        <h2 style="margin:6px 0 16px;">Fixed Upfront Rate Card & Pricing</h2>
        ${rateCards}
      </div>
      <div id="dispatch-form" class="card" style="border:1px solid #ef4444; background:#181112; padding:28px; margin:36px 0;">
        <h2 style="margin-top:0; color:#ef4444;">🚨 Request Emergency Technician Dispatch</h2>
        <p style="color:#94a3b8;">Licensed & police-verified technician dispatched to your location with diagnostic equipment.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:16px;">
          <input type="text" placeholder="Service Required (e.g. AC / Plumbing)" style="padding:10px; background:#241618; border:1px solid #482327; color:#fff; border-radius:6px;" />
          <input type="tel" placeholder="Mobile Number" style="padding:10px; background:#241618; border:1px solid #482327; color:#fff; border-radius:6px;" />
          <input type="text" placeholder="Complete Street Address" style="padding:10px; background:#241618; border:1px solid #482327; color:#fff; border-radius:6px;" />
          <select style="padding:10px; background:#241618; border:1px solid #482327; color:#fff; border-radius:6px;">
            <option>Immediate Dispatch (Within 45 Mins)</option>
            <option>Scheduled Today Afternoon</option>
            <option>Scheduled Tomorrow Morning</option>
          </select>
        </div>
        <button type="button" class="btn" style="background:#ef4444; margin-top:16px; width:100%;" onclick="alert('✓ Technician dispatched! Team ETA is 35-45 minutes.')">Dispatch Technician Now &rarr;</button>
      </div>`;
    } else if (industry === "consultant") {
      const pillarCards = (archetypeConfig.practiceAreas || []).map((p, idx) => `
        <div class="card" style="border-left:4px solid #d97706; background:#131822; margin:12px 0;">
          <span style="font-size:0.75rem; color:#fbbf24; text-transform:uppercase; font-weight:700;">Mandate 0${idx + 1}</span>
          <h3 style="margin:4px 0 6px;">${escapeHtml(p.name)}</h3>
          <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 8px;">${escapeHtml(p.deliverables)}</p>
          <small style="color:#fbbf24;">Standard: ${escapeHtml(p.cadence)}</small>
        </div>
      `).join("");

      const casesHtml = (archetypeConfig.caseStudies || []).map((c) => `
        <div class="card" style="background:#131822; padding:18px;">
          <strong style="color:#10b981; font-size:1.3rem; display:block; margin-bottom:4px;">${escapeHtml(c.metric)}</strong>
          <small style="color:#fbbf24; display:block; font-weight:700;">${escapeHtml(c.client)}</small>
          <p style="color:#94a3b8; font-size:0.85rem; margin:6px 0 0;">${escapeHtml(c.detail)}</p>
        </div>
      `).join("");

      industryHtml = `
      <div id="fiduciary-oath" class="card" style="border-left:4px solid #d97706; background:#0e141e; margin:28px 0;">
        <span style="font-size:0.85rem; font-weight:700; color:#fbbf24; text-transform:uppercase;">⚖️ Sworn Fiduciary Standard</span>
        <h2 style="margin:6px 0;">Fiduciary Duty of Absolute Loyalty & Care</h2>
        <p style="color:#94a3b8;">Unconditional commitment to client best interest. Zero kickbacks, zero product sales quotas, and transparent mandate billing.</p>
      </div>
      <div id="practice-areas" style="margin:36px 0;">
        <h2 style="margin-bottom:16px;">Strategic Practice Pillars & Mandates</h2>
        ${pillarCards}
      </div>
      <div id="case-studies" style="margin:36px 0;">
        <h2 style="margin-bottom:16px;">Anonymized Case Track Record</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
          ${casesHtml}
        </div>
      </div>
      <div id="discovery-call" class="card" style="border:1px solid #d97706; background:#0e141e; padding:28px; margin:36px 0;">
        <h2 style="margin-top:0; color:#fbbf24;">💼 Schedule a Confidential 15-Minute Discovery Call</h2>
        <p style="color:#94a3b8;">High-level mandate assessment conducted strictly under mutual non-disclosure.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:16px;">
          <input type="text" placeholder="Executive Name & Title" style="padding:10px; background:#18202d; border:1px solid #28374d; color:#fff; border-radius:6px;" />
          <input type="email" placeholder="Corporate / Private Email" style="padding:10px; background:#18202d; border:1px solid #28374d; color:#fff; border-radius:6px;" />
          <input type="tel" placeholder="Direct Phone / WhatsApp" style="padding:10px; background:#18202d; border:1px solid #28374d; color:#fff; border-radius:6px;" />
          <select style="padding:10px; background:#18202d; border:1px solid #28374d; color:#fff; border-radius:6px;">
            <option>Wealth & Family Office Governance</option>
            <option>Corporate Tax & Structuring</option>
            <option>Fiduciary Risk & Succession</option>
            <option>Valuation & Growth Advisory</option>
          </select>
        </div>
        <button type="button" class="btn" style="background:#d97706; margin-top:16px; width:100%;" onclick="alert('✓ Discovery call request logged! Calendar invite sent under NDA.')">Request Confidential Mandate Review &rarr;</button>
      </div>`;
    }

    const trustManifestHtml = `
    <div class="card" style="border: 1px solid rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); margin: 30px 0;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="font-size:0.75rem; font-family:monospace; color:#10b981; letter-spacing:1px; text-transform:uppercase;">TRANSPARENCY & ACCURACY AUDIT</span>
          <h3 style="margin:4px 0 0; color:#ffffff;">MakeSite Verified Trade Manifest</h3>
        </div>
        <div style="background:rgba(16,185,129,0.2); color:#34d399; padding:6px 14px; border-radius:999px; font-weight:700; font-size:0.85rem;">
          ✓ ${verifiedCount} / 5 Facts Verified
        </div>
      </div>
      <p style="font-size:0.9rem; color:#94a3b8; margin: 12px 0 16px;">
        Public verification manifest: Verified details are confirmed directly with the business owner.
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid ${confirmedSet?.has("business_name") ? "rgba(16,185,129,0.4)" : "rgba(229,169,59,0.4)"};">
          <small style="color:#94a3b8; display:block;">Identity</small>
          <strong>${escapeHtml(businessName)}</strong>
          <span style="display:block; font-size:0.75rem; color:${confirmedSet?.has("business_name") ? "#10b981" : "#e5a93b"};">${confirmedSet?.has("business_name") ? "✓ Verified" : "⚠️ Pending"}</span>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid ${confirmedSet?.has("category") ? "rgba(16,185,129,0.4)" : "rgba(229,169,59,0.4)"};">
          <small style="color:#94a3b8; display:block;">Category</small>
          <strong>${escapeHtml(category)}</strong>
          <span style="display:block; font-size:0.75rem; color:${confirmedSet?.has("category") ? "#10b981" : "#e5a93b"};">${confirmedSet?.has("category") ? "✓ Verified" : "⚠️ Pending"}</span>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid ${confirmedSet?.has("location") ? "rgba(16,185,129,0.4)" : "rgba(229,169,59,0.4)"};">
          <small style="color:#94a3b8; display:block;">Location</small>
          <strong>${escapeHtml(location)}</strong>
          <span style="display:block; font-size:0.75rem; color:${confirmedSet?.has("location") ? "#10b981" : "#e5a93b"};">${confirmedSet?.has("location") ? "✓ Verified" : "⚠️ Pending"}</span>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid ${confirmedSet?.has("hours") ? "rgba(16,185,129,0.4)" : "rgba(229,169,59,0.4)"};">
          <small style="color:#94a3b8; display:block;">Schedule</small>
          <strong>${escapeHtml(hours)}</strong>
          <span style="display:block; font-size:0.75rem; color:${confirmedSet?.has("hours") ? "#10b981" : "#e5a93b"};">${confirmedSet?.has("hours") ? "✓ Verified" : "⚠️ Estimated"}</span>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid ${confirmedSet?.has("contact") && contact ? "rgba(16,185,129,0.4)" : "rgba(229,169,59,0.4)"};">
          <small style="color:#94a3b8; display:block;">Direct Comms</small>
          <strong>${escapeHtml(contact || "Available on request")}</strong>
          <span style="display:block; font-size:0.75rem; color:${confirmedSet?.has("contact") && contact ? "#10b981" : "#e5a93b"};">${confirmedSet?.has("contact") && contact ? "✓ Verified" : "⚠️ Pending"}</span>
        </div>
      </div>
    </div>`;

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
    .btn { display: inline-block; background: #e05638; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; cursor: pointer; border: none; }
    .btn:hover { background: #c2410c; }
    .card { background: #11141d; padding: 24px; border-radius: 12px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.08); }
    .highlight-pulse { animation: staticPulse 1.8s ease-in-out !important; }
    @keyframes staticPulse {
      0% { transform: scale(1); outline: 3px solid transparent; }
      25% { transform: scale(1.02); outline: 3px solid #e05638; box-shadow: 0 0 35px rgba(224, 86, 56, 0.6); }
      60% { transform: scale(1.01); outline: 2px solid #e05638; box-shadow: 0 0 20px rgba(224, 86, 56, 0.4); }
      100% { transform: scale(1); outline: 3px solid transparent; }
    }
  </style>
</head>
<body>
  <div class="container">
    <p style="text-transform:uppercase; color:#e5a93b; letter-spacing:1px; font-weight:700;">${escapeHtml(category)}</p>
    <h1>${escapeHtml(heroTitle)}</h1>
    <p style="font-size:1.2rem; color:#94a3b8;">${escapeHtml(heroDesc)}</p>
    <a href="#contact" class="btn">${escapeHtml(cta)} &rarr;</a>
    <div class="card" style="margin-top:40px;">
      <h2>About ${escapeHtml(businessName)}</h2>
      <p>${escapeHtml(aboutText)}</p>
    </div>
    ${industryHtml}
    <h2>Capabilities & Services</h2>
    ${services.map((s) => `<div class="card"><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description)}</p></div>`).join("")}
    ${trustManifestHtml}
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
      const contentPayload = {
        ...currentContent,
        hero_title: heroTitle,
        hero_description: heroDesc,
        about: aboutText,
        cta: cta,
        services: services,
        features: features,
        faqs: faqs,
      };
      const data = await generateWebsiteHtml(currentBusinessData, contentPayload, activeTemplate);
      if (data && data.html) {
        setServerHtml(data.html);
        setHtmlCache((prev) => ({ ...prev, [activeTemplate]: data.html }));
        return data.html;
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

  const handleScrollToTarget = (targetId, e) => {
    if (e && e.preventDefault) e.preventDefault();
    const elem = document.getElementById(targetId || "contact");
    if (!elem) return;

    const screenScrollbox = document.getElementById("device-screen-scrollbox");
    if (screenScrollbox && deviceMode !== "desktop" && frameScrollMode === "screen") {
      const containerRect = screenScrollbox.getBoundingClientRect();
      const elemRect = elem.getBoundingClientRect();
      const offsetTop = elemRect.top - containerRect.top + screenScrollbox.scrollTop;
      screenScrollbox.scrollTo({ top: Math.max(0, offsetTop - 12), behavior: "smooth" });
    } else {
      const canvas = document.querySelector(".preview-canvas-container");
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const elemRect = elem.getBoundingClientRect();
        const offsetTop = elemRect.top - canvasRect.top + canvas.scrollTop;
        canvas.scrollTo({ top: Math.max(0, offsetTop - 20), behavior: "smooth" });
      } else {
        elem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    elem.classList.remove("highlight-pulse");
    void elem.offsetWidth;
    elem.classList.add("highlight-pulse");
    setTimeout(() => {
      elem.classList.remove("highlight-pulse");
    }, 1500);
  };

  const handleContactClick = (e) => {
    handleScrollToTarget("contact", e);
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

          <div className="tb-studio-brand">
            <img src="/logo-dark.png" alt="MakeSite Studio" className="tb-studio-logo" />
          </div>

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

          {/* Toggle between Screen View (scroll inside phone/tablet) and Full Page View */}
          {deviceMode !== "desktop" && (
            <div className="frame-scroll-pills" title="Switch between realistic device screen and unrolled page">
              <button
                type="button"
                className={`frame-scroll-btn ${frameScrollMode === "screen" ? "active" : ""}`}
                onClick={() => setFrameScrollMode("screen")}
                title="Scroll inside device screen"
              >
                📱 Screen
              </button>
              <button
                type="button"
                className={`frame-scroll-btn ${frameScrollMode === "full" ? "active" : ""}`}
                onClick={() => setFrameScrollMode("full")}
                title="View full continuous unrolled page"
              >
                📜 Full Page
              </button>
            </div>
          )}

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
        <main className={`preview-canvas-container mode-${deviceMode} ${isEditing ? "with-sidebar-open" : ""}`}>
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
          ) : deviceMode === "desktop" ? (
            <div className="device-frame device-frame-desktop">
              {/* Direct Desktop Render: Fully unconstrained, natural canvas scrolling */}
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
                  industry,
                  archetypeConfig,
                  confirmedFields: confirmedSet,
                  onContactClick: handleContactClick,
                  onNavigateToSection: handleScrollToTarget,
                  onShowToast: showToast,
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
          ) : (
            <div className={`device-frame device-frame-${deviceMode} frame-${frameScrollMode}`}>
              <div className="device-notch-bar">
                <span className="notch-camera"></span>
                <span className="notch-speaker"></span>
                <span className="notch-label">
                  {deviceMode === "mobile" ? "📱 Mobile 390px" : "📱 Tablet 768px"}
                  {frameScrollMode === "screen" ? " • Scroll Inside" : " • Full Length"}
                </span>
              </div>

              {/* Template Render Container with inner screen scrollbox (for mobile and tablet) */}
              <div
                className="device-screen-scrollbox"
                id="device-screen-scrollbox"
                tabIndex={0}
                role="region"
                aria-label={`${deviceMode} website preview`}
              >
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
                    industry,
                    archetypeConfig,
                    confirmedFields: confirmedSet,
                    onContactClick: handleContactClick,
                    onNavigateToSection: handleScrollToTarget,
                    onShowToast: showToast,
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

              <div className="device-bottom-bar">
                <span className="device-home-pill"></span>
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
    industry = "general",
    confirmedFields = new Set(),
    onContactClick,
    onNavigateToSection,
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
            <a href="#about" onClick={(e) => onNavigateToSection ? onNavigateToSection("about", e) : onContactClick(e)}>About</a>
            {archetypeConfig?.navLinks ? (
              archetypeConfig.navLinks.map((nav, nIdx) => (
                <a
                  key={nIdx}
                  href={`#${nav.target}`}
                  className={nav.isCta ? "tpl-nav-cta" : ""}
                  onClick={(e) => {
                    if (nav.target?.startsWith("tel:")) return;
                    if (onNavigateToSection) onNavigateToSection(nav.target, e);
                    else onContactClick(e);
                  }}
                >
                  {nav.label} {nav.isCta ? "↓" : ""}
                </a>
              ))
            ) : (
              <>
                <a href="#services" onClick={(e) => onNavigateToSection ? onNavigateToSection("services", e) : onContactClick(e)}>Services</a>
                <a href="#contact" className="tpl-nav-cta" onClick={onContactClick}>Contact &darr;</a>
              </>
            )}
            <a href="#verified-manifest" className="tpl-nav-trust-link" onClick={(e) => onNavigateToSection ? onNavigateToSection("verified-manifest", e) : onContactClick(e)}>✓ Trust Audit</a>
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
            <span className="eyebrow-dot"></span> {archetypeConfig?.badge || (
              <>
                Verified Profile &bull;{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => onUpdateDataField("location", e.currentTarget.innerText.trim())}
                >
                  {location}
                </span>
              </>
            )}
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
                onClick={!isEditing ? (e) => {
                  const target = archetypeConfig?.heroCtaTarget || "contact";
                  if (target.startsWith("tel:")) {
                    window.location.href = target;
                  } else {
                    onNavigateToSection ? onNavigateToSection(target, e) : onContactClick(e);
                  }
                } : undefined}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => onUpdateContentField("cta", e.currentTarget.innerText.trim())}
              >
                {archetypeConfig?.heroCta || cta} &darr;
              </button>
              {isEditing && <span className="inline-pen-badge">✎</span>}
            </div>

            <button
              className="tpl-btn-secondary"
              onClick={(e) => {
                const target = archetypeConfig?.heroSecondaryTarget || "contact";
                if (target.startsWith("tel:")) {
                  window.location.href = target;
                } else {
                  onNavigateToSection ? onNavigateToSection(target, e) : onContactClick(e);
                }
              }}
            >
              {archetypeConfig?.heroSecondaryCta || `📍 View Details • ${location}`}
            </button>
          </div>

          {archetypeConfig?.highlights && archetypeConfig.highlights.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "18px" }}>
              {archetypeConfig.highlights.map((hl, hIdx) => (
                <span
                  key={hIdx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "999px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    color: "var(--text-1)"
                  }}
                >
                  <span>{hl.icon}</span>
                  <span>{hl.text}</span>
                </span>
              ))}
            </div>
          )}

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

      {/* =========================================================================
          GENUINELY DISTINCT INDUSTRY ARCHETYPE SECTIONS
      ========================================================================= */}

      {/* 1. SALON & SPA ARCHETYPE */}
      {industry === "salon" && (
        <section className="tpl-section archetype-section tpl-industry-salon" id="treatment-menu">
          <div className="tpl-container">
            <div className="tpl-section-header">
              <span className="tpl-section-badge">🌿 Sanctuary Rituals & Aesthetic Care</span>
              <h2>Treatment Menu & Holistic Care</h2>
              <p>Unhurried botanical sessions designed to calm the nervous system, revive skin radiance, and restore natural balance.</p>
            </div>

            {/* Treatment Cards Grid */}
            <div className="tpl-services-grid" style={{ marginBottom: "50px" }}>
              {(archetypeConfig?.treatmentMenu || []).map((t, idx) => (
                <div key={idx} className="archetype-card">
                  <div className="card-meta-row">
                    <span className="badge-pill">⏱️ {t.duration}</span>
                    <span className="badge-pill price-pill">{t.price}</span>
                  </div>
                  <h3>{t.name}</h3>
                  <p>{t.description}</p>
                  <div className="card-action-bar">
                    <span className="card-subnote">Includes Aromatherapy Scalp Release</span>
                    <button
                      type="button"
                      className="btn-archetype-sm"
                      onClick={(e) => onNavigateToSection ? onNavigateToSection("book-appointment", e) : onContactClick(e)}
                    >
                      Book This Slot &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Master Stylists Roster */}
            <div id="stylists" style={{ margin: "60px 0" }}>
              <div className="tpl-section-header">
                <span className="tpl-section-badge">Master Artisans</span>
                <h2>Meet Our Creative Stylists & Therapists</h2>
                <p>Decades of collective technique dedicated to unhurried, attentive personal transformation.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                {(archetypeConfig?.stylists || []).map((s, idx) => (
                  <div key={idx} className="team-card">
                    <div className="team-avatar">✂️</div>
                    <strong style={{ fontSize: "1.05rem" }}>{s.name}</strong>
                    <span className="team-role">{s.role} &bull; {s.exp}</span>
                    <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "600" }}>{s.spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hygiene & Sanctuary Standards */}
            <div id="hygiene" style={{ margin: "60px 0" }}>
              <div className="tpl-section-header">
                <span className="tpl-section-badge">Sanctuary Standards</span>
                <h2>Clean Formulations & Clinical Hygiene</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {(archetypeConfig?.hygieneGuarantees || []).map((h, idx) => (
                  <div key={idx} className="story-card" style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{h.icon}</div>
                    <strong style={{ display: "block", marginBottom: "6px" }}>{h.title}</strong>
                    <p style={{ fontSize: "12.5px", opacity: 0.8, margin: 0 }}>{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Appointment Booking Form Widget */}
            <div className="archetype-booking-panel" id="book-appointment">
              <div className="booking-inner">
                <span className="tpl-section-badge">Online Concierge</span>
                <h2>Reserve Your Sanctuary Session</h2>
                <p>Select your ritual, preferred specialist, and ideal time slot. Immediate confirmation.</p>

                <form
                  className="archetype-interactive-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onShowToast) onShowToast("✓ Treatment slot reserved! Concierge will confirm via SMS.");
                  }}
                >
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Treatment Ritual</label>
                      <select defaultValue={archetypeConfig?.treatmentMenu?.[0]?.name || "Signature Hair Spa"}>
                        {(archetypeConfig?.treatmentMenu || []).map((t, idx) => (
                          <option key={idx} value={t.name}>{t.name} ({t.duration} &bull; {t.price})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Preferred Specialist</label>
                      <select defaultValue="Any Available Senior Specialist">
                        <option value="any">First Available Senior Specialist</option>
                        {(archetypeConfig?.stylists || []).map((s, idx) => (
                          <option key={idx} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Your Full Name</label>
                      <input type="text" placeholder="e.g. Maya Iyer" required />
                    </div>

                    <div className="form-group">
                      <label>Phone / WhatsApp Number</label>
                      <input type="tel" placeholder="+91 98765 43210" required />
                    </div>

                    <div className="form-group">
                      <label>Preferred Date</label>
                      <input type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                    </div>

                    <div className="form-group">
                      <label>Preferred Time Slot</label>
                      <select defaultValue="11:00 AM">
                        <option>10:00 AM - Morning Calm</option>
                        <option>11:30 AM - Midday Session</option>
                        <option>02:00 PM - Afternoon Glow</option>
                        <option>04:30 PM - Twilight Care</option>
                        <option>06:30 PM - Evening Reset</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-block">
                    Confirm Appointment Slot &rarr;
                  </button>
                  <p className="form-subtext">✨ No pre-payment required. Dedicated suite prepared prior to your arrival.</p>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. CAFÉ & BISTRO ARCHETYPE */}
      {industry === "cafe" && (
        <section className="tpl-section archetype-section tpl-industry-cafe" id="cafe-menu">
          <div className="tpl-container">
            {/* Roast Spotlight */}
            <div className="roast-spotlight-box" id="roast-spotlight">
              <span className="tpl-section-badge">☕ Single-Origin Roast Spotlight</span>
              <h2>{archetypeConfig?.roastSpotlight?.bean || "Washed Ethiopian Yirgacheffe"}</h2>
              <p style={{ maxWidth: "600px", margin: "10px auto 0", fontSize: "14px" }}>
                <strong>Tasting Profile:</strong> {archetypeConfig?.roastSpotlight?.notes} &bull; <strong>Elevation:</strong> {archetypeConfig?.roastSpotlight?.altitude}
              </p>
              <div className="roast-schedule-chips">
                <span className="badge-pill">📅 {archetypeConfig?.roastSpotlight?.roastDate}</span>
                <span className="badge-pill">☕ Dialed Daily at 07:00 AM</span>
                <span className="badge-pill">🌱 Direct Ethical Farm Gate</span>
              </div>
            </div>

            {/* Categorized Food & Beverage Menu */}
            <div className="tpl-section-header" style={{ marginTop: "60px" }}>
              <span className="tpl-section-badge">Daily Hearth & Barista Bar</span>
              <h2>Signature Food & Drinks Menu</h2>
              <p>House-roasted beans paired with slow-fermented viennoiserie and kitchen artisan boards.</p>
            </div>

            <div className="menu-board-container">
              {(archetypeConfig?.menuCategories || []).map((cat, cIdx) => (
                <div key={cIdx} style={{ marginBottom: "32px" }}>
                  <h3 style={{ fontSize: "1.2rem", color: "#e5a93b", borderBottom: "1px solid rgba(229,169,59,0.3)", paddingBottom: "8px", marginBottom: "14px" }}>
                    {cat.name}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {cat.items.map((item, iIdx) => (
                      <div key={iIdx} className="menu-item-row">
                        <div className="menu-item-left">
                          <div className="menu-item-header">
                            <strong style={{ fontSize: "1rem" }}>{item.name}</strong>
                            <span className="dietary-tag">{item.tag}</span>
                          </div>
                          <p style={{ fontSize: "12.5px", opacity: 0.8, margin: 0 }}>{item.desc}</p>
                        </div>
                        <div className="menu-item-price" style={{ color: "#e5a93b" }}>{item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Directions & Transit Guide */}
            <div className="directions-section" id="directions">
              <div className="directions-card">
                <span className="tpl-section-badge">How To Find Us</span>
                <h2>Directions, Transit & Parking</h2>
                <div className="address-callout">📍 <strong>{location}</strong></div>
                <div className="transit-tips">
                  <p>🚆 <strong>Public Transit:</strong> {archetypeConfig?.directionsGuide?.transit}</p>
                  <p>🕒 <strong>Dine-In Hours:</strong> {archetypeConfig?.directionsGuide?.dineInHours}</p>
                  <p>🥡 <strong>Takeaway:</strong> {archetypeConfig?.directionsGuide?.takeaway}</p>
                </div>
                <div className="directions-actions">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(location + ' ' + businessName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary-block"
                  >
                    🗺️ Open in Google Maps & Get Directions &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* Table Reservation & Pre-Order Widget */}
            <div className="archetype-booking-panel" id="table-reservation">
              <div className="booking-inner">
                <span className="tpl-section-badge">Reservations</span>
                <h2>Reserve a Table or Pre-Order For Pickup</h2>
                <p>Skip the queue during morning peak hours or reserve your favorite patio seating.</p>

                <form
                  className="archetype-interactive-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onShowToast) onShowToast("✓ Table reserved! See you soon at the café.");
                  }}
                >
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Party Size / Request Type</label>
                      <select defaultValue="Table for 2 Guests">
                        <option>Table for 1 Guest (Solo Study / Laptop)</option>
                        <option>Table for 2 Guests (Café Seating)</option>
                        <option>Table for 4 Guests (Brunch Booth)</option>
                        <option>Table for 6+ Guests (Community Hearth)</option>
                        <option>Takeaway Pre-Order (Fast Barista Counter Pickup)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Seating Preference</label>
                      <select defaultValue="Indoor Air-Conditioned Bar">
                        <option>Indoor Air-Conditioned Bar</option>
                        <option>Sunny Outdoor Garden Patio</option>
                        <option>Quiet Corner (Wi-Fi Work Desk)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Your Name</label>
                      <input type="text" placeholder="e.g. Rohan Sen" required />
                    </div>

                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input type="tel" placeholder="+91 98765 43210" required />
                    </div>

                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                    </div>

                    <div className="form-group">
                      <label>Arrival Time</label>
                      <select defaultValue="09:00 AM">
                        <option>08:00 AM (Early Roast & Croissant)</option>
                        <option>09:30 AM (Morning Brew)</option>
                        <option>12:30 PM (Panini Lunch)</option>
                        <option>04:00 PM (Afternoon Filter & Pastry)</option>
                        <option>06:30 PM (Evening Sunset Pour)</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-block">
                    Confirm Reservation / Pickup Order &rarr;
                  </button>
                  <p className="form-subtext">☕ Your table is held for 15 minutes past reservation time.</p>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. BOUTIQUE & FASHION ARCHETYPE */}
      {industry === "boutique" && (
        <section className="tpl-section archetype-section tpl-industry-boutique" id="lookbook">
          <div className="tpl-container">
            <div className="tpl-section-header">
              <span className="tpl-section-badge">✨ Curated Seasonal Atelier</span>
              <h2>The Signature Collection & Lookbook</h2>
              <p>Meticulously hand-loomed textiles, pure natural fabrics, and silhouette-perfect tailoring.</p>
            </div>

            {/* Lookbook Grid */}
            <div className="tpl-services-grid" style={{ marginBottom: "50px" }}>
              {(archetypeConfig?.lookbookItems || []).map((item, idx) => (
                <div key={idx} className="archetype-card" style={{ borderColor: "rgba(192, 132, 252, 0.25)" }}>
                  <div className="card-meta-row">
                    <span className="badge-pill" style={{ color: "#c084fc", background: "rgba(192, 132, 252, 0.15)" }}>{item.tag}</span>
                    <span className="badge-pill price-pill" style={{ color: "#c084fc" }}>{item.price}</span>
                  </div>
                  <h3>{item.name}</h3>
                  <span className="fabric-spec">🧵 {item.fabric}</span>
                  <p>{item.desc}</p>
                  <div className="card-action-bar">
                    <span className="card-subnote">Includes Master Alterations</span>
                    <button
                      type="button"
                      className="btn-archetype-sm"
                      style={{ color: "#c084fc" }}
                      onClick={(e) => onNavigateToSection ? onNavigateToSection("fitting", e) : onContactClick(e)}
                    >
                      Reserve for Fitting &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Atelier Craft Story */}
            <div id="craft" style={{ margin: "60px 0" }}>
              <div className="tpl-section-header">
                <span className="tpl-section-badge">Heritage Provenance</span>
                <h2>Atelier Craft & Tailoring Standards</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                {(archetypeConfig?.craftPillars || []).map((c, idx) => (
                  <div key={idx} className="story-card" style={{ textAlign: "left", borderColor: "rgba(192, 132, 252, 0.15)" }}>
                    <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "8px", color: "#c084fc" }}>{c.title}</strong>
                    <p style={{ fontSize: "13px", opacity: 0.8, margin: 0 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Private Fitting Scheduler */}
            <div className="archetype-booking-panel" id="fitting" style={{ borderColor: "rgba(192, 132, 252, 0.3)" }}>
              <div className="booking-inner">
                <span className="tpl-section-badge">VIP In-Store Experience</span>
                <h2>Book a Private In-Store Fitting Suite</h2>
                <p>Enjoy private styling consultation and master tailor alterations in our lounge suite.</p>

                <form
                  className="archetype-interactive-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onShowToast) onShowToast("✓ Fitting suite reserved! Stylist will have selections ready.");
                  }}
                >
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Occasion / Wardrobe Need</label>
                      <select defaultValue="Festive & Celebration Wear">
                        <option>Festive & Celebration Wear</option>
                        <option>Curated Everyday Silk & Linen</option>
                        <option>Bridal / Trousseau Consultation</option>
                        <option>Bespoke Custom Tailoring</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Approximate Size Preference</label>
                      <select defaultValue="Medium (M)">
                        <option>XS / S</option>
                        <option>Medium (M)</option>
                        <option>Large (L)</option>
                        <option>XL / Custom Tailored Measures</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Your Full Name</label>
                      <input type="text" placeholder="e.g. Ananya Singhania" required />
                    </div>

                    <div className="form-group">
                      <label>Mobile Number / WhatsApp</label>
                      <input type="tel" placeholder="+91 98765 43210" required />
                    </div>

                    <div className="form-group">
                      <label>Preferred Date</label>
                      <input type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                    </div>

                    <div className="form-group">
                      <label>Preferred Time Slot</label>
                      <select defaultValue="03:00 PM">
                        <option>11:30 AM (Quiet Morning Lounge)</option>
                        <option>03:00 PM (Afternoon Styling Session)</option>
                        <option>05:30 PM (Evening Private Suite)</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-block" style={{ background: "#a855f7" }}>
                    Reserve Private Fitting Suite &rarr;
                  </button>
                  <p className="form-subtext">✨ Complimentary alteration consultation with our in-house master tailor included.</p>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. TUITION & COACHING ARCHETYPE */}
      {industry === "tuition" && (
        <section className="tpl-section archetype-section tpl-industry-tuition" id="curriculum">
          <div className="tpl-container">
            {/* Academic Results Counters */}
            <div className="results-stats-section" id="results">
              <div className="tpl-section-header">
                <span className="tpl-section-badge">🎓 Proven Academic Track Record</span>
                <h2>Student Distinctions & Competitive Results</h2>
                <p>Consistent board exam excellence and premier entrance rank conversions year after year.</p>
              </div>
              <div className="results-grid">
                {(archetypeConfig?.resultsCounters || []).map((res, idx) => (
                  <div key={idx} className="stat-card">
                    <span className="stat-num" style={{ color: "#38bdf8" }}>{res.number}</span>
                    <span className="stat-lbl">{res.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum & Batch Schedules */}
            <div className="tpl-section-header" style={{ marginTop: "60px" }}>
              <span className="tpl-section-badge">Curriculum Matrix</span>
              <h2>Batches, Timings & Syllabus Structure</h2>
              <p>Strictly capped batches of 15 students to guarantee individual attention and continuous doubt resolution.</p>
            </div>

            <div className="tpl-services-grid" style={{ marginBottom: "50px" }}>
              {(archetypeConfig?.curriculumBatches || []).map((batch, idx) => (
                <div key={idx} className="archetype-card" style={{ borderColor: "rgba(56, 189, 248, 0.25)" }}>
                  <div className="card-meta-row">
                    <span className="badge-pill" style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.15)" }}>{batch.badge}</span>
                    <span className="badge-pill" style={{ color: "#fbbf24" }}>Max 15 Seats</span>
                  </div>
                  <h3>{batch.grade}</h3>
                  <span className="batch-time">🕒 {batch.schedule}</span>
                  <p style={{ fontWeight: "600", color: "#38bdf8", margin: "6px 0" }}>📖 {batch.subjects}</p>
                  <p>{batch.features}</p>
                  <div className="card-action-bar">
                    <span className="card-subnote">Includes Weekly Mocks</span>
                    <button
                      type="button"
                      className="btn-archetype-sm"
                      style={{ color: "#38bdf8" }}
                      onClick={(e) => onNavigateToSection ? onNavigateToSection("demo-class", e) : onContactClick(e)}
                    >
                      Enroll in Demo &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Senior Faculty Mentors */}
            <div id="faculty" style={{ margin: "60px 0" }}>
              <div className="tpl-section-header">
                <span className="tpl-section-badge">Master Educators</span>
                <h2>Meet Our Senior Subject Mentors</h2>
                <p>Alumni of top institutions with proven pedagogy that simplifies complex numericals.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                {(archetypeConfig?.faculty || []).map((fac, idx) => (
                  <div key={idx} className="team-card" style={{ textAlign: "left" }}>
                    <div className="team-avatar">👨‍🏫</div>
                    <strong style={{ fontSize: "1.1rem", display: "block" }}>{fac.name}</strong>
                    <span className="team-role" style={{ color: "#38bdf8" }}>{fac.role}</span>
                    <p style={{ fontSize: "12px", opacity: 0.85, margin: "6px 0" }}>🎓 {fac.cred}</p>
                    <p style={{ fontSize: "12px", opacity: 0.7, margin: 0 }}>{fac.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Free Demo Class Enrollment Widget */}
            <div className="archetype-booking-panel" id="demo-class" style={{ borderColor: "rgba(56, 189, 248, 0.3)" }}>
              <div className="booking-inner">
                <span className="tpl-section-badge">Zero Cost Assessment</span>
                <h2>Book a Free Diagnostic Demo Lecture</h2>
                <p>Experience one complete conceptual lecture and receive a diagnostic score report.</p>

                <form
                  className="archetype-interactive-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onShowToast) onShowToast("✓ Demo seat reserved! Admissions desk will SMS the class entry pass.");
                  }}
                >
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Target Academic Program</label>
                      <select defaultValue="Class 9 - 10 Foundation">
                        <option>Class 9 - 10 Foundation Batch</option>
                        <option>Class 11 - 12 Board & Entrance Prep</option>
                        <option>Target JEE / NEET Competitive Wing</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Subject Focus</label>
                      <select defaultValue="Mathematics & Numerical Problem Solving">
                        <option>Mathematics & Numerical Problem Solving</option>
                        <option>Physics & Visual Mechanics</option>
                        <option>Chemistry & Reaction Mechanisms</option>
                        <option>All-Subject Diagnostic Pass</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Student's Full Name</label>
                      <input type="text" placeholder="e.g. Aarav Sharma" required />
                    </div>

                    <div className="form-group">
                      <label>Parent / Student Mobile</label>
                      <input type="tel" placeholder="+91 98765 43210" required />
                    </div>

                    <div className="form-group">
                      <label>Current School Name</label>
                      <input type="text" placeholder="e.g. St. Xavier's High School" />
                    </div>

                    <div className="form-group">
                      <label>Preferred Demo Day</label>
                      <select defaultValue="This Coming Saturday (04:30 PM)">
                        <option>This Coming Saturday (04:30 PM)</option>
                        <option>This Coming Sunday (10:00 AM)</option>
                        <option>Next Weekday Evening Batch</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-block" style={{ background: "#0284c7" }}>
                    Claim Free Demo Seat & Diagnostic Pass &rarr;
                  </button>
                  <p className="form-subtext">🎓 Strictly 15 students per batch. Entry pass sent instantly via SMS.</p>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. LOCAL SERVICES & TRADES ARCHETYPE */}
      {industry === "local_service" && (
        <section className="tpl-section archetype-section tpl-industry-local" id="pricing-guide">
          <div className="tpl-container">
            {/* 24/7 Rapid Emergency Response Ribbon */}
            <div className="emergency-alert-banner" id="emergency-ribbon">
              <div className="emergency-inner">
                <div>
                  <span className="emergency-dot">●</span>
                  <strong>24/7 RAPID DISPATCH ACTIVE IN {location.toUpperCase()}</strong>
                  <span style={{ display: "block", opacity: 0.85, marginTop: "2px" }}>
                    Licensed technicians currently in your postal zone. Average arrival: 38 mins.
                  </span>
                </div>
                <a
                  href={contact ? `tel:${contact.replace(/[^0-9+]/g, "")}` : "#dispatch-form"}
                  className="btn-emergency-call"
                >
                  📞 {contact ? `Call: ${contact}` : "Request Rapid Dispatch"}
                </a>
              </div>
            </div>

            {/* Fixed Upfront Rate Card */}
            <div className="tpl-section-header" style={{ marginTop: "40px" }}>
              <span className="tpl-section-badge">Transparent Rate Card</span>
              <h2>Fixed Upfront Diagnostic & Repair Pricing</h2>
              <p>Zero surprise fees. You approve the exact quote before any work starts. 90-day callback warranty included.</p>
            </div>

            <div className="tpl-services-grid" style={{ marginBottom: "50px" }}>
              {(archetypeConfig?.rateCard || []).map((job, idx) => (
                <div key={idx} className="archetype-card" style={{ borderColor: "rgba(239, 68, 68, 0.25)" }}>
                  <div className="card-meta-row">
                    <span className="badge-pill" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.15)" }}>⏱️ {job.duration}</span>
                    <span className="badge-pill price-pill" style={{ color: "#ef4444" }}>{job.price}</span>
                  </div>
                  <h3>{job.name}</h3>
                  <span className="fabric-spec" style={{ color: "#10b981" }}>🛡️ {job.warranty}</span>
                  <p>{job.desc}</p>
                  <div className="card-action-bar">
                    <span className="card-subnote">Genuine OEM Spares</span>
                    <button
                      type="button"
                      className="btn-archetype-sm"
                      style={{ color: "#ef4444" }}
                      onClick={(e) => onNavigateToSection ? onNavigateToSection("dispatch-form", e) : onContactClick(e)}
                    >
                      Request This Job &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coverage Area Guide */}
            <div id="coverage" style={{ margin: "50px 0" }}>
              <div className="directions-card" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
                <span className="tpl-section-badge">Service Radius</span>
                <h2>Coverage Radius & Response Standby</h2>
                <div className="address-callout">📍 <strong>{archetypeConfig?.coverageGuide?.radius}</strong></div>
                <div className="transit-tips">
                  <p>⚡ <strong>Response Time:</strong> {archetypeConfig?.coverageGuide?.responseTime}</p>
                  <p>🚨 <strong>Current Status:</strong> {archetypeConfig?.coverageGuide?.emergencyStatus}</p>
                </div>
              </div>
            </div>

            {/* Guarantees */}
            <div id="guarantees" style={{ margin: "60px 0" }}>
              <div className="tpl-section-header">
                <span className="tpl-section-badge">Our Commitment</span>
                <h2>The 4-Point Service Guarantee</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {(archetypeConfig?.guarantees || []).map((g, idx) => (
                  <div key={idx} className="story-card" style={{ textAlign: "left", borderColor: "rgba(239, 68, 68, 0.15)" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{g.icon}</div>
                    <strong style={{ display: "block", marginBottom: "6px" }}>{g.title}</strong>
                    <p style={{ fontSize: "12.5px", opacity: 0.8, margin: 0 }}>{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Instant Technician Dispatch Form */}
            <div className="archetype-booking-panel" id="dispatch-form" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
              <div className="booking-inner">
                <span className="tpl-section-badge">Emergency & Scheduled</span>
                <h2>Request Rapid Technician Dispatch</h2>
                <p>A certified, police-verified technician will be routed directly to your address.</p>

                <form
                  className="archetype-interactive-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onShowToast) onShowToast("✓ Technician dispatched! Team ETA within 45 minutes.");
                  }}
                >
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Urgency Level</label>
                      <select defaultValue="Immediate Rapid Dispatch (Under 45 Mins)">
                        <option>Immediate Rapid Dispatch (Under 45 Mins)</option>
                        <option>Scheduled Today Afternoon</option>
                        <option>Scheduled Tomorrow Morning</option>
                        <option>Weekend General Maintenance</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Service / Repair Category</label>
                      <select defaultValue={archetypeConfig?.rateCard?.[0]?.name || "Emergency Repair"}>
                        {(archetypeConfig?.rateCard || []).map((r, idx) => (
                          <option key={idx} value={r.name}>{r.name} ({r.price})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Your Name</label>
                      <input type="text" placeholder="e.g. Vikram Joshi" required />
                    </div>

                    <div className="form-group">
                      <label>Direct Phone Number</label>
                      <input type="tel" placeholder="+91 98765 43210" required />
                    </div>

                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                      <label>Complete Street Address & Landmark</label>
                      <input type="text" placeholder="Flat No., Building Name, Street, Landmark" required />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-block" style={{ background: "#ef4444" }}>
                    Dispatch Certified Technician Now &rarr;
                  </button>
                  <p className="form-subtext">🛡️ Transparent estimate provided before any work starts. 90-day callback guarantee.</p>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. CONSULTANTS & ADVISORY ARCHETYPE */}
      {industry === "consultant" && (
        <section className="tpl-section archetype-section tpl-industry-consultant" id="practice-areas">
          <div className="tpl-container">
            {/* Executive Fiduciary Oath Banner */}
            <div className="roast-spotlight-box" id="fiduciary-oath" style={{ borderColor: "rgba(217, 119, 6, 0.35)", background: "rgba(217, 119, 6, 0.08)" }}>
              <span className="tpl-section-badge">⚖️ The Fiduciary Standard of Care</span>
              <h2>Independent Mandates & Capital Governance</h2>
              <p style={{ maxWidth: "660px", margin: "10px auto 0", fontSize: "14px" }}>
                Legally sworn duty of loyalty: zero undisclosed commissions, transparent hourly or fixed mandate retainers, and fiduciary architectures tailored strictly to your generational wellbeing.
              </p>
            </div>

            {/* Practice Areas */}
            <div className="tpl-section-header" style={{ marginTop: "60px" }}>
              <span className="tpl-section-badge">Practice Pillars</span>
              <h2>Strategic Advisory Disciplines</h2>
              <p>Comprehensive solutions designed for founders, family offices, and executive leadership.</p>
            </div>

            <div className="tpl-services-grid" style={{ marginBottom: "50px" }}>
              {(archetypeConfig?.practiceAreas || []).map((pillar, idx) => (
                <div key={idx} className="archetype-card" style={{ borderColor: "rgba(217, 119, 6, 0.25)" }}>
                  <div className="card-meta-row">
                    <span className="badge-pill" style={{ color: "#fbbf24", background: "rgba(217, 119, 6, 0.15)" }}>Pillar 0{idx + 1}</span>
                    <span className="badge-pill">{pillar.cadence}</span>
                  </div>
                  <h3>{pillar.name}</h3>
                  <p>{pillar.deliverables}</p>
                  <div className="card-action-bar">
                    <span className="card-subnote">Confidential Mandate</span>
                    <button
                      type="button"
                      className="btn-archetype-sm"
                      style={{ color: "#fbbf24" }}
                      onClick={(e) => onNavigateToSection ? onNavigateToSection("discovery-call", e) : onContactClick(e)}
                    >
                      Inquire Mandate &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Case Studies */}
            <div id="case-studies" style={{ margin: "60px 0" }}>
              <div className="tpl-section-header">
                <span className="tpl-section-badge">Verified Outcomes</span>
                <h2>Anonymized Mandate Case Studies</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
                {(archetypeConfig?.caseStudies || []).map((cs, idx) => (
                  <div key={idx} className="story-card" style={{ textAlign: "left", borderColor: "rgba(217, 119, 6, 0.2)" }}>
                    <span className="case-metric">{cs.metric}</span>
                    <strong style={{ fontSize: "1rem", color: "#fbbf24", display: "block" }}>{cs.client}</strong>
                    <p style={{ fontSize: "13px", opacity: 0.8, marginTop: "6px" }}>{cs.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Advisor Credentials */}
            <div id="credentials" style={{ margin: "60px 0" }}>
              <div className="tpl-section-header">
                <span className="tpl-section-badge">Executive Credentials</span>
                <h2>Designations & Governance Standard</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                {(archetypeConfig?.credentials || []).map((cred, idx) => (
                  <div key={idx} className="story-card" style={{ textAlign: "left" }}>
                    <strong style={{ fontSize: "1.05rem", display: "block", marginBottom: "6px" }}>{cred.title}</strong>
                    <p style={{ fontSize: "12.5px", opacity: 0.8, margin: 0 }}>{cred.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 15-Minute Discovery Call Scheduler */}
            <div className="archetype-booking-panel" id="discovery-call" style={{ borderColor: "rgba(217, 119, 6, 0.3)" }}>
              <div className="booking-inner">
                <span className="tpl-section-badge">Confidential Mandate Review</span>
                <h2>Schedule a 15-Minute Discovery Consultation</h2>
                <p>Discuss your advisory objectives directly with our senior practice lead under strict mutual non-disclosure.</p>

                <form
                  className="archetype-interactive-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onShowToast) onShowToast("✓ Discovery call request received! Calendar invite sent under NDA.");
                  }}
                >
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Practice Discipline</label>
                      <select defaultValue="Private Wealth & Family Office Governance">
                        {(archetypeConfig?.practiceAreas || []).map((p, idx) => (
                          <option key={idx} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Organization / Entity Type</label>
                      <select defaultValue="Private Family Office">
                        <option>Private Family Office</option>
                        <option>Mid-Market Corporate</option>
                        <option>High-Growth Tech Enterprise</option>
                        <option>Individual HNW Mandate</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Your Name & Title</label>
                      <input type="text" placeholder="e.g. S. Ramachandran, Managing Director" required />
                    </div>

                    <div className="form-group">
                      <label>Corporate / Private Email</label>
                      <input type="email" placeholder="executive@organization.com" required />
                    </div>

                    <div className="form-group">
                      <label>Direct Phone / WhatsApp</label>
                      <input type="tel" placeholder="+91 98765 43210" required />
                    </div>

                    <div className="form-group">
                      <label>Preferred Meeting Window</label>
                      <select defaultValue="Tomorrow Afternoon (03:00 PM - 05:00 PM)">
                        <option>Tomorrow Morning (10:00 AM - 12:00 PM)</option>
                        <option>Tomorrow Afternoon (03:00 PM - 05:00 PM)</option>
                        <option>This Thursday Executive Slot</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-block" style={{ background: "#d97706" }}>
                    Request Confidential Discovery Call &rarr;
                  </button>
                  <p className="form-subtext">⚖️ Strict mutual non-disclosure applies to all communications.</p>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. GENERAL ARCHETYPE: Core Services Section */}
      {industry === "general" && (
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
      )}


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

      {/* Verified Fact Manifest & Transparency Audit */}
      <section className="tpl-section tpl-trust-seal-bar" id="verified-manifest">
        <div className="tpl-container">
          <div className="trust-seal-inner">
            <div className="seal-header">
              <div className="seal-shield-icon">🛡️</div>
              <div className="seal-header-text">
                <span className="seal-eyebrow">TRANSPARENCY & DATA FIDELITY AUDIT</span>
                <h3 className="seal-title">MakeSite Verified Trade Manifest</h3>
              </div>
              <div className="seal-score-pill">
                <span className="score-dot"></span>
                <span>
                  {["business_name", "category", "location", "hours", "contact"].filter((f) =>
                    Boolean(
                      f === "business_name"
                        ? confirmedFields?.has("business_name")
                        : f === "category"
                        ? confirmedFields?.has("category")
                        : f === "location"
                        ? confirmedFields?.has("location")
                        : f === "hours"
                        ? confirmedFields?.has("hours")
                        : confirmedFields?.has("contact") && contact
                    )
                  ).length}{" "}
                  / 5 Facts Verified
                </span>
              </div>
            </div>

            <p className="seal-description">
              Visitors can rely on this public manifest. Green badges indicate data verified directly by the business owner; yellow badges represent estimated entries awaiting confirmation.
            </p>

            <div className="seal-badges-row">
              <div className={`seal-badge-card ${confirmedFields?.has("business_name") ? "verified" : "unconfirmed"}`}>
                <span className="badge-status-icon">{confirmedFields?.has("business_name") ? "✓" : "⚠️"}</span>
                <div className="badge-details">
                  <strong className="badge-name">Business Identity</strong>
                  <span className="badge-val">{businessName}</span>
                  <span className="badge-state-label">
                    {confirmedFields?.has("business_name") ? "Verified by Owner" : "Pending Confirmation"}
                  </span>
                </div>
              </div>

              <div className={`seal-badge-card ${confirmedFields?.has("category") ? "verified" : "unconfirmed"}`}>
                <span className="badge-status-icon">{confirmedFields?.has("category") ? "✓" : "⚠️"}</span>
                <div className="badge-details">
                  <strong className="badge-name">Trade Classification</strong>
                  <span className="badge-val">{category}</span>
                  <span className="badge-state-label">
                    {confirmedFields?.has("category") ? "Verified by Owner" : "Pending Confirmation"}
                  </span>
                </div>
              </div>

              <div className={`seal-badge-card ${confirmedFields?.has("location") ? "verified" : "unconfirmed"}`}>
                <span className="badge-status-icon">{confirmedFields?.has("location") ? "✓" : "⚠️"}</span>
                <div className="badge-details">
                  <strong className="badge-name">Operating Location</strong>
                  <span className="badge-val">{location}</span>
                  <span className="badge-state-label">
                    {confirmedFields?.has("location") ? "Physical Geo Verified" : "Pending Confirmation"}
                  </span>
                </div>
              </div>

              <div className={`seal-badge-card ${confirmedFields?.has("hours") ? "verified" : "unconfirmed"}`}>
                <span className="badge-status-icon">{confirmedFields?.has("hours") ? "✓" : "⚠️"}</span>
                <div className="badge-details">
                  <strong className="badge-name">Operating Schedule</strong>
                  <span className="badge-val">{hours}</span>
                  <span className="badge-state-label">
                    {confirmedFields?.has("hours") ? "Active Hours Verified" : "Estimated Schedule"}
                  </span>
                </div>
              </div>

              <div className={`seal-badge-card ${confirmedFields?.has("contact") && contact ? "verified" : "unconfirmed"}`}>
                <span className="badge-status-icon">{confirmedFields?.has("contact") && contact ? "✓" : "⚠️"}</span>
                <div className="badge-details">
                  <strong className="badge-name">Direct Inquiries</strong>
                  <span className="badge-val">{contact || "Channel Pending"}</span>
                  <span className="badge-state-label">
                    {confirmedFields?.has("contact") && contact ? "Verified Channel Active" : "Channel Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
        <div className="tpl-footer-inner">
          <div className="footer-left">
            <strong className="footer-brand">{businessName}</strong>
            <p>&copy; 2026 {businessName}. All rights reserved.</p>
          </div>
          <div className="footer-right">
            <span className="powered-by-tag">
              <img src="/logo-mark.png" alt="MakeSite" className="powered-by-icon" />
              Powered by <strong>MakeSite AI</strong>
            </span>
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