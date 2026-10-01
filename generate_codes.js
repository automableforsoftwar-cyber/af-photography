/**
 * generate_codes.js — launch / batch VIP codes
 *
 * Launch (100 codes → VIP_CODES_EXPORT.txt + Supabase insert):
 *   node generate_codes.js --launch
 *
 * Single course:
 *   node generate_codes.js --course=photographer-eye --count=50
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
  const opts = {
    course: null,
    count: 10,
    prefix: "AFP",
    maxUses: 1,
    launch: false,
  };
  for (const arg of argv) {
    if (arg === "--launch") opts.launch = true;
    else if (arg.startsWith("--course=")) opts.course = arg.slice(9);
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

function generateUnique(count, prefix, existing = new Set()) {
  const codes = new Set(existing);
  while (codes.size < existing.size + count) {
    codes.add(makeCode(prefix));
  }
  return Array.from(codes).slice(-count);
}

async function insertRows(rows) {
  const env = { ...process.env, ...loadEnvLocal() };
  const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !serviceKey) {
    console.warn(
      "No SUPABASE_SERVICE_ROLE_KEY — skipping remote insert (export file still written).",
    );
    return { inserted: 0, sqlFallback: true };
  }

  const { createClient } = require("@supabase/supabase-js");
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.from("access_codes").insert(rows).select("code");
  if (error) {
    console.error("Insert failed:", error.message);
    return { inserted: 0, error: error.message };
  }
  return { inserted: data?.length ?? 0 };
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

async function runLaunch() {
  const photographer = generateUnique(50, "AFP");
  const smart = generateUnique(50, "AFP", new Set(photographer));

  const photoRows = photographer.map((code) => ({
    code,
    target_course: "photographer-eye",
    max_uses: 1,
    current_uses: 0,
  }));
  const smartRows = smart.map((code) => ({
    code,
    target_course: "smart-start",
    max_uses: 1,
    current_uses: 0,
  }));
  const allRows = [...photoRows, ...smartRows];

  const exportPath = path.join(process.cwd(), "VIP_CODES_EXPORT.txt");
  const body = [
    "AF P — VIP CODES EXPORT (LAUNCH)",
    `Generated: ${new Date().toISOString()}`,
    "Each code is single-use and unlocks ONE course for 30 days.",
    "",
    "========================================",
    "SECTION 1: 50 Codes for Photographer Eye",
    "target_course = photographer-eye",
    "========================================",
    "",
    ...photographer,
    "",
    "========================================",
    "SECTION 2: 50 Codes for Smart Start",
    "target_course = smart-start",
    "========================================",
    "",
    ...smart,
    "",
    `TOTAL: ${allRows.length} codes`,
    "",
  ].join("\n");

  fs.writeFileSync(exportPath, body, "utf8");
  console.log(`Wrote ${exportPath}`);

  const result = await insertRows(allRows);
  if (result.error) {
    console.log("\n-- Fallback SQL:");
    printSql(allRows);
    process.exit(1);
  }
  if (result.sqlFallback) {
    console.log("\n-- SQL (paste if insert skipped):");
    printSql(allRows);
  } else {
    console.log(`Inserted ${result.inserted} rows into access_codes.`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.launch) {
    await runLaunch();
    return;
  }

  if (!opts.course) {
    console.error(
      "Missing --course or use --launch. Example: node generate_codes.js --launch",
    );
    process.exit(1);
  }
  if (!Number.isFinite(opts.count) || opts.count < 1) {
    console.error("--count must be a positive number");
    process.exit(1);
  }

  const list = generateUnique(opts.count, opts.prefix);
  const rows = list.map((code) => ({
    code,
    target_course: opts.course,
    max_uses: opts.maxUses,
    current_uses: 0,
  }));

  console.log(`# Generated ${rows.length} codes for course "${opts.course}"`);
  console.log(list.join("\n"));
  console.log("");

  const result = await insertRows(rows);
  if (result.error || result.sqlFallback) {
    printSql(rows);
    if (result.error) process.exit(1);
  } else {
    console.log(`Inserted ${result.inserted} rows into access_codes.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
