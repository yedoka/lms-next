import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import {
  PrismaClient,
  QuestionType,
  UserRole,
} from "../app/generated/prisma/client";

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

async function main() {
  await clearDatabase();

  const defaultPassword = "changeme123";

  const [admin, teacher, studentA, studentB] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@lms.local",
        password: defaultPassword,
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Ava Teacher",
        email: "teacher@lms.local",
        password: defaultPassword,
        role: UserRole.TEACHER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Noah Student",
        email: "student1@lms.local",
        password: defaultPassword,
        role: UserRole.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mia Student",
        email: "student2@lms.local",
        password: defaultPassword,
        role: UserRole.STUDENT,
      },
    }),
  ]);

  const nextCourse = await prisma.course.create({
    data: {
      title: "Next.js Fundamentals",
      description:
        "Build production-ready web apps with the App Router and modern React patterns.",
      category: "Web Development",
      thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      isPublished: true,
      teacherId: teacher.id,
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
      teacherId: teacher.id,
    },
  });

  const [lessonIntroNext, lessonRouting, lessonSqlBasics] = await Promise.all([
    prisma.lesson.create({
      data: {
        title: "Introduction to the App Router",
        description:
          "Understand layouts, pages, and nested segments in Next.js.",
        videoUrl: "https://example.com/videos/next-app-router-intro",
        position: 1,
        isPublished: true,
        courseId: nextCourse.id,
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
        courseId: nextCourse.id,
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
        courseId: sqlCourse.id,
      },
    }),
  ]);

  await prisma.attachment.createMany({
    data: [
      {
        name: "App Router Cheat Sheet.pdf",
        url: "https://example.com/files/app-router-cheat-sheet.pdf",
        lessonId: lessonIntroNext.id,
      },
      {
        name: "Routing Examples.zip",
        url: "https://example.com/files/routing-examples.zip",
        lessonId: lessonRouting.id,
      },
      {
        name: "SQL Practice Queries.sql",
        url: "https://example.com/files/sql-practice-queries.sql",
        lessonId: lessonSqlBasics.id,
      },
    ],
  });

  const nextQuiz = await prisma.quiz.create({
    data: {
      title: "Next.js Basics Quiz",
      lessonId: lessonIntroNext.id,
      timeLimit: 20,
      passingScore: 70,
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
      lessonId: lessonSqlBasics.id,
      timeLimit: 15,
      passingScore: 75,
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

  await prisma.enrollment.createMany({
    data: [
      { userId: studentA.id, courseId: nextCourse.id },
      { userId: studentA.id, courseId: sqlCourse.id },
      { userId: studentB.id, courseId: nextCourse.id },
    ],
  });

  await prisma.lessonProgress.createMany({
    data: [
      {
        userId: studentA.id,
        lessonId: lessonIntroNext.id,
        isCompleted: true,
        completedAt: new Date(),
      },
      {
        userId: studentA.id,
        lessonId: lessonSqlBasics.id,
        isCompleted: false,
      },
      {
        userId: studentB.id,
        lessonId: lessonIntroNext.id,
        isCompleted: true,
        completedAt: new Date(),
      },
      {
        userId: studentB.id,
        lessonId: lessonRouting.id,
        isCompleted: false,
      },
    ],
  });

  await prisma.quizAttempt.createMany({
    data: [
      {
        userId: studentA.id,
        quizId: nextQuiz.id,
        score: 85,
        submittedAt: new Date(),
      },
      {
        userId: studentA.id,
        quizId: sqlQuiz.id,
        score: 72,
        submittedAt: new Date(),
      },
      {
        userId: studentB.id,
        quizId: nextQuiz.id,
        score: 91,
        submittedAt: new Date(),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: studentA.id,
        type: "LESSON",
        message: "New lesson available: Server Components and Routing",
      },
      {
        userId: studentA.id,
        type: "GRADE",
        message: "Your grade for Next.js Basics Quiz is now available.",
      },
      {
        userId: studentB.id,
        type: "ENROLLMENT",
        message: "You were enrolled in Next.js Fundamentals.",
      },
      {
        userId: teacher.id,
        type: "ENROLLMENT",
        message: "A new student joined your course: Next.js Fundamentals.",
      },
      {
        userId: admin.id,
        type: "SYSTEM",
        message: "Initial LMS seed completed successfully.",
      },
    ],
  });

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

  console.log("Seed completed");
  console.log({
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
  });
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
