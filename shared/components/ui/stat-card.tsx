"use client";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

type StatColor = "info" | "success" | "warning" | "error" | "default";

const colorMap: Record<StatColor, { bg: string; icon: string }> = {
  info: { bg: "rgba(35,131,226,0.10)", icon: "#2383e2" },
  success: { bg: "rgba(68,131,97,0.10)", icon: "#448361" },
  warning: { bg: "rgba(203,145,47,0.10)", icon: "#cb912f" },
  error: { bg: "rgba(212,76,71,0.10)", icon: "#d44c47" },
  default: { bg: "rgba(0,0,0,0.05)", icon: "#6b6b6b" },
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: StatColor;
  sx?: SxProps<Theme>;
}

export function StatCard({ icon, label, value, color = "default", sx }: StatCardProps) {
  const { bg, icon: iconColor } = colorMap[color];

  return (
    <Card sx={{ p: 3, ...sx }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
            flexShrink: 0,
            "& svg": { width: 20, height: 20 },
          }}
        >
          {icon}
        </Box>
      </Box>
    </Card>
  );
}
