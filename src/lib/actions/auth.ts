"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { assertRateLimit, ensureBootstrapAdmin, isPublicRegistrationEnabled, isValidInviteCode } from "@/lib/auth-security";

export async function registerUser(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  await ensureBootstrapAdmin();

  if (!email || !password) {
    redirect("/register?error=missing_fields");
  }

  if (!isPublicRegistrationEnabled() && !isValidInviteCode(inviteCode)) {
    redirect("/register?error=invalid_invite");
  }

  if (password.length < 6) {
    redirect("/register?error=weak_password");
  }

  const rateLimitPassed = await assertRateLimit("register", email);
  if (!rateLimitPassed) {
    redirect("/register?error=rate_limited");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=email_exists");
  }

  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      name: name || null,
      email,
      password: hashedPassword,
      role: "USER",
    },
  });

  redirect("/login?registered=1");
}
