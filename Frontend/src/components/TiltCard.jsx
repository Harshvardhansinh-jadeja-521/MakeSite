import { useRef, useCallback } from "react";

// --------------------------------
// 3D Tilt Card Component
// --------------------------------
// Wraps any content in a div that responds to
// mouse movement with a 3D perspective tilt effect.

function TiltCard({
  children,
  className = "",
  intensity = 8,
  glare = true,
  scale = 1.02,
}) {

  const cardRef = useRef(null);
  const glareRef = useRef(null);


  const handleMouseMove = useCallback(
    (event) => {

      const card = cardRef.current;

      if (!card) return;

      const rect = card.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = event.clientX - centerX;
      const mouseY = event.clientY - centerY;

      // Normalized -1 to 1
      const rotateX =
        -(mouseY / (rect.height / 2)) *
        intensity;

      const rotateY =
        (mouseX / (rect.width / 2)) *
        intensity;

      card.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;

      // Move the glare highlight
      if (glare && glareRef.current) {

        const glareX =
          ((event.clientX - rect.left) /
            rect.width) *
          100;

        const glareY =
          ((event.clientY - rect.top) /
            rect.height) *
          100;

        glareRef.current.style.background =
          `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;

        glareRef.current.style.opacity = "1";
      }

    },
    [intensity, scale, glare]
  );


  const handleMouseLeave = useCallback(
    () => {

      const card = cardRef.current;

      if (!card) return;

      card.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";

      if (glare && glareRef.current) {
        glareRef.current.style.opacity = "0";
      }

    },
    [glare]
  );


  return (

    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease-out",
        position: "relative",
      }}
    >

      {children}

      {glare && (
        <div
          ref={glareRef}
          className="tilt-glare"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 0.3s ease",
            zIndex: 2,
          }}
        />
      )}

    </div>

  );

}


export default TiltCard;
