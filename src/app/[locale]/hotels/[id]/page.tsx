import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { Star, MapPin, Phone, Mail, Users } from "lucide-react";

export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: { rooms: { orderBy: { price: "asc" } } },
  });

  if (!hotel) notFound();

  const images = JSON.parse(hotel.images) as string[];
  const amenities = JSON.parse(hotel.amenities) as string[];
  const name = locale === "ru" ? hotel.nameRu : locale === "ky" ? hotel.nameKy : hotel.name;
  const desc = locale === "ru" ? hotel.descRu : locale === "ky" ? hotel.descKy : hotel.description;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="h-72 bg-gradient-to-br from-blue-100 to-blue-200 relative">
            {images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt={name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <div className="flex items-center gap-1">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
              <MapPin className="w-4 h-4" />
              {hotel.address}
            </div>
            <p className="text-gray-600 mb-4">{desc}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {amenities.map((a, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">{a}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {hotel.phone}
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {hotel.email}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">{t("room.type")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotel.rooms.map((room) => {
            const roomImages = JSON.parse(room.images) as string[];
            const roomAmenities = JSON.parse(room.amenities) as string[];
            const roomName = locale === "ru" ? room.nameRu : locale === "ky" ? room.nameKy : room.nameEn;

            return (
              <div key={room.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                  {roomImages[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={roomImages[0]} alt={roomName} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{roomName}</h3>
                      <span className="text-xs text-gray-400 capitalize">{room.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-700 text-lg">${room.price}</span>
                      <span className="text-xs text-gray-400 block">{t("room.perNight")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                    <Users className="w-4 h-4" />
                    {t("room.guests")}: {room.maxGuests}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {roomAmenities.slice(0, 3).map((a, i) => (
                      <span key={i} className="bg-gray-50 text-gray-600 text-xs px-2 py-0.5 rounded border border-gray-200">{a}</span>
                    ))}
                  </div>
                  {room.available ? (
                    <Link
                      href={`/${locale}/booking/${room.id}`}
                      className="block w-full text-center bg-blue-700 text-white font-medium py-2 rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      {t("room.book")}
                    </Link>
                  ) : (
                    <button disabled className="w-full bg-gray-200 text-gray-400 font-medium py-2 rounded-lg cursor-not-allowed">
                      {locale === "ru" ? "Нет мест" : "Not Available"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
