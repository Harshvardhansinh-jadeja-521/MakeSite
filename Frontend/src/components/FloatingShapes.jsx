import { useMemo } from "react";
import "./FloatingShapes.css";

// --------------------------------
// 3D Floating Geometric Shapes
// --------------------------------
// Renders animated 3D geometric shapes
// (cubes, rings, pyramids, spheres) that
// float and rotate in the background.

function FloatingShapes() {

  const shapes = useMemo(
    () => [
      {
        type: "cube",
        size: 40,
        left: "8%",
        top: "15%",
        delay: 0,
        duration: 22,
        color: "rgba(139, 92, 246, 0.12)",
      },
      {
        type: "ring",
        size: 60,
        left: "85%",
        top: "10%",
        delay: 3,
        duration: 28,
        color: "rgba(59, 130, 246, 0.1)",
      },
      {
        type: "pyramid",
        size: 35,
        left: "75%",
        top: "65%",
        delay: 5,
        duration: 25,
        color: "rgba(236, 72, 153, 0.1)",
      },
      {
        type: "cube",
        size: 25,
        left: "15%",
        top: "70%",
        delay: 8,
        duration: 20,
        color: "rgba(34, 197, 94, 0.08)",
      },
      {
        type: "sphere",
        size: 50,
        left: "50%",
        top: "5%",
        delay: 2,
        duration: 30,
        color: "rgba(139, 92, 246, 0.08)",
      },
      {
        type: "ring",
        size: 30,
        left: "25%",
        top: "45%",
        delay: 7,
        duration: 24,
        color: "rgba(251, 191, 36, 0.08)",
      },
      {
        type: "cube",
        size: 20,
        left: "90%",
        top: "40%",
        delay: 4,
        duration: 18,
        color: "rgba(59, 130, 246, 0.08)",
      },
      {
        type: "pyramid",
        size: 28,
        left: "60%",
        top: "80%",
        delay: 6,
        duration: 26,
        color: "rgba(139, 92, 246, 0.06)",
      },
    ],
    []
  );


  return (

    <div className="floating-shapes">

      {shapes.map((shape, index) => (

        <div
          key={index}
          className={`shape shape-${shape.type}`}
          style={{
            left: shape.left,
            top: shape.top,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
            "--shape-color": shape.color,
          }}
        >

          {shape.type === "cube" && (
            <div className="cube-faces">
              <div className="cube-face front" />
              <div className="cube-face back" />
              <div className="cube-face left" />
              <div className="cube-face right" />
              <div className="cube-face top" />
              <div className="cube-face bottom" />
            </div>
          )}

          {shape.type === "ring" && (
            <div className="ring-element" />
          )}

          {shape.type === "pyramid" && (
            <div className="pyramid-element">
              <div className="pyramid-face pf-1" />
              <div className="pyramid-face pf-2" />
              <div className="pyramid-face pf-3" />
              <div className="pyramid-face pf-4" />
            </div>
          )}

          {shape.type === "sphere" && (
            <div className="sphere-element" />
          )}

        </div>

      ))}


      {/* Animated grid floor */}
      <div className="perspective-grid" />


      {/* Floating particles */}
      <div className="particles">
        {Array.from({ length: 20 }).map(
          (_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 12}s`,
                "--particle-size": `${2 + Math.random() * 3}px`,
                "--particle-opacity": 0.15 + Math.random() * 0.25,
              }}
            />
          )
        )}
      </div>

    </div>

  );

}


export default FloatingShapes;
