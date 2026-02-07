"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Loader2, Upload, FileText, X } from "lucide-react";

export default function USNewVerificationPage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim() && files.length === 0) {
      setError("Please paste an estimate or upload a file");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      if (text.trim()) {
        formData.append("text", text.trim());
      }
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Server error");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let verificationId = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.id) verificationId = data.id;
              if (data.status === "error" && data.error) {
                throw new Error(data.error);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
                throw parseErr;
              }
            }
          }
        }
      }

      if (verificationId) {
        router.push(`/us/dashboard/verify/${verificationId}`);
      } else {
        throw new Error("Failed to create verification");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/us/dashboard"
        className="inline-flex items-center gap-2 text-[#161616]/50 hover:text-[#161616] font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-[#161616]/10 border border-[#161616]/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[#33C791]/10 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-[#33C791]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#161616]">Check Contractor Estimate</h1>
            <p className="text-[#161616]/50">
              Paste or upload your contractor's estimate for AI analysis
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text Input */}
          <div>
            <label htmlFor="estimate" className="block text-sm font-medium text-[#161616] mb-2">
              Contractor's Estimate
            </label>
            <textarea
              id="estimate"
              placeholder={"Paste the estimate text here, for example:\n\nKitchen tile installation - 120 sq ft × $15 = $1,800\nBathroom remodel - labor and materials = $4,500\nPainting - 3 rooms × $350 = $1,050\n..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="w-full px-4 py-4 rounded-xl border border-[#161616]/10 bg-[#FAF4EC] text-[#161616] placeholder:text-[#161616]/30 focus:outline-none focus:ring-2 focus:ring-[#0D8DFF] focus:border-transparent transition-all resize-none font-mono text-sm"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-[#161616] mb-2">
              Or upload files (PDF, photos, Excel)
            </label>
            <div className="border-2 border-dashed border-[#161616]/10 rounded-xl p-6 text-center hover:border-[#0D8DFF]/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-[#161616]/30 mx-auto mb-3" />
                <p className="text-[#161616]/50">
                  <span className="text-[#0D8DFF] font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-[#161616]/30 mt-1">PDF, Excel, or images up to 10MB</p>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-[#FAF4EC] rounded-lg px-4 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#161616]/50" />
                      <span className="text-sm text-[#161616] truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-[#161616]/30">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="cursor-pointer p-1 hover:bg-[#FA5424]/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-[#161616]/50 hover:text-[#FA5424]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-[#FA5424] bg-[#FA5424]/10 p-4 rounded-xl border border-[#FA5424]/20">
              {error}
            </div>
          )}

          {/* How it works */}
          <div className="bg-[#FAF4EC] rounded-xl p-5">
            <p className="font-medium text-[#161616] mb-2">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[#161616]/70">
              <li>AI extracts all line items and prices from your estimate</li>
              <li>Compares each item against current market rates</li>
              <li>Shows total potential overcharge amount for free</li>
              <li>Unlock detailed breakdown for $9.99</li>
            </ol>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer w-full bg-[#33C791] text-[#161616] font-semibold py-4 rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI is analyzing... (30-60 sec)
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Check This Estimate
              </>
            )}
          </button>
        </form>
      </div>

      {/* Trust badges */}
      <div className="mt-8 flex items-center justify-center gap-8 text-center">
        <div className="text-[#161616]/50">
          <div className="font-bold text-[#161616]">256-bit</div>
          <div className="text-xs">Encryption</div>
        </div>
        <div className="text-[#161616]/50">
          <div className="font-bold text-[#161616]">100%</div>
          <div className="text-xs">Anonymous</div>
        </div>
        <div className="text-[#161616]/50">
          <div className="font-bold text-[#161616]">30 sec</div>
          <div className="text-xs">Analysis</div>
        </div>
      </div>
    </div>
  );
}
