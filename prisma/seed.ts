import "dotenv/config";

import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import {
  PrismaClient,
  QuestionType,
  RequestStatus,
  UserRole,
} from "@prisma/client";

import argon2 from "argon2";

import {
  MATERIAL_KINDS,
  resetMaterialsDir,
  writeMaterial,
} from "./seed-assets";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/* -------------------------------------------------------------------------- */
/*  Deterministic randomness                                                   */
/* -------------------------------------------------------------------------- */

// mulberry32 — same seed always produces the same database, so screenshots,
// demos and manual QA stay reproducible across re-seeds.
function makeRng(seed: number) {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(20260730);

const randInt = (min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => rng() * (max - min) + min;
const chance = (probability: number) => rng() < probability;
const pick = <T>(items: readonly T[]): T => items[randInt(0, items.length - 1)]!;

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }

  return copy;
}

/* -------------------------------------------------------------------------- */
/*  Time helpers                                                               */
/* -------------------------------------------------------------------------- */

const DAY_MS = 86_400_000;
const NOW = new Date();
const PLATFORM_START = new Date(NOW.getTime() - 240 * DAY_MS);

const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);
// Follow-up events (reads, reviews, regrades) must never land in the future,
// even when the event they follow happened a few hours ago.
const notInFuture = (date: Date) => (date > NOW ? NOW : date);
const minutesAfter = (date: Date, minutes: number) =>
  notInFuture(new Date(date.getTime() + minutes * 60_000));
const hoursAfter = (date: Date, hours: number) =>
  notInFuture(new Date(date.getTime() + hours * 3_600_000));
const daysAfter = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);
const latest = (...dates: Date[]) =>
  new Date(Math.max(...dates.map((d) => d.getTime())));
const dateBetween = (from: Date, to: Date) => {
  const start = from.getTime();
  const end = Math.max(to.getTime(), start);

  return new Date(start + rng() * (end - start));
};

/* -------------------------------------------------------------------------- */
/*  People                                                                     */
/* -------------------------------------------------------------------------- */

const DEFAULT_PASSWORD = "changeme123";
const EMAIL_DOMAIN = "lms.local";

const FIRST_NAMES = [
  "Ava", "Noah", "Mia", "Liam", "Emma", "Ethan", "Olivia", "Lucas",
  "Sophia", "Mason", "Isabella", "Logan", "Amelia", "James", "Harper",
  "Benjamin", "Evelyn", "Henry", "Abigail", "Daniel", "Ella", "Samuel",
  "Grace", "Owen", "Chloe", "Jack", "Zoe", "Leo", "Nora", "Adam",
  "Lily", "Victor", "Ruby", "Oscar", "Hannah", "Felix", "Iris", "Theo",
  "Maya", "Caleb", "Nina", "Elias",
] as const;

const LAST_NAMES = [
  "Bennett", "Carter", "Dawson", "Ellis", "Fletcher", "Grant", "Hayes",
  "Ingram", "Jensen", "Keller", "Lawson", "Mercer", "Novak", "Osborne",
  "Palmer", "Quinn", "Reyes", "Sutton", "Turner", "Underwood", "Vance",
  "Whitaker", "Yates", "Zimmer", "Ashford", "Blake", "Cormac", "Delgado",
  "Everett", "Foster", "Gallagher", "Holloway", "Iverson", "Jarvis",
  "Kowalski", "Lindqvist", "Moreau", "Nakamura", "Okafor", "Petrov",
  "Rossi", "Sandoval",
] as const;

type PersonSeed = {
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: Date;
};

function buildPeople(): PersonSeed[] {
  const usedEmails = new Set<string>();
  const people: PersonSeed[] = [];

  const addPerson = (
    name: string,
    email: string,
    role: UserRole,
    createdAt: Date,
  ) => {
    if (usedEmails.has(email)) return;
    usedEmails.add(email);

    people.push({
      name,
      email,
      role,
      // Avatars are missing for some accounts on purpose — the UI must render
      // initials fallbacks too.
      image: chance(0.7) ? `https://i.pravatar.cc/240?u=${email}` : null,
      createdAt,
    });
  };

  // Stable demo accounts. Keep these emails — docs and manual QA rely on them.
  addPerson("Admin User", `admin@${EMAIL_DOMAIN}`, UserRole.ADMIN, PLATFORM_START);
  addPerson(
    "Ava Teacher",
    `teacher@${EMAIL_DOMAIN}`,
    UserRole.TEACHER,
    daysAfter(PLATFORM_START, 1),
  );
  addPerson(
    "Noah Student",
    `student1@${EMAIL_DOMAIN}`,
    UserRole.STUDENT,
    daysAfter(PLATFORM_START, 12),
  );
  addPerson(
    "Mia Student",
    `student2@${EMAIL_DOMAIN}`,
    UserRole.STUDENT,
    daysAfter(PLATFORM_START, 15),
  );

  const namePool = shuffled(
    FIRST_NAMES.flatMap((first) => LAST_NAMES.map((last) => `${first} ${last}`)),
  );
  let nameCursor = 0;
  const nextName = () => namePool[nameCursor++]!;

  const emailFor = (name: string) => {
    const [first, last] = name.toLowerCase().split(" ");
    const base = `${first}.${last}`;
    let email = `${base}@${EMAIL_DOMAIN}`;
    let suffix = 2;

    while (usedEmails.has(email)) {
      email = `${base}${suffix++}@${EMAIL_DOMAIN}`;
    }

    return email;
  };

  // A second admin so the admin dashboard is not a single-row table.
  const secondAdmin = nextName();
  addPerson(
    secondAdmin,
    emailFor(secondAdmin),
    UserRole.ADMIN,
    daysAfter(PLATFORM_START, 4),
  );

  // Teachers join early — they need courses before students arrive.
  for (let i = 0; i < 5; i++) {
    const name = nextName();
    addPerson(
      name,
      emailFor(name),
      UserRole.TEACHER,
      dateBetween(PLATFORM_START, daysAgo(200)),
    );
  }

  // Students trickle in over the whole platform lifetime.
  for (let i = 0; i < 34; i++) {
    const name = nextName();
    addPerson(
      name,
      emailFor(name),
      UserRole.STUDENT,
      dateBetween(daysAfter(PLATFORM_START, 10), daysAgo(3)),
    );
  }

  return people;
}

