import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallback } from "@/lib/freedompay";

// FreedomPay делает GET-запрос на этот URL после оплаты
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  return handleCallback(params);
}

// Иногда FP использует POST
export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body).entries());
  return handleCallback(params);
}

async function handleCallback(params: Record<string, string>) {
  // Верифицируем подпись
  if (!verifyCallback(params)) {
    console.error("FP callback: invalid signature", params);
    return xmlResponse("error", "Invalid signature");
  }

  const attemptOrderId = params.pg_order_id; // формат: bookingId-timestamp
  const paymentId = params.pg_payment_id;
  const status = params.pg_result; // 1 = success, 0 = failure

  if (!attemptOrderId) {
    return xmlResponse("error", "Missing order_id");
  }

  // bookingId — всё до последнего дефиса с timestamp
  const bookingId = attemptOrderId.replace(/-\d+$/, "");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return xmlResponse("error", "Booking not found");
  }

  if (status === "1") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "paid", status: "confirmed", paymentRef: paymentId },
    });
  } else {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "unpaid", status: "pending" },
    });
  }

  return xmlResponse("ok", "");
}

function xmlResponse(status: "ok" | "error", description: string) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<response>
  <pg_status>${status}</pg_status>
  <pg_description>${description}</pg_description>
</response>`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
