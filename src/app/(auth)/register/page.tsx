import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <div className="w-full rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold">建立帳號</h1>
        <p className="mb-6 text-sm text-slate-500">註冊後即可開始記錄每日工作日誌。</p>

        <form action={registerUser} className="space-y-4">
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
