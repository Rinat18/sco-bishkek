import crypto from "crypto";

const FP_API_URL = process.env.FP_API_URL ?? "https://pay.freedompay.money/init_payment.php";
const FP_MERCHANT_ID = process.env.FP_MERCHANT_ID!;
const FP_SECRET_KEY = process.env.FP_SECRET_KEY!;

export interface FPPaymentParams {
  orderId: string;
  amount: number;       // в сомах (или USD — зависит от настройки мерчанта)
  currency: string;
  description: string;
  customerEmail: string;
  customerPhone: string;
  successUrl: string;
  failureUrl: string;
  resultUrl: string;    // webhook callback
}

function buildSignature(params: Record<string, string>, secretKey: string): string {
  // FreedomPay signature: MD5("init_payment.php;" + sorted values joined by ";" + ";" + secretKey)
  const sorted = Object.keys(params)
    .filter((k) => k !== "pg_sig")
    .sort()
    .map((k) => params[k]);
  const str = ["init_payment.php", ...sorted, secretKey].join(";");
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function createFPPayment(p: FPPaymentParams): Promise<{ paymentUrl: string; paymentId: string }> {
  const salt = crypto.randomBytes(8).toString("hex");

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
    pg_request_method: "GET",
    pg_language: "ru",
    pg_user_contact_email: p.customerEmail,
    pg_user_phone: p.customerPhone,
  };

  params.pg_sig = buildSignature(params, FP_SECRET_KEY);

  const body = new URLSearchParams(params);
  const res = await fetch(FP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const xml = await res.text();

  // Parse XML response
  const paymentUrl = xml.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/)?.[1] ?? "";
  const paymentId = xml.match(/<pg_payment_id>(.*?)<\/pg_payment_id>/)?.[1] ?? "";
  const status = xml.match(/<pg_status>(.*?)<\/pg_status>/)?.[1] ?? "";
  const errorDescription = xml.match(/<pg_error_description>(.*?)<\/pg_error_description>/)?.[1] ?? "";

  if (status !== "ok" || !paymentUrl) {
    throw new Error(`FreedomPay error: ${errorDescription || xml}`);
  }

  return { paymentUrl, paymentId };
}

export function verifyCallback(params: Record<string, string>): boolean {
  const sig = params.pg_sig;
  if (!sig) return false;
  const script = params.pg_script_name ?? "callback.php";
  const sorted = Object.keys(params)
    .filter((k) => k !== "pg_sig")
    .sort()
    .map((k) => params[k]);
  const str = [script, ...sorted, FP_SECRET_KEY].join(";");
  const expected = crypto.createHash("md5").update(str).digest("hex");
  return expected === sig;
}
