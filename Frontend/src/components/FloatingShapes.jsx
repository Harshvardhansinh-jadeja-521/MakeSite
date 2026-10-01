import "./FloatingShapes.css";

// ---------------------------------------------------------------------------
// Studio Ambient Background
// Replaces cluttered AI-style 3D spinning shapes with a clean, high-precision
// architectural dot-grid and subtle slate-sapphire ambient illumination.
// ---------------------------------------------------------------------------

function FloatingShapes() {
  return (
    <div className="studio-background" aria-hidden="true">
      {/* Subtle top ambient lighting (clean sapphire/slate, NOT purple) */}
      <div className="ambient-glow" />

      {/* Technical precision dot grid */}
      <div className="studio-grid" />
    </div>
  );
}

export default FloatingShapes;
