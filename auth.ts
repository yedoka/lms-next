import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/shared/db/prisma";
import { LoginSchema } from "@/features/auth/schemas/login";
import argon2 from "argon2";
import { DEFAULT_ROLE } from "@/features/auth/utils/roles";
import { ROUTES } from "@/features/auth/utils/routes";
import { AUTH_SESSION_TTL } from "@/features/auth/utils/config";
import { normalizeRole } from "@/features/auth/utils/rbac";
import type { JWT } from "next-auth/jwt";

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const parseRememberMe = (value: unknown) =>
  value === true || value === "true" || value === "on" || value === "1";

const getTokenAuthTime = (token: JWT) =>
  typeof token.authTime === "number" ? token.authTime : nowInSeconds();

const getTokenTTL = (token: JWT) =>
  token.rememberMe
    ? AUTH_SESSION_TTL.THIRTY_DAYS_SECONDS
    : AUTH_SESSION_TTL.ONE_DAY_SECONDS;

const applyUserToToken = (
  token: JWT,
  user: {
    id?: unknown;
    email?: unknown;
    role?: unknown;
    rememberMe?: unknown;
  },
) => {
  if (typeof user.id === "string") {
    token.userId = user.id;
  }

  if (typeof user.email === "string") {
    token.email = user.email;
  }

  token.role = normalizeRole(user.role) ?? DEFAULT_ROLE;
  token.rememberMe = parseRememberMe(user.rememberMe);
  token.authTime = nowInSeconds();
};

const resolveUserIdFromToken = (token: JWT) => {
  if (typeof token.userId === "string") {
    return token.userId;
  }

  return typeof token.sub === "string" ? token.sub : "";
};

const validateUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return null;
  }

  const isValid = await argon2.verify(user.password, password);

  if (!isValid) {
    return null;
  }

  return user;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  pages: {
    signIn: ROUTES.AUTH_LOGIN,
  },
  session: {
    strategy: "jwt",
    maxAge: AUTH_SESSION_TTL.THIRTY_DAYS_SECONDS,
  },
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const parsed = LoginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
          rememberMe: parseRememberMe(credentials?.rememberMe),
        });

        if (!parsed.success) {
          return null;
        }

        const { email, password, rememberMe } = parsed.data;

        const user = await validateUser(email, password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          rememberMe,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        applyUserToToken(token, user);
      }

      const authTime = getTokenAuthTime(token);
      const ttl = getTokenTTL(token);

      token.authTime = authTime;
      token.exp = authTime + ttl;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const userId = resolveUserIdFromToken(token);
        session.user.userId = userId;
        session.user.id = userId;
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        session.user.role = normalizeRole(token.role) ?? DEFAULT_ROLE;
      }

      return session;
    },
  },
});
