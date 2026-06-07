"use client";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  sx,
  contentSx,
}: SectionCardProps) {
  const hasHeader = title || description || action;

  return (
    <Card sx={{ overflow: "visible", ...sx }}>
      {hasHeader && (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              px: 3,
              py: 2.5,
            }}
          >
            <Box>
              {title && (
                <Typography variant="subtitle2" fontWeight={600}>
                  {title}
                </Typography>
              )}
              {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {description}
                </Typography>
              )}
            </Box>
            {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
          </Box>
          <Divider />
        </>
      )}
      <Box sx={{ p: 3, ...contentSx }}>{children}</Box>
    </Card>
  );
}
