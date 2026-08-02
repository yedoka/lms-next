/** Human labels for `Notification.type`, which is a free-form string column. */
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  GRADE: "Grade updated",
  LESSON: "New lesson",
  ENROLLMENT: "Enrollment confirmed",
};

export function notificationTypeLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type;
}
