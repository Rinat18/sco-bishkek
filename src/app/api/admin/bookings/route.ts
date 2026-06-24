import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(booking);
}
