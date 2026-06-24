"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search, Download, CheckCircle, XCircle, Users, DollarSign,
  FileSpreadsheet, FileText, Globe, Hotel, BarChart3, Moon,
} from "lucide-react";

interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  organization: string | null;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
  room: {
    nameEn: string;
    nameRu: string;
    nameKy: string;
    price: number;
    type: string;
    hotel: { name: string; nameRu: string; nameKy: string };
  };
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  revenue: number;
}

function nights(b: Booking) {
  return Math.max(1, Math.floor(
    (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000
  ));
}

export default function AdminClient({ bookings: initial, stats, locale }: {
  bookings: Booking[];
  stats: Stats;
  locale: string;
}) {
  const t = useTranslations("admin");
  const [bookings, setBookings] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"bookings" | "stats" | "calc">("bookings");

  const roomName = (b: Booking) => locale === "ru" ? b.room.nameRu : locale === "ky" ? b.room.nameKy : b.room.nameEn;
  const hotelName = (b: Booking) => locale === "ru" ? b.room.hotel.nameRu : locale === "ky" ? b.room.hotel.nameKy : b.room.hotel.name;

  const filtered = bookings.filter((b) => {
    const matchSearch = search === "" || `${b.firstName} ${b.lastName} ${b.email} ${b.country}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || b.status === filter;
    return matchSearch && matchFilter;
  });

  const active = bookings.filter((b) => b.status !== "cancelled");

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  function exportCSV() {
    const rows = [
      ["#", "Фамилия", "Имя", "Email", "Страна", "Отель", "Номер", "Заезд", "Выезд", "Ночей", "Сумма $", "Статус"],
      ...filtered.map((b, i) => [
        i + 1, b.lastName, b.firstName, b.email, b.country,
        hotelName(b), roomName(b),
        new Date(b.checkIn).toLocaleDateString("ru-RU"),
        new Date(b.checkOut).toLocaleDateString("ru-RU"),
        nights(b), b.totalPrice, b.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bookings.csv";
    a.click();
  }

  function exportExcel() {
    window.open("/api/export/excel", "_blank");
  }

  function exportPDF() {
    import("jspdf").then(async ({ default: jsPDF }) => {
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(14);
      doc.text("SCO Bishkek 2026 — Реестр бронирований", 14, 15);
      doc.setFontSize(9);
      doc.text(`Дата формирования: ${new Date().toLocaleDateString("ru-RU")}`, 14, 22);

      autoTable(doc, {
        startY: 27,
        head: [["#", "ФИО", "Страна", "Отель", "Номер", "Заезд", "Выезд", "Ночей", "Сумма $", "Статус"]],
        body: filtered.map((b, i) => [
          i + 1,
          `${b.lastName} ${b.firstName}`,
          b.country,
          hotelName(b),
          roomName(b),
          new Date(b.checkIn).toLocaleDateString("ru-RU"),
          new Date(b.checkOut).toLocaleDateString("ru-RU"),
          nights(b),
          `$${b.totalPrice}`,
          b.status === "confirmed" ? "✓" : b.status === "cancelled" ? "✗" : "…",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [29, 78, 216] },
        alternateRowStyles: { fillColor: [239, 246, 255] },
      });

      doc.save(`sco-registry-${new Date().toISOString().slice(0, 10)}.pdf`);
    });
  }

  // ── Stats by country
  const byCountry: Record<string, { count: number; total: number }> = {};
  active.forEach((b) => {
    if (!byCountry[b.country]) byCountry[b.country] = { count: 0, total: 0 };
    byCountry[b.country].count++;
    byCountry[b.country].total += b.totalPrice;
  });
  const countrySorted = Object.entries(byCountry).sort((a, b) => b[1].count - a[1].count);

  // ── Stats by hotel
  const byHotel: Record<string, { count: number; total: number }> = {};
  active.forEach((b) => {
    const h = hotelName(b);
    if (!byHotel[h]) byHotel[h] = { count: 0, total: 0 };
    byHotel[h].count++;
    byHotel[h].total += b.totalPrice;
  });

  const statusBadge = (status: string) => {
    const s: Record<string, string> = {
      confirmed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      confirmed: locale === "ru" ? "Подтверждено" : "Confirmed",
      pending: locale === "ru" ? "Ожидает" : "Pending",
      cancelled: locale === "ru" ? "Отменено" : "Cancelled",
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s[status] ?? "bg-gray-100 text-gray-600"}`}>{labels[status] ?? status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold">{t("title")} — SCO Bishkek 2026</h1>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={exportExcel} className="flex items-center gap-1.5 bg-green-500/80 hover:bg-green-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: locale === "ru" ? "Всего" : "Total", value: stats.total, icon: Users, color: "blue" },
            { label: locale === "ru" ? "Подтверждено" : "Confirmed", value: stats.confirmed, icon: CheckCircle, color: "green" },
            { label: locale === "ru" ? "Ожидает" : "Pending", value: stats.pending, icon: Moon, color: "yellow" },
            { label: locale === "ru" ? "Доход" : "Revenue", value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign, color: "purple" },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {[
            { key: "bookings", label: locale === "ru" ? "Бронирования" : "Bookings", icon: Users },
            { key: "stats", label: locale === "ru" ? "Статистика" : "Statistics", icon: BarChart3 },
            { key: "calc", label: locale === "ru" ? "Расчёт" : "Calculation", icon: FileSpreadsheet },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Bookings ── */}
        {tab === "bookings" && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={locale === "ru" ? "Поиск по имени, email, стране..." : "Search..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {["all", "confirmed", "pending", "cancelled"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === s ? "bg-blue-700 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s === "all" ? (locale === "ru" ? "Все" : "All") :
                     s === "confirmed" ? (locale === "ru" ? "Подтверждено" : "Confirmed") :
                     s === "pending" ? (locale === "ru" ? "Ожидает" : "Pending") :
                     (locale === "ru" ? "Отменено" : "Cancelled")}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["#", locale === "ru" ? "Участник" : "Participant", locale === "ru" ? "Страна" : "Country", locale === "ru" ? "Отель / Номер" : "Hotel / Room", locale === "ru" ? "Даты" : "Dates", locale === "ru" ? "Ночей" : "Nights", locale === "ru" ? "Сумма" : "Amount", locale === "ru" ? "Статус" : "Status", ""].map((h, i) => (
                        <th key={i} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((b, i) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{b.lastName} {b.firstName}</p>
                          <p className="text-xs text-gray-400">{b.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{b.country}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 text-sm">{hotelName(b)}</p>
                          <p className="text-xs text-gray-400">{roomName(b)}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          <p>{new Date(b.checkIn).toLocaleDateString("ru-RU")}</p>
                          <p className="text-xs text-gray-400">→ {new Date(b.checkOut).toLocaleDateString("ru-RU")}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 font-medium">{nights(b)}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">${b.totalPrice}</td>
                        <td className="px-4 py-3">{statusBadge(b.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {b.status !== "confirmed" && (
                              <button onClick={() => updateStatus(b.id, "confirmed")} title="Подтвердить" className="text-green-600 hover:text-green-800">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {b.status !== "cancelled" && (
                              <button onClick={() => updateStatus(b.id, "cancelled")} title="Отменить" className="text-red-500 hover:text-red-700">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                          {locale === "ru" ? "Нет бронирований" : "No bookings found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Tab: Statistics ── */}
        {tab === "stats" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Country */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-blue-700" />
                <h2 className="font-semibold text-gray-900">{locale === "ru" ? "По странам" : "By Country"}</h2>
              </div>
              {countrySorted.length === 0 ? (
                <p className="text-gray-400 text-sm">{locale === "ru" ? "Нет данных" : "No data"}</p>
              ) : (
                <div className="space-y-2">
                  {countrySorted.map(([country, data]) => {
                    const pct = Math.round((data.count / active.length) * 100);
                    return (
                      <div key={country}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-800">{country}</span>
                          <span className="text-gray-500">{data.count} чел. · ${data.total}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* By Hotel */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Hotel className="w-4 h-4 text-blue-700" />
                <h2 className="font-semibold text-gray-900">{locale === "ru" ? "По отелям" : "By Hotel"}</h2>
              </div>
              {Object.keys(byHotel).length === 0 ? (
                <p className="text-gray-400 text-sm">{locale === "ru" ? "Нет данных" : "No data"}</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(byHotel)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([hotel, data]) => (
                      <div key={hotel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{hotel}</p>
                          <p className="text-xs text-gray-400">{data.count} {locale === "ru" ? "бронирований" : "bookings"}</p>
                        </div>
                        <span className="font-bold text-blue-700">${data.total}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-4">{locale === "ru" ? "Сводка" : "Summary"}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: locale === "ru" ? "Участников всего" : "Total participants", value: stats.total },
                  { label: locale === "ru" ? "Стран" : "Countries", value: Object.keys(byCountry).length },
                  { label: locale === "ru" ? "Отелей задействовано" : "Hotels", value: Object.keys(byHotel).length },
                  { label: locale === "ru" ? "Общая выручка" : "Total revenue", value: `$${stats.revenue.toFixed(0)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-blue-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-700">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Calculation / Расчёт проживания ── */}
        {tab === "calc" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {locale === "ru" ? "Расчёт стоимости проживания" : "Accommodation Cost Breakdown"}
              </h2>
              <button onClick={exportExcel} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
                {locale === "ru" ? "Скачать Excel" : "Download Excel"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["#", locale === "ru" ? "ФИО" : "Name", locale === "ru" ? "Страна" : "Country",
                      locale === "ru" ? "Отель" : "Hotel", locale === "ru" ? "Категория" : "Category",
                      locale === "ru" ? "Заезд" : "Check-in", locale === "ru" ? "Выезд" : "Check-out",
                      locale === "ru" ? "Ночей" : "Nights", locale === "ru" ? "Тариф/ночь" : "Rate/night",
                      locale === "ru" ? "Гостей" : "Guests", locale === "ru" ? "Итого $" : "Total $"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {active.map((b, i) => {
                    const n = nights(b);
                    return (
                      <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-blue-50/30"}>
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{b.lastName} {b.firstName}</td>
                        <td className="px-4 py-3 text-gray-600">{b.country}</td>
                        <td className="px-4 py-3 text-gray-600">{hotelName(b)}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded capitalize">{b.room.type}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(b.checkIn).toLocaleDateString("ru-RU")}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(b.checkOut).toLocaleDateString("ru-RU")}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">{n}</td>
                        <td className="px-4 py-3 text-gray-600">${b.room.price}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{b.guests}</td>
                        <td className="px-4 py-3 font-bold text-blue-700">${b.totalPrice}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-blue-700 text-white">
                  <tr>
                    <td colSpan={9} className="px-4 py-3 font-semibold text-right pr-4">
                      {locale === "ru" ? "ИТОГО:" : "TOTAL:"}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {active.reduce((s, b) => s + b.guests, 0)}
                    </td>
                    <td className="px-4 py-3 font-bold text-lg">
                      ${active.reduce((s, b) => s + b.totalPrice, 0).toFixed(0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
