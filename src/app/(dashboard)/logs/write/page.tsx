import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLog, deleteLog } from "@/lib/actions/log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LogoutButton } from "@/components/logout-button";

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toDisplayDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function LogsWritePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const logs = await prisma.log.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">每日工作日誌</h1>
          <p className="text-sm text-slate-600">左側輸入，右側總覽</p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" href="/logs/view">
            純檢視
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-4 shadow-sm md:p-6">
          <h2 className="mb-4 text-lg font-semibold">新增日誌</h2>
          <form action={createLog} className="space-y-4">
            <label className="block text-sm font-medium">
              日期
              <Input className="mt-1" name="date" type="date" required defaultValue={toInputDate(new Date())} />
            </label>

            <label className="block text-sm font-medium">
              內容
              <Textarea
                className="mt-1 min-h-48"
                name="content"
                required
                placeholder="今天完成了哪些工作？遇到什麼問題？"
              />
            </label>

            <Button type="submit">儲存</Button>
          </form>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm md:p-6">
          <h2 className="mb-4 text-lg font-semibold">近期日誌</h2>

          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">尚無日誌，先在左側新增一筆。</p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li key={log.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{toDisplayDate(log.date)}</span>
                    <form action={deleteLog}>
                      <input type="hidden" name="logId" value={log.id} />
                      <button type="submit" className="text-sm text-rose-700 underline">
                        刪除
                      </button>
                    </form>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{log.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
