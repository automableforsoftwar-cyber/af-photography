import { supabase } from "@/lib/supabase";

export const CODE_INVALID_MSG =
  "عفواً، هذا الكود غير صالح أو تم استنفاد الحد الأقصى للاستخدام.";
export const PHONE_EXISTS_MSG = "عفواً، رقم الموبايل مسجل بالفعل.";
export const LOGIN_INVALID_MSG =
  "رقم الموبايل أو كلمة المرور غير صحيحة.";

type AccessCodeRow = {
  id: string;
  code: string;
  current_uses: number;
  max_uses: number;
};

export type AuthResult =
  | {
      ok: true;
      userId: string;
      phone: string;
      paymentCode: string;
    }
  | { ok: false; message: string };

/** Phone-as-email helper — avoids SMS OTP while using Supabase Auth. */
export function phoneToEmail(phone: string) {
  const normalized = phone.trim().replace(/\s+/g, "");
  return `${normalized}@afp.com`;
}

async function validateAccessCode(code: string): Promise<
  | { ok: true; row: AccessCodeRow }
  | { ok: false; message: string }
> {
  const { data, error } = await supabase
    .from("access_codes")
    .select("id, code, current_uses, max_uses")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("access_codes query:", error);
    return { ok: false, message: CODE_INVALID_MSG };
  }

  const row = data as AccessCodeRow | null;
  if (!row || row.current_uses >= row.max_uses) {
    return { ok: false, message: CODE_INVALID_MSG };
  }

  return { ok: true, row };
}

/**
 * Sign up with VIP code + phone + password (phone mapped to fake email).
 */
export async function signUpWithVipCode(input: {
  code: string;
  phone: string;
  password: string;
}): Promise<AuthResult> {
  const code = input.code.trim();
  const phone = input.phone.trim().replace(/\s+/g, "");
  const password = input.password;

  if (!code || !phone || password.length < 6) {
    return {
      ok: false,
      message:
        password.length < 6
          ? "كلمة المرور لازم تكون ٦ حروف على الأقل."
          : CODE_INVALID_MSG,
    };
  }

  const validated = await validateAccessCode(code);
  if (!validated.ok) return validated;

  const fakeEmail = phoneToEmail(phone);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: fakeEmail,
    password,
    options: {
      data: { phone, used_code: code },
    },
  });

  if (signUpError) {
    console.error("signUp:", signUpError);
    const msg = signUpError.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      return { ok: false, message: PHONE_EXISTS_MSG };
    }
    return {
      ok: false,
      message: "حصل خطأ أثناء إنشاء الحساب. حاول تاني.",
    };
  }

  let userId = signUpData.user?.id ?? null;

  // If email confirmation is required, session may be missing — try immediate login.
  if (!signUpData.session) {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });
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
    return {
      ok: false,
      message: "حصل خطأ أثناء إنشاء الحساب. حاول تاني.",
    };
  }

  const { error: updateError } = await supabase
    .from("access_codes")
    .update({ current_uses: validated.row.current_uses + 1 })
    .eq("id", validated.row.id)
    .eq("code", code);

  if (updateError) {
    console.error("access_codes update:", updateError);
    return {
      ok: false,
      message: "حصل خطأ أثناء تفعيل الكود. حاول تاني.",
    };
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    phone_number: phone,
    used_code: code,
  });

  if (insertError) {
    console.error("profiles insert:", insertError);
    if (insertError.code === "23505") {
      return { ok: false, message: PHONE_EXISTS_MSG };
    }
    // Best-effort rollback of use count
    await supabase
      .from("access_codes")
      .update({ current_uses: validated.row.current_uses })
      .eq("id", validated.row.id);
    return {
      ok: false,
      message: "حصل خطأ أثناء إنشاء الملف الشخصي. حاول تاني.",
    };
  }

  // Seed progress row (non-blocking)
  await supabase.from("user_progress").upsert(
    { user_id: userId, completed_lessons: [], score: 0 },
    { onConflict: "user_id" },
  );

  return {
    ok: true,
    userId,
    phone,
    paymentCode: code,
  };
}

/**
 * Log in with phone + password (phone mapped to fake email).
 */
export async function signInWithPhone(input: {
  phone: string;
  password: string;
}): Promise<AuthResult> {
  const phone = input.phone.trim().replace(/\s+/g, "");
  const password = input.password;

  if (!phone || !password) {
    return { ok: false, message: LOGIN_INVALID_MSG };
  }

  const fakeEmail = phoneToEmail(phone);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password,
  });

  if (error || !data.user) {
    console.error("signIn:", error);
    return { ok: false, message: LOGIN_INVALID_MSG };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number, used_code")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    ok: true,
    userId: data.user.id,
    phone: profile?.phone_number ?? phone,
    paymentCode: profile?.used_code ?? "",
  };
}

export async function signOutSession() {
  await supabase.auth.signOut();
}
