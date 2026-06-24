import crypto from "crypto";

const FP_API_URL = process.env.FP_API_URL ?? "https://api.freedompay.kz/g2g/payment_page/";
const FP_MERCHANT_ID = process.env.FP_MERCHANT_ID!;
const FP_SECRET_KEY = process.env.FP_SECRET_KEY!;

const LANG_MAP: Record<string, string> = { ru: "ru", en: "en", ky: "kg", zh: "en" };

export interface FPPaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerPhone: string;
  successUrl: string;
  failureUrl: string;
  resultUrl: string;
  locale?: string;
}

// Signature: MD5(scriptName + ";" + sortedValues.join(";") + ";" + secretKey)
// Only params with non-empty values are included
function buildSignature(scriptName: string, params: Record<string, string>, secretKey: string): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "pg_sig" && params[k] !== "" && params[k] != null)
    .sort()
    .map((k) => params[k]);
  const str = [scriptName, ...sorted, secretKey].join(";");
  console.log("[FP] sig string:", str);
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function createFPPayment(p: FPPaymentParams): Promise<{ paymentUrl: string; paymentId: string }> {
  const salt = crypto.randomBytes(8).toString("hex");
  const scriptName = "payment_page";

  // Build params — only include non-empty values
  const params: Record<string, string> = {};
  const assign = (k: string, v: string) => { if (v) params[k] = v; };

  assign("pg_merchant_id", FP_MERCHANT_ID);
  assign("pg_order_id", p.orderId);
  assign("pg_amount", p.amount.toFixed(2));
  assign("pg_currency", p.currency);
  assign("pg_description", p.description);
  assign("pg_salt", salt);
  assign("pg_result_url", p.resultUrl);
  assign("pg_success_url", p.successUrl);
  assign("pg_failure_url", p.failureUrl);
  assign("pg_language", LANG_MAP[p.locale ?? "ru"] ?? "ru");
  assign("pg_user_email", p.customerEmail);
  assign("pg_user_phone", p.customerPhone);

  params.pg_sig = buildSignature(scriptName, params, FP_SECRET_KEY);

  console.log("[FP] params:", JSON.stringify(params, null, 2));

  const body = new URLSearchParams(params);
  const res = await fetch(FP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const xml = await res.text();
  console.log("[FP] response XML:", xml);

  const paymentUrl = xml.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/)?.[1] ?? "";
  const paymentId = xml.match(/<pg_payment_id>(.*?)<\/pg_payment_id>/)?.[1] ?? "";
  const status = xml.match(/<pg_status>(.*?)<\/pg_status>/)?.[1] ?? "";
  const errorCode = xml.match(/<pg_error_code>(.*?)<\/pg_error_code>/)?.[1] ?? "";
  const errorDescription = xml.match(/<pg_error_description>(.*?)<\/pg_error_description>/)?.[1] ?? "";

  if (status !== "ok" || !paymentUrl) {
    throw new Error(`FreedomPay [${errorCode}]: ${errorDescription || xml}`);
  }

  return { paymentUrl, paymentId };
}

export function verifyCallback(params: Record<string, string>): boolean {
  const sig = params.pg_sig;
  if (!sig) return false;
  const scriptName = params.pg_script_name ?? "result.php";
  const sorted = Object.keys(params)
    .filter((k) => k !== "pg_sig" && params[k] !== "")
    .sort()
    .map((k) => params[k]);
  const str = [scriptName, ...sorted, FP_SECRET_KEY].join(";");
  const expected = crypto.createHash("md5").update(str).digest("hex");
  return expected === sig;
}
