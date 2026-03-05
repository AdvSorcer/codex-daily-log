import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_RATE_LIMIT_MAX_ATTEMPTS = 5;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function getRateLimitConfig() {
  const windowSeconds = Number(process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS ?? DEFAULT_RATE_LIMIT_WINDOW_SECONDS);
  const maxAttempts = Number(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS ?? DEFAULT_RATE_LIMIT_MAX_ATTEMPTS);

  return {
    windowMs: Math.max(1, Number.isFinite(windowSeconds) ? windowSeconds : DEFAULT_RATE_LIMIT_WINDOW_SECONDS) * 1000,
    maxAttempts: Math.max(1, Number.isFinite(maxAttempts) ? maxAttempts : DEFAULT_RATE_LIMIT_MAX_ATTEMPTS),
  };
}

export function isPublicRegistrationEnabled(): boolean {
  return parseBoolean(process.env.AUTH_ALLOW_PUBLIC_REGISTRATION, false);
}

export function isValidInviteCode(inviteCode: string): boolean {
  const configuredInviteCode = process.env.AUTH_INVITE_CODE;
  if (!configuredInviteCode) {
    return false;
  }

  return inviteCode.length > 0 && inviteCode === configuredInviteCode;
}

export async function ensureBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    return;
  }

  const existingAdmin = await prisma.user.count({
    where: { role: "ADMIN" },
  });

  if (existingAdmin > 0) {
    return;
  }

  const hashedPassword = await hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
}

export async function assertRateLimit(action: string, key: string): Promise<boolean> {
  const { maxAttempts, windowMs } = getRateLimitConfig();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const safeKey = key.trim().toLowerCase() || "unknown";

  const existing = await prisma.authRateLimit.findUnique({
    where: {
      action_key: {
        action,
        key: safeKey,
      },
    },
  });

  if (!existing || existing.windowStart < windowStart) {
    await prisma.authRateLimit.upsert({
      where: {
        action_key: {
          action,
          key: safeKey,
        },
      },
      update: {
        count: 1,
        windowStart: now,
      },
      create: {
        action,
        key: safeKey,
        count: 1,
        windowStart: now,
      },
    });
    return true;
  }

  if (existing.count >= maxAttempts) {
    return false;
  }

  await prisma.authRateLimit.update({
    where: {
      action_key: {
        action,
        key: safeKey,
      },
    },
    data: {
      count: {
        increment: 1,
      },
    },
  });

  return true;
}
