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
