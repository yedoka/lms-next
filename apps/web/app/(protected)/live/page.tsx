import { requireAuth } from "@/features/auth/utils/with-role";
import { LiveQuizPlayer } from "@/features/courses/components/live-quiz-player";
import { PageContainer } from "@/shared/components/ui";

export default async function LiveJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireAuth();
  const { code } = await searchParams;

  return (
    <PageContainer maxWidth="md">
      <LiveQuizPlayer initialCode={code} />
    </PageContainer>
  );
}
