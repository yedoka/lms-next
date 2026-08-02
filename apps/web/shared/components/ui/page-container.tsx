"use client";

import Container from "@mui/material/Container";
import type { ContainerProps } from "@mui/material/Container";

type PageContainerProps = ContainerProps;

export function PageContainer({
  maxWidth = "lg",
  sx,
  children,
  ...props
}: PageContainerProps) {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...props}
    >
      {children}
    </Container>
  );
}
