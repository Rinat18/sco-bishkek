import crypto from "crypto";

const FP_API_URL = process.env.FP_API_URL ?? "https://api.freedompay.kz/g2g/payment_page/";
const FP_MERCHANT_ID = process.env.FP_MERCHANT_ID!;
const FP_SECRET_KEY = process.env.FP_SECRET_KEY!;

// Map next-intl locales → FP language codes
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

// MD5("payment_page;" + sorted param values joined by ";" + ";" + secretKey)
function buildSignature(scriptName: string, params: Record<string, string>, secretKey: string): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "pg_sig")
    .sort()
    .map((k) => params[k]);
  const str = [scriptName, ...sorted, secretKey].join(";");
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function createFPPayment(p: FPPaymentParams): Promise<{ paymentUrl: string; paymentId: string }> {
  const salt = crypto.randomBytes(8).toString("hex");
  const scriptName = "payment_page";

  const params: Record<string, string> = {
    pg_merchant_id: FP_MERCHANT_ID,
    pg_order_id: p.orderId,
    pg_amount: p.amount.toFixed(2),
    pg_currency: p.currency,
    pg_description: p.description,
    pg_salt: salt,
    pg_result_url: p.resultUrl,
    pg_success_url: p.successUrl,
    pg_failure_url: p.failureUrl,
    pg_language: LANG_MAP[p.locale ?? "ru"] ?? "ru",
    pg_user_email: p.customerEmail,
    pg_user_phone: p.customerPhone,
  };

  params.pg_sig = buildSignature(scriptName, params, FP_SECRET_KEY);

  const body = new URLSearchParams(params);
  const res = await fetch(FP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const xml = await res.text();

  const paymentUrl = xml.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/)?.[1] ?? "";
  const paymentId = xml.match(/<pg_payment_id>(.*?)<\/pg_payment_id>/)?.[1] ?? "";
  const status = xml.match(/<pg_status>(.*?)<\/pg_status>/)?.[1] ?? "";
  const errorDescription = xml.match(/<pg_error_description>(.*?)<\/pg_error_description>/)?.[1] ?? "";

  if (status !== "ok" || !paymentUrl) {
    throw new Error(`FreedomPay error: ${errorDescription || xml}`);
  }

  return { paymentUrl, paymentId };
}

// Верификация подписи от FP (result_url callback)
export function verifyCallback(params: Record<string, string>): boolean {
  const sig = params.pg_sig;
  if (!sig) return false;
  // FP передаёт pg_script_name в callback
  const scriptName = params.pg_script_name ?? "result.php";
  const sorted = Object.keys(params)
    .filter((k) => k !== "pg_sig")
    .sort()
    .map((k) => params[k]);
  const str = [scriptName, ...sorted, FP_SECRET_KEY].join(";");
  const expected = crypto.createHash("md5").update(str).digest("hex");
  return expected === sig;
}
