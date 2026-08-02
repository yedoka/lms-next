import { redirect } from "next/navigation";
import { ROUTES } from "@/features/auth/utils/routes";

export default function HomePage() {
  redirect(ROUTES.DASHBOARD);
}
