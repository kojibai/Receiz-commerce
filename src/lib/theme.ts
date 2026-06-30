import type { CSSProperties } from "react";
import type { BrandConfig } from "@/types/domain";

const radiusMap: Record<BrandConfig["cornerRadius"], string> = {
  compact: "6px",
  balanced: "8px",
  soft: "12px"
};

const fontMap: Record<string, string> = {
  Inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  Geist: "Geist, Inter, ui-sans-serif, system-ui, sans-serif",
  System: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  Editorial: "Georgia, Cambria, 'Times New Roman', serif"
};

export function brandThemeStyle(brand: BrandConfig): CSSProperties {
  return {
    "--boost": brand.primaryColor,
    "--receiz": brand.secondaryColor,
    "--receiz-strong": brand.secondaryColor,
    "--cyan": brand.secondaryColor,
    "--gold": brand.accentColor,
    "--text": brand.neutralColor,
    "--background": brand.backgroundColor,
    "--radius": radiusMap[brand.cornerRadius],
    "--radius-lg": `calc(${radiusMap[brand.cornerRadius]} + 4px)`,
    fontFamily: fontMap[brand.fontFamily] ?? fontMap.Inter
  } as CSSProperties;
}
