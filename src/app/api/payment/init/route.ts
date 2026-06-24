import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFPPayment } from "@/lib/freedompay";

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { hotel: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${req.headers.get("host")}`;
    const locale = req.headers.get("accept-language")?.slice(0, 2) ?? "ru";

    const { paymentUrl, paymentId } = await createFPPayment({
      orderId: booking.id,
      amount: booking.totalPrice,
      currency: booking.currency,
      description: `SCO 2026 — ${booking.room.hotel.nameRu} — ${booking.room.nameRu}`,
      customerEmail: booking.email,
      customerPhone: booking.phone,
      successUrl: `${baseUrl}/${locale}/payment/success?booking=${booking.id}`,
      failureUrl: `${baseUrl}/${locale}/payment/failure?booking=${booking.id}`,
      resultUrl: `${baseUrl}/api/payment/callback`,
    });

    // Сохраняем paymentId
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentRef: paymentId, status: "pending" },
    });

    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error("FP init error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
