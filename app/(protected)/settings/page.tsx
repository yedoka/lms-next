import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/features/settings/services/service";
import { getPendingRequestForUser } from "@/features/admin/services/role-request-service";
import { SettingsTabs } from "@/features/settings/components/settings-tabs";
import { PageContainer, PageHeader } from "@/shared/components/ui";
import { ROUTES } from "@/features/auth/utils/routes";

export default async function UserSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.AUTH_LOGIN);

  const user = await getUserProfile(session.user.id);
  if (!user) redirect(ROUTES.AUTH_LOGIN);

  // Only students can request an upgrade to teacher
  const canRequestRole = session.user.role === "STUDENT";
  const pendingRequest = canRequestRole
    ? await getPendingRequestForUser(session.user.id)
    : null;

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
      <SettingsTabs
        user={user}
        canRequestRole={canRequestRole}
        hasPendingRequest={!!pendingRequest}
      />
    </PageContainer>
  );
}
