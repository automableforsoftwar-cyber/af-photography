import { supabase } from "@/lib/supabase";

export const CODE_INVALID_MSG =
  "عفواً، هذا الكود غير صالح أو تم استنفاد الحد الأقصى للاستخدام.";
export const CODE_ALREADY_OWNED_MSG =
  "إنت فاتح الكورس ده بالفعل على حسابك (لسه الاشتراك شغال).";
export const EMAIL_EXISTS_MSG = "عفواً، الإيميل ده مسجّل بالفعل.";
export const LOGIN_INVALID_MSG = "الإيميل أو كلمة المرور غير صحيحة.";

const SUBSCRIPTION_DAYS = 30;

type AccessCodeRow = {
  id: string;
  code: string;
  current_uses: number;
  max_uses: number;
  target_course: string;
};

export type AuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; message: string };

export type RedeemResult =
  | { ok: true; courseId: string; expiresAt: string }
  | { ok: false; message: string };

export type CourseEnrollment = {
  courseId: string;
  expiresAt: string | null;
};

function plusThirtyDaysIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + SUBSCRIPTION_DAYS);
  return d.toISOString();
}

function isActiveExpiry(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

/** Sign up with real email + password (no course unlock). */
export async function signUpWithEmail(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || password.length < 6) {
    return {
      ok: false,
      message:
        password.length < 6
          ? "كلمة المرور لازم تكون ٦ حروف على الأقل."
          : "اكتب إيميل صحيح.",
    };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { email } },
  });

  if (signUpError) {
    console.error("signUp:", signUpError);
    const msg = signUpError.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      return { ok: false, message: EMAIL_EXISTS_MSG };
    }
    return { ok: false, message: "حصل خطأ أثناء إنشاء الحساب. حاول تاني." };
  }

  let userId = signUpData.user?.id ?? null;

  if (!signUpData.session) {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.user) {
      console.error("post-signup signIn:", signInError);
      return {
        ok: false,
        message:
          "تم إنشاء الحساب لكن لازم تفعيل الإيميل في إعدادات Supabase (Confirm email = Off) عشان تدخل فوراً.",
      };
    }
    userId = signInData.user.id;
  }

  if (!userId) {
    return { ok: false, message: "حصل خطأ أثناء إنشاء الحساب. حاول تاني." };
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    email,
    phone_number: null,
    used_code: null,
  });

  if (insertError && insertError.code !== "23505") {
    console.error("profiles insert:", insertError);
    return {
      ok: false,
      message: "حصل خطأ أثناء إنشاء الملف الشخصي. حاول تاني.",
    };
  }

  return { ok: true, userId, email };
}

/** Log in with real email + password. */
export async function signInWithEmail(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return { ok: false, message: LOGIN_INVALID_MSG };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.error("signIn:", error);
    return { ok: false, message: LOGIN_INVALID_MSG };
  }

  await supabase.from("profiles").upsert(
    { id: data.user.id, email },
    { onConflict: "id" },
  );

  return { ok: true, userId: data.user.id, email };
}

/**
 * Redeem a single-use course code. Unlocks ONLY target_course for 30 days.
 * Expired enrollments can be renewed with a new valid code.
 */
export async function redeemCourseCode(codeInput: string): Promise<RedeemResult> {
  const code = codeInput.trim();
  if (!code) return { ok: false, message: CODE_INVALID_MSG };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "لازم تسجّل دخول الأول." };
  }

  const { data: accessRow, error: codeError } = await supabase
    .from("access_codes")
    .select("id, code, current_uses, max_uses, target_course")
    .eq("code", code)
    .maybeSingle();

  if (codeError) {
    console.error("access_codes query:", codeError);
    return { ok: false, message: CODE_INVALID_MSG };
  }

  const row = accessRow as AccessCodeRow | null;
  if (!row || row.current_uses >= row.max_uses || !row.target_course) {
    return { ok: false, message: CODE_INVALID_MSG };
  }

  const courseId = row.target_course;
  const expiresAt = plusThirtyDaysIso();

  const { data: existing } = await supabase
    .from("user_courses")
    .select("id, expires_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing && isActiveExpiry(existing.expires_at as string | null)) {
    return { ok: false, message: CODE_ALREADY_OWNED_MSG };
  }

  const { error: updateError } = await supabase
    .from("access_codes")
    .update({ current_uses: row.current_uses + 1 })
    .eq("id", row.id)
    .eq("code", code);

  if (updateError) {
    console.error("access_codes update:", updateError);
    return { ok: false, message: "حصل خطأ أثناء تفعيل الكود. حاول تاني." };
  }

  if (existing) {
    // Renew expired enrollment — new 30-day window
    const { error: renewError } = await supabase
      .from("user_courses")
      .update({
        expires_at: expiresAt,
        unlocked_via_code: code,
        unlocked_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (renewError) {
      console.error("user_courses renew:", renewError);
      await supabase
        .from("access_codes")
        .update({ current_uses: row.current_uses })
        .eq("id", row.id);
      return { ok: false, message: "حصل خطأ أثناء تجديد الاشتراك. حاول تاني." };
    }
  } else {
    const { error: enrollError } = await supabase.from("user_courses").insert({
      user_id: user.id,
      course_id: courseId,
      unlocked_via_code: code,
      expires_at: expiresAt,
    });

    if (enrollError) {
      console.error("user_courses insert:", enrollError);
      await supabase
        .from("access_codes")
        .update({ current_uses: row.current_uses })
        .eq("id", row.id);
      if (enrollError.code === "23505") {
        return { ok: false, message: CODE_ALREADY_OWNED_MSG };
      }
      return { ok: false, message: "حصل خطأ أثناء فتح الكورس. حاول تاني." };
    }
  }

  await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      course_id: courseId,
      completed_lessons: [],
      score: 0,
    },
    { onConflict: "user_id,course_id" },
  );

  return { ok: true, courseId, expiresAt };
}

/** Active (non-expired) course IDs only. */
export async function fetchUnlockedCourseIds(
  userId: string,
): Promise<string[]> {
  const enrollments = await fetchActiveEnrollments(userId);
  return enrollments.map((e) => e.courseId);
}

export async function fetchActiveEnrollments(
  userId: string,
): Promise<CourseEnrollment[]> {
  const { data, error } = await supabase
    .from("user_courses")
    .select("course_id, expires_at")
    .eq("user_id", userId);

  if (error) {
    console.error("user_courses fetch:", error);
    return [];
  }

  return (data ?? [])
    .filter((row) => isActiveExpiry(row.expires_at as string | null))
    .map((row) => ({
      courseId: row.course_id as string,
      expiresAt: (row.expires_at as string) ?? null,
    }));
}

export async function signOutSession() {
  await supabase.auth.signOut();
}