/* -------------------------------------------------------------------------- */
/*  Course catalogue                                                           */
/* -------------------------------------------------------------------------- */

type QuestionSeed = {
  text: string;
  type: QuestionType;
  points: number;
  answers: [text: string, isCorrect: boolean][];
};

type QuizSeed = {
  title: string;
  lessonIndex: number;
  timeLimit: number | null;
  passingScore: number;
  isPublished: boolean;
  questions: QuestionSeed[];
};

type LessonSeed = {
  title: string;
  description: string;
  isPublished?: boolean;
};

type CourseSeed = {
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  isPublished: boolean;
  lessons: LessonSeed[];
  quizzes: QuizSeed[];
};

const mc = (
  text: string,
  points: number,
  answers: [string, boolean][],
): QuestionSeed => ({
  text,
  type: QuestionType.MULTIPLE_CHOICE,
  points,
  answers,
});

const tf = (text: string, points: number, isTrue: boolean): QuestionSeed => ({
  text,
  type: QuestionType.BOOLEAN,
  points,
  answers: [
    ["True", isTrue],
    ["False", !isTrue],
  ],
});

const COURSES: CourseSeed[] = [
  {
    title: "Next.js Fundamentals",
    description:
      "Build production-ready web apps with the App Router, server components and modern React data patterns.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    isPublished: true,
    lessons: [
      {
        title: "Introduction to the App Router",
        description:
          "Understand layouts, pages and nested route segments in Next.js.",
      },
      {
        title: "Server Components and Client Components",
        description:
          "Decide what runs on the server, what ships to the browser, and why the boundary matters.",
      },
      {
        title: "Data Fetching and Caching",
        description:
          "Fetch on the server, tag your cache entries and revalidate them without a full rebuild.",
      },
      {
        title: "Server Actions and Mutations",
        description:
          "Handle forms and mutations without hand-rolling API routes.",
      },
      {
        title: "Authentication with NextAuth",
        description:
          "Wire up sessions, protected routes and role-aware navigation.",
      },
      {
        title: "Deploying to Production",
        description:
          "Environment variables, build output modes and runtime selection.",
      },
    ],
    quizzes: [
      {
        title: "Next.js Basics Quiz",
        lessonIndex: 0,
        timeLimit: 20,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("Which file defines the UI for a route segment in the App Router?", 2, [
            ["route.ts", false],
            ["page.tsx", true],
            ["index.tsx", false],
            ["app.tsx", false],
          ]),
          mc("What is the purpose of layout.tsx?", 2, [
            ["It replaces the page on every navigation", false],
            ["It wraps child segments and preserves state across navigation", true],
            ["It configures the build output", false],
            ["It defines API endpoints", false],
          ]),
          tf("Server Components can query the database directly.", 1, true),
          tf("Every component in the App Router is a Client Component by default.", 1, false),
          mc("Which directive marks a Client Component?", 1, [
            ['"use client"', true],
            ['"use server"', false],
            ['"client only"', false],
            ["export const client = true", false],
          ]),
        ],
      },
      {
        title: "Data Fetching and Caching Quiz",
        lessonIndex: 2,
        timeLimit: 15,
        passingScore: 75,
        isPublished: true,
        questions: [
          mc("Which API invalidates a tagged cache entry?", 2, [
            ["revalidateTag", true],
            ["refreshCache", false],
            ["invalidatePath", false],
            ["resetRouter", false],
          ]),
          mc("Where should secrets used during data fetching live?", 2, [
            ["In NEXT_PUBLIC_ environment variables", false],
            ["In server-only environment variables", true],
            ["In localStorage", false],
            ["Hardcoded in the component", false],
          ]),
          tf("A fetch inside a Server Component runs in the browser.", 1, false),
          tf("Streaming lets you send parts of a page before all data is ready.", 1, true),
        ],
      },
    ],
  },
  {
    title: "Practical PostgreSQL",
    description:
      "Relational modelling, indexing, transactions and query optimisation with hands-on examples.",
    category: "Databases",
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d",
    isPublished: true,
    lessons: [
      {
        title: "Relational Modelling Basics",
        description: "Normalisation, keys and when denormalising is the right call.",
      },
      {
        title: "SQL Joins in Practice",
        description: "Inner, left, right and full joins on realistic datasets.",
      },
      {
        title: "Indexes and Query Plans",
        description: "Read EXPLAIN ANALYZE output and pick the right index type.",
      },
      {
        title: "Transactions and Isolation Levels",
        description: "ACID guarantees, locking and how anomalies actually appear.",
      },
      {
        title: "Migrations and Schema Evolution",
        description: "Ship schema changes without downtime.",
      },
    ],
    quizzes: [
      {
        title: "PostgreSQL Essentials Quiz",
        lessonIndex: 2,
        timeLimit: 15,
        passingScore: 75,
        isPublished: true,
        questions: [
          mc("What is the main purpose of an index?", 2, [
            ["Encrypt table data", false],
            ["Speed up row lookups", true],
            ["Compress large rows", false],
            ["Duplicate table records", false],
          ]),
          mc("Which command shows the planner's chosen strategy?", 2, [
            ["DESCRIBE", false],
            ["EXPLAIN ANALYZE", true],
            ["SHOW PLAN", false],
            ["ANALYZE TABLE", false],
          ]),
          mc("A LEFT JOIN returns:", 2, [
            ["Only matching rows from both tables", false],
            ["All rows from the left table plus matches from the right", true],
            ["All rows from both tables", false],
            ["Only rows missing on the right", false],
          ]),
          tf("Every index makes writes cheaper.", 1, false),
          tf("The default isolation level in PostgreSQL is READ COMMITTED.", 1, true),
        ],
      },
    ],
  },
  {
    title: "TypeScript in Depth",
    description:
      "Move past annotations: generics, conditional types and type-level modelling of real domains.",
    category: "Programming",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea",
    isPublished: true,
    lessons: [
      {
        title: "The Structural Type System",
        description: "Why TypeScript compares shapes, not names.",
      },
      {
        title: "Generics That Earn Their Keep",
        description: "Constraints, inference and when a generic is overkill.",
      },
      {
        title: "Union and Discriminated Types",
        description: "Model state machines so impossible states do not compile.",
      },
      {
        title: "Conditional and Mapped Types",
        description: "Transform types programmatically without losing readability.",
      },
      {
        title: "Runtime Validation with Zod",
        description: "Bridge the gap between compile-time types and untrusted input.",
      },
      {
        title: "Strict Mode Migration",
        description: "Turn on strict flags in an existing codebase incrementally.",
        isPublished: false,
      },
    ],
    quizzes: [
      {
        title: "TypeScript Type System Quiz",
        lessonIndex: 1,
        timeLimit: 25,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("What does the `unknown` type mean?", 2, [
            ["Any value, usable without narrowing", false],
            ["Any value, but it must be narrowed before use", true],
            ["A value that is always undefined", false],
            ["An alias for `any`", false],
          ]),
          mc("Which keyword constrains a generic parameter?", 1, [
            ["extends", true],
            ["implements", false],
            ["satisfies", false],
            ["infer", false],
          ]),
          mc("A discriminated union is narrowed by:", 2, [
            ["A shared literal property", true],
            ["The order of the union members", false],
            ["A class inheritance chain", false],
            ["Type assertions only", false],
          ]),
          tf("TypeScript types exist at runtime.", 1, false),
          tf("`satisfies` checks a value against a type without widening it.", 1, true),
        ],
      },
    ],
  },
  {
    title: "React Performance Engineering",
    description:
      "Profile real applications, kill wasted renders and keep interactions under the frame budget.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
    isPublished: true,
    lessons: [
      {
        title: "How React Renders",
        description: "Reconciliation, commit phases and what triggers re-renders.",
      },
      {
        title: "Profiling with React DevTools",
        description: "Find the component that is actually costing you frames.",
      },
      {
        title: "Memoisation and the React Compiler",
        description: "When memo, useMemo and useCallback still matter.",
      },
      {
        title: "List Virtualisation",
        description: "Render ten thousand rows without freezing the tab.",
      },
      {
        title: "Bundle Size and Code Splitting",
        description: "Ship less JavaScript with dynamic imports and route splitting.",
      },
    ],
    quizzes: [
      {
        title: "Rendering and Profiling Quiz",
        lessonIndex: 1,
        timeLimit: 20,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("What causes a component to re-render?", 2, [
            ["A state or prop change, or a parent re-render", true],
            ["Any DOM event anywhere on the page", false],
            ["Only a state change", false],
            ["Scrolling the window", false],
          ]),
          mc("What does React.memo do?", 2, [
            ["Caches fetch responses", false],
            ["Skips re-rendering when props are shallow-equal", true],
            ["Freezes component state", false],
            ["Defers the component to the server", false],
          ]),
          tf("Virtualisation reduces the number of mounted DOM nodes.", 1, true),
          tf("useCallback makes a function run faster.", 1, false),
        ],
      },
    ],
  },
  {
    title: "REST and GraphQL API Design",
    description:
      "Design APIs that survive contact with real clients: versioning, pagination, errors and auth.",
    category: "Backend",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
    isPublished: true,
    lessons: [
      {
        title: "Resources, Verbs and Status Codes",
        description: "Get the HTTP fundamentals right before adding anything clever.",
      },
      {
        title: "Pagination, Filtering and Sorting",
        description: "Cursor vs offset pagination and their failure modes.",
      },
      {
        title: "Error Contracts",
        description: "Machine-readable errors clients can actually branch on.",
      },
      {
        title: "GraphQL Schema Design",
        description: "Types, resolvers and avoiding the N+1 trap.",
      },
      {
        title: "Authentication and Rate Limiting",
        description: "Tokens, scopes and protecting expensive endpoints.",
      },
      {
        title: "Versioning and Deprecation",
        description: "Evolve a public API without breaking existing clients.",
      },
    ],
    quizzes: [
      {
        title: "HTTP and REST Quiz",
        lessonIndex: 0,
        timeLimit: 15,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("Which status code means the request succeeded and created a resource?", 2, [
            ["200", false],
            ["201", true],
            ["204", false],
            ["302", false],
          ]),
          mc("Which HTTP method is expected to be idempotent?", 2, [
            ["POST", false],
            ["PUT", true],
            ["PATCH", false],
            ["CONNECT", false],
          ]),
          mc("Cursor pagination is preferred over offset because:", 2, [
            ["It is easier to implement", false],
            ["It stays stable while rows are inserted", true],
            ["It always returns fewer rows", false],
            ["It removes the need for indexes", false],
          ]),
          tf("A 401 means the server understood the request but refuses to authorise it for the current user.", 1, false),
          tf("The N+1 problem can appear in GraphQL resolvers.", 1, true),
        ],
      },
    ],
  },
  {
    title: "Docker for Developers",
    description:
      "Containerise real services, keep images small and run a full stack locally with Compose.",
    category: "DevOps",
    thumbnail: "https://images.unsplash.com/photo-1605745341112-85968b19335b",
    isPublished: true,
    lessons: [
      {
        title: "Images, Layers and Containers",
        description: "The mental model everything else builds on.",
      },
      {
        title: "Writing a Good Dockerfile",
        description: "Layer caching, multi-stage builds and slim base images.",
      },
      {
        title: "Volumes and Networking",
        description: "Persist data and let containers talk to each other.",
      },
      {
        title: "Docker Compose for Local Stacks",
        description: "Run app, database and cache with one command.",
      },
    ],
    quizzes: [
      {
        title: "Docker Fundamentals Quiz",
        lessonIndex: 1,
        timeLimit: 15,
        passingScore: 65,
        isPublished: true,
        questions: [
          mc("What is a Docker image?", 2, [
            ["A running process with its own namespace", false],
            ["An immutable, layered filesystem template", true],
            ["A virtual machine snapshot", false],
            ["A network bridge definition", false],
          ]),
          mc("Why use a multi-stage build?", 2, [
            ["To run several containers at once", false],
            ["To keep build tooling out of the final image", true],
            ["To skip the build cache", false],
            ["To support multiple architectures automatically", false],
          ]),
          tf("Data written inside a container survives its removal by default.", 1, false),
          tf("Reordering Dockerfile instructions can change cache hit rates.", 1, true),
        ],
      },
    ],
  },
  {
    title: "Git and Team Workflows",
    description:
      "Branching strategies, review etiquette and recovering from the commits you regret.",
    category: "Engineering Practices",
    thumbnail: "https://images.unsplash.com/photo-1556075798-4825dfaaf498",
    isPublished: true,
    lessons: [
      {
        title: "Commits, Branches and the Object Model",
        description: "What Git actually stores and why that makes it fast.",
      },
      {
        title: "Merge vs Rebase",
        description: "Pick a history style and apply it consistently.",
      },
      {
        title: "Pull Requests That Get Reviewed",
        description: "Small diffs, clear descriptions and useful commit messages.",
      },
      {
        title: "Undoing Mistakes",
        description: "revert, reset, reflog and the difference between them.",
      },
      {
        title: "Release Branches and Tags",
        description: "Cut, patch and ship a release.",
      },
    ],
    quizzes: [
      {
        title: "Git Workflow Quiz",
        lessonIndex: 3,
        timeLimit: 10,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("Which command creates a new commit that undoes an earlier one?", 2, [
            ["git reset --hard", false],
            ["git revert", true],
            ["git checkout --", false],
            ["git clean -fd", false],
          ]),
          mc("What does git reflog help you recover?", 2, [
            ["Deleted remote branches on the server", false],
            ["Commits no longer reachable from any branch", true],
            ["Uncommitted working tree changes", false],
            ["Stashed merge conflicts", false],
          ]),
          tf("Rebasing rewrites commit hashes.", 1, true),
          tf("A merge commit can have more than one parent.", 1, true),
        ],
      },
    ],
  },
  {
    title: "Introduction to Machine Learning with Python",
    description:
      "Supervised learning end to end: features, models, evaluation and the traps in between.",
    category: "Data Science",
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    // Draft course — the teacher dashboard needs an unpublished row to render.
    isPublished: false,
    lessons: [
      {
        title: "What Machine Learning Can and Cannot Do",
        description: "Framing a problem before touching a model.",
        isPublished: false,
      },
      {
        title: "Working with NumPy and pandas",
        description: "Load, clean and reshape a dataset.",
        isPublished: false,
      },
      {
        title: "Regression and Classification",
        description: "Your first models with scikit-learn.",
        isPublished: false,
      },
      {
        title: "Evaluating Models Honestly",
        description: "Train/test splits, cross-validation and leakage.",
        isPublished: false,
      },
    ],
    quizzes: [],
  },
];

