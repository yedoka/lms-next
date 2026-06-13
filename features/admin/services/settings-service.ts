import { unstable_cache } from "next/cache";
import prisma from "@/shared/db/prisma";
import type { SystemSettingsData } from "@/features/admin/schemas/schema";

export const SYSTEM_SETTINGS_TAG = "system-settings";

const DEFAULTS: SystemSettingsData = {
  platformName: "LMS",
  allowSelfRegistration: true,
  maintenanceMode: false,
};

const fetchSettings = async (): Promise<SystemSettingsData> => {
  const rows = await prisma.systemSetting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    platformName: map.platformName ?? DEFAULTS.platformName,
    allowSelfRegistration:
      map.allowSelfRegistration !== undefined
        ? map.allowSelfRegistration === "true"
        : DEFAULTS.allowSelfRegistration,
    maintenanceMode:
      map.maintenanceMode !== undefined
        ? map.maintenanceMode === "true"
        : DEFAULTS.maintenanceMode,
  };
};

export const getSettings = unstable_cache(fetchSettings, [SYSTEM_SETTINGS_TAG], {
  tags: [SYSTEM_SETTINGS_TAG],
});

export async function updateSettings(data: SystemSettingsData) {
  const entries: { key: string; value: string }[] = [
    { key: "platformName", value: data.platformName },
    { key: "allowSelfRegistration", value: String(data.allowSelfRegistration) },
    { key: "maintenanceMode", value: String(data.maintenanceMode) },
  ];

  await Promise.all(
    entries.map((e) =>
      prisma.systemSetting.upsert({
        where: { key: e.key },
        update: { value: e.value },
        create: { key: e.key, value: e.value },
      }),
    ),
  );
}
