import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";

export default async function BookingPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "booking" });

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { hotel: true },
  });

  if (!room) notFound();

  const hotelName = locale === "ru" ? room.hotel.nameRu : locale === "ky" ? room.hotel.nameKy : room.hotel.name;
  const roomName = locale === "ru" ? room.nameRu : locale === "ky" ? room.nameKy : room.nameEn;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">{t("summary")}</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">{locale === "ru" ? "Отель" : locale === "ky" ? "Мейманкана" : "Hotel"}</p>
                  <p className="font-medium text-gray-800">{hotelName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: room.hotel.stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">{locale === "ru" ? "Номер" : locale === "ky" ? "Бөлмө" : "Room"}</p>
                  <p className="font-medium text-gray-800">{roomName}</p>
                  <p className="text-gray-500 text-xs capitalize">{room.type}</p>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-gray-400 text-xs mb-0.5">{locale === "ru" ? "Цена за ночь" : locale === "ky" ? "Бир түнгө" : "Per night"}</p>
                  <p className="font-bold text-blue-700 text-lg">${room.price}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            <BookingForm room={{ id: room.id, price: room.price, nameEn: room.nameEn, nameRu: room.nameRu, nameKy: room.nameKy }} locale={locale} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
