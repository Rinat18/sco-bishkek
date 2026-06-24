"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { CreditCard, Lock } from "lucide-react";

interface Room {
  id: string;
  price: number;
  nameEn: string;
  nameRu: string;
  nameKy: string;
}

export default function BookingForm({ room, locale }: { room: Room; locale: string }) {
  const t = useTranslations("booking");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    organization: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    notes: "",
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvv: "",
  });

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function nights(): number {
    if (!form.checkIn || !form.checkOut) return 0;
    const diff = new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  const total = nights() * room.price;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          organization: form.organization,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: form.guests,
          notes: form.notes,
          totalPrice: total,
        }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/${locale}/booking/confirmation/${data.id}`);
      }
    } catch {
      alert("Error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Step 1: Personal info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">{t("personalInfo")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("firstName")} *</label>
            <input className={inputClass} required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>{t("lastName")} *</label>
            <input className={inputClass} required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>{t("email")} *</label>
            <input type="email" className={inputClass} required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>{t("phone")} *</label>
            <input type="tel" className={inputClass} required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+996 700 000 000" />
          </div>
          <div>
            <label className={labelClass}>{t("country")} *</label>
            <input className={inputClass} required value={form.country} onChange={(e) => update("country", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>{t("organization")}</label>
            <input className={inputClass} value={form.organization} onChange={(e) => update("organization", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Step 2: Stay details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">{t("stayDetails")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("checkIn")} *</label>
            <input type="date" className={inputClass} required value={form.checkIn} onChange={(e) => update("checkIn", e.target.value)} min="2026-07-14" max="2026-07-17" />
          </div>
          <div>
            <label className={labelClass}>{t("checkOut")} *</label>
            <input type="date" className={inputClass} required value={form.checkOut} onChange={(e) => update("checkOut", e.target.value)} min="2026-07-15" max="2026-07-18" />
          </div>
          <div>
            <label className={labelClass}>{t("guests")} *</label>
            <input type="number" className={inputClass} required min={1} max={4} value={form.guests} onChange={(e) => update("guests", parseInt(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>{t("notes")}</label>
            <input className={inputClass} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
        </div>
        {nights() > 0 && (
          <div className="mt-4 bg-blue-50 rounded-lg p-3 text-sm">
            <span className="text-gray-600">{t("total")}: </span>
            <span className="font-bold text-blue-700">${total}</span>
            <span className="text-gray-500"> ({nights()} {t("nights")})</span>
          </div>
        )}
      </div>

      {/* Step 3: Payment */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-blue-700" />
          <h2 className="font-semibold text-gray-900">{t("payment")}</h2>
          <Lock className="w-3.5 h-3.5 text-gray-400 ml-auto" />
          <span className="text-xs text-gray-400">SSL</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>{t("cardNumber")} *</label>
            <input
              className={inputClass}
              required
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              value={form.cardNumber}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                update("cardNumber", v);
              }}
            />
          </div>
          <div>
            <label className={labelClass}>{t("cardHolder")} *</label>
            <input className={inputClass} required placeholder="IVAN IVANOV" value={form.cardHolder} onChange={(e) => update("cardHolder", e.target.value.toUpperCase())} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("expiry")} *</label>
              <input
                className={inputClass}
                required
                placeholder="MM/YY"
                maxLength={5}
                value={form.expiry}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  update("expiry", v.length >= 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                }}
              />
            </div>
            <div>
              <label className={labelClass}>{t("cvv")} *</label>
              <input className={inputClass} required placeholder="123" maxLength={3} type="password" value={form.cvv} onChange={(e) => update("cvv", e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
        </div>
      </div>

      {/* Total + Submit */}
      <div className="bg-blue-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-blue-100">{t("total")}</span>
          <span className="text-2xl font-bold">${total || "—"}</span>
        </div>
        <button
          type="submit"
          disabled={loading || nights() === 0}
          className="w-full bg-white text-blue-700 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("processing") : t("confirm")}
        </button>
      </div>
    </form>
  );
}
