# 每日工作日誌系統 (MVP)

使用 Bun + Next.js App Router + NextAuth v4 + Prisma(SQLite) 建立的日誌 MVP。

## 技術棧

- Bun
- Next.js 16 (App Router)
- NextAuth.js v4 (Credentials Provider)
- Prisma + SQLite
- Server Actions

## 環境需求

- Bun 1.1+
- Node.js 20+

## 快速開始

1. 安裝依賴

```bash
bun install
```

2. 設定環境變數

```bash
cp .env.example .env
```

建議至少設定以下值（Vercel 也要同步）：

- `NEXTAUTH_SECRET`：長隨機字串
- `AUTH_ALLOW_PUBLIC_REGISTRATION=false`：預設關閉公開註冊
- `AUTH_INVITE_CODE`：註冊邀請碼
- `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`：首次自動建立管理員帳號
- `AUTH_RATE_LIMIT_WINDOW_SECONDS` / `AUTH_RATE_LIMIT_MAX_ATTEMPTS`：登入與註冊限流

3. 初始化資料庫

```bash
bunx prisma db push
```

4. 啟動開發伺服器

```bash
bun run dev
```

開啟 `http://localhost:3000`。

## 主要路由

- `/register`：註冊
- `/login`：登入
- `/logs`：重導向到 `/logs/write`
- `/logs/write`：日誌撰寫 + 總覽
- `/logs/view`：純 table 檢視

## 建置與正式環境

```bash
bun run build
bun run start
```

## 安全預設（適合先上線）

- 預設關閉公開註冊，註冊需邀請碼。
- 若資料庫內尚無 `ADMIN`，系統會用 `BOOTSTRAP_ADMIN_*` 建立一次管理員。
- 登入與註冊有基礎 rate limit（依 email key）。
