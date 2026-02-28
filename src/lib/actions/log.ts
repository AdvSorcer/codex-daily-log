"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSessionUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

function parseDateOnly(value: string): Date {
  const normalized = `${value}T00:00:00.000Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return date;
}

export async function createLog(formData: FormData) {
  const userId = await getSessionUserId();
  const dateInput = String(formData.get("date") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!dateInput || !content) {
    throw new Error("Date and content are required");
  }

  const date = parseDateOnly(dateInput);

  await prisma.log.create({
    data: {
      userId,
      date,
      content,
    },
  });

  revalidatePath("/logs/write");
  revalidatePath("/logs/view");
}

export async function deleteLog(formData: FormData) {
  const userId = await getSessionUserId();
  const logId = String(formData.get("logId") ?? "").trim();

  if (!logId) {
    throw new Error("logId is required");
  }

  await prisma.log.deleteMany({
    where: {
      id: logId,
      userId,
    },
  });

  revalidatePath("/logs/write");
  revalidatePath("/logs/view");
}
