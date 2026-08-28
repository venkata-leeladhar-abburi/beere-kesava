import { Global, Module } from "@nestjs/common";
import { WhatsAppController } from "./whatsapp.controller";
import { WhatsAppDocumentsService } from "./whatsapp-documents.service";
import { WhatsAppSalesService } from "./whatsapp-sales.service";
import { WhatsAppService } from "./whatsapp.service";

// @Global: many feature modules (auth, sales, purchase-orders, reports, ...)
// need to send WhatsApp messages. Registering it globally avoids importing
// WhatsAppModule into every one of them individually.
@Global()
@Module({
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppDocumentsService, WhatsAppSalesService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
