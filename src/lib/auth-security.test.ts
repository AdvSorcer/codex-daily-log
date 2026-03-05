import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  assertRateLimit,
  ensureBootstrapAdmin,
  isPublicRegistrationEnabled,
  isValidInviteCode,
} from "@/lib/auth-security";
import { prisma } from "@/lib/prisma";

const prismaMock = prisma as any;

// 測試後還原被修改的環境變數，避免案例互相污染。
const ENV_KEYS = [
  "AUTH_ALLOW_PUBLIC_REGISTRATION",
  "AUTH_INVITE_CODE",
  "AUTH_RATE_LIMIT_WINDOW_SECONDS",
  "AUTH_RATE_LIMIT_MAX_ATTEMPTS",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_PASSWORD",
  "BOOTSTRAP_ADMIN_NAME",
] as const;
const ORIGINAL_ENV = new Map<string, string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);
const originalUserCount = prismaMock.user.count;
const originalUserUpsert = prismaMock.user.upsert;
const originalRateFindUnique = prismaMock.authRateLimit.findUnique;
const originalRateUpsert = prismaMock.authRateLimit.upsert;
const originalRateUpdate = prismaMock.authRateLimit.update;

afterEach(() => {
  for (const key of ENV_KEYS) {
    const original = ORIGINAL_ENV.get(key);
    if (original === undefined) {
      delete process.env[key];
      continue;
    }
    process.env[key] = original;
  }

  prismaMock.user.count = originalUserCount;
  prismaMock.user.upsert = originalUserUpsert;
  prismaMock.authRateLimit.findUnique = originalRateFindUnique;
  prismaMock.authRateLimit.upsert = originalRateUpsert;
  prismaMock.authRateLimit.update = originalRateUpdate;
});

describe("isPublicRegistrationEnabled", () => {
  // 未設定時應維持安全預設：不開放公開註冊。
  test("defaults to disabled when env is missing", () => {
    delete process.env.AUTH_ALLOW_PUBLIC_REGISTRATION;
    assert.equal(isPublicRegistrationEnabled(), false);
  });

  // 僅在字串為 "true" 時才啟用公開註冊。
  test("returns true when env is true", () => {
    process.env.AUTH_ALLOW_PUBLIC_REGISTRATION = "true";
    assert.equal(isPublicRegistrationEnabled(), true);
  });

  // 其他值都視為未啟用，避免配置模糊造成誤開放。
  test("returns false for non-true values", () => {
    process.env.AUTH_ALLOW_PUBLIC_REGISTRATION = "1";
    assert.equal(isPublicRegistrationEnabled(), false);
  });
});

describe("isValidInviteCode", () => {
  // 沒有設定邀請碼時，一律驗證失敗。
  test("returns false when invite code is not configured", () => {
    delete process.env.AUTH_INVITE_CODE;
    assert.equal(isValidInviteCode("any-value"), false);
  });

  // 邀請碼必須完整且精準比對（區分大小寫與空白）。
  test("returns true only for exact code match", () => {
    process.env.AUTH_INVITE_CODE = "team-invite-123";
    assert.equal(isValidInviteCode("team-invite-123"), true);
    assert.equal(isValidInviteCode("TEAM-INVITE-123"), false);
    assert.equal(isValidInviteCode(" team-invite-123 "), false);
  });
});

describe("ensureBootstrapAdmin", () => {
  // 未提供必要 env 時，不應建立 admin。
  test("does nothing when bootstrap env is missing", async () => {
    delete process.env.BOOTSTRAP_ADMIN_EMAIL;
    delete process.env.BOOTSTRAP_ADMIN_PASSWORD;

    let upsertCalled = false;
    prismaMock.user.count = async () => 0;
    prismaMock.user.upsert = async () => {
      upsertCalled = true;
      return {};
    };

    await ensureBootstrapAdmin();
    assert.equal(upsertCalled, false);
  });

  // 只有在還沒有 admin 時才建立。
  test("creates admin when no existing admin is found", async () => {
    process.env.BOOTSTRAP_ADMIN_EMAIL = "admin@example.com";
    process.env.BOOTSTRAP_ADMIN_PASSWORD = "AdminPass#123";
    process.env.BOOTSTRAP_ADMIN_NAME = "Team Admin";

    let countCalled = false;
    let upsertArgs: unknown;

    prismaMock.user.count = async () => {
      countCalled = true;
      return 0;
    };
    prismaMock.user.upsert = async (args: unknown) => {
      upsertArgs = args;
      return {};
    };

    await ensureBootstrapAdmin();

    assert.equal(countCalled, true);
    assert.ok(upsertArgs);
    const parsed = upsertArgs as { create: { email: string; role: string }; update: { role: string; password: string } };
    assert.equal(parsed.create.email, "admin@example.com");
    assert.equal(parsed.create.role, "ADMIN");
    assert.equal(parsed.update.role, "ADMIN");
    assert.notEqual(parsed.update.password, "AdminPass#123");
  });

  // 已存在 admin 時，不應再覆寫或重建。
  test("does not create admin when one already exists", async () => {
    process.env.BOOTSTRAP_ADMIN_EMAIL = "admin@example.com";
    process.env.BOOTSTRAP_ADMIN_PASSWORD = "AdminPass#123";

    let upsertCalled = false;
    prismaMock.user.count = async () => 1;
    prismaMock.user.upsert = async () => {
      upsertCalled = true;
      return {};
    };

    await ensureBootstrapAdmin();
    assert.equal(upsertCalled, false);
  });
});

describe("assertRateLimit", () => {
  // 沒有紀錄時，應建立初始窗口並放行。
  test("allows first attempt and creates rate-limit record", async () => {
    process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS = "60";
    process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS = "5";

    let upsertArgs: unknown;
    prismaMock.authRateLimit.findUnique = async () => null;
    prismaMock.authRateLimit.upsert = async (args: unknown) => {
      upsertArgs = args;
      return {};
    };

    const allowed = await assertRateLimit("login", "USER@Example.com");
    assert.equal(allowed, true);
    assert.ok(upsertArgs);
    const parsed = upsertArgs as { where: { action_key: { action: string; key: string } } };
    assert.equal(parsed.where.action_key.action, "login");
    assert.equal(parsed.where.action_key.key, "user@example.com");
  });

  // 在窗口內超過上限要拒絕，且不再更新計數。
  test("blocks when attempts exceed configured limit in window", async () => {
    process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS = "60";
    process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS = "2";

    const currentWindow = new Date(Date.now() - 1_000);
    let updateCalled = false;

    prismaMock.authRateLimit.findUnique = async () =>
      ({
        count: 2,
        windowStart: currentWindow,
      });
    prismaMock.authRateLimit.update = async () => {
      updateCalled = true;
      return {};
    };

    const allowed = await assertRateLimit("login", "blocked@example.com");
    assert.equal(allowed, false);
    assert.equal(updateCalled, false);
  });

  // 超過時間窗口後，應重置為新窗口並放行。
  test("resets counter when previous window is expired", async () => {
    process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS = "60";
    process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS = "2";

    const expiredWindow = new Date(Date.now() - 120_000);
    let upsertCalled = false;

    prismaMock.authRateLimit.findUnique = async () =>
      ({
        count: 2,
        windowStart: expiredWindow,
      });
    prismaMock.authRateLimit.upsert = async () => {
      upsertCalled = true;
      return {};
    };

    const allowed = await assertRateLimit("login", "retry@example.com");
    assert.equal(allowed, true);
    assert.equal(upsertCalled, true);
  });
});
