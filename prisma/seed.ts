import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient, QuestionType, UserRole } from "@prisma/client";

import argon2 from "argon2";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearDatabase() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.quizAttempt.deleteMany(),
    prisma.answer.deleteMany(),
    prisma.question.deleteMany(),
    prisma.quiz.deleteMany(),
    prisma.lessonProgress.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.course.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

const DEFAULT_PASSWORD = "changeme123";
const QUIZ_SETTINGS = {
  NEXT: {
    timeLimit: 20,
    passingScore: 70,
  },
  SQL: {
    timeLimit: 15,
    passingScore: 75,
  },
} as const;

const SEED_USERS = {
  admin: {
    name: "Admin User",
    email: "admin@lms.local",
    role: UserRole.ADMIN,
  },
  teacher: {
    name: "Ava Teacher",
    email: "teacher@lms.local",
    role: UserRole.TEACHER,
  },
  studentA: {
    name: "Noah Student",
    email: "student1@lms.local",
    role: UserRole.STUDENT,
  },
  studentB: {
    name: "Mia Student",
    email: "student2@lms.local",
    role: UserRole.STUDENT,
  },
} as const;

const NOTIFICATION_TYPES = {
  LESSON: "LESSON",
  GRADE: "GRADE",
  ENROLLMENT: "ENROLLMENT",
  SYSTEM: "SYSTEM",
} as const;

const NOTIFICATION_MESSAGES = {
  LESSON_AVAILABLE: "New lesson available: Server Components and Routing",
  GRADE_AVAILABLE: "Your grade for Next.js Basics Quiz is now available.",
  ENROLLED_NEXT: "You were enrolled in Next.js Fundamentals.",
  STUDENT_JOINED_NEXT: "A new student joined your course: Next.js Fundamentals.",
  SEED_COMPLETE: "Initial LMS seed completed successfully.",
} as const;

const QUIZ_ATTEMPT_SCORES = {
  studentA: {
    next: 85,
    sql: 72,
  },
  studentB: {
    next: 91,
  },
} as const;

type SeedUsers = {
  admin: { id: string };
  teacher: { id: string };
  studentA: { id: string };
  studentB: { id: string };
};

type SeedCourses = {
  nextCourse: { id: string };
  sqlCourse: { id: string };
};

type SeedLessons = {
  lessonIntroNext: { id: string };
  lessonRouting: { id: string };
  lessonSqlBasics: { id: string };
};

type SeedQuizzes = {
  nextQuiz: { id: string };
  sqlQuiz: { id: string };
};

async function seedUsers(defaultPassword: string) {
  const [admin, teacher, studentA, studentB] = await Promise.all([
    prisma.user.create({
      data: {
        name: SEED_USERS.admin.name,
        email: SEED_USERS.admin.email,
        password: defaultPassword,
        role: SEED_USERS.admin.role,
      },
    }),
    prisma.user.create({
      data: {
        name: SEED_USERS.teacher.name,
        email: SEED_USERS.teacher.email,
        password: defaultPassword,
        role: SEED_USERS.teacher.role,
      },
    }),
    prisma.user.create({
      data: {
        name: SEED_USERS.studentA.name,
        email: SEED_USERS.studentA.email,
        password: defaultPassword,
        role: SEED_USERS.studentA.role,
      },
    }),
    prisma.user.create({
      data: {
        name: SEED_USERS.studentB.name,
        email: SEED_USERS.studentB.email,
        password: defaultPassword,
        role: SEED_USERS.studentB.role,
      },
    }),
  ]);

  return { admin, teacher, studentA, studentB };
}

async function seedCourses(teacherId: string) {
  const nextCourse = await prisma.course.create({
    data: {
      title: "Next.js Fundamentals",
      description:
        "Build production-ready web apps with the App Router and modern React patterns.",
      category: "Web Development",
      thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      isPublished: true,
      teacherId,
    },
  });

  const sqlCourse = await prisma.course.create({
    data: {
      title: "Practical PostgreSQL",
      description:
        "Learn relational modeling, indexing, transactions, and query optimization.",
      category: "Databases",
      thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d",
      isPublished: true,
      teacherId,
    },
  });

  return { nextCourse, sqlCourse };
}

