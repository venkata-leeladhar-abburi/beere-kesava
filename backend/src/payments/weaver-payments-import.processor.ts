import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { ImportResult, PaymentsService } from "./payments.service";

export const WEAVER_PAYMENTS_IMPORT_QUEUE = "weaver-payments-import";

interface WeaverPaymentsImportJobData {
  fileBase64: string;
}

@Processor(WEAVER_PAYMENTS_IMPORT_QUEUE)
export class WeaverPaymentsImportProcessor extends WorkerHost {
  constructor(private readonly paymentsService: PaymentsService) {
    super();
  }

  async process(job: Job<WeaverPaymentsImportJobData>): Promise<ImportResult> {
    const buffer = Buffer.from(job.data.fileBase64, "base64");
    return this.paymentsService.importWeaverPaymentsFromExcel(buffer);
  }
}
