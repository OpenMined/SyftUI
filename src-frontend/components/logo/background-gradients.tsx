import { memo } from "react";

export const BackgroundGradients = memo(function BackgroundGradients({
  width = "100%",
  height = "100%",
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* 1) Warm peach at top‑left */}
        <radialGradient
          id="g1"
          cx="20%"
          cy="20%"
          r="60%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#F09463" />
          <stop offset="100%" stopColor="#F09463" stopOpacity="0" />
        </radialGradient>

        {/* 2) Bright coral nearer the top center */}
        <radialGradient
          id="g2"
          cx="50%"
          cy="10%"
          r="70%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#FDC676" />
          <stop offset="100%" stopColor="#FDC676" stopOpacity="0" />
        </radialGradient>

        {/* 3) Magenta‑pink at the left‑mid */}
        <radialGradient
          id="g3"
          cx="0%"
          cy="60%"
          r="60%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#AF3A7E" />
          <stop offset="100%" stopColor="#AF3A7E" stopOpacity="0" />
        </radialGradient>

        {/* 4) Teal‑green down near the bottom center */}
        <radialGradient
          id="g4"
          cx="60%"
          cy="80%"
          r="60%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#7BC3AB" />
          <stop offset="100%" stopColor="#7BC3AB" stopOpacity="0" />
        </radialGradient>

        {/* 5) Pale lime at the right */}
        <radialGradient
          id="g5"
          cx="100%"
          cy="40%"
          r="60%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#C1C68E" />
          <stop offset="100%" stopColor="#C1C68E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base is white so that any "holes" fade back to white */}
      <rect width="100%" height="100%" fill="#FFFFFF" />

      {/* Layer the five radial gradients in the same order */}
      <rect width="100%" height="100%" fill="url(#g1)" />
      <rect width="100%" height="100%" fill="url(#g2)" />
      <rect width="100%" height="100%" fill="url(#g3)" />
      <rect width="100%" height="100%" fill="url(#g4)" />
      <rect width="100%" height="100%" fill="url(#g5)" />
    </svg>
  );
});
