"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { ProfileSettingsForm } from "./profile-settings-form";
import { PasswordSettingsForm } from "./password-settings-form";
import { AppearanceSettings } from "./appearance-settings";

interface SettingsTabsProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

const TABS = [
  { value: "profile", label: "Profile" },
  { value: "security", label: "Security" },
  { value: "appearance", label: "Appearance" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const SECTION_LABELS: Record<TabValue, { title: string; description: string }> = {
  profile: {
    title: "Profile",
    description: "Update your display name and avatar.",
  },
  security: {
    title: "Security",
    description: "Change your password. You will need your current password.",
  },
  appearance: {
    title: "Appearance",
    description: "Personalise how the app looks.",
  },
};

export function SettingsTabs({ user }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("profile");
  const section = SECTION_LABELS[activeTab];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v as TabValue)}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {TABS.map(({ value, label }) => (
          <Tab key={value} value={value} label={label} sx={{ textTransform: "none", fontWeight: 500 }} />
        ))}
      </Tabs>

      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
            {section.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            {section.description}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {activeTab === "profile" && <ProfileSettingsForm initialData={user} />}
          {activeTab === "security" && <PasswordSettingsForm />}
          {activeTab === "appearance" && <AppearanceSettings />}
        </CardContent>
      </Card>
    </Box>
  );
}
