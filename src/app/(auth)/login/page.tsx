import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <div className="w-full rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold">登入</h1>
        <p className="mb-6 text-sm text-slate-500">登入後進入日誌撰寫頁。</p>

        <LoginForm />

        <p className="mt-4 text-sm text-slate-600">
          還沒有帳號？ <Link href="/register" className="underline">前往註冊</Link>
        </p>
      </div>
    </main>
  );
}
