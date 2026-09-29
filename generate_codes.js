/**
 * generate_codes.js
 *
 * Batch-generate unique single-use VIP codes for a specific course.
 *
 * Usage:
 *   node generate_codes.js --course=photographer-eye --count=50
 *   node generate_codes.js --course=smart-start --count=20 --prefix=AFP
 *
 * If SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL are set in .env.local,
 * codes are inserted into access_codes. Otherwise SQL INSERT statements are printed.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    out[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return out;
}

function parseArgs(argv) {
  const opts = { course: null, count: 10, prefix: "AFP", maxUses: 1 };
  for (const arg of argv) {
    if (arg.startsWith("--course=")) opts.course = arg.slice(9);
    else if (arg.startsWith("--count=")) opts.count = Number(arg.slice(8));
    else if (arg.startsWith("--prefix=")) opts.prefix = arg.slice(9);
    else if (arg.startsWith("--max-uses=")) opts.maxUses = Number(arg.slice(11));
  }
  return opts;
}

function makeCode(prefix) {
  const a = crypto.randomBytes(2).toString("hex").toUpperCase();
  const b = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${a}-${b}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.course) {
    console.error(
      "Missing --course. Example: node generate_codes.js --course=photographer-eye --count=50",
    );
    process.exit(1);
  }
  if (!Number.isFinite(opts.count) || opts.count < 1) {
    console.error("--count must be a positive number");
    process.exit(1);
  }

  const codes = new Set();
  while (codes.size < opts.count) {
    codes.add(makeCode(opts.prefix));
  }
  const list = Array.from(codes);

  const env = { ...process.env, ...loadEnvLocal() };
  const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

  const rows = list.map((code) => ({
    code,
    target_course: opts.course,
    max_uses: opts.maxUses,
    current_uses: 0,
  }));

  console.log(`# Generated ${rows.length} codes for course "${opts.course}"`);
  console.log(list.join("\n"));
  console.log("");

  if (url && serviceKey) {
    const { createClient } = require("@supabase/supabase-js");
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.from("access_codes").insert(rows).select("code");
    if (error) {
      console.error("Insert failed:", error.message);
      console.log("\n-- Fallback SQL:");
      printSql(rows);
      process.exit(1);
    }
    console.log(`Inserted ${data?.length ?? 0} rows into access_codes.`);
    return;
  }

  console.log(
    "# No SUPABASE_SERVICE_ROLE_KEY found — printing SQL instead. Paste into Supabase SQL Editor.\n",
  );
  printSql(rows);
}

function printSql(rows) {
  const values = rows
    .map(
      (r) =>
        `('${r.code.replace(/'/g, "''")}', '${r.target_course.replace(/'/g, "''")}', ${r.max_uses}, 0)`,
    )
    .join(",\n  ");
  console.log(
    `INSERT INTO public.access_codes (code, target_course, max_uses, current_uses)\nVALUES\n  ${values};`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
