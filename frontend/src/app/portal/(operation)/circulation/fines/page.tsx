'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Search, Receipt, User, Wallet,
    AlertCircle, CheckCircle2, History, Printer, Loader2, X,
    Calendar, FileText, Clock, ArrowRight, MapPin, Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog"; // Import ConfirmDialog
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Cookies from 'js-cookie';

// --- INTERFACES ---

interface Reader {
    _id: string;
    fullName: string;
    email: string;
    totalDebt: number;
    address?: string;
    readerId?: string;
}

interface FineReceipt {
    _id: string;
    amountPaid: number;
    paymentDate: string;
    readerId: {
        _id: string;
        fullName: string;
    };
}

// --- COMPONENT TÙY CHỈNH: SEARCHABLE INPUT ---
const SearchableInput = ({
    options,
    value,
    onChange,
    placeholder,
    id
}: {
    options: string[],
    value: string,
    onChange: (val: string) => void,
    placeholder?: string,
    id?: string
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        if (!value) return options;
        const lowerVal = value.toLowerCase();
        return options.filter(opt => opt.toLowerCase().includes(lowerVal));
    }, [value, options]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <Input
                id={id}
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                autoComplete="off"
            />
            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.map((option, index) => (
                        <div
                            key={index}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 flex items-center justify-between"
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                            {value === option && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function FinesPage() {
    // --- STATE ---
    const [filterName, setFilterName] = useState("");
    const [filterEmail, setFilterEmail] = useState("");
    const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
    const [suggestedEmails, setSuggestedEmails] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [debtorReaders, setDebtorReaders] = useState<Reader[]>([]);
    const [filteredReaders, setFilteredReaders] = useState<Reader[]>([]);
    const [reader, setReader] = useState<Reader | null>(null);

    const [collectAmount, setCollectAmount] = useState<string>("");
    const [error, setError] = useState("");

    const [recentReceipts, setRecentReceipts] = useState<FineReceipt[]>([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<FineReceipt | null>(null);

    // Receipt Search State
    const [receiptSearchQuery, setReceiptSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isReceiptsLoading, setIsReceiptsLoading] = useState(false);

    // State for printing the JUST created receipt
    const [receiptToPrint, setReceiptToPrint] = useState<{
        readerName: string;
        amount: number;
        date: Date;
        receiptId: string;
        oldDebt: number;
        newDebt: number;
    } | null>(null);

    const searchRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        fetchReceipts();
        fetchDebtorReaders();
    }, []);

    // Debounce for receipt search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchReceipts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [receiptSearchQuery, startDate, endDate]);

    useEffect(() => {
        let filtered = debtorReaders;
        
        // Filter by name
        if (filterName) {
            filtered = filtered.filter(r => 
                r.fullName.toLowerCase().includes(filterName.toLowerCase())
            );
        }
        
        // Filter by email
        if (filterEmail) {
            filtered = filtered.filter(r => 
                r.email.toLowerCase().includes(filterEmail.toLowerCase())
            );
        }
        
        setFilteredReaders(filtered);
    }, [filterName, filterEmail, debtorReaders]);

    // --- API CALLS ---
    const fetchReceipts = async () => {
        setIsReceiptsLoading(true);
        try {
            const token = Cookies.get('access_token');
            const params = new URLSearchParams();
            if (receiptSearchQuery) params.append('keyword', receiptSearchQuery);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const endpoint = (receiptSearchQuery || startDate || endDate)
                ? `${baseUrl}/fine-receipts/search?${params.toString()}`
                : `${baseUrl}/fine-receipts`;

            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Sort by date desc if not already (backend search sorts, but findAll might not)
                const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()) : [];
                setRecentReceipts(sorted);
            }
        } catch (error) {
            console.error("Failed to fetch receipts", error);
        } finally {
            setIsReceiptsLoading(false);
        }
    };

    const fetchDebtorReaders = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${baseUrl}/readers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("🔍 Raw readers data:", data);
                console.log("🔍 Sample reader:", data[0]);
                
                if (Array.isArray(data)) {
                    // Lọc chỉ độc giả có nợ và sort theo nợ giảm dần
                    const debtors = data
                        .filter(r => {
                            const debt = Number(r.totalDebt || 0);
                            console.log(`Reader ${r.fullName}: totalDebt = ${r.totalDebt} (${typeof r.totalDebt}), parsed = ${debt}`);
                            return debt > 0;
                        })
                        .sort((a, b) => {
                            const debtA = Number(a.totalDebt || 0);
                            const debtB = Number(b.totalDebt || 0);
                            return debtB - debtA;
                        });
                    
                    console.log("✅ Found debtors:", debtors.length, debtors);
                    setDebtorReaders(debtors);
                    setFilteredReaders(debtors);
                    
                    // Populate suggestion lists
                    const uniqueNames = Array.from(new Set(debtors.map(r => r.fullName)));
                    const uniqueEmails = Array.from(new Set(debtors.map(r => r.email)));
                    setSuggestedNames(uniqueNames);
                    setSuggestedEmails(uniqueEmails);
                }
            }
        } catch (error) {
            console.error("Failed to fetch debtor readers", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!reader || !collectAmount) return;

        // Final Validation
        const amount = Number(collectAmount);
        if (amount <= 0) {
            toast.error("Số tiền không hợp lệ");
            return;
        }
        if (amount > reader.totalDebt) {
            toast.error("Số tiền thu vượt quá tổng nợ");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${baseUrl}/fine-receipts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    readerId: reader._id,
                    amountPaid: amount,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                
                // Prepare data for printing (use old debt before update)
                const oldDebt = reader.totalDebt;
                const newDebt = oldDebt - amount;
                
                // Create date in Vietnam timezone (UTC+7)
                const vietnamDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
                
                setReceiptToPrint({
                    readerName: reader.fullName,
                    amount: amount,
                    date: vietnamDate,
                    receiptId: data._id || "N/A",
                    oldDebt: oldDebt,
                    newDebt: newDebt
                });

                toast.success("Thu tiền thành công", {
                    description: `Đã thu ${formatCurrency(amount)} từ ${reader.fullName}`,
                });

                // Reset form first
                setCollectAmount("");
                setShowConfirmDialog(false);

                // Refresh data from backend
                await fetchReceipts();
                await fetchDebtorReaders();
                
                // Update reader with fresh data from backend
                // Find the updated reader in the newly fetched data
                const token = Cookies.get('access_token');
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                const updatedReaderRes = await fetch(`${baseUrl}/readers/${reader._id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (updatedReaderRes.ok) {
                    const updatedReader = await updatedReaderRes.json();
                    // Only keep reader selected if they still have debt
                    if (updatedReader.totalDebt > 0) {
                        setReader(updatedReader);
                    } else {
                        setReader(null);
                    }
                } else {
                    // If can't fetch updated reader, clear selection
                    setReader(null);
                }

            } else {
                const errData = await res.json();
                toast.error("Thất bại", {
                    description: errData.message || "Không thể lập phiếu thu.",
                });
            }
        } catch (error) {
            console.error("Payment error", error);
            toast.error("Lỗi hệ thống", { description: "Vui lòng thử lại sau." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- HANDLERS ---
    const selectReader = (selected: Reader) => {
        setReader(selected);
        setCollectAmount("");
        setError("");
        setReceiptToPrint(null);
    };

    const clearFilters = () => {
        setFilterName("");
        setFilterEmail("");
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (!reader) return;

        const amount = Number(value);
        if (amount > reader.totalDebt) {
            // Auto-correct to max debt
            value = reader.totalDebt.toString();
            setError(""); // Clear error if any
        } else {
            setError("");
        }
        setCollectAmount(value);
    };

    const triggerPrint = () => {
        window.print();
    };

    // --- HELPERS ---
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const remainingDebt = reader ? reader.totalDebt - (Number(collectAmount) || 0) : 0;

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return "Vừa xong";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    };

    return (
        <>
            {/* --- MAIN SCREEN (Hidden on Print) --- */}
            <div className="space-y-6 print:hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Thu Tiền Phạt</h1>
                        <p className="text-sm text-slate-500">Lập phiếu thu và gạch nợ cho độc giả (Theo BM6, QĐ6)</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-12rem)]">
                    {/* LEFT COLUMN: FORM */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* SEARCH & DEBTOR LIST CARD */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="bg-white border-b border-slate-100">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-5 h-5 text-slate-800" /> Độc giả đang có nợ tiền phạt
                                </CardTitle>
                                <p className="text-sm text-slate-600 mt-1 font-normal">
                                    Chọn độc giả để tạo phiếu thu tiền phạt
                                </p>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {/* Search Filters */}
                                <div className="space-y-3">
                                    {/* Tên độc giả */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Tên độc giả</label>
                                        <SearchableInput
                                            options={suggestedNames}
                                            value={filterName}
                                            onChange={setFilterName}
                                            placeholder="Nhập tên độc giả..."
                                        />
                                    </div>
                                    
                                    {/* Email */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Email</label>
                                        <SearchableInput
                                            options={suggestedEmails}
                                            value={filterEmail}
                                            onChange={setFilterEmail}
                                            placeholder="Nhập email..."
                                        />
                                    </div>
                                    
                                    {/* Clear button */}
                                    <div className="flex justify-end">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={clearFilters}
                                            disabled={!filterName && !filterEmail}
                                            className="text-slate-600"
                                        >
                                            <X className="w-4 h-4 mr-1" /> Xóa bộ lọc
                                        </Button>
                                    </div>
                                </div>

                                {/* Debtor List */}
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        <span className="ml-2 text-slate-500">Đang tải...</span>
                                    </div>
                                ) : filteredReaders.length > 0 ? (
                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-2">
                                            {filteredReaders.map((r) => (
                                                <button
                                                    key={r._id}
                                                    onClick={() => selectReader(r)}
                                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-blue-500 hover:shadow-md ${
                                                        reader?._id === r._id 
                                                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                            : 'border-slate-200 bg-white hover:bg-blue-50/50'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-semibold text-slate-900 truncate">
                                                                    {r.fullName}
                                                                </p>
                                                                <Badge variant="outline" className="text-xs shrink-0">
                                                                    {r._id.slice(-6).toUpperCase()}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-slate-500 truncate">{r.email}</p>
                                                            {r.address && (
                                                                <p className="text-xs text-slate-400 mt-1 truncate">{r.address}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs text-slate-500 mb-0.5">Tổng nợ</p>
                                                            <p className="text-lg font-bold text-red-600">
                                                                {formatCurrency(r.totalDebt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                                        <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p className="text-slate-500 font-medium">
                                            {(filterName || filterEmail)
                                                ? "Không tìm thấy độc giả phù hợp" 
                                                : "Không có độc giả nào đang nợ tiền phạt"}
                                        </p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {debtorReaders.length} độc giả có nợ trong hệ thống
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* PAYMENT FORM - BM6 Format */}
                        {reader ? (
                            <Card className="border-slate-200 shadow-lg overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                                    <div className="relative">
                                        <h2 className="text-xl font-bold tracking-wider uppercase">Phiếu Thu Tiền Phạt</h2>
                                    </div>
                                </div>

                                <CardContent className="p-8 space-y-6 bg-gradient-to-br from-white to-slate-50/50">
                                    {/* Reader Info Card */}
                                    <div className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden shadow-sm">
                                        {/* Row 1: Họ tên độc giả & Địa chỉ */}
                                        <div className="border-b border-slate-200">
                                            <div className="flex">
                                                <div className="w-44 bg-gradient-to-br from-slate-50 to-slate-100 p-4 border-r border-slate-200 flex items-start">
                                                    <span className="font-semibold text-slate-700 text-sm">Họ tên độc giả:</span>
                                                </div>
                                                <div className="flex-1 p-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-lg">{reader.fullName}</p>
                                                            <p className="text-sm text-slate-500 mt-1">{reader.email}</p>
                                                        </div>
                                                        {reader.address && (
                                                            <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                                                <MapPin className="w-4 h-4 text-slate-600 mt-1 shrink-0" />
                                                                <div>
                                                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Địa chỉ:</span>
                                                                    <p className="text-sm text-slate-700 mt-0.5">{reader.address}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Tổng nợ */}
                                        <div className="border-b border-slate-200 flex bg-red-50/30">
                                            <div className="w-44 bg-gradient-to-br from-slate-50 to-slate-100 p-4 border-r border-slate-200 flex items-center">
                                                <span className="font-semibold text-slate-700 text-sm">Tổng nợ:</span>
                                            </div>
                                            <div className="flex-1 p-4 flex items-center">
                                                <div className="bg-red-100 border border-red-200 px-4 py-2 rounded-md">
                                                    <span className="text-red-700 font-bold text-xl">
                                                        {formatCurrency(reader.totalDebt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 3: Số tiền thu */}
                                        <div className="border-b border-slate-200 flex">
                                            <div className="w-44 bg-gradient-to-br from-slate-50 to-slate-100 p-4 border-r border-slate-200">
                                                <span className="font-semibold text-slate-700 text-sm flex items-start">
                                                    <span>Số tiền thu:</span>
                                                    <span className="text-red-500 ml-0.5">*</span>
                                                </span>
                                            </div>
                                            <div className="flex-1 p-4">
                                                <div className="max-w-md space-y-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="Nhập số tiền thu..."
                                                        className={`h-12 text-base font-semibold border-2 transition-all ${
                                                            error 
                                                                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                                                                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
                                                        }`}
                                                        value={collectAmount}
                                                        onChange={handleAmountChange}
                                                        min="0"
                                                        max={reader.totalDebt}
                                                    />
                                                    {error && (
                                                        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
                                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                            <span>{error}</span>
                                                        </div>
                                                    )}
                                                    {collectAmount && !error && (
                                                        <div className="flex items-center gap-2 bg-blue-50 p-2.5 rounded-md border border-blue-200">
                                                            <span className="text-sm text-blue-700">Bằng chữ:</span>
                                                            <span className="text-sm font-bold text-blue-900">
                                                                {formatCurrency(Number(collectAmount))}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-slate-500 italic flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        QĐ6: Số tiền thu không được vượt quá tổng nợ hiện tại
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 4: Còn lại */}
                                        <div className={`flex ${remainingDebt === 0 ? 'bg-emerald-50/50' : 'bg-orange-50/30'}`}>
                                            <div className="w-44 bg-gradient-to-br from-slate-50 to-slate-100 p-4 border-r border-slate-200 flex items-center">
                                                <span className="font-semibold text-slate-700 text-sm">Còn lại:</span>
                                            </div>
                                            <div className="flex-1 p-4 flex items-center">
                                                <div className={`px-4 py-2 rounded-md border-2 ${
                                                    remainingDebt > 0 
                                                        ? 'bg-orange-100 border-orange-200' 
                                                        : 'bg-emerald-100 border-emerald-200'
                                                }`}>
                                                    <span className={`text-xl font-bold ${
                                                        remainingDebt > 0 ? 'text-orange-700' : 'text-emerald-700'
                                                    }`}>
                                                        {formatCurrency(remainingDebt)}
                                                    </span>
                                                    {remainingDebt === 0 && collectAmount && (
                                                        <span className="ml-3 text-sm text-emerald-700 font-medium">✓ Đã thanh toán hết</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 p-5 flex justify-between items-center">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setReader(null)}
                                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Hủy bỏ
                                    </Button>
                                    <div className="flex gap-3">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 shadow-sm min-w-[140px]"
                                            disabled={!!error || !collectAmount || Number(collectAmount) <= 0 || isSubmitting}
                                            onClick={() => setShowConfirmDialog(true)}
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                            Xác nhận thu
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ) : (
                            <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/30">
                                <CardContent className="p-12">
                                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Receipt className="w-10 h-10 text-black-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold text-slate-700">
                                                Chưa chọn độc giả
                                            </h3>
                                            <p className="text-slate-500 max-w-md">
                                                Vui lòng tìm kiếm và chọn độc giả ở phần trên để tạo phiếu thu tiền phạt
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* RIGHT COLUMN: HISTORY */}
                    <div className="lg:col-span-1 h-full">
                        <Card className="h-full border-slate-200 shadow-sm flex flex-col">
                            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 space-y-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <History className="w-4 h-4 text-slate-500" /> Danh sách phiếu thu
                                </CardTitle>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Tìm theo tên, email, mã phiếu, số tiền..."
                                            className="pl-9 pr-9 bg-white h-9 text-sm"
                                            value={receiptSearchQuery}
                                            onChange={(e) => setReceiptSearchQuery(e.target.value)}
                                        />
                                        {receiptSearchQuery && (
                                            <button
                                                onClick={() => setReceiptSearchQuery("")}
                                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            className="bg-white h-9 text-sm"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                        <Input
                                            type="date"
                                            className="bg-white h-9 text-sm"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                        {(startDate || endDate) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 shrink-0"
                                                onClick={() => {
                                                    setStartDate("");
                                                    setEndDate("");
                                                }}
                                                title="Xóa bộ lọc ngày"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden relative">
                                {isReceiptsLoading && (
                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    </div>
                                )}
                                <ScrollArea className="h-full">
                                    <div className="divide-y divide-slate-100">
                                        {recentReceipts.length > 0 ? recentReceipts.map((item) => (
                                            <div
                                                key={item._id}
                                                className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                                                onClick={() => setSelectedReceipt(item)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                            <Receipt className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm text-slate-800">{item.readerId?.fullName || 'Unknown'}</p>
                                                            <p className="text-xs text-slate-500 font-mono">#{item._id.slice(-6).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-emerald-600 text-sm">
                                                        +{formatCurrency(item.amountPaid)}
                                                    </span>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                                                <History className="w-8 h-8 opacity-20" />
                                                <p>Chưa có phiếu thu nào</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* CONFIRMATION DIALOG */}
                {/* CONFIRMATION DIALOG */}
                <ConfirmDialog
                    isOpen={showConfirmDialog}
                    onOpenChange={setShowConfirmDialog}
                    title="Xác nhận thu tiền phạt"
                    description={
                        <span>
                           Bạn có chắc chắn muốn thu số tiền <span className="font-bold text-slate-900">{collectAmount ? formatCurrency(Number(collectAmount)) : '0 ₫'}</span> từ độc giả <span className="font-bold text-slate-900">{reader?.fullName}</span>?
                           <br />
                           <span className="text-xs text-red-500 mt-2 block">Hành động này sẽ cập nhật công nợ của độc giả và không thể hoàn tác.</span>
                        </span>
                    }
                    onConfirm={handleConfirmPayment}
                    confirmLabel={isSubmitting ? "Đang xử lý..." : "Xác nhận"} // Note: ConfirmDialog doesn't support rendering loading spinner in button easily without more changes, but text change is okay.
                    variant="default" // Use default variant (blue) or "destructive" if implied? Money collection is usually positive/neutral action, not destructive like deletion. But here it was green. The ConfirmDialog defaults to Blue.
                />

                {/* RECEIPT DETAILS DIALOG */}
                <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Chi tiết phiếu thu</DialogTitle>
                            <DialogDescription>
                                Thông tin chi tiết phiếu thu tiền phạt
                            </DialogDescription>
                        </DialogHeader>
                        {selectedReceipt && (
                            <div className="space-y-4 py-4">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-sm text-slate-500">Mã phiếu</span>
                                    <span className="font-mono font-medium text-slate-900">#{selectedReceipt._id.slice(-6).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-sm text-slate-500">Độc giả</span>
                                    <span className="font-medium text-slate-900">{selectedReceipt.readerId?.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-sm text-slate-500">Số tiền thu</span>
                                    <span className="font-bold text-emerald-600 text-lg">{formatCurrency(selectedReceipt.amountPaid)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-sm text-slate-500">Ngày thu</span>
                                    <span className="text-slate-900">{new Date(selectedReceipt.paymentDate).toLocaleDateString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}</span>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={() => setSelectedReceipt(null)}>Đóng</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* --- PRINT TEMPLATE (Visible only on Print) --- */}
            <div className="hidden print:block p-8 text-black bg-white">
                {receiptToPrint ? (
                    <div className="max-w-2xl mx-auto border border-black p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold uppercase mb-2">Phiếu Thu Tiền Phạt</h1>
                            <p className="italic">
                                {new Date(receiptToPrint.date).toLocaleDateString('vi-VN', { 
                                    timeZone: 'Asia/Ho_Chi_Minh',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between">
                                <span>Mã phiếu:</span>
                                <span className="font-mono font-bold">{receiptToPrint.receiptId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Họ tên độc giả:</span>
                                <span className="font-bold">{receiptToPrint.readerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Số tiền thu:</span>
                                <span className="font-bold text-xl">{formatCurrency(receiptToPrint.amount)}</span>
                            </div>
                            <Separator className="my-2 border-black" />
                            <div className="flex justify-between text-sm">
                                <span>Nợ cũ:</span>
                                <span>{formatCurrency(receiptToPrint.oldDebt)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Còn nợ:</span>
                                <span>{formatCurrency(receiptToPrint.newDebt)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mt-12 text-center">
                            <div>
                                <p className="font-bold mb-16">Người nộp tiền</p>
                                <p className="italic text-sm">(Ký, họ tên)</p>
                            </div>
                            <div>
                                <p className="font-bold mb-16">Người thu tiền</p>
                                <p className="italic text-sm">(Ký, họ tên)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center pt-20">
                        <p>Vui lòng chọn phiếu thu để in.</p>
                    </div>
                )}
            </div>
        </>
    );
}
