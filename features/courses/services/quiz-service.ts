import prisma from "@/shared/db/prisma";
import {
  QuizFormData,
  QuestionFormData,
  AnswerFormData,
} from "../schemas/quiz";

export async function getQuizByLessonId(lessonId: string) {
  return prisma.quiz.findFirst({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          answers: true,
        },
      },
    },
  });
}

export async function createQuiz(lessonId: string, data: QuizFormData) {
  return prisma.quiz.create({
    data: {
      lessonId,
      title: data.title,
      timeLimit: data.timeLimit,
      passingScore: data.passingScore,
      isPublished: data.isPublished,
    },
  });
}

export async function updateQuiz(quizId: string, data: Partial<QuizFormData>) {
  return prisma.quiz.update({
    where: { id: quizId },
    data,
  });
}

export async function deleteQuiz(quizId: string) {
  return prisma.quiz.delete({
    where: { id: quizId },
  });
}

export async function createQuestion(
  quizId: string,
  data: QuestionFormData & { position?: number },
) {
  const lastQuestion = await prisma.question.findFirst({
    where: { quizId },
    orderBy: { position: "desc" },
  });

  const position =
    data.position ?? (lastQuestion ? lastQuestion.position + 1 : 0);

  return prisma.question.create({
    data: {
      quizId,
      text: data.text,
      type: data.type,
      points: data.points,
      position,
      answers: {
        create:
          data.type === "BOOLEAN"
            ? [
                { text: "True", isCorrect: true },
                { text: "False", isCorrect: false },
              ]
            : [
                { text: "Option 1", isCorrect: true },
                { text: "Option 2", isCorrect: false },
              ],
      },
    },
    include: {
      answers: true,
    },
  });
}

export async function updateQuestion(
  questionId: string,
  data: Partial<QuestionFormData>,
) {
  return prisma.question.update({
    where: { id: questionId },
    data,
    include: {
      answers: true,
    },
  });
}

export async function deleteQuestion(questionId: string) {
  return prisma.question.delete({
    where: { id: questionId },
  });
}

export async function reorderQuestions(
  quizId: string,
  updates: { id: string; position: number }[],
) {
  // Execute all updates in a transaction
  return prisma.$transaction(
    updates.map((update) =>
      prisma.question.update({
        where: { id: update.id, quizId: quizId }, // Ensure we only update questions for this quiz
        data: { position: update.position },
      }),
    ),
  );
}

export async function createAnswer(questionId: string, data: AnswerFormData) {
  return prisma.answer.create({
    data: {
      questionId,
      text: data.text,
      isCorrect: data.isCorrect,
    },
  });
}

export async function updateAnswer(
  answerId: string,
  data: Partial<AnswerFormData>,
) {
  return prisma.answer.update({
    where: { id: answerId },
    data,
  });
}

export async function deleteAnswer(answerId: string) {
  return prisma.answer.delete({
    where: { id: answerId },
  });
}

export async function setCorrectAnswer(questionId: string, answerId: string) {
  return prisma.$transaction([
    prisma.answer.updateMany({
      where: { questionId },
      data: { isCorrect: false },
    }),
    prisma.answer.update({
      where: { id: answerId },
      data: { isCorrect: true },
    }),
  ]);
}

export async function gradeQuizAttempt(
  userId: string,
  quizId: string,
  submittedAnswers: { questionId: string; answerId: string }[],
) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { answers: true },
      },
    },
  });

  if (!quiz) throw new Error("Quiz not found");

  let score = 0;
  const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  const attemptAnswersData = [];

  for (const submitted of submittedAnswers) {
    const question = quiz.questions.find((q) => q.id === submitted.questionId);
    if (!question) continue;

    const selectedAnswer = question.answers.find(
      (a) => a.id === submitted.answerId,
    );
    if (!selectedAnswer) continue;

    if (selectedAnswer.isCorrect) {
      score += question.points;
    }

    attemptAnswersData.push({
      questionId: submitted.questionId,
      answerId: submitted.answerId,
    });
  }

  // Calculate percentage and check if passed
  const scorePercentage =
    maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = scorePercentage >= quiz.passingScore;

  // Create attempt in a transaction
  return prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score: scorePercentage, // Storing percentage as score, or should it be raw score? Plan says "Calculated score", let's store percentage to easily compare with passingScore
      passed,
      submittedAt: new Date(),
      answers: {
        create: attemptAnswersData,
      },
    },
  });
}

export async function getQuizAttemptById(attemptId: string, userId: string) {
  return prisma.quizAttempt.findFirst({
    where: {
      id: attemptId,
      userId, // Ensure the user owns this attempt
    },
    include: {
      quiz: true,
      answers: {
        include: {
          question: {
            include: { answers: true },
          },
          answer: true,
        },
      },
    },
  });
}