// Real videos, uploaded to this project's Cloudinary account from `assets/`.
// The player derives its poster by swapping the extension for .jpg, which
// Cloudinary serves automatically for video assets.
const SEED_VIDEOS = [
  "https://res.cloudinary.com/dkorgjcec/video/upload/lms/seed/blue.mp4",
  "https://res.cloudinary.com/dkorgjcec/video/upload/lms/seed/blue2.mp4",
  "https://res.cloudinary.com/dkorgjcec/video/upload/lms/seed/pink.mp4",
] as const;

// Lesson materials are written to disk during the seed, so every attachment
// row points at a file that really exists and really has that size.
const MATERIALS_PUBLIC_PATH = "/files";
const MATERIALS_DIR = path.resolve(process.cwd(), "public", "files");

/* -------------------------------------------------------------------------- */
/*  Notifications                                                              */
/* -------------------------------------------------------------------------- */

const NOTIFICATION_TYPES = {
  LESSON: "LESSON",
  GRADE: "GRADE",
  ENROLLMENT: "ENROLLMENT",
  SYSTEM: "SYSTEM",
} as const;

type NotificationSeed = {
  userId: string;
  type: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
};

/* -------------------------------------------------------------------------- */
/*  Seed steps                                                                 */
/* -------------------------------------------------------------------------- */

