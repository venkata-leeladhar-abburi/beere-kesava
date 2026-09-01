// Shared pre-flight check for the weaver/vendor payment Excel upload panels.
// The file input's `accept` attribute is only a file-dialog filter — the user
// can switch the dialog to "All files" and pick anything — so both panels run
// the picked file through this before spending an upload on it. The backend
// (spreadsheetUploadOptions in common/storage/upload.config.ts) enforces the
// same rules; this just fails fast with a clearer message.
//
// Only OOXML is listed: the importer parses with exceljs's .xlsx reader, so a
// legacy .xls or a .csv can't be read no matter how it's uploaded.
export const IMPORT_FILE_ACCEPT = ".xlsx,.xlsm";

const ALLOWED_EXTENSIONS = [".xlsx", ".xlsm"];
const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

/** Returns an error message to show the user, or null if the file is acceptable. */
export function validateImportFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext))) {
    return "Please upload an .xlsx file — legacy .xls and .csv files aren't supported.";
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return "That file is larger than 5MB. Please upload the filled-in template only.";
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  return null;
}
