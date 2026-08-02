import prisma from "@/shared/db/prisma";
import { ROLE } from "@/features/auth/utils/roles";

/**
 * Validates if a user owns a course or has an admin role.
 * Returns the course if valid, throws an error if validation fails.
 */
export async function validateCourseOwnership(courseId: string, userId: string, role: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  if (role !== ROLE.ADMIN && course.teacherId !== userId) {
    throw new Error("Unauthorized: You do not own this course");
  }

  return course;
}

function assertCourseAccess(teacherId: string, userId: string, role: string) {
  if (role !== ROLE.ADMIN && teacherId !== userId) {
    throw new Error("Unauthorized: You do not own this course");
  }
}

/**
 * The validators below resolve a child entity to its owning course through the
 * database and authorize against *that* course.
 *
 * Never authorize a mutation against a courseId supplied by the same client
 * request that supplies the child id: proving you own course A does not entitle
 * you to mutate a lesson belonging to course B. Each validator returns the
 * derived ids so callers can revalidate the correct paths without trusting
 * client input for those either.
 */

export async function validateLessonOwnership(lessonId: string, userId: string, role: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      courseId: true,
      course: { select: { teacherId: true } },
    },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  assertCourseAccess(lesson.course.teacherId, userId, role);

  return { lessonId: lesson.id, courseId: lesson.courseId };
}

export async function validateAttachmentOwnership(attachmentId: string, userId: string, role: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: {
      id: true,
      lessonId: true,
      lesson: {
        select: { courseId: true, course: { select: { teacherId: true } } },
      },
    },
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  assertCourseAccess(attachment.lesson.course.teacherId, userId, role);

  return {
    attachmentId: attachment.id,
    lessonId: attachment.lessonId,
    courseId: attachment.lesson.courseId,
  };
}

export async function validateQuizOwnership(quizId: string, userId: string, role: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      lessonId: true,
      lesson: {
        select: { courseId: true, course: { select: { teacherId: true } } },
      },
    },
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  assertCourseAccess(quiz.lesson.course.teacherId, userId, role);

  return { quizId: quiz.id, lessonId: quiz.lessonId, courseId: quiz.lesson.courseId };
}

export async function validateQuestionOwnership(questionId: string, userId: string, role: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      quizId: true,
      quiz: {
        select: {
          lessonId: true,
          lesson: {
            select: { courseId: true, course: { select: { teacherId: true } } },
          },
        },
      },
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  assertCourseAccess(question.quiz.lesson.course.teacherId, userId, role);

  return {
    questionId: question.id,
    quizId: question.quizId,
    lessonId: question.quiz.lessonId,
    courseId: question.quiz.lesson.courseId,
  };
}

export async function validateAnswerOwnership(answerId: string, userId: string, role: string) {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: {
      id: true,
      questionId: true,
      question: {
        select: {
          quizId: true,
          quiz: {
            select: {
              lessonId: true,
              lesson: {
                select: { courseId: true, course: { select: { teacherId: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!answer) {
    throw new Error("Answer not found");
  }

  assertCourseAccess(answer.question.quiz.lesson.course.teacherId, userId, role);

  return {
    answerId: answer.id,
    questionId: answer.questionId,
    quizId: answer.question.quizId,
    lessonId: answer.question.quiz.lessonId,
    courseId: answer.question.quiz.lesson.courseId,
  };
}