async function seedLessons(nextCourseId: string, sqlCourseId: string) {
  const [lessonIntroNext, lessonRouting, lessonSqlBasics] = await Promise.all([
    prisma.lesson.create({
      data: {
        title: "Introduction to the App Router",
        description:
          "Understand layouts, pages, and nested segments in Next.js.",
        videoUrl: "https://example.com/videos/next-app-router-intro",
        position: 1,
        isPublished: true,
        courseId: nextCourseId,
      },
    }),
    prisma.lesson.create({
      data: {
        title: "Server Components and Routing",
        description:
          "Use server components and route groups to structure scalable apps.",
        videoUrl: "https://example.com/videos/next-server-components",
        position: 2,
        isPublished: true,
        courseId: nextCourseId,
      },
    }),
    prisma.lesson.create({
      data: {
        title: "SQL Joins and Indexes",
        description:
          "Write performant queries with joins and targeted indexing.",
        videoUrl: "https://example.com/videos/sql-joins-indexes",
        position: 1,
        isPublished: true,
        courseId: sqlCourseId,
      },
    }),
  ]);

  return { lessonIntroNext, lessonRouting, lessonSqlBasics };
}

async function seedAttachments(lessons: SeedLessons) {
  await prisma.attachment.createMany({
    data: [
      {
        name: "App Router Cheat Sheet.pdf",
        url: "https://example.com/files/app-router-cheat-sheet.pdf",
        lessonId: lessons.lessonIntroNext.id,
      },
      {
        name: "Routing Examples.zip",
        url: "https://example.com/files/routing-examples.zip",
        lessonId: lessons.lessonRouting.id,
      },
      {
        name: "SQL Practice Queries.sql",
        url: "https://example.com/files/sql-practice-queries.sql",
        lessonId: lessons.lessonSqlBasics.id,
      },
    ],
  });
}

