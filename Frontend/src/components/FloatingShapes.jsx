import "./FloatingShapes.css";

/**
 * High-Performance Ambient Atmosphere
 * Optimized for buttery 60fps performance on low-end PCs and integrated GPUs.
 * Zero continuous GPU repaint loops, zero heavy blur filters.
 */
function FloatingShapes() {
  return (
    <div className="floating-canvas" aria-hidden="true">
      <div className="clean-grid" />
      <div className="ambient-glow" />
      <div className="canvas-vignette" />
    </div>
  );
}

export default FloatingShapes;
