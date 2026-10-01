import { useState, useEffect } from "react";
import "./TemplateSelector.css";
import FloatingShapes from "./FloatingShapes";

const FALLBACK_TEMPLATES = [
  {
    id: "modern-dark",
    name: "Neon Cyber / Dark Luxe",
    category: "Technology & Modern",
    description: "Deep obsidian glassmorphism with glowing neon cyan & indigo accents, 3D cards, and high-tech elegance.",
    badge: "Popular",
    accent: "#3b82f6",
    accent_secondary: "#06b6d4",
    bg_type: "dark",
    palette: ["#090b10", "#121622", "#3b82f6", "#06b6d4", "#f0f4f8"],
    icon: "⚡",
  },
  {
    id: "minimal-clean",
    name: "Minimalist Studio",
    category: "Editorial & Design",
    description: "Crisp editorial layout with Swiss typography, monochrome contrast, generous whitespace, and subtle borders.",
    badge: "Clean",
    accent: "#18181b",
    accent_secondary: "#10b981",
    bg_type: "light",
    palette: ["#fcfcfd", "#f4f4f5", "#18181b", "#71717a", "#10b981"],
    icon: "◻️",
  },
  {
    id: "vibrant-gradient",
    name: "Aurora Vibrant",
    category: "Creative & SaaS",
    description: "Fluid modern gradients, glowing pill badges, smooth card animations, and vivid creative styling.",
    badge: "Trendy",
    accent: "#2563eb",
    accent_secondary: "#06b6d4",
    bg_type: "dark",
    palette: ["#0b0d17", "#131b2e", "#2563eb", "#06b6d4", "#f9fafb"],
    icon: "✨",
  },
  {
    id: "corporate-pro",
    name: "Enterprise Executive",
    category: "Corporate & Finance",
    description: "Authoritative deep navy and warm champagne palette, structured trust badges, and boardroom-ready credibility.",
    badge: "Business",
    accent: "#0f2b48",
    accent_secondary: "#d97706",
    bg_type: "light",
    palette: ["#f8fafc", "#ffffff", "#0f2b48", "#1e3a5f", "#d97706"],
    icon: "💼",
  },
  {
    id: "warm-artisan",
    name: "Sunset Bistro / Warm Artisan",
    category: "Culinary & Boutique",
    description: "Earthy terracotta, honey amber, and warm cream with elegant serif headlines, perfect for cafes, restaurants, and craft stores.",
    badge: "Artisan",
    accent: "#c2410c",
    accent_secondary: "#d97706",
    bg_type: "warm",
    palette: ["#fdfbf7", "#fef3c7", "#c2410c", "#78350f", "#292524"],
    icon: "☕",
  },
  {
    id: "emerald-wellness",
    name: "Emerald Oasis / Health & Spa",
    category: "Wellness & Medical",
    description: "Soothing eucalyptus, deep emerald, and soft mint tones with zen rounded curves, ideal for clinics, yoga, therapy, and spas.",
    badge: "Wellness",
    accent: "#059669",
    accent_secondary: "#10b981",
    bg_type: "calm",
    palette: ["#f0fdf4", "#ffffff", "#065f46", "#059669", "#34d399"],
    icon: "🌿",
  },
  {
    id: "tech-bold",
    name: "Cyber High-Impact / Dev Hub",
    category: "Agency & Engineering",
    description: "High-contrast matrix black with acid lime & electric blue accents, terminal typography, and ultra-dynamic geometric blocks.",
    badge: "High Energy",
    accent: "#84cc16",
    accent_secondary: "#3b82f6",
    bg_type: "dark",
    palette: ["#050505", "#111111", "#84cc16", "#3b82f6", "#e5e7eb"],
    icon: "🔥",
  },
];

