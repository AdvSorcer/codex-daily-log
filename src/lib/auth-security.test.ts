import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { isPublicRegistrationEnabled, isValidInviteCode } from "@/lib/auth-security";

// 測試後還原被修改的環境變數，避免案例互相污染。
const ENV_KEYS = ["AUTH_ALLOW_PUBLIC_REGISTRATION", "AUTH_INVITE_CODE"] as const;
const ORIGINAL_ENV = new Map<string, string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of ENV_KEYS) {
    const original = ORIGINAL_ENV.get(key);
    if (original === undefined) {
      delete process.env[key];
      continue;
    }
    process.env[key] = original;
  }
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
