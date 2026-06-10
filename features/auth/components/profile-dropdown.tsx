"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import { ROLE_LABELS } from "@/features/auth/utils/rbac";
import { ROUTES } from "@/features/auth/utils/routes";
import type { UserRole } from "@prisma/client";
import Link from "next/link";

type ProfileDropdownProps = {
  name?: string | null;
  email?: string | null;
  role: UserRole;
  image?: string | null;
};

export function ProfileDropdown({ name, email, role, image }: ProfileDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const displayName = name?.trim() || "User";
  const initial = displayName[0].toUpperCase();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleClose();
    signOut({ callbackUrl: ROUTES.AUTH_LOGIN });
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        endIcon={<ChevronDown size={16} />}
        sx={{
          textTransform: "none",
          color: "text.primary",
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Avatar
          src={image ?? undefined}
          sx={{
            width: 32,
            height: 32,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {initial}
        </Avatar>
        <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
          <Typography variant="body2" fontWeight={500} lineHeight={1.2}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
            {ROLE_LABELS[role]}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              width: 256,
              mt: 0.5,
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight={600}>
            {displayName}
          </Typography>
          {email && (
            <Typography variant="caption" color="text.secondary">
              {email}
            </Typography>
          )}
        </Box>
        <Divider />
        <MenuItem
          component={Link}
          href={ROUTES.DASHBOARD_SETTINGS}
          onClick={handleClose}
          sx={{ mt: 0.5, mx: 1, borderRadius: 1 }}
        >
          <Typography variant="body2">Settings</Typography>
        </MenuItem>
        <MenuItem
          onClick={handleSignOut}
          sx={{ mx: 1, mb: 0.5, borderRadius: 1 }}
        >
          <Typography variant="body2">Sign out</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
