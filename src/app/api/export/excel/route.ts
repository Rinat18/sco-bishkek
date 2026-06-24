import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { room: { include: { hotel: true } } },
    orderBy: { createdAt: "asc" },
  });

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Реестр бронирований ──
  const registryRows = bookings.map((b, i) => {
    const nights = Math.max(
      1,
      Math.floor((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000)
    );
    return {
      "№": i + 1,
      "Фамилия": b.lastName,
      "Имя": b.firstName,
      "Email": b.email,
      "Телефон": b.phone,
      "Страна": b.country,
      "Организация": b.organization ?? "",
      "Отель": b.room.hotel.nameRu,
      "Номер": b.room.nameRu,
      "Тип": b.room.type,
      "Заезд": new Date(b.checkIn).toLocaleDateString("ru-RU"),
      "Выезд": new Date(b.checkOut).toLocaleDateString("ru-RU"),
      "Ночей": nights,
      "Цена/ночь $": b.room.price,
      "Итого $": b.totalPrice,
      "Статус": b.status === "confirmed" ? "Подтверждено" : b.status === "cancelled" ? "Отменено" : "Ожидает",
      "Оплата": b.paymentStatus === "paid" ? "Оплачено" : "Не оплачено",
      "Дата брони": new Date(b.createdAt).toLocaleDateString("ru-RU"),
    };
  });

  const wsRegistry = XLSX.utils.json_to_sheet(registryRows);
  wsRegistry["!cols"] = [
    { wch: 4 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 16 },
    { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 },
    { wch: 14 }, { wch: 12 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRegistry, "Реестр");

  // ── Sheet 2: Расчёт проживания ──
  const calcRows = bookings
    .filter((b) => b.status !== "cancelled")
    .map((b, i) => {
      const nights = Math.max(
        1,
        Math.floor((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000)
      );
      return {
        "№": i + 1,
        "ФИО": `${b.lastName} ${b.firstName}`,
        "Страна": b.country,
        "Организация": b.organization ?? "",
        "Отель": b.room.hotel.nameRu,
        "Категория": b.room.type,
        "Дата заезда": new Date(b.checkIn).toLocaleDateString("ru-RU"),
        "Дата выезда": new Date(b.checkOut).toLocaleDateString("ru-RU"),
        "Кол-во ночей": nights,
        "Гостей": b.guests,
        "Тариф $/ночь": b.room.price,
        "Стоимость $": b.totalPrice,
      };
    });

  const wsCalc = XLSX.utils.json_to_sheet(calcRows);
  // Итоговая строка
  const totalRow = calcRows.reduce((sum, r) => sum + (r["Стоимость $"] as number), 0);
  XLSX.utils.sheet_add_aoa(wsCalc, [[
    "", "", "", "", "", "", "", "ИТОГО:", "", "", "", totalRow,
  ]], { origin: calcRows.length + 1 });
  wsCalc["!cols"] = [
    { wch: 4 }, { wch: 25 }, { wch: 14 }, { wch: 20 }, { wch: 22 },
    { wch: 10 }, { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 8 },
    { wch: 13 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCalc, "Расчёт проживания");

  // ── Sheet 3: Статистика по странам ──
  const byCountry: Record<string, { count: number; total: number }> = {};
  bookings
    .filter((b) => b.status !== "cancelled")
    .forEach((b) => {
      if (!byCountry[b.country]) byCountry[b.country] = { count: 0, total: 0 };
      byCountry[b.country].count++;
      byCountry[b.country].total += b.totalPrice;
    });

  const statsRows = Object.entries(byCountry)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([country, data], i) => ({
      "№": i + 1,
      "Страна": country,
      "Участников": data.count,
      "Сумма $": data.total,
    }));

  const wsStats = XLSX.utils.json_to_sheet(statsRows);
  wsStats["!cols"] = [{ wch: 4 }, { wch: 20 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsStats, "По странам");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sco-bishkek-registry-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
