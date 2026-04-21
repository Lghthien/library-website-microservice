"use client";

import { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/ToastContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ExcelImporterProps {
    buttonLabel?: string;
    onImport: (data: any[]) => Promise<void>;
    templateHeaders: string[]; // List of expected headers for validation
    sampleFileName?: string; // For downloading template (optional feature for future)
}

export function ExcelImporter({ 
    buttonLabel = "Nhập Excel", 
    onImport, 
    templateHeaders 
}: ExcelImporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);
        setParsedData(null);
        setIsLoading(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const buffer = evt.target?.result as ArrayBuffer;
                const wb = new ExcelJS.Workbook();
                await wb.xlsx.load(buffer);
                const ws = wb.worksheets[0];

                if (!ws || ws.rowCount === 0) {
                    throw new Error("File rỗng.");
                }

                // Get headers from first row
                const headerRow = ws.getRow(1).values as any[];
                const headers = headerRow.slice(1).map((h: any) => String(h ?? '').trim().toLowerCase());
                const expected = templateHeaders.map(h => h.trim().toLowerCase());

                const missingHeaders = expected.filter(eh => !headers.includes(eh));
                if (missingHeaders.length > 0) {
                    throw new Error(`File thiếu các cột bắt buộc: ${missingHeaders.join(", ")}`);
                }

                // Convert rows to objects
                const jsonData: any[] = [];
                ws.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // skip header
                    const rowValues = row.values as any[];
                    const obj: any = {};
                    headerRow.slice(1).forEach((h: any, i: number) => {
                        obj[h] = rowValues[i + 1] ?? '';
                    });
                    jsonData.push(obj);
                });

                setParsedData(jsonData);
                setIsLoading(false);

            } catch (err) {
                console.error("Excel parse error:", err);
                setError(err instanceof Error ? err.message : "Không thể đọc file Excel.");
                setIsLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImportConfirm = async () => {
        if (!parsedData) return;

        try {
            setIsLoading(true);
            await onImport(parsedData);
            setIsOpen(false);
            setFileName(null);
            setParsedData(null);
            // Success toast should be handled by parent or here? 
            // Better to let parent handle specific success messages, but we can reset state here.
        } catch (err) {
            console.error("Import execution error:", err);
            // Parent normally handles error display, but we stop loading here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800">
                    <FileSpreadsheet className="h-4 w-4" />
                    {buttonLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nhập dữ liệu từ Excel</DialogTitle>
                    <DialogDescription>
                        Chọn file Excel (.xlsx, .xls) chứa dữ liệu cần nhập.
                        <br />
                        <span className="text-xs text-slate-500">
                            Cột yêu cầu: {templateHeaders.join(", ")}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {!fileName ? (
                        <div 
                            className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-8 w-8 mb-2 text-slate-400" />
                            <p className="text-sm font-medium">Click để chọn file</p>
                            <p className="text-xs text-slate-400">hoặc kéo thả vào đây</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border rounded-md">
                            <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{fileName}</p>
                                <p className="text-xs text-slate-500">
                                    {parsedData ? `${parsedData.length} dòng dữ liệu` : "Đang xử lý..."}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => {
                                setFileName(null);
                                setParsedData(null);
                                setError(null);
                            }} disabled={isLoading}>
                                Xóa
                            </Button>
                        </div>
                    )}
                    
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />

                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                    >
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleImportConfirm}
                        disabled={!parsedData || !!error || isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Tiến hành nhập
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
