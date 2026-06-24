import Link from "next/link";
import { XCircle } from "lucide-react";

export default async function PaymentFailurePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ booking?: string }>;
}) {
  const { locale } = await params;
  const { booking: bookingId } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-9 h-9 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {locale === "ru" ? "Оплата не прошла" : locale === "ky" ? "Төлөм ийгиликсиз болду" : locale === "zh" ? "支付失败" : "Payment Failed"}
        </h1>
        <p className="text-gray-500 mb-6">
          {locale === "ru"
            ? "Что-то пошло не так. Вы можете попробовать ещё раз или выбрать другую карту."
            : "Something went wrong. Please try again or use a different card."}
        </p>

        <div className="flex flex-col gap-3">
          {bookingId && (
            <Link
              href={`/${locale}/booking/confirmation/${bookingId}`}
              className="block w-full bg-blue-700 text-white font-semibold py-3 rounded-xl text-center hover:bg-blue-800 transition-colors"
            >
              {locale === "ru" ? "Попробовать снова" : "Try Again"}
            </Link>
          )}
          <Link
            href={`/${locale}`}
            className="block w-full border border-gray-200 text-gray-700 font-medium py-3 rounded-xl text-center hover:bg-gray-50 transition-colors"
          >
            {locale === "ru" ? "На главную" : "Back to Home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
