"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

export function EmptyState({ icon, title, description, action, sx }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 6,
        border: "1.5px dashed",
        borderColor: "divider",
        borderRadius: 2,
        gap: 1.5,
        ...sx,
      }}
    >
      {icon && (
        <Box sx={{ color: "text.disabled", "& svg": { width: 36, height: 36 } }}>
          {icon}
        </Box>
      )}
      <Typography variant="subtitle2" color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 0.5 }}>{action}</Box>}
    </Box>
  );
}
