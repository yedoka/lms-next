import prisma from "@/lib/prisma";
import { SignupSchema } from "@/lib/validation/signup";
import argon2 from "argon2";
import { NextResponse } from "next/server";

const errorResponse = (status: number, error: string) =>
  NextResponse.json({ success: false, error }, { status });

const successResponse = <T>(status: number, data: T, message: string) =>
  NextResponse.json({ success: true, message, data }, { status });

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse(400, "Invalid JSON body");
    }

    const data = SignupSchema.safeParse(body);
    if (!data.success) {
      const message = data.error.issues[0]?.message ?? "Invalid input data";

      return errorResponse(400, message);
    }

    const { email, name, password, role } = data.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return errorResponse(400, "User already exists");
    }

    const hashedPassword = await argon2.hash(password);

    const newUser = await prisma.user.create({
      data: { email, name, password: hashedPassword, role },
      select: { id: true, email: true, name: true, role: true },
    });

    return successResponse(201, newUser, "Signup successful");
  } catch {
    return errorResponse(500, "Internal server error during signup");
  }
}
