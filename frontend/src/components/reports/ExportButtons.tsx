"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui";
import type { ExportFormat } from "@/types/report";

export function ExportButtons({
    onExport,
    formats = ["csv", "json"],
    disabled = false,
}: {
    onExport: (format: ExportFormat) => void;
    formats?: ExportFormat[];
    disabled?: boolean;
}) {
    return (
        <div className="camera-actions">
            {formats.map((format) => (
                <Button
                    key={format}
                    variant="secondary"
                    size="sm"
                    icon={<Download size={14} aria-hidden />}
                    onClick={() => onExport(format)}
                    disabled={disabled}
                >
                    {format.toUpperCase()}
                </Button>
            ))}
        </div>
    );
}

export function toCsv(
    headers: readonly (string | number)[],
    rows: readonly (readonly (string | number | null)[])[],
): string {
    const escape = (value: string | number | null) => {
        const text = value === null ? "" : String(value);

        return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    return [headers, ...rows].map((row) => row.map(escape).join(";")).join("\r\n");
}

export function downloadFile(
    filename: string,
    content: string,
    mimeType = "text/csv;charset=utf-8",
): void {
    const blob = new Blob(["\uFEFF", content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}