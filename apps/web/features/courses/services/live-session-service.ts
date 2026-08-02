import { getRedis } from "@/shared/lib/redis";

const SESSION_TTL = 86400;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface LiveSessionQuestion {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "BOOLEAN";
  points: number;
  answers: { id: string; text: string; isCorrect: boolean }[];
}

interface CreateLiveSessionParams {
  quizId: string;
  courseId: string;
  lessonId: string;
  teacherId: string;
  title: string;
  passingScore: number;
  secondsPerQuestion: number;
  questions: LiveSessionQuestion[];
}

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createLiveSession(
  params: CreateLiveSessionParams,
): Promise<{ code: string }> {
  const redis = getRedis();

  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    if (++attempts > 10) throw new Error("Failed to generate unique session code");
  } while ((await redis.exists(`quiz:session:${code}`)) > 0);

  await redis.hmset(`quiz:session:${code}`, {
    quizId: params.quizId,
    courseId: params.courseId,
    lessonId: params.lessonId,
    teacherId: params.teacherId,
    title: params.title,
    passingScore: params.passingScore.toString(),
    secondsPerQuestion: params.secondsPerQuestion.toString(),
    status: "lobby",
    currentIndex: "0",
    questionStartedAt: "",
    questions: JSON.stringify(params.questions),
  });
  await redis.expire(`quiz:session:${code}`, SESSION_TTL);

  return { code };
}
