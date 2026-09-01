import { BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import { memoryStorage } from "multer";

// Spreadsheet imports (weaver/vendor payment uploads). The importers read
// OOXML (.xlsx/.xlsm) and CSV — see loadImportWorkbook, which decides the
// format from the file's own bytes. Legacy .xls is allowed through this
// filter deliberately: the parser recognises it and returns a message telling
// the uploader to re-save it, which is far more useful than a file dialog
// that refuses to offer the file at all.
//
// Browsers are inconsistent about the MIME they attach to a spreadsheet
// — Windows without Excel installed frequently sends application/octet-stream
// — so the extension is the real gate here and the MIME list only rejects the
// obviously-wrong types.
const ALLOWED_SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "application/csv",
  "application/octet-stream",
  "application/zip",
  "",
]);
const ALLOWED_SPREADSHEET_EXTENSIONS = [".xlsx", ".xlsm", ".xls", ".csv"];
const MAX_SPREADSHEET_SIZE_BYTES = 5 * 1024 * 1024;

const SPREADSHEET_REJECTION_MESSAGE =
  "Upload must be a spreadsheet file (.xlsx, .xlsm or .csv)";

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
