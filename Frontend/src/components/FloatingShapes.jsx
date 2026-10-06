import "./FloatingShapes.css";

/**
 * Animated Architectural Grid Background
 * Subtle, precision-engineered background with sliding grid lines,
 * ambient soft luminescence, and micro-accent dots.
 */
function FloatingShapes() {
  return (
    <div className="grid-bg" aria-hidden="true">
      <div className="grid-bg__lines" />
      <div className="grid-bg__glow" />
      <div className="grid-bg__mask" />
      {/* Precision grid accents / crosshairs */}
      <span className="grid-bg__dot dot-1" />
      <span className="grid-bg__dot dot-2" />
      <span className="grid-bg__dot dot-3" />
      <span className="grid-bg__dot dot-4" />
      <span className="grid-bg__dot dot-5" />
      <div className="grid-bg__crosshair ch-1" />
      <div className="grid-bg__crosshair ch-2" />
    </div>
  );
}

export default FloatingShapes;
