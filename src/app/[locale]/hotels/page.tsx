import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { Star, MapPin } from "lucide-react";

export default async function HotelsPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  const hotels = await prisma.hotel.findMany({
    include: { rooms: { orderBy: { price: "asc" } } },
    orderBy: { stars: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("hotels.title")}</h1>
        <p className="text-gray-500 mb-8">{t("hotels.subtitle")}</p>

        {hotels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <p className="text-lg">Отели скоро появятся</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hotels.map((hotel) => {
              const images = JSON.parse(hotel.images) as string[];
              const name = locale === "ru" ? hotel.nameRu : locale === "ky" ? hotel.nameKy : hotel.name;
              const desc = locale === "ru" ? hotel.descRu : locale === "ky" ? hotel.descKy : hotel.description;
              const amenities = JSON.parse(hotel.amenities) as string[];
              const minPrice = hotel.rooms[0]?.price ?? 0;

              return (
                <div key={hotel.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-56 h-48 sm:h-auto bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0">
                      {images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={images[0]} alt={name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
                          <div className="flex items-center gap-1 text-yellow-500 ml-2 flex-shrink-0">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                          <MapPin className="w-3 h-3" />
                          {hotel.address}
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{desc}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {amenities.slice(0, 4).map((a, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{a}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400">{t("hotels.from")} </span>
                          <span className="font-bold text-blue-700 text-lg">${minPrice}</span>
                          <span className="text-xs text-gray-400"> {t("hotels.perNight")}</span>
                        </div>
                        <Link
                          href={`/${locale}/hotels/${hotel.id}`}
                          className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                        >
                          {t("hotels.viewRooms")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
