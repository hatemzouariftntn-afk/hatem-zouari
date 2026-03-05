// src/app/tags/actions.ts
"use server";

import { db } from "@/lib/db";
import { Tag } from "@/types";

// Placeholder for getting the current user ID from session/token
// TODO: Replace with actual session/auth logic
async function getCurrentUserId(): Promise<number | null> {
  console.warn("Using placeholder user ID 1 for testing. Implement proper auth!");
  return 1;
}

// Function to list tags for the current user
export async function listTags() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "المستخدم غير مسجل الدخول." };
  }

  try {
    const tags = await db.getAllTags();
    return { success: true, tags: tags || [] };

  } catch (error) {
    console.error("List Tags Error:", error);
    return { success: false, error: "حدث خطأ أثناء جلب الوسوم." };
  }
}

// Function to add a new tag for the current user
export async function addTag(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "يجب تسجيل الدخول لإضافة وسم." };
  }

  const name = formData.get("tagName") as string;
  if (!name || name.trim() === "") {
    return { success: false, error: "اسم الوسم مطلوب." };
  }

  const tagName = name.trim();

  try {
    return {
      success: false,
      error: "إضافة الوسوم يدوياً غير مدعومة حالياً. الوسوم تُستخرج تلقائياً من المستندات."
    };

  } catch (error) {
    console.error("Add Tag Error:", error);
    return { success: false, error: "حدث خطأ أثناء إضافة الوسم." };
  }
}

// Remember to link tags to documents in the saveDocument action (already partially done)
// Consider adding actions for updating/deleting tags
