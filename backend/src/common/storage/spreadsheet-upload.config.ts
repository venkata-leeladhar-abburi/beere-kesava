import { BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import { memoryStorage } from "multer";

// Spreadsheet imports (weaver/vendor payment uploads) differ from every case
// above: the parser is exceljs's OOXML reader, so legacy .xls (BIFF) and .csv
// genuinely can't be read even though a file dialog will happily offer them.
// Browsers are also inconsistent about the MIME they attach to a spreadsheet
// — Windows without Excel installed frequently sends application/octet-stream
// — so the extension is the real gate here and the MIME list only rejects the
// obviously-wrong types.
const ALLOWED_SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/octet-stream",
  "application/zip",
  "",
]);
const ALLOWED_SPREADSHEET_EXTENSIONS = [".xlsx", ".xlsm"];
const MAX_SPREADSHEET_SIZE_BYTES = 5 * 1024 * 1024;

const SPREADSHEET_REJECTION_MESSAGE =
  "Upload must be an .xlsx file (legacy .xls and .csv aren't supported)";

/** Multer options for an Excel import file parsed server-side by exceljs. */
export function spreadsheetUploadOptions() {
  return {
    storage: memoryStorage(),
    limits: { fileSize: MAX_SPREADSHEET_SIZE_BYTES },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, accept: boolean) => void,
    ) => {
      const name = (file.originalname ?? "").toLowerCase();
      const extensionOk = ALLOWED_SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext));
      if (!extensionOk || !ALLOWED_SPREADSHEET_MIME_TYPES.has(file.mimetype ?? "")) {
        callback(new BadRequestException(SPREADSHEET_REJECTION_MESSAGE), false);
        return;
      }
      callback(null, true);
    },
  };
}
