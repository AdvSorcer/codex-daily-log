import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "請填寫 Email 與密碼。",
  invalid_invite: "邀請碼無效。",
  weak_password: "密碼至少需要 6 個字元。",
  email_exists: "Email 已被註冊。",
  rate_limited: "操作過於頻繁，請稍後再試。",
};

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : "";
  const errorMessage = ERROR_MESSAGES[errorKey];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <div className="w-full rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold">建立帳號</h1>
        <p className="mb-6 text-sm text-slate-500">註冊後即可開始記錄每日工作日誌（預設需邀請碼）。</p>

        <form action={registerUser} className="space-y-4">
          {errorMessage ? <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{errorMessage}</p> : null}

          <label className="block text-sm font-medium">
            名稱
            <Input name="name" type="text" placeholder="你的名稱" className="mt-1" />
          </label>

          <label className="block text-sm font-medium">
            Email
            <Input name="email" type="email" required placeholder="you@example.com" className="mt-1" />
          </label>

          <label className="block text-sm font-medium">
            密碼
            <Input name="password" type="password" required minLength={6} className="mt-1" />
          </label>

          <label className="block text-sm font-medium">
            邀請碼
            <Input name="inviteCode" type="text" placeholder="請輸入邀請碼" className="mt-1" />
          </label>

          <Button type="submit" className="w-full">
            註冊
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          已有帳號？ <Link href="/login" className="underline">前往登入</Link>
        </p>
      </div>
    </main>
  );
}