async function clearDatabase() {
  // Ordered child-first so the deletes work even where cascade is not declared.
  await prisma.$transaction([
    prisma.attemptAnswer.deleteMany(),
    prisma.quizOverride.deleteMany(),
    prisma.quizAttempt.deleteMany(),
    prisma.answer.deleteMany(),
    prisma.question.deleteMany(),
    prisma.quiz.deleteMany(),
    prisma.lessonProgress.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.course.deleteMany(),
    prisma.roleRequest.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.systemSetting.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function seedUsers(passwordHash: string) {
  const people = buildPeople();

  const users = await prisma.user.createManyAndReturn({
    data: people.map((person) => ({
      name: person.name,
      email: person.email,
      password: passwordHash,
      role: person.role,
      image: person.image,
      createdAt: person.createdAt,
      updatedAt: person.createdAt,
    })),
  });

  return {
    all: users,
    admins: users.filter((user) => user.role === UserRole.ADMIN),
    teachers: users.filter((user) => user.role === UserRole.TEACHER),
    students: users.filter((user) => user.role === UserRole.STUDENT),
  };
}

type CreatedQuiz = {
  id: string;
  title: string;
  passingScore: number;
  timeLimit: number | null;
  lessonId: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  questions: {
    id: string;
    points: number;
    answers: { id: string; isCorrect: boolean }[];
  }[];
};

type CreatedLesson = {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: Date;
};

type CreatedCourse = {
  id: string;
  title: string;
  isPublished: boolean;
  teacherId: string;
  createdAt: Date;
  lessons: CreatedLesson[];
};

async function seedCatalogue(teacherIds: string[]) {
  const courses: CreatedCourse[] = [];
  const quizzes: CreatedQuiz[] = [];
  const attachments: {
    name: string;
    url: string;
    size: number;
    lessonId: string;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];

  // Stale files from a previous run would otherwise linger in public/.
  resetMaterialsDir(MATERIALS_DIR);
  let lessonCounter = 0;

  for (const [index, seed] of COURSES.entries()) {
    const teacherId = teacherIds[index % teacherIds.length]!;
    const courseCreatedAt = dateBetween(
      PLATFORM_START,
      daysAgo(index < 4 ? 150 : 60),
    );

    const course = await prisma.course.create({
      data: {
        title: seed.title,
        description: seed.description,
        category: seed.category,
        thumbnail: seed.thumbnail,
        isPublished: seed.isPublished,
        teacherId,
        createdAt: courseCreatedAt,
        updatedAt: daysAfter(courseCreatedAt, randInt(1, 20)),
      },
    });

    const createdLessons: CreatedLesson[] = [];

    for (const [position, lessonSeed] of seed.lessons.entries()) {
      const lessonCreatedAt = daysAfter(courseCreatedAt, position * randInt(2, 6));
      const isPublished = lessonSeed.isPublished ?? seed.isPublished;

      const lesson = await prisma.lesson.create({
        data: {
          title: lessonSeed.title,
          description: lessonSeed.description,
          // Rotate through the uploaded clips so every lesson has a video that
          // actually plays.
          videoUrl: SEED_VIDEOS[lessonCounter++ % SEED_VIDEOS.length]!,
          position: position + 1,
          isPublished,
          courseId: course.id,
          createdAt: lessonCreatedAt,
          updatedAt: daysAfter(lessonCreatedAt, randInt(0, 5)),
        },
      });

      createdLessons.push({
        id: lesson.id,
        title: lesson.title,
        isPublished,
        createdAt: lessonCreatedAt,
      });

      for (const kind of shuffled(MATERIAL_KINDS).slice(0, randInt(0, 2))) {
        const material = writeMaterial(MATERIALS_DIR, kind, {
          courseTitle: seed.title,
          courseCategory: seed.category,
          lessonTitle: lessonSeed.title,
          lessonDescription: lessonSeed.description,
          lessonNumber: position + 1,
          createdAt: lessonCreatedAt,
        });

        attachments.push({
          name: material.name,
          url: `${MATERIALS_PUBLIC_PATH}/${material.fileName}`,
          size: material.size,
          lessonId: lesson.id,
          createdAt: lessonCreatedAt,
          updatedAt: lessonCreatedAt,
        });
      }
    }

    for (const quizSeed of seed.quizzes) {
      const lesson = createdLessons[quizSeed.lessonIndex];
      if (!lesson) continue;

      const quiz = await prisma.quiz.create({
        data: {
          title: quizSeed.title,
          lessonId: lesson.id,
          timeLimit: quizSeed.timeLimit,
          passingScore: quizSeed.passingScore,
          isPublished: quizSeed.isPublished,
          createdAt: lesson.createdAt,
          updatedAt: lesson.createdAt,
          questions: {
            create: quizSeed.questions.map((question, questionIndex) => ({
              text: question.text,
              type: question.type,
              points: question.points,
              position: questionIndex + 1,
              createdAt: lesson.createdAt,
              updatedAt: lesson.createdAt,
              answers: {
                create: question.answers.map(([text, isCorrect]) => ({
                  text,
                  isCorrect,
                  createdAt: lesson.createdAt,
                  updatedAt: lesson.createdAt,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { answers: true },
          },
        },
      });

      quizzes.push({
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        lessonId: lesson.id,
        courseId: course.id,
        courseTitle: course.title,
        teacherId,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          points: question.points,
          answers: question.answers.map((answer) => ({
            id: answer.id,
            isCorrect: answer.isCorrect,
          })),
        })),
      });
    }

    courses.push({
      id: course.id,
      title: course.title,
      isPublished: seed.isPublished,
      teacherId,
      createdAt: courseCreatedAt,
      lessons: createdLessons,
    });
  }

  if (attachments.length > 0) {
    await prisma.attachment.createMany({ data: attachments });
  }

  return { courses, quizzes };
}

type StudentUser = { id: string; name: string | null; createdAt: Date };

async function seedLearningActivity(
  students: StudentUser[],
  courses: CreatedCourse[],
  quizzes: CreatedQuiz[],
) {
  const publishedCourses = courses.filter((course) => course.isPublished);
  const quizzesByLesson = new Map<string, CreatedQuiz[]>();

  for (const quiz of quizzes) {
    const bucket = quizzesByLesson.get(quiz.lessonId) ?? [];
    bucket.push(quiz);
    quizzesByLesson.set(quiz.lessonId, bucket);
  }

  const notifications: NotificationSeed[] = [];
  const gradedAttempts: {
    id: string;
    userId: string;
    studentName: string;
    quiz: CreatedQuiz;
    score: number;
    passed: boolean;
    submittedAt: Date;
  }[] = [];

  let inProgressAttemptUsed = false;

  for (const student of students) {
    // Per-student skill level drives quiz outcomes, so the gradebook shows a
    // believable spread instead of everyone scoring the same.
    const ability = randFloat(0.42, 0.95);
    const diligence = randFloat(0.2, 1);

    const candidates = publishedCourses.filter(
      (course) => course.createdAt < NOW && student.createdAt < NOW,
    );
    const chosen = shuffled(candidates).slice(0, randInt(1, 4));

    for (const course of chosen) {
      const enrolledAt = dateBetween(
        latest(course.createdAt, student.createdAt),
        daysAgo(1),
      );

      await prisma.enrollment.create({
        data: {
          userId: student.id,
          courseId: course.id,
          createdAt: enrolledAt,
        },
      });

      notifications.push({
        userId: student.id,
        type: NOTIFICATION_TYPES.ENROLLMENT,
        message: `You were enrolled in ${course.title}.`,
        readAt: chance(0.7) ? hoursAfter(enrolledAt, randInt(1, 40)) : null,
        createdAt: enrolledAt,
      });

      if (chance(0.35)) {
        notifications.push({
          userId: course.teacherId,
          type: NOTIFICATION_TYPES.ENROLLMENT,
          message: `${student.name ?? "A student"} joined your course: ${course.title}.`,
          readAt: chance(0.5) ? hoursAfter(enrolledAt, randInt(2, 72)) : null,
          createdAt: enrolledAt,
        });
      }

      const publishedLessons = course.lessons.filter(
        (lesson) => lesson.isPublished,
      );

      // Students work through lessons in order, so completion is a prefix of
      // the lesson list rather than a random scatter.
      const completedCount = Math.round(publishedLessons.length * diligence);
      let cursor = enrolledAt;

      for (const [index, lesson] of publishedLessons.entries()) {
        if (index > completedCount) break;

        const isCompleted = index < completedCount;
        cursor = dateBetween(cursor, daysAfter(cursor, randInt(1, 9)));
        const touchedAt = cursor > NOW ? daysAgo(randInt(1, 5)) : cursor;

        await prisma.lessonProgress.create({
          data: {
            userId: student.id,
            lessonId: lesson.id,
            isCompleted,
            completedAt: isCompleted ? touchedAt : null,
            createdAt: touchedAt,
            updatedAt: touchedAt,
          },
        });

        if (!isCompleted) continue;

        for (const quiz of quizzesByLesson.get(lesson.id) ?? []) {
          const maxAttempts = randInt(1, 3);

          for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
            // Retakes are informed by the previous try.
            const accuracy = Math.min(0.98, ability + attemptIndex * 0.12);
            const startedAt = dateBetween(
              touchedAt,
              daysAfter(touchedAt, randInt(1, 4)),
            );

            // Exactly one attempt is left unsubmitted so the "in progress"
            // state is represented in the data.
            const leaveInProgress =
              !inProgressAttemptUsed &&
              attemptIndex === maxAttempts - 1 &&
              chance(0.04);

            if (leaveInProgress) {
              inProgressAttemptUsed = true;

              await prisma.quizAttempt.create({
                data: {
                  userId: student.id,
                  quizId: quiz.id,
                  score: 0,
                  passed: false,
                  startedAt: daysAgo(randInt(0, 1)),
                  submittedAt: null,
                  createdAt: daysAgo(randInt(0, 1)),
                  updatedAt: daysAgo(0),
                },
              });

              break;
            }

            const totalPoints = quiz.questions.reduce(
              (sum, question) => sum + question.points,
              0,
            );
            let earnedPoints = 0;

            const picks = quiz.questions.map((question) => {
              const correct = question.answers.filter(
                (answer) => answer.isCorrect,
              );
              const wrong = question.answers.filter(
                (answer) => !answer.isCorrect,
              );
              const goesRight = chance(accuracy) || wrong.length === 0;
              const chosenAnswer = goesRight ? pick(correct) : pick(wrong);

              if (chosenAnswer.isCorrect) earnedPoints += question.points;

              return { questionId: question.id, answerId: chosenAnswer.id };
            });

            const score =
              totalPoints === 0
                ? 0
                : Math.round((earnedPoints / totalPoints) * 100);
            const passed = score >= quiz.passingScore;
            const submittedAt = minutesAfter(
              startedAt,
              randInt(3, quiz.timeLimit ?? 25),
            );

            const attempt = await prisma.quizAttempt.create({
              data: {
                userId: student.id,
                quizId: quiz.id,
                score,
                passed,
                startedAt,
                submittedAt,
                createdAt: startedAt,
                updatedAt: submittedAt,
              },
            });

            await prisma.attemptAnswer.createMany({
              data: picks.map((choice) => ({
                attemptId: attempt.id,
                questionId: choice.questionId,
                answerId: choice.answerId,
                createdAt: submittedAt,
                updatedAt: submittedAt,
              })),
            });

            gradedAttempts.push({
              id: attempt.id,
              userId: student.id,
              studentName: student.name ?? "A student",
              quiz,
              score,
              passed,
              submittedAt,
            });

            if (chance(0.4)) {
              notifications.push({
                userId: student.id,
                type: NOTIFICATION_TYPES.GRADE,
                message: `Your score for ${quiz.title} is ${score}% (${passed ? "passed" : "not passed"}).`,
                readAt: chance(0.6)
                  ? hoursAfter(submittedAt, randInt(1, 30))
                  : null,
                createdAt: submittedAt,
              });
            }

            if (passed) break;
          }
        }
      }
    }
  }

  return { notifications, gradedAttempts };
}

async function seedOverrides(
  gradedAttempts: Awaited<
    ReturnType<typeof seedLearningActivity>
  >["gradedAttempts"],
  adminId: string,
) {
  const OVERRIDE_REASONS = [
    "Question 3 was ambiguous; regraded after review.",
    "Student reported a timer glitch during the attempt, verified in the logs.",
    "Answer key contained a typo — corrected and rescored.",
    "Manual regrade after an appeal from the student.",
    "Partial credit granted for a valid alternative approach.",
  ];

  const failed = gradedAttempts.filter((attempt) => !attempt.passed);
  const targets = shuffled(failed).slice(0, Math.min(5, failed.length));
  const notifications: NotificationSeed[] = [];

  for (const attempt of targets) {
    const newScore = Math.min(
      100,
      attempt.quiz.passingScore + randInt(0, 12),
    );
    const createdAt = hoursAfter(attempt.submittedAt, randInt(6, 96));
    const updatedByAdmin = chance(0.3);

    await prisma.quizOverride.create({
      data: {
        quizAttemptId: attempt.id,
        originalScore: attempt.score,
        newScore,
        reason: pick(OVERRIDE_REASONS),
        createdBy: attempt.quiz.teacherId,
        updatedBy: updatedByAdmin ? adminId : null,
        createdAt,
        updatedAt: updatedByAdmin ? hoursAfter(createdAt, randInt(1, 48)) : createdAt,
      },
    });

    // Deliberately no write-back to QuizAttempt.score / .passed — the app keeps
    // the auto-graded values and resolves the override at read time. Seeding it
    // any other way would hide bugs in that resolution.
    notifications.push({
      userId: attempt.userId,
      type: NOTIFICATION_TYPES.GRADE,
      message: `Your score for ${attempt.quiz.title} was updated to ${newScore}% after a teacher review.`,
      readAt: chance(0.5) ? hoursAfter(createdAt, randInt(1, 24)) : null,
      createdAt,
    });
  }

  return notifications;
}

async function seedRoleRequests(students: StudentUser[], adminId: string) {
  const REASONS = [
    "I run internal workshops at my company and would like to publish them here.",
    "I am a teaching assistant for the database course this semester.",
    "I want to upload the lecture series I recorded last year.",
    "I mentor a junior cohort and need to manage their lessons.",
    "I would like to co-teach the React performance course.",
  ];

  const applicants = shuffled(students).slice(0, 7);
  const notifications: NotificationSeed[] = [];

  for (const [index, applicant] of applicants.entries()) {
    // Mix of outcomes so the admin review queue has pending work plus history.
    const status =
      index < 3
        ? RequestStatus.PENDING
        : index < 5
          ? RequestStatus.APPROVED
          : RequestStatus.REJECTED;

    const createdAt = dateBetween(latest(applicant.createdAt, daysAgo(90)), daysAgo(2));
    const reviewedAt =
      status === RequestStatus.PENDING
        ? null
        : hoursAfter(createdAt, randInt(4, 120));

    await prisma.roleRequest.create({
      data: {
        userId: applicant.id,
        requestedRole: UserRole.TEACHER,
        status,
        reason: pick(REASONS),
        reviewedAt,
        reviewedBy: reviewedAt ? adminId : null,
        createdAt,
        updatedAt: reviewedAt ?? createdAt,
      },
    });

    if (status === RequestStatus.APPROVED && reviewedAt) {
      await prisma.user.update({
        where: { id: applicant.id },
        data: { role: UserRole.TEACHER, updatedAt: reviewedAt },
      });
    }

    if (reviewedAt) {
      notifications.push({
        userId: applicant.id,
        type: NOTIFICATION_TYPES.SYSTEM,
        message:
          status === RequestStatus.APPROVED
            ? "Your request for teacher access was approved."
            : "Your request for teacher access was declined.",
        readAt: chance(0.6) ? hoursAfter(reviewedAt, randInt(1, 48)) : null,
        createdAt: reviewedAt,
      });
    }
  }

  return notifications;
}

async function seedSystemSettings() {
  await prisma.systemSetting.createMany({
    data: [
      { key: "platformName", value: "Acme Learning Platform" },
      { key: "allowSelfRegistration", value: "true" },
      { key: "maintenanceMode", value: "false" },
    ],
  });
}

async function seedPasswordResetToken(email: string) {
  await prisma.passwordResetToken.create({
    data: {
      email,
      token: "seed-expired-reset-token-0001",
      // Already expired — exercises the "token no longer valid" path.
      expiresAt: daysAgo(1),
      createdAt: daysAgo(2),
    },
  });
}

async function seedAnnouncements(
  userIds: string[],
  courses: CreatedCourse[],
): Promise<NotificationSeed[]> {
  const notifications: NotificationSeed[] = [];

  const broadcastAt = daysAgo(randInt(3, 20));
  for (const userId of userIds) {
    notifications.push({
      userId,
      type: NOTIFICATION_TYPES.SYSTEM,
      message:
        "Scheduled maintenance this Saturday from 02:00 to 04:00 UTC. Live sessions will be unavailable.",
      readAt: chance(0.45) ? hoursAfter(broadcastAt, randInt(1, 72)) : null,
      createdAt: broadcastAt,
    });
  }

  // "New lesson" pings for the most recent published lessons.
  const recentLessons = courses
    .filter((course) => course.isPublished)
    .flatMap((course) =>
      course.lessons
        .filter((lesson) => lesson.isPublished)
        .map((lesson) => ({ course, lesson })),
    )
    .sort((a, b) => b.lesson.createdAt.getTime() - a.lesson.createdAt.getTime())
    .slice(0, 6);

  for (const { course, lesson } of recentLessons) {
    const enrolled = await prisma.enrollment.findMany({
      where: { courseId: course.id },
      select: { userId: true },
    });

    for (const enrollment of enrolled) {
      if (!chance(0.5)) continue;

      const createdAt = dateBetween(lesson.createdAt, daysAgo(1));

      notifications.push({
        userId: enrollment.userId,
        type: NOTIFICATION_TYPES.LESSON,
        message: `New lesson available in ${course.title}: ${lesson.title}`,
        readAt: chance(0.55) ? hoursAfter(createdAt, randInt(1, 60)) : null,
        createdAt,
      });
    }
  }

  return notifications;
}

async function getSeedCounts() {
  const [
    users,
    courses,
    lessons,
    attachments,
    quizzes,
    questions,
    answers,
    enrollments,
    lessonProgress,
    quizAttempts,
    attemptAnswers,
    quizOverrides,
    roleRequests,
    notifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.attachment.count(),
    prisma.quiz.count(),
    prisma.question.count(),
    prisma.answer.count(),
    prisma.enrollment.count(),
    prisma.lessonProgress.count(),
    prisma.quizAttempt.count(),
    prisma.attemptAnswer.count(),
    prisma.quizOverride.count(),
    prisma.roleRequest.count(),
    prisma.notification.count(),
  ]);

  return {
    users,
    courses,
    lessons,
    attachments,
    quizzes,
    questions,
    answers,
    enrollments,
    lessonProgress,
    quizAttempts,
    attemptAnswers,
    quizOverrides,
    roleRequests,
    notifications,
  };
}

/* -------------------------------------------------------------------------- */
/*  Entry point                                                                */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("Clearing database...");
  await clearDatabase();

  console.log("Hashing default password...");
  // Hashed once and reused — argon2 is deliberately slow.
  const passwordHash = await argon2.hash(DEFAULT_PASSWORD);

  console.log("Seeding users...");
  const users = await seedUsers(passwordHash);
  const primaryAdmin = users.admins[0]!;

  console.log("Seeding courses, lessons and quizzes...");
  const { courses, quizzes } = await seedCatalogue(
    users.teachers.map((teacher) => teacher.id),
  );

  console.log("Seeding enrollments, progress and quiz attempts...");
  const { notifications, gradedAttempts } = await seedLearningActivity(
    users.students,
    courses,
    quizzes,
  );

  console.log("Seeding grade overrides and role requests...");
  const overrideNotifications = await seedOverrides(
    gradedAttempts,
    primaryAdmin.id,
  );
  const roleRequestNotifications = await seedRoleRequests(
    users.students,
    primaryAdmin.id,
  );

  console.log("Seeding announcements and settings...");
  const announcements = await seedAnnouncements(
    users.all.map((user) => user.id),
    courses,
  );

  await prisma.notification.createMany({
    data: [
      ...notifications,
      ...overrideNotifications,
      ...roleRequestNotifications,
      ...announcements,
    ],
  });

  await seedSystemSettings();
  await seedPasswordResetToken(users.students[0]!.email);

  console.log("\nSeed completed");
  console.table(await getSeedCounts());
  console.log(`\nAll accounts share the password: ${DEFAULT_PASSWORD}`);
  console.log("Demo logins:");
  console.log(`  admin@${EMAIL_DOMAIN}    (ADMIN)`);
  console.log(`  teacher@${EMAIL_DOMAIN}  (TEACHER)`);
  console.log(`  student1@${EMAIL_DOMAIN} (STUDENT)`);
  console.log(`  student2@${EMAIL_DOMAIN} (STUDENT)`);
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
