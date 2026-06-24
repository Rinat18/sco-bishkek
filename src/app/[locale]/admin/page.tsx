import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const locale = await getLocale();

  const bookings = await prisma.booking.findMany({
    include: { room: { include: { hotel: true } } },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    revenue: bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.totalPrice, 0),
  };

  return <AdminClient bookings={bookings} stats={stats} locale={locale} />;
}