async function seedQuizzes(lessons: SeedLessons) {
  const nextQuiz = await prisma.quiz.create({
    data: {
      title: "Next.js Basics Quiz",
      lessonId: lessons.lessonIntroNext.id,
      timeLimit: QUIZ_SETTINGS.NEXT.timeLimit,
      passingScore: QUIZ_SETTINGS.NEXT.passingScore,
      isPublished: true,
      questions: {
        create: [
          {
            text: "Which file is required for a route segment in the App Router?",
            type: QuestionType.MULTIPLE_CHOICE,
            points: 2,
            position: 1,
            answers: {
              create: [
                { text: "route.ts", isCorrect: false },
                { text: "page.tsx", isCorrect: true },
                { text: "index.tsx", isCorrect: false },
                { text: "app.tsx", isCorrect: false },
              ],
            },
          },
          {
            text: "Server Components can access backend resources directly.",
            type: QuestionType.BOOLEAN,
            points: 1,
            position: 2,
            answers: {
              create: [
                { text: "True", isCorrect: true },
                { text: "False", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });

  const sqlQuiz = await prisma.quiz.create({
    data: {
      title: "PostgreSQL Essentials Quiz",
      lessonId: lessons.lessonSqlBasics.id,
      timeLimit: QUIZ_SETTINGS.SQL.timeLimit,
      passingScore: QUIZ_SETTINGS.SQL.passingScore,
      isPublished: true,
      questions: {
        create: [
          {
            text: "What is the main purpose of an index in PostgreSQL?",
            type: QuestionType.MULTIPLE_CHOICE,
            points: 2,
            position: 1,
            answers: {
              create: [
                { text: "Encrypt table data", isCorrect: false },
                { text: "Speed up query lookups", isCorrect: true },
                { text: "Compress large rows", isCorrect: false },
                { text: "Duplicate table records", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });

  return { nextQuiz, sqlQuiz };
}

async function seedStudentData(
  users: SeedUsers,
  courses: SeedCourses,
  lessons: SeedLessons,
  quizzes: SeedQuizzes,
) {
  await prisma.enrollment.createMany({
    data: [
      { userId: users.studentA.id, courseId: courses.nextCourse.id },
      { userId: users.studentA.id, courseId: courses.sqlCourse.id },
      { userId: users.studentB.id, courseId: courses.nextCourse.id },
    ],
  });

  await prisma.lessonProgress.createMany({
    data: [
      {
        userId: users.studentA.id,
        lessonId: lessons.lessonIntroNext.id,
        isCompleted: true,
        completedAt: new Date(),
      },
      {
        userId: users.studentA.id,
        lessonId: lessons.lessonSqlBasics.id,
        isCompleted: false,
      },
      {
        userId: users.studentB.id,
        lessonId: lessons.lessonIntroNext.id,
        isCompleted: true,
        completedAt: new Date(),
      },
      {
        userId: users.studentB.id,
        lessonId: lessons.lessonRouting.id,
        isCompleted: false,
      },
    ],
  });

  await prisma.quizAttempt.createMany({
    data: [
      {
        userId: users.studentA.id,
        quizId: quizzes.nextQuiz.id,
        score: QUIZ_ATTEMPT_SCORES.studentA.next,
        submittedAt: new Date(),
      },
      {
        userId: users.studentA.id,
        quizId: quizzes.sqlQuiz.id,
        score: QUIZ_ATTEMPT_SCORES.studentA.sql,
        submittedAt: new Date(),
      },
      {
        userId: users.studentB.id,
        quizId: quizzes.nextQuiz.id,
        score: QUIZ_ATTEMPT_SCORES.studentB.next,
        submittedAt: new Date(),
      },
    ],
  });
}

async function seedNotifications(users: SeedUsers) {
  await prisma.notification.createMany({
    data: [
      {
        userId: users.studentA.id,
        type: NOTIFICATION_TYPES.LESSON,
        message: NOTIFICATION_MESSAGES.LESSON_AVAILABLE,
      },
      {
        userId: users.studentA.id,
        type: NOTIFICATION_TYPES.GRADE,
        message: NOTIFICATION_MESSAGES.GRADE_AVAILABLE,
      },
      {
        userId: users.studentB.id,
        type: NOTIFICATION_TYPES.ENROLLMENT,
        message: NOTIFICATION_MESSAGES.ENROLLED_NEXT,
      },
      {
        userId: users.teacher.id,
        type: NOTIFICATION_TYPES.ENROLLMENT,
        message: NOTIFICATION_MESSAGES.STUDENT_JOINED_NEXT,
      },
      {
        userId: users.admin.id,
        type: NOTIFICATION_TYPES.SYSTEM,
        message: NOTIFICATION_MESSAGES.SEED_COMPLETE,
      },
    ],
  });
}

async function getSeedCounts() {
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.quiz.count(),
    prisma.question.count(),
    prisma.answer.count(),
    prisma.enrollment.count(),
    prisma.lessonProgress.count(),
    prisma.quizAttempt.count(),
    prisma.notification.count(),
  ]);

  return {
    users: counts[0],
    courses: counts[1],
    lessons: counts[2],
    quizzes: counts[3],
    questions: counts[4],
    answers: counts[5],
    enrollments: counts[6],
    lessonProgress: counts[7],
    quizAttempts: counts[8],
    notifications: counts[9],
  };
}

async function main() {
  await clearDatabase();

  const defaultPassword = await argon2.hash(DEFAULT_PASSWORD);
  const users = await seedUsers(defaultPassword);
  const courses = await seedCourses(users.teacher.id);
  const lessons = await seedLessons(
    courses.nextCourse.id,
    courses.sqlCourse.id,
  );

  await seedAttachments(lessons);

  const quizzes = await seedQuizzes(lessons);

  await seedStudentData(users, courses, lessons, quizzes);
  await seedNotifications(users);

  const counts = await getSeedCounts();

  console.log("Seed completed");
  console.log(counts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
