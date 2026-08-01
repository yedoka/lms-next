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
const EMAIL_DOMAIN = "demo.local";

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
  {
    title: "Testing JavaScript Applications",
    description:
      "Unit, integration and end-to-end tests that catch real regressions instead of restating the implementation.",
    category: "Engineering Practices",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    isPublished: true,
    lessons: [
      {
        title: "What to Test and What to Skip",
        description:
          "Pick assertions by risk, not by coverage percentage.",
      },
      {
        title: "Unit Tests with Vitest",
        description: "Fast feedback loops, mocking and test doubles.",
      },
      {
        title: "Testing React Components",
        description:
          "Query by role, assert on behaviour and avoid implementation details.",
      },
      {
        title: "End-to-End Tests with Playwright",
        description: "Drive the real app and keep the suite stable.",
      },
      {
        title: "Tests in CI",
        description: "Parallelism, flake triage and useful failure output.",
      },
    ],
    quizzes: [
      {
        title: "Testing Foundations Quiz",
        lessonIndex: 1,
        timeLimit: 15,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("What makes a test brittle?", 2, [
            ["It asserts on user-visible behaviour", false],
            ["It couples to internal implementation details", true],
            ["It runs in under a second", false],
            ["It uses a real database", false],
          ]),
          mc("Why prefer queries by accessible role in component tests?", 2, [
            ["They are faster to execute", false],
            ["They survive refactors and check accessibility at once", true],
            ["They avoid the need for assertions", false],
            ["They disable React strict mode", false],
          ]),
          tf("100% line coverage proves the code is correct.", 1, false),
          tf("A flaky test is worse than no test if it is always ignored.", 1, true),
        ],
      },
      {
        title: "End-to-End Testing Quiz",
        lessonIndex: 3,
        timeLimit: 12,
        passingScore: 65,
        isPublished: true,
        questions: [
          mc("What is the main cost of end-to-end tests?", 2, [
            ["They cannot test authentication", false],
            ["They are slow and more prone to flake", true],
            ["They only run on Windows", false],
            ["They require a type checker", false],
          ]),
          mc("Which is the most reliable wait strategy?", 2, [
            ["A fixed sleep of two seconds", false],
            ["Waiting for a specific element or network state", true],
            ["Retrying the whole suite on failure", false],
            ["Disabling animations only", false],
          ]),
          tf("Every user flow deserves an end-to-end test.", 1, false),
        ],
      },
    ],
  },
  {
    title: "Modern CSS and Layout Systems",
    description:
      "Flexbox, Grid, container queries and a design-token workflow that scales past one page.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    isPublished: true,
    lessons: [
      {
        title: "The Box Model, Revisited",
        description: "Sizing, spacing and why margins collapse.",
      },
      {
        title: "Flexbox in Practice",
        description: "One-dimensional layouts and the alignment properties.",
      },
      {
        title: "CSS Grid",
        description: "Two-dimensional layouts, template areas and auto-fit.",
      },
      {
        title: "Responsive Without Breakpoint Soup",
        description: "clamp(), container queries and intrinsic sizing.",
      },
      {
        title: "Design Tokens and Theming",
        description: "Custom properties, colour schemes and dark mode.",
      },
      {
        title: "Animation and Motion",
        description: "Transitions, keyframes and respecting reduced motion.",
      },
    ],
    quizzes: [
      {
        title: "Layout Systems Quiz",
        lessonIndex: 2,
        timeLimit: 15,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("Which layout system is designed for two dimensions?", 2, [
            ["Flexbox", false],
            ["CSS Grid", true],
            ["Floats", false],
            ["Absolute positioning", false],
          ]),
          mc("What does `minmax(200px, 1fr)` express in a grid track?", 2, [
            ["A fixed 200px column", false],
            ["A column at least 200px wide that grows with free space", true],
            ["A column capped at 200px", false],
            ["A column that only applies on mobile", false],
          ]),
          tf("`gap` works in both Flexbox and Grid.", 1, true),
          tf("Container queries respond to the viewport size.", 1, false),
        ],
      },
    ],
  },
  {
    title: "Node.js Backend Fundamentals",
    description:
      "The event loop, streams, error handling and the shape of a service that survives production.",
    category: "Backend",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    isPublished: true,
    lessons: [
      {
        title: "The Event Loop and Async I/O",
        description: "Why a single thread can serve thousands of connections.",
      },
      {
        title: "Modules, Packages and the Toolchain",
        description: "ESM, CommonJS and dependency hygiene.",
      },
      {
        title: "Streams and Backpressure",
        description: "Process data larger than memory without falling over.",
      },
      {
        title: "Error Handling and Process Lifecycle",
        description: "Graceful shutdown, unhandled rejections and health checks.",
      },
      {
        title: "Logging, Metrics and Tracing",
        description: "Make production behaviour observable before you need it.",
      },
    ],
    quizzes: [
      {
        title: "Node Runtime Quiz",
        lessonIndex: 0,
        timeLimit: 15,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("What blocks the Node event loop?", 2, [
            ["An awaited database query", false],
            ["A long synchronous CPU-bound loop", true],
            ["A pending timer", false],
            ["An open socket", false],
          ]),
          mc("What problem does backpressure solve?", 2, [
            ["A producer overwhelming a slower consumer", true],
            ["Two servers sharing one port", false],
            ["Circular imports between modules", false],
            ["Expired TLS certificates", false],
          ]),
          tf("`process.exit()` waits for pending async work to finish.", 1, false),
          tf("Unhandled promise rejections terminate the process by default in modern Node.", 1, true),
        ],
      },
      {
        title: "Production Readiness Quiz",
        lessonIndex: 3,
        timeLimit: 10,
        passingScore: 60,
        isPublished: true,
        questions: [
          mc("What should a readiness probe report?", 2, [
            ["That the process is alive", false],
            ["That the instance can serve traffic, dependencies included", true],
            ["The current CPU temperature", false],
            ["The last deployment author", false],
          ]),
          tf("Graceful shutdown should stop accepting new connections before closing the ones in flight.", 1, true),
          tf("Logging full request bodies at info level is a good default.", 1, false),
        ],
      },
    ],
  },
  {
    title: "Data Structures and Algorithms",
    description:
      "Complexity analysis and the handful of structures that answer most interview and production questions.",
    category: "Programming",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
    isPublished: true,
    lessons: [
      {
        title: "Big-O Without the Hand-Waving",
        description: "Counting operations and comparing growth rates.",
      },
      {
        title: "Arrays, Lists and Hash Maps",
        description: "The trade-offs behind the everyday containers.",
      },
      {
        title: "Stacks, Queues and Heaps",
        description: "Order of access as a design decision.",
      },
      {
        title: "Trees and Graphs",
        description: "Traversals, BFS, DFS and where each one wins.",
      },
      {
        title: "Sorting and Searching",
        description: "Why the standard library sort is usually the right call.",
      },
      {
        title: "Dynamic Programming Basics",
        description: "Overlapping subproblems and memoisation.",
      },
    ],
    quizzes: [
      {
        title: "Complexity Quiz",
        lessonIndex: 0,
        timeLimit: 12,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("What is the average lookup cost of a hash map?", 2, [
            ["O(1)", true],
            ["O(log n)", false],
            ["O(n)", false],
            ["O(n log n)", false],
          ]),
          mc("Which traversal finds the shortest path in an unweighted graph?", 2, [
            ["Depth-first search", false],
            ["Breadth-first search", true],
            ["Post-order traversal", false],
            ["Topological sort", false],
          ]),
          tf("Binary search requires sorted input.", 1, true),
          tf("A heap keeps all of its elements fully sorted.", 1, false),
        ],
      },
      {
        title: "Structures in Practice Quiz",
        lessonIndex: 3,
        timeLimit: 15,
        passingScore: 65,
        isPublished: true,
        questions: [
          mc("Which structure fits an undo history best?", 2, [
            ["Queue", false],
            ["Stack", true],
            ["Min-heap", false],
            ["Hash set", false],
          ]),
          mc("What makes dynamic programming applicable?", 2, [
            ["The input is always numeric", false],
            ["Subproblems overlap and have optimal substructure", true],
            ["The problem is NP-complete", false],
            ["The recursion depth is shallow", false],
          ]),
          tf("Depth-first search can be written iteratively with an explicit stack.", 1, true),
        ],
      },
    ],
  },
  {
    title: "Kubernetes Essentials",
    description:
      "Pods, deployments, services and the config you actually need to ship a container to a cluster.",
    category: "DevOps",
    thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9",
    isPublished: true,
    lessons: [
      {
        title: "Why an Orchestrator",
        description: "The problems Kubernetes exists to solve.",
      },
      {
        title: "Pods, ReplicaSets and Deployments",
        description: "The workload objects and how rollouts happen.",
      },
      {
        title: "Services and Ingress",
        description: "Reaching your workloads from inside and outside the cluster.",
      },
      {
        title: "ConfigMaps, Secrets and Volumes",
        description: "Separating configuration from images.",
      },
      {
        title: "Resource Limits and Autoscaling",
        description: "Requests, limits and the horizontal pod autoscaler.",
      },
    ],
    quizzes: [
      {
        title: "Kubernetes Objects Quiz",
        lessonIndex: 1,
        timeLimit: 15,
        passingScore: 65,
        isPublished: true,
        questions: [
          mc("What does a Deployment manage?", 2, [
            ["Persistent volumes", false],
            ["ReplicaSets, and through them Pods", true],
            ["Cluster nodes", false],
            ["Ingress controllers", false],
          ]),
          mc("What is a Service for?", 2, [
            ["Building container images", false],
            ["A stable network endpoint in front of changing Pods", true],
            ["Storing secrets encrypted at rest", false],
            ["Scheduling cron jobs", false],
          ]),
          tf("Pods are meant to be long-lived and individually managed.", 1, false),
          tf("A container without a memory limit can be evicted under node pressure.", 1, true),
        ],
      },
    ],
  },
  {
    title: "Web Application Security",
    description:
      "The OWASP classics — how each attack works, and the defence that actually holds.",
    category: "Security",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
    isPublished: true,
    lessons: [
      {
        title: "Threat Modelling in Thirty Minutes",
        description: "Assets, entry points and what an attacker gains.",
      },
      {
        title: "Injection and Cross-Site Scripting",
        description: "Escaping, parameterisation and content security policy.",
      },
      {
        title: "Authentication and Session Handling",
        description: "Password storage, session fixation and MFA.",
      },
      {
        title: "Authorization Bugs",
        description: "Broken object-level access control and how to test for it.",
      },
      {
        title: "Dependencies and Supply Chain",
        description: "Lockfiles, advisories and update discipline.",
      },
    ],
    quizzes: [
      {
        title: "Web Security Quiz",
        lessonIndex: 1,
        timeLimit: 15,
        passingScore: 75,
        isPublished: true,
        questions: [
          mc("What prevents SQL injection most reliably?", 2, [
            ["Escaping quotes by hand", false],
            ["Parameterised queries", true],
            ["Rejecting requests over HTTP", false],
            ["Hiding error messages", false],
          ]),
          mc("Which storage is appropriate for user passwords?", 2, [
            ["Reversible encryption with a shared key", false],
            ["A slow salted hash such as argon2 or bcrypt", true],
            ["A fast hash such as MD5", false],
            ["Plain text behind a firewall", false],
          ]),
          tf("A Content Security Policy can limit the impact of a stored XSS bug.", 1, true),
          tf("Checking the user's role in the UI is enough to enforce authorization.", 1, false),
        ],
      },
      {
        title: "Access Control Quiz",
        lessonIndex: 3,
        timeLimit: 10,
        passingScore: 70,
        isPublished: true,
        questions: [
          mc("What is broken object-level authorization?", 2, [
            ["Serving an expired TLS certificate", false],
            ["Returning a record because it exists, without checking who asked", true],
            ["Logging a user out too early", false],
            ["Rate limiting anonymous requests", false],
          ]),
          tf("Server actions must re-check permissions even when the UI hides the button.", 1, true),
          tf("Sequential integer IDs are a vulnerability on their own.", 1, false),
        ],
      },
    ],
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
      daysAgo(index < 4 ? 180 : index < 9 ? 120 : 70),
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

type GradedAttempt = {
  id: string;
  userId: string;
  studentName: string;
  quiz: CreatedQuiz;
  score: number;
  passed: boolean;
  submittedAt: Date;
};

/**
 * One submitted attempt with its answer rows. `accuracy` is the per-question
 * probability of picking a correct answer, so the resulting score spread stays
 * believable instead of clustering at 100%.
 */
async function createGradedAttempt(
  student: StudentUser,
  quiz: CreatedQuiz,
  accuracy: number,
  startedAt: Date,
): Promise<GradedAttempt> {
  const totalPoints = quiz.questions.reduce(
    (sum, question) => sum + question.points,
    0,
  );
  let earnedPoints = 0;

  const picks = quiz.questions.map((question) => {
    const correct = question.answers.filter((answer) => answer.isCorrect);
    const wrong = question.answers.filter((answer) => !answer.isCorrect);
    const goesRight = chance(accuracy) || wrong.length === 0;
    const chosenAnswer = goesRight ? pick(correct) : pick(wrong);

    if (chosenAnswer.isCorrect) earnedPoints += question.points;

    return { questionId: question.id, answerId: chosenAnswer.id };
  });

  const score =
    totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const passed = score >= quiz.passingScore;
  const submittedAt = minutesAfter(startedAt, randInt(3, quiz.timeLimit ?? 25));

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

  return {
    id: attempt.id,
    userId: student.id,
    studentName: student.name ?? "A student",
    quiz,
    score,
    passed,
    submittedAt,
  };
}

/**
 * `count` timestamps, oldest first. Roughly a third land in the older history
 * and the rest are spread over the last 12 weeks with deliberately uneven
 * weekly volume — including one quiet week, because a flat chart reads as fake.
 */
function buildShowcaseDates(count: number): Date[] {
  const WEEK_WEIGHTS = [4, 6, 3, 7, 5, 1, 6, 4, 8, 5, 7, 4]; // oldest → newest
  const recentCount = Math.max(1, Math.round(count * 0.72));
  const olderCount = Math.max(0, count - recentCount);
  const weightSum = WEEK_WEIGHTS.reduce((sum, weight) => sum + weight, 0);

  const dates: Date[] = [];

  for (let i = 0; i < olderCount; i++) {
    dates.push(dateBetween(daysAgo(215), daysAgo(88)));
  }

  const inWeek = (weeksBack: number) =>
    notInFuture(
      new Date(
        daysAgo(weeksBack * 7 + randInt(0, 6)).getTime() +
          randInt(8, 21) * 3_600_000,
      ),
    );

  let placed = 0;

  for (const [index, weight] of WEEK_WEIGHTS.entries()) {
    const weeksBack = WEEK_WEIGHTS.length - 1 - index;
    const isLast = index === WEEK_WEIGHTS.length - 1;
    const target = isLast
      ? recentCount - placed
      : Math.round((recentCount * weight) / weightSum);

    for (let i = 0; i < target && placed < recentCount; i++) {
      dates.push(inWeek(weeksBack));
      placed++;
    }
  }

  while (placed < recentCount) {
    dates.push(inWeek(randInt(0, 3)));
    placed++;
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * student1@demo.local is the demo account, so it has to look like someone who
 * has used the platform for months: many enrollments, a long completion history
 * and enough recent work that the weekly activity chart has a shape.
 *
 * The generic per-student pass cannot produce that — it walks forward from the
 * enrollment date, which leaves the last 12 weeks almost empty for an account
 * that enrolled 200 days ago. Here the weekly volume is decided first and the
 * lesson completions are laid onto it, with quiz attempts following each
 * completion.
 */
async function seedShowcaseActivity(
  student: StudentUser,
  courses: CreatedCourse[],
  quizzes: CreatedQuiz[],
) {
  const quizzesByLesson = new Map<string, CreatedQuiz[]>();

  for (const quiz of quizzes) {
    const bucket = quizzesByLesson.get(quiz.lessonId) ?? [];
    bucket.push(quiz);
    quizzesByLesson.set(quiz.lessonId, bucket);
  }

  const ability = 0.82;
  const notifications: NotificationSeed[] = [];
  const gradedAttempts: GradedAttempt[] = [];

  const publishedCourses = courses.filter(
    (course) => course.isPublished && course.createdAt < daysAgo(20),
  );
  const enrolled = shuffled(publishedCourses).slice(
    0,
    Math.min(12, publishedCourses.length),
  );

  // Finished, half-done and barely-started courses side by side, so the
  // dashboard cards are not all at the same percentage.
  const COMPLETION_RATIOS = [
    1, 1, 1, 0.9, 0.85, 0.8, 0.75, 0.6, 0.5, 0.4, 0.3, 0.2,
  ];

  const queues = enrolled.map((course, index) => {
    const lessons = course.lessons.filter((lesson) => lesson.isPublished);
    const completedCount = Math.max(
      1,
      Math.round(lessons.length * (COMPLETION_RATIOS[index] ?? 0.3)),
    );

    return {
      course,
      completed: lessons.slice(0, completedCount),
      next: lessons[completedCount] ?? null,
    };
  });

  // Round-robin: several courses run in parallel, each one still in order.
  const timeline: { course: CreatedCourse; lesson: CreatedLesson }[] = [];

  for (let index = 0; ; index++) {
    let added = false;

    for (const queue of queues) {
      const lesson = queue.completed[index];
      if (!lesson) continue;

      timeline.push({ course: queue.course, lesson });
      added = true;
    }

    if (!added) break;
  }

  const dates = buildShowcaseDates(timeline.length);
  const completedAtByLesson = new Map<string, Date>();
  const firstTouchByCourse = new Map<string, Date>();

  for (const [index, entry] of timeline.entries()) {
    // A completion can never predate the course it belongs to.
    const floor = daysAfter(entry.course.createdAt, 1);
    const at = dates[index]! < floor ? dateBetween(floor, NOW) : dates[index]!;

    completedAtByLesson.set(entry.lesson.id, at);

    const known = firstTouchByCourse.get(entry.course.id);
    if (!known || at < known) firstTouchByCourse.set(entry.course.id, at);
  }

  for (const queue of queues) {
    const { course } = queue;
    const floor = latest(course.createdAt, student.createdAt);
    const firstTouch = firstTouchByCourse.get(course.id) ?? daysAgo(randInt(2, 20));
    const enrolledAt = dateBetween(
      floor,
      new Date(Math.max(floor.getTime(), firstTouch.getTime() - DAY_MS)),
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
      readAt: chance(0.8) ? hoursAfter(enrolledAt, randInt(1, 40)) : null,
      createdAt: enrolledAt,
    });

    for (const lesson of queue.completed) {
      const completedAt = completedAtByLesson.get(lesson.id)!;

      await prisma.lessonProgress.create({
        data: {
          userId: student.id,
          lessonId: lesson.id,
          isCompleted: true,
          completedAt,
          createdAt: completedAt,
          updatedAt: completedAt,
        },
      });

      for (const quiz of quizzesByLesson.get(lesson.id) ?? []) {
        const maxAttempts = randInt(1, 3);

        for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
          const attempt = await createGradedAttempt(
            student,
            quiz,
            Math.min(0.97, ability + attemptIndex * 0.1),
            dateBetween(completedAt, daysAfter(completedAt, randInt(1, 3))),
          );

          gradedAttempts.push(attempt);

          if (chance(0.6)) {
            notifications.push({
              userId: student.id,
              type: NOTIFICATION_TYPES.GRADE,
              message: `Your score for ${quiz.title} is ${attempt.score}% (${
                attempt.passed ? "passed" : "not passed"
              }).`,
              readAt: chance(0.7)
                ? hoursAfter(attempt.submittedAt, randInt(1, 30))
                : null,
              createdAt: attempt.submittedAt,
            });
          }

          if (attempt.passed) break;
        }
      }
    }

    // The lesson the student is on right now — the dashboard needs a resume
    // target per unfinished course.
    if (queue.next) {
      const startedAt = daysAgo(randInt(0, 6));

      await prisma.lessonProgress.create({
        data: {
          userId: student.id,
          lessonId: queue.next.id,
          isCompleted: false,
          completedAt: null,
          createdAt: startedAt,
          updatedAt: startedAt,
        },
      });
    }
  }

  // Recent retakes on quizzes already taken, so the quiz series in the chart
  // stays alive in weeks where no lesson was finished.
  const takenQuizzes = [
    ...new Map(gradedAttempts.map((a) => [a.quiz.id, a.quiz])).values(),
  ];
  const retakeQuizzes = shuffled(takenQuizzes);

  // Spread over distinct weeks rather than at random, so no recent week ends up
  // with a flat zero for the quiz series.
  for (const [index, quiz] of retakeQuizzes.entries()) {
    const weeksBack = index % 11;
    const attempt = await createGradedAttempt(
      student,
      quiz,
      0.93,
      notInFuture(
        new Date(
          daysAgo(weeksBack * 7 + randInt(0, 6)).getTime() +
            randInt(9, 20) * 3_600_000,
        ),
      ),
    );

    gradedAttempts.push(attempt);
  }

  // One unsubmitted attempt so the "in progress" state shows on the demo account.
  const openQuiz = retakeQuizzes[0];

  if (openQuiz) {
    const startedAt = hoursAfter(daysAgo(1), randInt(1, 10));

    await prisma.quizAttempt.create({
      data: {
        userId: student.id,
        quizId: openQuiz.id,
        score: 0,
        passed: false,
        startedAt,
        submittedAt: null,
        createdAt: startedAt,
        updatedAt: startedAt,
      },
    });
  }

  return { notifications, gradedAttempts };
}

async function seedOverrides(
  gradedAttempts: GradedAttempt[],
  adminId: string,
  priorityUserId?: string,
) {
  const OVERRIDE_REASONS = [
    "Question 3 was ambiguous; regraded after review.",
    "Student reported a timer glitch during the attempt, verified in the logs.",
    "Answer key contained a typo — corrected and rescored.",
    "Manual regrade after an appeal from the student.",
    "Partial credit granted for a valid alternative approach.",
  ];

  const failed = gradedAttempts.filter((attempt) => !attempt.passed);
  // The demo account gets regrades of its own — the activity feed has a
  // dedicated "regrade" event kind that would otherwise never render for it.
  const priority = shuffled(
    failed.filter((attempt) => attempt.userId === priorityUserId),
  ).slice(0, 3);
  const rest = shuffled(
    failed.filter((attempt) => !priority.includes(attempt)),
  ).slice(0, 6);
  const targets = [...priority, ...rest];
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
  // The demo student is seeded separately — see seedShowcaseActivity.
  const showcaseStudent = users.students.find(
    (student) => student.email === `student1@${EMAIL_DOMAIN}`,
  );
  const { notifications, gradedAttempts } = await seedLearningActivity(
    users.students.filter((student) => student.id !== showcaseStudent?.id),
    courses,
    quizzes,
  );

  if (showcaseStudent) {
    console.log("Seeding demo student history...");
    const showcase = await seedShowcaseActivity(
      showcaseStudent,
      courses,
      quizzes,
    );

    notifications.push(...showcase.notifications);
    gradedAttempts.push(...showcase.gradedAttempts);
  }

  console.log("Seeding grade overrides and role requests...");
  const overrideNotifications = await seedOverrides(
    gradedAttempts,
    primaryAdmin.id,
    showcaseStudent?.id,
  );
  const roleRequestNotifications = await seedRoleRequests(
    // A demo account promoted to TEACHER would break the student walkthrough.
    users.students.filter(
      (student) => !student.email.startsWith("student"),
    ),
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
