import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, firstName, lastName, email, phone, country, organization, checkIn, checkOut, guests, notes, totalPrice } = body;

    if (!roomId || !firstName || !lastName || !email || !phone || !country || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.available) {
      return NextResponse.json({ error: "Room not available" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        roomId,
        firstName,
        lastName,
        email,
        phone,
        country,
        organization: organization || null,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: Number(guests),
        totalPrice: Number(totalPrice),
        status: "pending",
        paymentStatus: "unpaid",
        paymentRef: null,
        notes: notes || null,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { room: { include: { hotel: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookings);
}
