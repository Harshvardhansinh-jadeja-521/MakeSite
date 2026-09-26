import "./TemplateSelector.css";

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
      <div className="template-header">
        <button className="template-back" onClick={onBack}>
          ← Back
        </button>

        <h1>Choose Your Website Style</h1>

        <p>
          Select a design that matches the style of your business.
        </p>
      </div>

      <div className="template-grid">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${
              selectedTemplate === template.id ? "selected" : ""
            }`}
            onClick={() => onSelect(template.id)}
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
            </div>

            <div className="template-info">
              <div className="template-name">
                <span>{template.icon}</span>
                {template.name}
              </div>

              <p>{template.description}</p>
            </div>

            {selectedTemplate === template.id && (
              <div className="selected-badge">
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="template-footer">
        <button className="continue-button" onClick={onContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}

export default TemplateSelector;