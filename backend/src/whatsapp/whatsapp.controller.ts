import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("whatsapp")
export class WhatsAppController {
  constructor(private readonly prisma: PrismaService) {}

  // Lets the frontend poll delivery status for a message it just triggered,
  // e.g. after sending a document or bill: GET /whatsapp/messages?relatedId=...
  @Get("messages")
  findAll(@Query("relatedId") relatedId?: string, @Query("relatedType") relatedType?: string) {
    return this.prisma.whatsAppMessage.findMany({
      where: { relatedId, relatedType },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
