"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("帳號或密碼錯誤");
      return;
    }

    router.push("/logs/write");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {params.get("registered") === "1" ? (
        <p className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">註冊成功，請登入。</p>
      ) : null}

      {error ? <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}

      <label className="block text-sm font-medium">
        Email
        <Input name="email" type="email" required className="mt-1" />
      </label>

      <label className="block text-sm font-medium">
        密碼
        <Input name="password" type="password" required className="mt-1" />
      </label>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "登入中..." : "登入"}
      </Button>
    </form>
  );
}
