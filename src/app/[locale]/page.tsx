import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { Star, MapPin, Calendar, Shield, Wifi, Car } from "lucide-react";

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  const hotels = await prisma.hotel.findMany({
    include: { rooms: { take: 1, orderBy: { price: "asc" } } },
    take: 6,
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-600/40 border border-blue-400/30 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {t("hero.event")}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-blue-100 text-lg mb-2">{t("hero.subtitle")}</p>
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-8">
              <Calendar className="w-4 h-4" />
              {t("hero.dates")}
            </div>
            <Link
              href={`/${locale}/hotels`}
              className="inline-flex items-center gap-2 bg-white text-blue-800 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Shield, text: locale === "ru" ? "Безопасное бронирование" : locale === "ky" ? "Коопсуз брондоо" : "Secure Booking" },
            { icon: Wifi, text: locale === "ru" ? "Wi-Fi в номерах" : locale === "ky" ? "Бөлмөлөрдө Wi-Fi" : "Wi-Fi in Rooms" },
            { icon: Car, text: locale === "ru" ? "Трансфер от аэропорта" : locale === "ky" ? "Аэропорттон трансфер" : "Airport Transfer" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-600">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-700" />
              </div>
              <span className="font-medium">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Hotels */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("hotels.title")}</h2>
          <p className="text-gray-500">{t("hotels.subtitle")}</p>
        </div>

        {hotels.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>Отели скоро появятся / Hotels coming soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => {
              const images = JSON.parse(hotel.images) as string[];
              const minPrice = hotel.rooms[0]?.price ?? 0;
              const name = locale === "ru" ? hotel.nameRu : locale === "ky" ? hotel.nameKy : hotel.name;

              return (
                <div key={hotel.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 relative">
                    {images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={images[0]} alt={name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 flex items-center gap-1 text-xs font-medium text-yellow-600">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {hotel.stars}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                      <MapPin className="w-3 h-3" />
                      {hotel.address}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400">{t("hotels.from")} </span>
                        <span className="font-bold text-blue-700">${minPrice}</span>
                        <span className="text-xs text-gray-400"> {t("hotels.perNight")}</span>
                      </div>
                      <Link
                        href={`/${locale}/hotels/${hotel.id}`}
                        className="bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        {t("hotels.viewRooms")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
