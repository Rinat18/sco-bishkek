"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Download, CheckCircle, XCircle, Users, DollarSign } from "lucide-react";

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
    hotel: {
      name: string;
      nameRu: string;
      nameKy: string;
    };
  };
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  revenue: number;
}

export default function AdminClient({ bookings: initial, stats, locale }: { bookings: Booking[]; stats: Stats; locale: string }) {
  const t = useTranslations("admin");
  const [bookings, setBookings] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const roomName = (b: Booking) => locale === "ru" ? b.room.nameRu : locale === "ky" ? b.room.nameKy : b.room.nameEn;
  const hotelName = (b: Booking) => locale === "ru" ? b.room.hotel.nameRu : locale === "ky" ? b.room.hotel.nameKy : b.room.hotel.name;

  const filtered = bookings.filter((b) => {
    const matchSearch = search === "" || `${b.firstName} ${b.lastName} ${b.email}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || b.status === filter;
    return matchSearch && matchFilter;
  });

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/bookings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  function exportCSV() {
    const rows = [
      ["ID", "Name", "Email", "Phone", "Hotel", "Room", "CheckIn", "CheckOut", "Amount", "Status"],
      ...filtered.map((b) => [
        b.id,
        `${b.firstName} ${b.lastName}`,
        b.email,
        b.phone,
        hotelName(b),
        roomName(b),
        new Date(b.checkIn).toLocaleDateString(),
        new Date(b.checkOut).toLocaleDateString(),
        `$${b.totalPrice}`,
        b.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings.csv";
    a.click();
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">{t("title")} — SCO Bishkek 2026</h1>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t("total"), value: stats.total, icon: Users, color: "blue" },
            { label: t("confirmed"), value: stats.confirmed, icon: CheckCircle, color: "green" },
            { label: t("pending"), value: stats.pending, icon: CheckCircle, color: "yellow" },
            { label: t("revenue"), value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign, color: "purple" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-${color}-50`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("search")}
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
                {s === "all" ? (locale === "ru" ? "Все" : locale === "ky" ? "Баары" : "All") : t(s as "confirmed" | "pending" | "cancelled")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[t("name"), t("hotel"), t("room"), t("dates"), t("amount"), t("status"), t("actions")].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.firstName} {b.lastName}</p>
                      <p className="text-xs text-gray-400">{b.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{hotelName(b)}</td>
                    <td className="px-4 py-3 text-gray-600">{roomName(b)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{new Date(b.checkIn).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">→ {new Date(b.checkOut).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">${b.totalPrice}</td>
                    <td className="px-4 py-3">{statusBadge(b.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {b.status !== "confirmed" && (
                          <button onClick={() => updateStatus(b.id, "confirmed")} className="text-green-600 hover:text-green-800">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button onClick={() => updateStatus(b.id, "cancelled")} className="text-red-500 hover:text-red-700">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      {locale === "ru" ? "Нет бронирований" : "No bookings found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
