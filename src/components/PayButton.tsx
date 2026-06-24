"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export default function PayButton({
  bookingId,
  locale,
  amount,
}: {
  bookingId: string;
  locale: string;
  amount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment init failed");
      window.location.href = data.paymentUrl;
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {locale === "ru" ? "Переход к оплате..." : "Redirecting..."}
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {locale === "ru" ? `Оплатить $${amount}` : locale === "zh" ? `支付 $${amount}` : `Pay $${amount}`}
          </>
        )}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
      <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z"/></svg>
        {locale === "ru" ? "Безопасная оплата через FreedomPay" : "Secure payment via FreedomPay"}
      </p>
    </div>
  );
}
