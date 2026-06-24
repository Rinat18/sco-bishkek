import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const hotels = [
    {
      name: "Hyatt Regency Bishkek",
      nameRu: "Хаятт Ридженси Бишкек",
      nameKy: "Хаятт Риджэнси Бишкек",
      description: "Luxury 5-star hotel in the heart of Bishkek, the preferred choice for international delegations.",
      descRu: "Роскошный 5-звёздочный отель в центре Бишкека, предпочтительный выбор международных делегаций.",
      descKy: "Бишкектин борборунда жайгашкан 5 жылдыздуу люкс мейманкана, эл аралык делегациялар тандаган жер.",
      address: "ул. Советская 33, Бишкек",
      stars: 5,
      images: JSON.stringify(["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"]),
      amenities: JSON.stringify(["Wi-Fi", "Бассейн", "Спа", "Ресторан", "Конференц-зал", "Фитнес"]),
      phone: "+996 312 661 234",
      email: "reservations@hyatt-bishkek.kg",
    },
    {
      name: "Orion Hotel Bishkek",
      nameRu: "Отель Орион Бишкек",
      nameKy: "Орион Мейманканасы Бишкек",
      description: "Modern 4-star hotel with excellent transport links, ideal for business travelers.",
      descRu: "Современный 4-звёздочный отель с отличной транспортной доступностью, идеален для деловых путешественников.",
      descKy: "Заманбап 4 жылдыздуу мейманкана, транспорт байланыштары жакшы, бизнес саякатчылары үчүн идеалдуу.",
      address: "пр. Чуй 168, Бишкек",
      stars: 4,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"]),
      amenities: JSON.stringify(["Wi-Fi", "Ресторан", "Парковка", "Трансфер", "Конференц-зал"]),
      phone: "+996 312 555 000",
      email: "info@orion-hotel.kg",
    },
    {
      name: "South Hotel Bishkek",
      nameRu: "Отель Саут Бишкек",
      nameKy: "Саут Мейманканасы Бишкек",
      description: "Comfortable 4-star hotel surrounded by greenery, 10 minutes from the city centre.",
      descRu: "Комфортный 4-звёздочный отель в зелёном окружении, 10 минут от центра города.",
      descKy: "Жашылчалыктар арасында жайгашкан ыңгайлуу 4 жылдыздуу мейманкана, шаардын борборунан 10 мүнөт.",
      address: "ул. Ахунбаева 2Б, Бишкек",
      stars: 4,
      images: JSON.stringify(["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"]),
      amenities: JSON.stringify(["Wi-Fi", "Сад", "Ресторан", "Парковка", "Спортзал"]),
      phone: "+996 312 444 555",
      email: "booking@south-hotel.kg",
    },
  ];

  for (const hotel of hotels) {
    const created = await prisma.hotel.create({ data: hotel });

    if (hotel.stars === 5) {
      await prisma.room.createMany({
        data: [
          {
            hotelId: created.id,
            nameEn: "Deluxe King Room",
            nameRu: "Делюкс Кинг",
            nameKy: "Делюкс Кинг Бөлмө",
            type: "deluxe",
            price: 250,
            maxGuests: 2,
            images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"]),
            amenities: JSON.stringify(["King Bed", "City View", "Minibar", "Jacuzzi"]),
            totalCount: 20,
          },
          {
            hotelId: created.id,
            nameEn: "Presidential Suite",
            nameRu: "Президентский Люкс",
            nameKy: "Президент Люкс",
            type: "suite",
            price: 600,
            maxGuests: 4,
            images: JSON.stringify(["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800"]),
            amenities: JSON.stringify(["2 Bedrooms", "Living Room", "Butler Service", "Private Bar"]),
            totalCount: 5,
          },
        ],
      });
    } else {
      await prisma.room.createMany({
        data: [
          {
            hotelId: created.id,
            nameEn: "Standard Room",
            nameRu: "Стандартный Номер",
            nameKy: "Стандарт Бөлмө",
            type: "standard",
            price: 120,
            maxGuests: 2,
            images: JSON.stringify(["https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"]),
            amenities: JSON.stringify(["Double Bed", "Shower", "TV", "Wi-Fi"]),
            totalCount: 30,
          },
          {
            hotelId: created.id,
            nameEn: "Twin Room",
            nameRu: "Твин Номер",
            nameKy: "Твин Бөлмө",
            type: "twin",
            price: 140,
            maxGuests: 2,
            images: JSON.stringify(["https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800"]),
            amenities: JSON.stringify(["2 Single Beds", "Shower", "TV", "Wi-Fi"]),
            totalCount: 25,
          },
        ],
      });
    }
  }

  console.log("Seed complete: 3 hotels, rooms created");
}

main().catch(console.error).finally(() => prisma.$disconnect());
