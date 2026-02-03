// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse-fork");

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF file");
  }
}
