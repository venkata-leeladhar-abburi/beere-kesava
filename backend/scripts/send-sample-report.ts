// One-off manual test: pushes a real "Outstanding Payments" report to every
// number on ADMIN_WHATSAPP_NUMBERS via the same bk_report_share_ template and
// code path ReportSchedulerService.deliver() uses, so it verifies the whole
// AiSensy pipeline end-to-end without waiting for the 15-minute cron.
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "../src/app.module";
import { ReportsService } from "../src/reports/reports.service";
import { StorageService } from "../src/common/storage/storage.service";
import { WhatsAppService } from "../src/whatsapp/whatsapp.service";
import { buildReportWorkbook, XLSX_MIME_TYPE } from "../src/reports/report-workbook";
import { WhatsAppMessageKind } from "../src/generated/prisma/client";

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });

  try {
    const config = app.get(ConfigService);
    const reportsService = app.get(ReportsService);
    const storage = app.get(StorageService);
    const whatsapp = app.get(WhatsAppService);

    const recipients = [...new Set((config.get<string>("ADMIN_WHATSAPP_NUMBERS") ?? "")
      .split(",").map(n => n.trim()).filter(Boolean))];

    if (recipients.length === 0) {
      console.error("ADMIN_WHATSAPP_NUMBERS is unset — nothing to send to.");
      return;
    }

    console.log(`Sending sample "Outstanding Payments" report to: ${recipients.join(", ")}`);

    const reportData = await reportsService.getOutstandingPayments();
    const workbook = await buildReportWorkbook("outstanding-payments", reportData);
    const key = await storage.uploadBuffer(workbook, XLSX_MIME_TYPE, "documents");
    const url = await storage.resolveUrl(key.replace(/^\/uploads\//, ""));
    const now = new Date();
    const filename = `Outstanding-Payments-SAMPLE-${now.toISOString().slice(0, 10)}.xlsx`;

    for (const destination of recipients) {
      const result = await whatsapp.sendTemplate({
        campaignName: "bk_report_share_",
        destination,
        recipientName: "Admin",
        templateParams: [
          "Admin",
          "Outstanding Payments (SAMPLE TEST)",
          "One-off",
          now.toLocaleString("en-IN"),
          "Manual",
        ],
        media: { url, filename },
        kind: WhatsAppMessageKind.REPORT,
        relatedType: "ScheduledReport",
        relatedId: "manual-test",
      });
      console.log(`  ${destination} -> ${result.status}${result.errorMessage ? ` (${result.errorMessage})` : ""}`);
    }
  } finally {
    await app.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
