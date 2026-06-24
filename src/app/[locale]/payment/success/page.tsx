import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ booking?: string }>;
}) {
  const { locale } = await params;
  const { booking: bookingId } = await searchParams;
  const t = await getTranslations({ locale, namespace: "booking" });

  const booking = bookingId
    ? await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { room: { include: { hotel: true } } },
      })
    : null;

  const hotelName = booking
    ? locale === "ru" ? booking.room.hotel.nameRu : locale === "ky" ? booking.room.hotel.nameKy : booking.room.hotel.name
    : "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {locale === "ru" ? "Оплата прошла успешно!" : locale === "ky" ? "Төлөм ийгиликтүү өттү!" : locale === "zh" ? "支付成功！" : "Payment Successful!"}
        </h1>
        <p className="text-gray-500 mb-6">
          {locale === "ru"
            ? "Бронирование подтверждено. Детали отправлены на ваш email."
            : "Booking confirmed. Details sent to your email."}
        </p>

        {booking && (
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{locale === "ru" ? "Отель" : "Hotel"}</span>
              <span className="font-medium text-gray-900">{hotelName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{locale === "ru" ? "Гость" : "Guest"}</span>
              <span className="font-medium text-gray-900">{booking.lastName} {booking.firstName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{locale === "ru" ? "Номер брони" : "Booking ID"}</span>
              <span className="font-mono text-xs text-gray-600">{booking.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-500">{locale === "ru" ? "Оплачено" : "Paid"}</span>
              <span className="font-bold text-green-600">${booking.totalPrice}</span>
            </div>
          </div>
        )}

        <Link
          href={`/${locale}`}
          className="block w-full bg-blue-700 text-white font-semibold py-3 rounded-xl text-center hover:bg-blue-800 transition-colors"
        >
          {locale === "ru" ? "На главную" : "Back to Home"}
        </Link>
      </div>
    </div>
  );
}
