import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function LogsViewPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const logs = await prisma.log.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main>
      <style>{`
        body { margin: 0; }
        table { border-collapse: collapse; width: 100%; table-layout: fixed; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; vertical-align: top; font-size: 12px; line-height: 1.25; }
        th { background: #f3f3f3; text-align: left; }
        td:first-child, th:first-child { width: 140px; white-space: nowrap; }
        pre { margin: 0; white-space: pre-wrap; font: inherit; }
      `}</style>

      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>內容</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={2}>尚無日誌</td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.date)}</td>
                <td>
                  <pre>{log.content}</pre>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
