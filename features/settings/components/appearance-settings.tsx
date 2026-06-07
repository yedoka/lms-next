"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Sun, Moon, Monitor } from "lucide-react";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: <Sun size={16} /> },
  { value: "dark", label: "Dark", icon: <Moon size={16} /> },
  { value: "system", label: "System", icon: <Monitor size={16} /> },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Box sx={{ height: 40 }} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Theme
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Choose how the app looks for you. "System" follows your OS preference.
        </Typography>
      </Box>

      <ToggleButtonGroup
        value={theme}
        exclusive
        onChange={(_, value) => { if (value) setTheme(value); }}
        size="small"
      >
        {THEME_OPTIONS.map(({ value, label, icon }) => (
          <ToggleButton key={value} value={value} sx={{ gap: 1, px: 2 }}>
            {icon}
            <Typography variant="body2">{label}</Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
