import { auth } from "@/auth";
import { ROLE } from "@/features/auth/utils/roles";
import { ROUTES } from "@/features/auth/utils/routes";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.AUTH_LOGIN);
  }

  const role = session.user.role;

  if (role === ROLE.ADMIN) {
    redirect(ROUTES.DASHBOARD_ADMIN);
  }

  if (role === ROLE.TEACHER) {
    redirect(ROUTES.DASHBOARD_TEACHER);
  }

  redirect(ROUTES.DASHBOARD_STUDENT);
}
