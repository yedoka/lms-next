"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";

type StartLiveSessionButtonProps = {
  href: string;
  disabled: boolean;
};

// Client component because `component={Link}` passes a function to MUI's Button,
// which a Server Component cannot serialize across the boundary.
export function StartLiveSessionButton({ href, disabled }: StartLiveSessionButtonProps) {
  return (
    <Tooltip title={disabled ? "Publish the quiz first to host a live session" : ""}>
      {/* Tooltip needs a non-disabled child to receive hover events. */}
      <span>
        {disabled ? (
          <Button variant="contained" color="error" disabled>
            Start Live Session
          </Button>
        ) : (
          <Button variant="contained" color="error" component={Link} href={href}>
            Start Live Session
          </Button>
        )}
      </span>
    </Tooltip>
  );
}
