import prisma from "@/lib/prisma";
import { SignupSchema } from "@/lib/validation/signup";
import argon2 from "argon2";

export async function POST(request: Request) {
  const body = await request.json();
  const data = SignupSchema.safeParse(body);
  if (!data.success) {
    const message = data.error.issues[0]?.message ?? "Invalid input data";

    return new Response(JSON.stringify({ error: message }), {
      status: 400,
    });
  }

  const { email, name, password, role } = data.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return new Response(JSON.stringify({ error: "User already exists" }), {
      status: 400,
    });
  }

  const hashedPassword = await argon2.hash(password);

  const newUser = await prisma.user.create({
    data: { email, name, password: hashedPassword, role },
    select: { id: true, email: true, name: true, role: true },
  });

  return new Response(
    JSON.stringify({ message: "Signup successful", data: newUser }),
    { status: 201 },
  );
}
