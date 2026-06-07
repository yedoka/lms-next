import { createTheme } from "@mui/material/styles";
import React from "react";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import type {} from "@mui/material/themeCssVarsAugmentation";

const LinkBehavior = React.forwardRef<
  HTMLAnchorElement,
  Omit<NextLinkProps, "href"> & { href: string }
>((props, ref) => {
  const { href, ...other } = props;
  return React.createElement(NextLink, { ref, href, ...other });
});
LinkBehavior.displayName = "LinkBehavior";

// ─── Module augmentation for custom palette tokens ────────────────────────────
declare module "@mui/material/styles" {
  interface Palette {
    custom: { surface: string; accentSoft: string };
  }
  interface PaletteOptions {
    custom?: { surface?: string; accentSoft?: string };
  }
}

export const theme = createTheme({
  // ── CSS Variables ────────────────────────────────────────────────────────
  cssVariables: {
    colorSchemeSelector: "class",
  },

  // ── Color Schemes ────────────────────────────────────────────────────────
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#191919",
          dark: "#000000",
          light: "#444444",
          contrastText: "#ffffff",
        },
        secondary: {
          main: "#f1f1ef",
          contrastText: "#191919",
        },
        info: {
          main: "#2383e2",
          contrastText: "#ffffff",
          light: "#5ba6f5",
          dark: "#1a6bc0",
        },
        success: {
          main: "#448361",
          contrastText: "#ffffff",
        },
        warning: {
          main: "#cb912f",
          contrastText: "#ffffff",
        },
        error: {
          main: "#d44c47",
          contrastText: "#ffffff",
        },
        background: {
          default: "#ffffff",
          paper: "#ffffff",
        },
        text: {
          primary: "#191919",
          secondary: "#6b6b6b",
          disabled: "#b0b0b0",
        },
        divider: "#e9e9e7",
        action: {
          hover: "rgba(0,0,0,0.04)",
          selected: "rgba(0,0,0,0.08)",
          disabled: "rgba(0,0,0,0.26)",
          disabledBackground: "rgba(0,0,0,0.06)",
        },
        custom: {
          surface: "#f7f7f5",
          accentSoft: "rgba(35,131,226,0.10)",
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: "#ededed",
          dark: "#ffffff",
          light: "#b0b0b0",
          contrastText: "#191919",
        },
        secondary: {
          main: "#2f2f2f",
          contrastText: "#e9e9e7",
        },
        info: {
          main: "#529cff",
          contrastText: "#ffffff",
          light: "#7bb5ff",
          dark: "#3a7fe0",
        },
        success: {
          main: "#4dab6d",
          contrastText: "#ffffff",
        },
        warning: {
          main: "#d9a13a",
          contrastText: "#ffffff",
        },
        error: {
          main: "#e5736e",
          contrastText: "#ffffff",
        },
        background: {
          default: "#191919",
          paper: "#202020",
        },
        text: {
          primary: "#e9e9e7",
          secondary: "#9b9b9b",
          disabled: "#5a5a5a",
        },
        divider: "rgba(255,255,255,0.10)",
        action: {
          hover: "rgba(255,255,255,0.06)",
          selected: "rgba(255,255,255,0.12)",
          disabled: "rgba(255,255,255,0.30)",
          disabledBackground: "rgba(255,255,255,0.08)",
        },
        custom: {
          surface: "#252525",
          accentSoft: "rgba(82,156,255,0.12)",
        },
      },
    },
  },

  // ── Typography ────────────────────────────────────────────────────────────
  typography: {
    fontFamily:
      "var(--font-sans, Inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    htmlFontSize: 16,
    h1: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.015em" },
    h3: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" },
    h4: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 },
    button: {
      fontSize: "0.875rem",
      fontWeight: 500,
      textTransform: "none" as const,
      lineHeight: 1.5,
    },
    caption: { fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.5 },
    overline: {
      fontSize: "0.6875rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      lineHeight: 2,
    },
  },

  // ── Shape ─────────────────────────────────────────────────────────────────
  shape: { borderRadius: 8 },

  // ── Component overrides ───────────────────────────────────────────────────
  components: {
    // ── Global baseline ──────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: (themeParam) => [
        {
          body: {
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
          "::-webkit-scrollbar": { width: 6, height: 6 },
          "::-webkit-scrollbar-track": { background: "transparent" },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.12)",
            borderRadius: 3,
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.22)",
            },
          },
          "*": { scrollbarWidth: "thin" as const },
        },
        themeParam.applyStyles("dark", {
          "::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.15)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.25)",
            },
          },
        }),
      ],
    },

    // ── ButtonBase ───────────────────────────────────────────────────────
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },

    // ── Button ───────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({
          theme: themeParam,
          ownerState,
        }: {
          theme: ReturnType<typeof createTheme>;
          ownerState: { variant?: string; color?: string };
        }) => ({
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
          letterSpacing: 0,
          // Outlined primary: hairline gray border, dark text
          ...(ownerState.variant === "outlined" &&
            ownerState.color === "primary" && {
              borderColor: themeParam.vars.palette.divider,
              color: themeParam.vars.palette.text.primary,
              "&:hover": {
                borderColor: themeParam.vars.palette.text.disabled,
                backgroundColor: themeParam.vars.palette.action.hover,
              },
            }),
          // Text primary: dark text with subtle hover
          ...(ownerState.variant === "text" &&
            ownerState.color === "primary" && {
              color: themeParam.vars.palette.text.primary,
              "&:hover": { backgroundColor: themeParam.vars.palette.action.hover },
            }),
        }),
        sizeSmall: { padding: "4px 12px", fontSize: "0.8125rem" },
        sizeMedium: { padding: "7px 16px" },
        sizeLarge: { padding: "10px 22px", fontSize: "0.9375rem" },
      },
    },

    // ── IconButton ───────────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          borderRadius: 8,
          "&:hover": { backgroundColor: themeParam.vars.palette.action.hover },
        }),
      },
    },

    // ── Paper / Card ─────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          borderColor: themeParam.vars.palette.divider,
        }),
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          border: `1px solid ${themeParam.vars.palette.divider}`,
          borderRadius: 10,
          boxShadow: "none",
          transition: "box-shadow 0.15s ease, transform 0.15s ease",
        }),
      },
    },

    // ── Inputs ───────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },

    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: 14 },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          borderRadius: 8,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: themeParam.vars.palette.divider,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: themeParam.vars.palette.text.disabled,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: themeParam.vars.palette.info.main,
            borderWidth: 1,
          },
        }),
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          fontSize: 14,
          fontWeight: 500,
          color: themeParam.vars.palette.text.primary,
          "&.Mui-focused": { color: themeParam.vars.palette.info.main },
        }),
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          fontSize: 14,
          "&.Mui-focused": { color: themeParam.vars.palette.info.main },
        }),
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: { fontSize: 13, marginLeft: 0 },
      },
    },

    // ── Select / Menu ─────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        outlined: { borderRadius: 8 },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => [
          {
            borderRadius: 10,
            border: `1px solid ${themeParam.vars.palette.divider}`,
            boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
            marginTop: 4,
          },
          themeParam.applyStyles("dark", {
            boxShadow: "0 8px 28px rgba(0,0,0,0.40)",
          }),
        ],
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          borderRadius: 6,
          margin: "2px 4px",
          fontSize: 14,
          minHeight: 36,
          "&.Mui-selected": {
            backgroundColor: themeParam.vars.palette.custom.accentSoft,
            color: themeParam.vars.palette.info.main,
          },
          "&:hover": { backgroundColor: themeParam.vars.palette.action.hover },
        }),
      },
    },

    // ── Chip ─────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: ({
          theme: themeParam,
          ownerState,
        }: {
          theme: ReturnType<typeof createTheme>;
          ownerState: { color?: string };
        }) => ({
          borderRadius: 6,
          fontWeight: 500,
          fontSize: 12,
          height: 22,
          ...(ownerState.color === "default" && {
            backgroundColor: themeParam.vars.palette.secondary.main,
            color: themeParam.vars.palette.text.primary,
          }),
        }),
        label: { paddingLeft: 8, paddingRight: 8 },
      },
    },

    // ── Table ─────────────────────────────────────────────────────────────
    MuiTable: {
      defaultProps: { size: "small" },
    },

    MuiTableHead: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          "& .MuiTableCell-head": {
            backgroundColor: themeParam.vars.palette.custom.surface,
            color: themeParam.vars.palette.text.secondary,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            borderBottom: `1px solid ${themeParam.vars.palette.divider}`,
            padding: "10px 16px",
          },
        }),
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          borderBottom: `1px solid ${themeParam.vars.palette.divider}`,
          padding: "10px 16px",
          fontSize: 14,
        }),
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          "&:hover td": { backgroundColor: themeParam.vars.palette.action.hover },
          "&:last-child td": { borderBottom: 0 },
        }),
      },
    },

    // ── Dialog ────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => [
          {
            borderRadius: 12,
            border: `1px solid ${themeParam.vars.palette.divider}`,
            boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
          },
          themeParam.applyStyles("dark", {
            boxShadow: "0 8px 28px rgba(0,0,0,0.50)",
          }),
        ],
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: "1rem", fontWeight: 600, padding: "20px 24px 8px" },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: { padding: "16px 24px" },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: { padding: "8px 24px 20px", gap: 8 },
      },
    },

    // ── AppBar ────────────────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: { color: "default", elevation: 0 },
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          backgroundColor: themeParam.vars.palette.background.paper,
          borderBottom: `1px solid ${themeParam.vars.palette.divider}`,
          color: themeParam.vars.palette.text.primary,
        }),
      },
    },

    // ── Drawer ───────────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          backgroundColor: themeParam.vars.palette.custom.surface,
          borderRight: `1px solid ${themeParam.vars.palette.divider}`,
          boxShadow: "none",
        }),
      },
    },

    // ── List / Nav ───────────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => [
          {
            borderRadius: 8,
            "&.Mui-selected": {
              backgroundColor: themeParam.vars.palette.custom.accentSoft,
              color: themeParam.vars.palette.info.main,
              "&:hover": {
                backgroundColor: "rgba(35,131,226,0.15)",
              },
              "& .MuiListItemIcon-root": { color: themeParam.vars.palette.info.main },
              "& .MuiListItemText-primary": { color: themeParam.vars.palette.info.main },
            },
            "&:hover": { backgroundColor: themeParam.vars.palette.action.hover },
          },
          themeParam.applyStyles("dark", {
            "&.Mui-selected": {
              "&:hover": {
                backgroundColor: "rgba(82,156,255,0.18)",
              },
            },
          }),
        ],
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 36 },
      },
    },

    // ── Switch ───────────────────────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        switchBase: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          "&.Mui-checked": {
            "& + .MuiSwitch-track": {
              backgroundColor: themeParam.vars.palette.info.main,
              opacity: 1,
            },
          },
        }),
      },
    },

    // ── Progress ─────────────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => [
          {
            borderRadius: 4,
            backgroundColor: "#e9e9e7",
            height: 6,
          },
          themeParam.applyStyles("dark", {
            backgroundColor: "#2f2f2f",
          }),
        ],
        bar: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          borderRadius: 4,
          backgroundColor: themeParam.vars.palette.info.main,
        }),
      },
    },

    // ── Checkbox / Radio ─────────────────────────────────────────────────
    MuiCheckbox: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          "&.Mui-checked": { color: themeParam.vars.palette.info.main },
        }),
      },
    },

    MuiRadio: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          "&.Mui-checked": { color: themeParam.vars.palette.info.main },
        }),
      },
    },

    // ── Tabs ─────────────────────────────────────────────────────────────
    MuiTabs: {
      styleOverrides: {
        indicator: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          backgroundColor: themeParam.vars.palette.info.main,
        }),
      },
    },

    MuiTab: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          textTransform: "none",
          fontWeight: 500,
          fontSize: 14,
          "&.Mui-selected": { color: themeParam.vars.palette.info.main },
        }),
      },
    },

    // ── Tooltip ──────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => [
          {
            backgroundColor: "#191919",
            fontSize: 12,
            borderRadius: 6,
            padding: "4px 8px",
          },
          themeParam.applyStyles("dark", {
            backgroundColor: "#3a3a3a",
          }),
        ],
        arrow: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => [
          {
            color: "#191919",
          },
          themeParam.applyStyles("dark", {
            color: "#3a3a3a",
          }),
        ],
      },
    },

    // ── Link ─────────────────────────────────────────────────────────────
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      },
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          color: themeParam.vars.palette.info.main,
          textDecorationColor: "transparent",
          "&:hover": { textDecorationColor: themeParam.vars.palette.info.main },
        }),
      },
    },

    // ── Divider ──────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => ({
          borderColor: themeParam.vars.palette.divider,
        }),
      },
    },

    // ── Skeleton ─────────────────────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root: ({ theme: themeParam }: { theme: ReturnType<typeof createTheme> }) => [
          {
            borderRadius: 6,
            backgroundColor: "#f0f0ee",
            "&::after": {
              backgroundImage: "linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent)",
            },
          },
          themeParam.applyStyles("dark", {
            backgroundColor: "#2a2a2a",
            "&::after": {
              backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
            },
          }),
        ],
      },
    },

    // ── Alert ────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },

    // ── Circular progress ─────────────────────────────────────────────────
    MuiCircularProgress: {
      defaultProps: { color: "info" },
    },
  },
});
