import { supabase } from "@/lib/supabase";

export const CODE_INVALID_MSG =
  "عفواً، هذا الكود غير صالح أو تم استنفاد الحد الأقصى للاستخدام.";
export const PHONE_EXISTS_MSG = "عفواً، رقم الموبايل مسجل بالفعل.";

type AccessCodeRow = {
  id: string;
  code: string;
  current_uses: number;
  max_uses: number;
};

export type EnrollResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Validates access code + phone against Supabase, then grants enrollment.
 */
export async function enrollWithAccessCode(input: {
  code: string;
  phone: string;
}): Promise<EnrollResult> {
  const code = input.code.trim();
  const phone = input.phone.trim();

  if (!code || !phone) {
    return { ok: false, message: CODE_INVALID_MSG };
  }

  const { data: accessRow, error: codeError } = await supabase
    .from("access_codes")
    .select("id, code, current_uses, max_uses")
    .eq("code", code)
    .maybeSingle();

  if (codeError) {
    console.error("access_codes query:", codeError);
    return { ok: false, message: CODE_INVALID_MSG };
  }

  const row = accessRow as AccessCodeRow | null;
  if (!row || row.current_uses >= row.max_uses) {
    return { ok: false, message: CODE_INVALID_MSG };
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle();

  if (profileError) {
    console.error("profiles query:", profileError);
    return {
      ok: false,
      message: "حصل خطأ أثناء التحقق. حاول تاني بعد شوية.",
    };
  }

  if (existingProfile) {
    return { ok: false, message: PHONE_EXISTS_MSG };
  }

  const { error: updateError } = await supabase
    .from("access_codes")
    .update({ current_uses: row.current_uses + 1 })
    .eq("id", row.id)
    .eq("code", code);

  if (updateError) {
    console.error("access_codes update:", updateError);
    return {
      ok: false,
      message: "حصل خطأ أثناء تفعيل الكود. حاول تاني.",
    };
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    phone_number: phone,
    used_code: code,
  });

  if (insertError) {
    console.error("profiles insert:", insertError);
    // Best-effort rollback so a failed insert doesn't burn a seat
    await supabase
      .from("access_codes")
      .update({ current_uses: row.current_uses })
      .eq("id", row.id);
    return {
      ok: false,
      message: "حصل خطأ أثناء إنشاء الحساب. حاول تاني.",
    };
  }

  return { ok: true };
}