function TemplateSelector({ selectedTemplate, onSelect, onContinue, onBack }) {
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Attempt to fetch latest templates from backend API
  useEffect(() => {
    let isMounted = true;
    fetch("http://127.0.0.1:8000/templates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.templates) && data.templates.length > 0) {
          setTemplates(data.templates);
        }
      })
      .catch(() => {
        // Safe fallback already initialized
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { id: "all", label: "All Styles", count: templates.length },
    { id: "dark", label: "Dark & Modern", count: templates.filter((t) => t.bg_type === "dark").length },
    { id: "light", label: "Editorial & Corporate", count: templates.filter((t) => t.bg_type === "light").length },
    { id: "artisan", label: "Artisan & Wellness", count: templates.filter((t) => t.bg_type === "warm" || t.bg_type === "calm").length },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesFilter =
      filterCategory === "all" ||
      (filterCategory === "dark" && t.bg_type === "dark") ||
      (filterCategory === "light" && t.bg_type === "light") ||
      (filterCategory === "artisan" && (t.bg_type === "warm" || t.bg_type === "calm"));

    const matchesSearch =
      searchQuery.trim() === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const activeTemplateObj = templates.find((t) => t.id === selectedTemplate) || templates[0];

  return (
    <div className="template-page">
      <FloatingShapes />

      {/* Header Bar */}
      <div className="template-header">
        <div className="template-top-nav">
          <button className="template-back" onClick={onBack} title="Return to business details">
            <span className="back-arrow">←</span> Back to Blueprint
          </button>

          <div className="template-step-pill">
            <span className="pulse-dot"></span>
            Step 3 of 4 &bull; Choose Design Architecture
          </div>

          <div className="header-spacer" />
        </div>

        <h1 className="template-page-title">Select Your Website Architecture</h1>
        <p className="template-page-subtitle">
          Choose a design system tailored to your industry. Every template is 100% static, responsive, and features smooth in-page navigation.
        </p>

        {/* Filter & Search Bar */}
        <div className="template-filter-bar">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-tab ${filterCategory === cat.id ? "active" : ""}`}
                onClick={() => setFilterCategory(cat.id)}
              >
                {cat.label}
                <span className="tab-count">{cat.count}</span>
              </button>
            ))}
          </div>

          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="template-search-input"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery("")}>
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="template-grid">
        {filteredTemplates.map((template, index) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onSelect={onSelect}
            index={index}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="template-empty-state">
          <span className="empty-icon">🎨</span>
          <h3>No templates match your search</h3>
          <p>Try resetting the category filter or search keywords.</p>
          <button
            className="reset-filter-btn"
            onClick={() => {
              setFilterCategory("all");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="template-footer">
        <div className="footer-summary">
          <span className="summary-label">Selected Style:</span>
          <span className="summary-val">
            <span className="summary-icon">{activeTemplateObj?.icon}</span>
            <strong>{activeTemplateObj?.name}</strong>
            <span className="summary-badge">({activeTemplateObj?.badge})</span>
          </span>
        </div>

        <button className="continue-button" onClick={onContinue} id="continue-to-preview-btn">
          <span>Generate & Open Live Canvas</span>
          <span className="continue-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Clean Modern Template Card Component
// ----------------------------------------------------
function TemplateCard({ template, isSelected, onSelect, index }) {
  return (
    <div
      className={`template-card ${isSelected ? "selected" : ""} template-theme-${template.bg_type}`}
      onClick={() => onSelect(template.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(template.id);
        }
      }}
    >
      {/* Top Header Badge */}
      <div className="card-top-row">
        <span className="template-category-tag">{template.category}</span>
        {template.badge && <span className={`template-badge badge-${template.id}`}>{template.badge}</span>}
      </div>

      {/* Realistic Mini Website Canvas Mockup */}
      <div className={`mini-mockup mockup-${template.id}`}>
        <div className="mockup-browser-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="mockup-nav">
          <div className="mockup-brand-dot" style={{ background: template.accent }}></div>
          <div className="mockup-nav-lines">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div className="mockup-hero">
          <div className="mockup-pill" style={{ borderColor: template.accent }}></div>
          <div className="mockup-title"></div>
          <div className="mockup-sub"></div>
          <div className="mockup-btn" style={{ background: template.accent }}></div>
        </div>
        <div className="mockup-cards-row">
          <div className="mockup-card-mini"></div>
          <div className="mockup-card-mini"></div>
          <div className="mockup-card-mini"></div>
        </div>
      </div>

      {/* Template Info & Description */}
      <div className="template-info">
        <div className="template-name-row">
          <span className="template-icon-circle">{template.icon}</span>
          <h3 className="template-name">{template.name}</h3>
        </div>
        <p className="template-desc">{template.description}</p>

        {/* Color Palette Swatches */}
        <div className="palette-row">
          <span className="palette-label">Palette:</span>
          <div className="swatches">
            {template.palette?.map((color, cIdx) => (
              <span
                key={cIdx}
                className="swatch-dot"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selection Overlay / Status */}
      <div className="card-select-footer">
        {isSelected ? (
          <span className="active-selected-tag">
            <span className="check-icon">✓</span> Selected Architecture
          </span>
        ) : (
          <span className="select-action-text">Click to Select</span>
        )}
      </div>
    </div>
  );
}

export default TemplateSelector;