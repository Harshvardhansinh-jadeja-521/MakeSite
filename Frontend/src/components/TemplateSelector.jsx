import { useRef, useCallback } from "react";
import "./TemplateSelector.css";
import FloatingShapes from "./FloatingShapes";

function TemplateSelector({ selectedTemplate, onSelect, onContinue, onBack }) {
  const templates = [
    {
      id: "modern",
      name: "Modern",
      description: "Clean and professional design",
      icon: "✨",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Simple, elegant and easy to read",
      icon: "◻️",
    },
    {
      id: "bold",
      name: "Bold",
      description: "Strong visuals and eye-catching sections",
      icon: "🔥",
    },
  ];

  return (
    <div className="template-page">

      <FloatingShapes />

      <div className="template-header">
        <button className="template-back" onClick={onBack}>
          ← Back
        </button>

        <div className="template-header-badge">
          Step 2 of 3
        </div>

        <h1>Choose Your Website Style</h1>

        <p>
          Select a design that matches the style of your business.
        </p>
      </div>

      <div className="template-grid">
        {templates.map((template, index) => (

          <Template3DCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onSelect={onSelect}
            index={index}
          />

        ))}
      </div>

      <div className="template-footer">
        <button className="continue-button" onClick={onContinue}>
          <span className="btn-content">
            Continue
            <span className="continue-arrow">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}


// --------------------------------
// 3D Tilt Template Card
// --------------------------------

function Template3DCard({
  template,
  isSelected,
  onSelect,
  index,
}) {

  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const handleMouseMove = useCallback((event) => {

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;

    const rotateX = -(mouseY / (rect.height / 2)) * 10;
    const rotateY = (mouseX / (rect.width / 2)) * 10;

    card.style.transform =
      `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

    if (glareRef.current) {
      const glareX = ((event.clientX - rect.left) / rect.width) * 100;
      const glareY = ((event.clientY - rect.top) / rect.height) * 100;

      glareRef.current.style.background =
        `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 55%)`;
      glareRef.current.style.opacity = "1";
    }

  }, []);


  const handleMouseLeave = useCallback(() => {

    const card = cardRef.current;
    if (!card) return;

    card.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";

    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }

  }, []);


  return (

    <div
      ref={cardRef}
      className={`template-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(template.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease-out",
        animationDelay: `${index * 0.12}s`,
      }}
    >

      <div className={`template-preview ${template.id}`}>
        <div className="preview-top"></div>
        <div className="preview-content">
          <div className="preview-title"></div>
          <div className="preview-line"></div>
          <div className="preview-line short"></div>

          <div className="preview-boxes">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Shimmer effect */}
        <div className="preview-shimmer" />
      </div>

      <div className="template-info">
        <div className="template-name">
          <span className="template-icon-3d">{template.icon}</span>
          {template.name}
        </div>

        <p>{template.description}</p>
      </div>

      {isSelected && (
        <div className="selected-badge">
          <span className="badge-check">✓</span> Selected
        </div>
      )}

      {/* Glare overlay */}
      <div
        ref={glareRef}
        className="card-glare"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.3s ease",
          zIndex: 5,
        }}
      />

    </div>

  );

}


export default TemplateSelector;