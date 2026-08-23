/**
 * Single source of truth for colors used outside `sx` (chart series, raw
 * `color` props on icons/MUI-X components) where `theme.palette.*` string
 * shortcuts don't apply. CSS var strings track the active light/dark scheme
 * automatically, same as the rest of the app.
 */
export const chartColors = {
  info: "var(--mui-palette-info-main)",
  success: "var(--mui-palette-success-main)",
  warning: "var(--mui-palette-warning-main)",
  error: "var(--mui-palette-error-main)",
} as const;

/**
 * Categorical hues for the student activity chart, fixed order — lessons
 * first, quizzes second. Validated as a pair against both chart surfaces:
 * adjacent ΔE 24.5 normal vision, 23.3 under deuteranopia, contrast >= 3:1 on
 * the light and dark surface alike, so one set serves both schemes. The
 * greens carried by `chartColors.success` read as gray at chart scale
 * (chroma below the floor), which is why this pair is not the palette token.
 */
export const activitySeriesColors = {
  lessons: "#2383e2",
  quizzes: "#1f9d55",
} as const;
