"use client";

import { signIn } from "next-auth/react";
import { SIGNUP_ROLES } from "@/features/auth/utils/roles";
import { executeSignup, executePasswordResetRequest, executePasswordReset } from "@/features/auth/actions/server-actions";

type ActionSuccess = {
  ok: true;
  message?: string;
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
  requestedRole: (typeof SIGNUP_ROLES)[number];
  password: string;
  passwordConfirmation: string;
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
    return await executeSignup(input);
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
      rememberMe: "true",
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

export const submitPasswordResetRequest = async (
  email: string,
): Promise<ActionResult> => {
  try {
    return await executePasswordResetRequest(email);
  } catch {
    return { ok: false, message: "Network error during password reset request" };
  }
};

export const submitPasswordReset = async (
  token: string,
  input: unknown,
): Promise<ActionResult> => {
  try {
    return await executePasswordReset(token, input);
  } catch {
    return { ok: false, message: "Network error during password reset" };
  }
};
