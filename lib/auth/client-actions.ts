"use client";

import { signIn } from "next-auth/react";
import { ROUTES } from "@/lib/auth/routes";
import { SIGNUP_ROLES } from "@/lib/auth/roles";

type ActionSuccess = {
  ok: true;
};

type ActionFailure = {
  ok: false;
  message: string;
};

export type ActionResult = ActionSuccess | ActionFailure;

export type LoginActionInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type SignupActionInput = {
  name: string;
  email: string;
  role: (typeof SIGNUP_ROLES)[number];
  password: string;
  passwordConfirmation: string;
};

const toErrorMessage = (body: unknown, fallback: string) => {
  if (body && typeof body === "object" && "error" in body) {
    const error = body.error;

    if (typeof error === "string" && error.trim()) {
      return error;
    }
  }

  return fallback;
};

export const submitLogin = async (
  input: LoginActionInput,
): Promise<ActionResult> => {
  try {
    const res = await signIn("credentials", {
      email: input.email,
      password: input.password,
      rememberMe: input.rememberMe ? "true" : "false",
      redirect: false,
    });

    if (res?.error) {
      return { ok: false, message: "Invalid email or password" };
    }

    if (!res?.ok) {
      return { ok: false, message: "Login request failed" };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Network error during login" };
  }
};

export const submitSignup = async (
  input: SignupActionInput,
): Promise<ActionResult> => {
  try {
    const response = await fetch(ROUTES.API_AUTH_SIGNUP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      return {
        ok: false,
        message: toErrorMessage(body, "Signup request failed"),
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Network error during signup" };
  }
};

export const autoSignInAfterSignup = async (
  email: string,
  password: string,
): Promise<ActionResult> => {
  try {
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!response?.ok) {
      return {
        ok: false,
        message: "Account created. Please login.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Account created. Please login.",
    };
  }
};
