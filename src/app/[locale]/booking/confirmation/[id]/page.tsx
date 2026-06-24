import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { CheckCircle } from "lucide-react";

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "confirmation" });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: { include: { hotel: true } } },
  });

  if (!booking) notFound();

  const hotelName = locale === "ru" ? booking.room.hotel.nameRu : locale === "ky" ? booking.room.hotel.nameKy : booking.room.hotel.name;
  const roomName = locale === "ru" ? booking.room.nameRu : locale === "ky" ? booking.room.nameKy : booking.room.nameEn;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-500 mb-8">{t("subtitle")}</p>

          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("bookingId")}</span>
              <span className="font-mono font-medium text-gray-900">{booking.id.slice(0, 12).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("hotel")}</span>
              <span className="font-medium text-gray-900">{hotelName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("room")}</span>
              <span className="font-medium text-gray-900">{roomName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("checkIn")}</span>
              <span className="font-medium text-gray-900">{new Date(booking.checkIn).toLocaleDateString(locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("checkOut")}</span>
              <span className="font-medium text-gray-900">{new Date(booking.checkOut).toLocaleDateString(locale)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-gray-500">{t("total")}</span>
              <span className="font-bold text-blue-700 text-lg">${booking.totalPrice}</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            {t("confirmed")}
          </div>

          <Link
            href={`/${locale}`}
            className="block w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
