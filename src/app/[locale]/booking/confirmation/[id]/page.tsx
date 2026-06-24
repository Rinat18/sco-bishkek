import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import PayButton from "@/components/PayButton";

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
  const isPaid = booking.paymentStatus === "paid";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("title")}</h1>
            <p className="text-gray-500 text-sm">{t("subtitle")}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 space-y-3 mb-6">
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

          {isPaid ? (
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {t("confirmed")}
              </div>
              <Link
                href={`/${locale}`}
                className="w-full text-center bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors"
              >
                {t("backHome")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium w-fit mx-auto">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                {locale === "ru" ? "Ожидает оплаты" : "Awaiting payment"}
              </div>
              <PayButton bookingId={booking.id} locale={locale} amount={booking.totalPrice} />
              <Link
                href={`/${locale}`}
                className="w-full text-center border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                {t("backHome")}
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
