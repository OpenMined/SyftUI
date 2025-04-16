import { memo } from "react";

export const Icon = memo(function Icon({
  width = 256,
  height = 128,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 556 556"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M478.246 162.258L278.023 277.997L77.7996 162.258L278.023 46.5185L478.246 162.258Z"
        fill="url(#paint0_linear_345_360)"
      />
      <path
        d="M478.246 162.258V393.737L278.023 509.482V277.997L478.246 162.258Z"
        fill="url(#paint1_linear_345_360)"
      />
      <path
        d="M278.023 277.997V509.482L77.7996 393.737V162.258L278.023 277.997Z"
        fill="url(#paint2_linear_345_360)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_345_360"
          x1="77.7996"
          y1="162.258"
          x2="478.246"
          y2="162.258"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DC7A6E" />
          <stop offset="0.251496" stopColor="#F6A464" />
          <stop offset="0.501247" stopColor="#FDC577" />
          <stop offset="0.753655" stopColor="#EFC381" />
          <stop offset="1" stopColor="#B9D599" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_345_360"
          x1="475.8"
          y1="162.258"
          x2="278.023"
          y2="509.482"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#BFCD94" />
          <stop offset="0.245025" stopColor="#B2D69E" />
          <stop offset="0.504453" stopColor="#8DCCA6" />
          <stop offset="0.745734" stopColor="#5CB8B7" />
          <stop offset="1" stopColor="#4CA5B8" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_345_360"
          x1="77.7996"
          y1="162.258"
          x2="278.023"
          y2="509.482"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D7686D" />
          <stop offset="0.225" stopColor="#C64B77" />
          <stop offset="0.485" stopColor="#A2638E" />
          <stop offset="0.703194" stopColor="#758AA8" />
          <stop offset="1" stopColor="#639EAF" />
        </linearGradient>
      </defs>
    </svg>
  );
});
