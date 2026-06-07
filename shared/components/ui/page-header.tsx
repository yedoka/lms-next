"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  sx?: SxProps<Theme>;
}

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  sx,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
        mb: 4,
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {backHref && (
          <Box sx={{ mb: 0.5 }}>
            <IconButton
              component={Link}
              href={backHref}
              size="small"
              sx={{ ml: -1 }}
              aria-label="Go back"
            >
              <ChevronLeft size={18} />
            </IconButton>
          </Box>
        )}
        <Typography variant="h3" component="h1">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, mt: 0.5 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
