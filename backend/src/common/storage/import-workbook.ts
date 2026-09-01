import { Readable } from "node:stream";
import * as ExcelJS from "exceljs";

// What the payment importers can actually read, decided from the file's own
// bytes rather than its name — an admin re-saving a bank export often leaves
// the wrong extension on it, and a browser's MIME guess is unreliable too
// (Windows without Excel installed sends application/octet-stream).
//
// An .xlsx/.xlsm is a zip container ("PK\x03\x04"); a legacy .xls is an OLE2
// compound document ("\xD0\xCF\x11\xE0"), which exceljs has no reader for.
// Anything else is treated as delimited text and parsed as CSV.
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const OLE2_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);

export const LEGACY_XLS_MESSAGE =
  "This looks like a legacy .xls file, which can't be read. Open it in Excel and use " +
  "File → Save As → Excel Workbook (.xlsx), or Save As → CSV, then upload that.";

const UNREADABLE_MESSAGE =
  "Couldn't read this file — upload an .xlsx, .xlsm or .csv exported from the template.";

export type LoadWorkbookResult =
  | { ok: true; workbook: ExcelJS.Workbook }
  | { ok: false; message: string };

function startsWith(buffer: Buffer, signature: Buffer): boolean {
  return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature);
}

/**
 * Loads an uploaded import file into a workbook, whatever spreadsheet format
 * it arrived in. Never throws: a file that can't be read comes back as
 * `{ ok: false }` carrying the message to show the uploader.
 */
export async function loadImportWorkbook(buffer: Buffer): Promise<LoadWorkbookResult> {
  if (buffer.length === 0) {
    return { ok: false, message: "That file is empty." };
  }

  if (startsWith(buffer, OLE2_SIGNATURE)) {
    return { ok: false, message: LEGACY_XLS_MESSAGE };
  }

  const workbook = new ExcelJS.Workbook();

  if (startsWith(buffer, ZIP_SIGNATURE)) {
    try {
      // exceljs's bundled .d.ts predates the newer generic Buffer<T>/Uint8Array<T>
      // typings shipped in current @types/node, so this Buffer-to-Buffer call trips a
      // structural mismatch that doesn't exist at runtime.
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    } catch {
      return { ok: false, message: UNREADABLE_MESSAGE };
    }
    return { ok: true, workbook };
  }

  // Not a recognised container — try it as CSV. A truly unreadable file (a
  // PDF, an image) parses as garbage rather than throwing, so the caller's
  // required-column check is what ultimately rejects it, with a message that
  // names the column it wanted.
  try {
    await workbook.csv.read(Readable.from(buffer));
  } catch {
    return { ok: false, message: UNREADABLE_MESSAGE };
  }
  return { ok: true, workbook };
}
