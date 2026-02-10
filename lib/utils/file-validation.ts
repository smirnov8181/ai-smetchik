const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

/**
 * Sanitize a file name — strip path traversal and non-safe characters.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\]/g, "_") // strip path separators
    .replace(/\.\./g, "_") // strip directory traversal
    .replace(/[^\w.\-]/g, "_") // keep only word chars, dots, hyphens
    .slice(0, 255); // limit length
}

/**
 * Validate a single uploaded file. Returns an error string or null if valid.
 */
export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
  }

  if (!ALLOWED_MIME_TYPES.has(file.type) && !file.name.endsWith(".xlsx")) {
    return `File "${file.name}" has unsupported type: ${file.type}`;
  }

  return null;
}

/**
 * Validate an array of files. Returns an error string or null if valid.
 */
export function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES) {
    return `Too many files (max ${MAX_FILES})`;
  }

  for (const file of files) {
    const err = validateFile(file);
    if (err) return err;
  }

  return null;
}
