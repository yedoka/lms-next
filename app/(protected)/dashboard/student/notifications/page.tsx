import { auth } from "@/auth";
import { withRole } from "@/features/auth/utils/with-role";
import { ROLE } from "@/features/auth/utils/roles";
import {
  getNotifications,
  NOTIFICATIONS_MAX_LIMIT,
} from "@/features/notifications/services/notification-service";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { PageContainer, PageHeader } from "@/shared/components/ui";

export default async function StudentNotificationsPage() {
  await withRole([ROLE.STUDENT, ROLE.ADMIN]);
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // The bell in the header keeps the live feed; this page is the full history,
  // so it reads straight from the service instead of the socket-backed hook.
  const notifications = await getNotifications(
    session.user.id,
    NOTIFICATIONS_MAX_LIMIT,
  );

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Notifications"
        description="Grades, new lessons and enrollment updates."
      />

      <NotificationList notifications={notifications} />
    </PageContainer>
  );
}
