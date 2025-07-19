import "react";

declare module "react" {
  interface CSSProperties {
    /**
     * CSS custom properties (CSS variables)
     * @example
     * style={{ '--sidebar-width': '15rem' }}
     */
    [key: `--${string}`]: string | number | undefined;
  }
}
