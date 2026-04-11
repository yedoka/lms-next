import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { LoginSchema } from "@/lib/validation/login";
import argon2 from "argon2";
import type { UserRole } from "@prisma/client";

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
const THIRTY_DAYS_IN_SECONDS = 30 * ONE_DAY_IN_SECONDS;

const parseRememberMe = (value: unknown) =>
  value === true || value === "true" || value === "on" || value === "1";

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
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS_IN_SECONDS,
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
        token.userId = user.id;
        token.email = user.email ?? token.email;
        token.role = (user as { role?: UserRole }).role;
        token.rememberMe = parseRememberMe(
          (user as { rememberMe?: unknown }).rememberMe,
        );
        token.authTime = Math.floor(Date.now() / 1000);
      }

      const authTime =
        typeof token.authTime === "number"
          ? token.authTime
          : Math.floor(Date.now() / 1000);
      const ttl = token.rememberMe
        ? THIRTY_DAYS_IN_SECONDS
        : ONE_DAY_IN_SECONDS;

      token.authTime = authTime;
      token.exp = authTime + ttl;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.userId =
          typeof token.userId === "string" ? token.userId : (token.sub ?? "");
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        session.user.role = (token.role as UserRole | undefined) ?? "STUDENT";
      }

      return session;
    },
  },
});
