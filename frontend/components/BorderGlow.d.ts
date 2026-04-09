declare module "@/components/BorderGlow" {
  import type { CSSProperties, ReactNode } from "react";

  type BorderGlowProps = {
    children?: ReactNode;
    className?: string;
    edgeSensitivity?: number;
    glowColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
    glowRadius?: number;
    glowIntensity?: number;
    coneSpread?: number;
    animated?: boolean;
    colors?: string[];
    fillOpacity?: number;
    style?: CSSProperties;
  };

  export default function BorderGlow(props: BorderGlowProps): JSX.Element;
}
