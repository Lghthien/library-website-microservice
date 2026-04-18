'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Cookies from 'js-cookie';
import {
    Search, Filter, UserPlus, Plus, MoreHorizontal,
    Edit, Trash2, AlertCircle, AlertTriangle, Calendar, CalendarClock,
    CreditCard, User, Save, Loader2, RefreshCw, BookOpen, X, Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExcelImporter } from "@/components/ui/excel-importer";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner"; // Assuming sonner is used, or I'll use alert for now if not sure
import { useToast } from '@/components/ui/ToastContext';


// --- INTERFACES ---
interface ApiReaderType {
    _id: string;
    readerTypeName: string;
    maxBorrowLimit: number;
    cardValidityMonths: number;
}

interface ApiReader {
    _id: string;
    fullName: string;
    dateOfBirth: string;
    address: string;
    email: string;
    phoneNumber?: string;
    createdDate: string;
    expiryDate: string;
    totalDebt: number;
    readerTypeId: ApiReaderType | string;
}

interface Reader {
    id: string;
    name: string;
    type: string;
    typeId: string;
    dob: string;
    address: string;
    email: string;
    phoneNumber?: string;
    createDate: string;
    expiryDate: string;
    totalDebt: number;
}

interface BorrowedBook {
    copyId: string;
    bookTitle: string;
    loanDate: string;
    dueDate: string;
    overdueDays: number;
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

export default function ReadersPage() {
    const { showToast } = useToast();
    const [readers, setReaders] = useState<Reader[]>([]);
    const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
    const [suggestedEmails, setSuggestedEmails] = useState<string[]>([]);
    const [readerTypes, setReaderTypes] = useState<ApiReaderType[]>([]);
    const [minAge, setMinAge] = useState<number>(18);
    const [maxAge, setMaxAge] = useState<number>(55);
    const [filterName, setFilterName] = useState("");
    const [filterEmail, setFilterEmail] = useState("");
    const [filterTypeId, setFilterTypeId] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    // State cho Dialog (Thêm/Sửa)
    // State cho Dialog (Thêm/Sửa)
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingReader, setEditingReader] = useState<Reader | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingReaderId, setDeletingReaderId] = useState<string | null>(null);
    
    // State cho Dialog Sách đang mượn
    const [borrowedBooksDialogOpen, setBorrowedBooksDialogOpen] = useState(false);
    const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
    const [viewingReaderName, setViewingReaderName] = useState<string>("");
    const [isLoadingBorrowedBooks, setIsLoadingBorrowedBooks] = useState(false);

    // State Form Data
    const [formData, setFormData] = useState({
        name: "",
        typeId: "",
        dob: "",
        email: "",
        phoneNumber: "",
        address: ""
    });

    // Ngày mặc định
    // Ngày mặc định
    const today = new Date().toISOString().split('T')[0];

    // Calculate validity based on selected type
    const selectedReaderType = readerTypes.find(t => t._id === formData.typeId);
    const validityMonths = selectedReaderType ? selectedReaderType.cardValidityMonths : 6;

    // --- FETCH DATA ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const baseUrl = 'http://localhost:4000/api';

            const [resReaders, resTypes, resMinAge, resMaxAge] = await Promise.all([
                fetch(`${baseUrl}/readers`, { headers }),
                fetch(`${baseUrl}/reader-types`, { headers }),
                fetch(`${baseUrl}/parameters/name/QD1_MIN_AGE`, { headers }),
                fetch(`${baseUrl}/parameters/name/QD1_MAX_AGE`, { headers })
            ]);

            if (!resReaders.ok || !resTypes.ok) throw new Error("Failed to fetch data");

            const readersData: ApiReader[] = await resReaders.json();
            const typesData: ApiReaderType[] = await resTypes.json();

            if (resMinAge.ok) {
                const minAgeData = await resMinAge.json();
                if (minAgeData && minAgeData.paramValue) setMinAge(parseInt(minAgeData.paramValue));
            }

            if (resMaxAge.ok) {
                const maxAgeData = await resMaxAge.json();
                if (maxAgeData && maxAgeData.paramValue) setMaxAge(parseInt(maxAgeData.paramValue));
            }

            setReaderTypes(typesData);

            // Map API data to UI interface
            const mappedReaders: Reader[] = readersData.map(r => {
                let typeName = "Unknown";
                let typeId = "";
                
                if (typeof r.readerTypeId === 'object' && r.readerTypeId !== null) {
                    typeName = (r.readerTypeId as ApiReaderType).readerTypeName || "Unknown";
                    typeId = (r.readerTypeId as ApiReaderType)._id || "";
                } else {
                    // If it's just an ID, try to find it in typesData (though typesData might be set after)
                    // Better to rely on populated data from backend
                    const foundType = typesData.find(t => t._id === r.readerTypeId);
                    if (foundType) {
                        typeName = foundType.readerTypeName;
                        typeId = foundType._id;
                    } else {
                        typeId = r.readerTypeId as string;
                    }
                }

                return {
                    id: r._id,
                    name: r.fullName,
                    type: typeName,
                    typeId: typeId,
                    dob: new Date(r.dateOfBirth).toISOString().split('T')[0],
                    address: r.address,
                    email: r.email,
                    phoneNumber: r.phoneNumber || '', // Include phoneNumber
                    createDate: new Date(r.createdDate).toISOString().split('T')[0],
                    expiryDate: new Date(r.expiryDate).toISOString().split('T')[0],
                    totalDebt: r.totalDebt
                };
            });

            setReaders(mappedReaders);
            
            // Populate suggestion lists
            const uniqueNames = Array.from(new Set(mappedReaders.map(r => r.name)));
            const uniqueEmails = Array.from(new Set(mappedReaders.map(r => r.email)));
            setSuggestedNames(uniqueNames);
            setSuggestedEmails(uniqueEmails);
        } catch (error) {
            console.error("Error fetching data:", error);
            // alert("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Listen for parameter updates from other pages
        const handleParametersUpdate = () => {
            console.log('📡 Parameters updated - refreshing...');
            fetchData();
        };
        
        window.addEventListener('parameters-updated', handleParametersUpdate);
        
        return () => {
            window.removeEventListener('parameters-updated', handleParametersUpdate);
        };
    }, []);

    // --- ACTIONS ---

    // 1. Mở form THÊM MỚI
    const handleAdd = () => {
        setEditingReader(null);
        setFormData({ name: "", typeId: "", dob: "", email: "", phoneNumber: "", address: "" });
        setIsDialogOpen(true);
    };

    // 2. Mở form CHỈNH SỬA
    const handleEdit = (reader: Reader) => {
        setEditingReader(reader);
        setFormData({
            name: reader.name,
            typeId: reader.typeId,
            dob: reader.dob,
            email: reader.email,
            phoneNumber: reader.phoneNumber || "",
            address: reader.address
        });
        setIsDialogOpen(true);
    };

    // 2.5 GIA HẠN THẺ ĐỘC GIẢ
    const handleRenewCard = async (readerId: string) => {
        try {
            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            
            const response = await fetch(`${baseUrl}/readers/${readerId}/renew`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                // Không gửi body - backend sẽ lấy thời hạn từ Loại độc giả
            });

            if (!response.ok) {
                throw new Error('Gia hạn thẻ thất bại');
            }

            showToast('✅ Đã gia hạn thẻ thành công! (Thời hạn theo loại độc giả)', 'success');
            await fetchData(); // Reload data
        } catch (error) {
            console.error('Renew card error:', error);
            showToast('❌ Gia hạn thẻ thất bại', 'error');
        }
    };

    // 2.6 XEM SÁCH ĐANG MƯỢN
    const handleViewBorrowedBooks = async (readerId: string, readerName: string) => {
        setViewingReaderName(readerName);
        setBorrowedBooksDialogOpen(true);
        setIsLoadingBorrowedBooks(true);
        
        try {
            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            
            const response = await fetch(`${baseUrl}/loans?readerId=${readerId}&status=borrowing`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu sách đang mượn');
            }

            const loans = await response.json();
            
            // Transform the data to get borrowed books
            const books: BorrowedBook[] = [];
            for (const loan of loans) {
                if (loan.loanDetails && Array.isArray(loan.loanDetails)) {
                    for (const detail of loan.loanDetails) {
                        if (!detail.returnDate) { // Chưa trả
                            // Calculate due date: borrowDate + 4 days (default max borrow days)
                            const borrowDate = loan.borrowDate ? new Date(loan.borrowDate) : new Date();
                            const dueDate = new Date(borrowDate);
                            dueDate.setDate(dueDate.getDate() + 4); // QD4_MAX_BORROW_DAYS default is 4
                            
                            // Validate dates before using toISOString
                            const loanDateStr = borrowDate && !isNaN(borrowDate.getTime()) 
                                ? borrowDate.toISOString().split('T')[0] 
                                : 'N/A';
                            const dueDateStr = dueDate && !isNaN(dueDate.getTime()) 
                                ? dueDate.toISOString().split('T')[0] 
                                : 'N/A';
                            
                            books.push({
                                copyId: detail.copyId?._id || detail.copyId,
                                bookTitle: detail.copyId?.bookId?.titleId?.title || 'N/A',
                                loanDate: loanDateStr,
                                dueDate: dueDateStr,
                                overdueDays: detail.overdueDays || 0,
                            });
                        }
                    }
                }
            }
            
            setBorrowedBooks(books);
        } catch (error) {
            console.error('Error fetching borrowed books:', error);
            showToast('❌ Không thể tải dữ liệu sách đang mượn', 'error');
            setBorrowedBooks([]);
        } finally {
            setIsLoadingBorrowedBooks(false);
        }
    };

    // 3. LƯU DỮ LIỆU
    const handleSave = async () => {
        // Validate
        if (!formData.name || !formData.dob || !formData.typeId) {
            showToast("Vui lòng điền đầy đủ thông tin bắt buộc (*)", 'warning');
            return;
        }

        // Validate phone number format if provided
        if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(formData.phoneNumber)) {
                showToast("Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0", 'error');
                return;
            }
        }

        // Validate Age using dynamic parameters
        const birthDate = new Date(formData.dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        console.log(`🔍 Age validation: age=${age}, minAge=${minAge}, maxAge=${maxAge}`);

        if (age < minAge || age > maxAge) {
            showToast(`Độc giả phải từ ${minAge} đến ${maxAge} tuổi (QĐ1).`, 'error');
            return;
        }

        try {
            const token = Cookies.get('access_token');
            const headers = { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const baseUrl = 'http://localhost:4000/api';

            const payload = {
                fullName: formData.name,
                dateOfBirth: new Date(formData.dob).toISOString(),
                address: formData.address,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                readerTypeId: formData.typeId
            };

            // Kiểm tra trùng lặp CHỈ khi TẠO MỚI (không kiểm tra khi chỉnh sửa)
            if (!editingReader) {
                const allReadersRes = await fetch(`${baseUrl}/readers`, { headers });
                if (allReadersRes.ok) {
                    const allReaders = await allReadersRes.json();
                    const duplicate = allReaders.find((r: ApiReader) => 
                        r.fullName === formData.name &&
                        new Date(r.dateOfBirth).toISOString().split('T')[0] === new Date(formData.dob).toISOString().split('T')[0] &&
                        r.email === formData.email &&
                        r.phoneNumber === formData.phoneNumber
                    );

                    if (duplicate) {
                        showToast(
                            'Độc giả này đã tồn tại với cùng họ tên, ngày sinh, email và số điện thoại.',
                            'warning'
                        );
                        return; // CHẶN NGAY, không submit
                    }
                }
            }

            let res;
            if (editingReader) {
                // UPDATE
                res = await fetch(`${baseUrl}/readers/${editingReader.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                // CREATE
                res = await fetch(`${baseUrl}/readers`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Lỗi khi lưu dữ liệu");
            }

            // Show success message
            if (editingReader) {
                showToast('✅ Cập nhật thông tin độc giả thành công!', 'success');
            } else {
                showToast('✅ Lập thẻ độc giả thành công!', 'success');
            }

            // Refresh data
            await fetchData();
            setIsDialogOpen(false);

        } catch (error) {
            console.error("Save error:", error);
            showToast(error instanceof Error ? error.message : "Có lỗi xảy ra", 'error');
        }
    };

    // 4. Xóa độc giả - Trigger Dialog (Với kiểm tra)
    const handleDelete = async (id: string) => {
        const reader = readers.find(r => r.id === id);
        if (!reader) {
            showToast("Không tìm thấy độc giả", 'error');
            return;
        }

        // Kiểm tra 1: Thẻ còn hạn
        const today = new Date();
        const expiryDate = new Date(reader.expiryDate);
        if (expiryDate > today) {
            showToast(`Không thể xóa: Độc giả ${reader.name} còn thẻ hợp lệ (hết hạn ${reader.expiryDate}). Không được phép xóa.`, 'error');
            return;
        }

        // Kiểm tra 2: Còn nợ
        if (reader.totalDebt > 0) {
            showToast(`Không thể xóa: Độc giả ${reader.name} còn nợ ${reader.totalDebt.toLocaleString('vi-VN')} VNĐ. Vui lòng thu tiền phạt trước khi xóa.`, 'error');
            return;
        }

        // Kiểm tra 3: Có sách đang mượn
        try {
            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            
            const response = await fetch(`${baseUrl}/loans?readerId=${id}&status=borrowing`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const loans = await response.json();
                
                // Đếm số sách đang mượn
                let borrowedCount = 0;
                for (const loan of loans) {
                    if (loan.loanDetails && Array.isArray(loan.loanDetails)) {
                        for (const detail of loan.loanDetails) {
                            if (!detail.returnDate) { // Chưa trả
                                borrowedCount++;
                            }
                        }
                    }
                }
                
                if (borrowedCount > 0) {
                    showToast(`Không thể xóa: Độc giả ${reader.name} đang mượn ${borrowedCount} quyển sách. Vui lòng trả sách trước khi xóa.`, 'error');
                    return;
                }
            }
        } catch (error) {
            console.error("Error checking borrowed books:", error);
            showToast("Lỗi khi kiểm tra sách đang mượn", 'error');
            return;
        }

        // Tất cả điều kiện đã thỏa mãn -> Cho phép xóa
        setDeletingReaderId(id);
        setDeleteConfirmOpen(true);
    };

    // 4.1 Xác nhận Xóa (Execute)
    const confirmDelete = async () => {
        if (!deletingReaderId) return;
        try {
            const token = Cookies.get('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const baseUrl = 'http://localhost:4000/api';

            const res = await fetch(`${baseUrl}/readers/${deletingReaderId}`, {
                method: 'DELETE',
                headers
            });

            if (!res.ok) throw new Error("Không thể xóa độc giả");

            // Refresh data
            await fetchData();
            showToast("Đã xóa độc giả thành công (xóa mềm - dữ liệu được lưu trữ)", 'success');

        } catch (error) {
            console.error("Delete error:", error);
            showToast("Có lỗi xảy ra khi xóa.", 'error');
        } finally {
            setDeleteConfirmOpen(false);
            setDeletingReaderId(null);
        }
    };


    // Filter UI
    const filteredReaders = readers.filter(r => {
        // Filter by name
        if (filterName && !r.name.toLowerCase().includes(filterName.toLowerCase())) {
            return false;
        }
        
        // Filter by email
        if (filterEmail && !r.email.toLowerCase().includes(filterEmail.toLowerCase())) {
            return false;
        }
        
        // Filter by type
        if (filterTypeId !== "all" && r.typeId !== filterTypeId) {
            return false;
        }

        return true;
    });

    // Clear all filters function
    const clearFilters = () => {
        setFilterName("");
        setFilterEmail("");
        setFilterTypeId("all");
    };

    const handleBulkImport = async (data: any[]) => {
        try {
            const payload = data.map(item => ({
                fullName: item['FullName'] || item['fullname'],
                email: item['Email'] || item['email'],
                phoneNumber: item['Phone'] || item['phone'],
                address: item['Address'] || item['address'],
                dateOfBirth: item['DOB'] || item['dob'], 
                readerType: item['Type'] || item['type'] 
            }));

            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${baseUrl}/readers/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                 const errText = await res.text();
                 throw new Error(errText || "Bulk import failed");
            }
            
            const results = await res.json();
            const successes = results.filter((r: any) => r.status === 'success');
            const errors = results.filter((r: any) => r.status === 'error');

            if (errors.length > 0) {
                 const firstError = errors[0].message;
                 showToast(`Có ${errors.length} lỗi. Ví dụ: ${firstError}`, "warning");
                 console.warn("Import errors:", errors);
            } else {
                 showToast(`Đã nhập thành công ${successes.length} độc giả.`, "success");
            }
            fetchData();
        } catch (error) {
            console.error("Import error:", error);
            showToast("Lỗi khi nhập dữ liệu độc giả.", "error");
        }
    };



    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý Độc giả</h1>
                    <p className="text-sm text-slate-500">Lập thẻ độc giả mới (BM1) và quản lý thông tin thành viên.</p>
                </div>
                <div className="flex gap-2">
                    <ExcelImporter
                        buttonLabel="Nhập danh sách"
                        onImport={handleBulkImport}
                        templateHeaders={['FullName', 'Email', 'Phone', 'Address', 'DOB', 'Type']}
                    />
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Lập thẻ độc giả
                    </Button>
                </div>
            </div>

            {/* --- BỘ LỌC --- */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        {/* Row 1: Name + Email Comboboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        </div>
                        
                        {/* Row 2: Reader Type + Clear Button */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2">
                                <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Loại độc giả:</label>
                                <Select value={filterTypeId} onValueChange={setFilterTypeId}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Lọc theo loại độc giả" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả loại độc giả</SelectItem>
                                        {readerTypes.map((type) => (
                                            <SelectItem key={type._id} value={type._id}>
                                                {type.readerTypeName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={clearFilters}
                                className="text-slate-600"
                            >
                                <X className="w-4 h-4 mr-1" /> Xóa bộ lọc
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- DANH SÁCH --- */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800">Danh sách thành viên</CardTitle>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Tổng: {filteredReaders.length}</div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Họ và tên</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Số điện thoại</TableHead>
                                <TableHead>Ngày sinh</TableHead>
                                <TableHead className="text-center">Thẻ</TableHead>
                                <TableHead className="text-right">Nợ</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReaders.map((reader) => (
                                <TableRow key={reader.id}>
                                    <TableCell className="font-medium text-slate-800">{reader.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600">
                                            {reader.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {reader.email}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {reader.phoneNumber || '-'}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(reader.dob).toLocaleDateString('vi-VN')}
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const isExpired = new Date(reader.expiryDate) < new Date();
                                            return (
                                                <span className={`flex items-center font-medium text-sm ${isExpired ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    <CalendarClock className="w-3 h-3 mr-1" />
                                                    {new Date(reader.expiryDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {reader.totalDebt > 0 ? (
                                            <span className="text-red-600 font-medium">
                                                {reader.totalDebt.toLocaleString('vi-VN')}đ
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Tác vụ</DropdownMenuLabel>

                                                {/* NÚT SỬA */}
                                                <DropdownMenuItem onClick={() => handleEdit(reader)}>
                                                    <Edit className="mr-2 h-4 w-4 text-blue-600" /> Sửa thông tin
                                                </DropdownMenuItem>

                                                {/* NÚT GIA HẠN THẺ */}
                                                <DropdownMenuItem onClick={() => handleRenewCard(reader.id)}>
                                                    <RefreshCw className="mr-2 h-4 w-4 text-green-600" /> Gia hạn thẻ
                                                </DropdownMenuItem>

                                                {/* NÚT XEM SÁCH ĐANG MƯỢN */}
                                                <DropdownMenuItem onClick={() => handleViewBorrowedBooks(reader.id, reader.name)}>
                                                    <BookOpen className="mr-2 h-4 w-4" /> Sách đang mượn
                                                </DropdownMenuItem>

                                                {/* NÚT XÓA */}
                                                <DropdownMenuItem onClick={() => handleDelete(reader.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa độc giả
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* --- FORM MODAL (THÊM / SỬA) --- */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingReader ? "Cập nhật Thông tin Độc giả" : "Lập Thẻ Độc giả (BM1)"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingReader
                                ? `Chỉnh sửa thông tin cho độc giả ${editingReader.id}.`
                                : `Nhập thông tin cá nhân. Thẻ sẽ có hạn ${validityMonths} tháng theo loại độc giả.`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Hàng 1: Tên + Loại */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="readerName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Họ và tên
                                </Label>
                                <Input
                                    id="readerName"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Loại độc giả</Label>
                                <Select
                                    value={formData.typeId}
                                    onValueChange={(val) => setFormData({ ...formData, typeId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {readerTypes.map((type) => (
                                            <SelectItem key={type._id} value={type._id}>
                                                {type.readerTypeName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Hàng 2: Ngày sinh + Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dob">Ngày sinh</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                />
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="example@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="0xxxxxxxxx (10 số)"
                                    maxLength={10}
                                    pattern="0[0-9]{9}"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Hàng 4: Địa chỉ */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Địa chỉ</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Số nhà, đường, phường/xã..."
                            />
                        </div>

                        {/* Hàng 5: Ngày lập thẻ (Chỉ hiển thị khi Thêm mới hoặc Readonly) */}
                        {!editingReader && (
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-2">
                                <div className="space-y-2">
                                    <Label>Ngày lập thẻ</Label>
                                    <Input value={today} disabled className="bg-slate-50 text-slate-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-500">Hạn dùng mặc định</Label>
                                    <div className="h-10 px-3 py-2 border rounded-md bg-slate-50 text-slate-700 flex items-center font-medium">
                                        {validityMonths} tháng
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Hủy bỏ
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            {editingReader ? <><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</> : <><UserPlus className="w-4 h-4 mr-2" /> Lập thẻ</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- DELETE CONFIRMATION DIALOG --- */}
            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Xác nhận xóa độc giả"
                description="Bạn có chắc chắn muốn xóa độc giả này không? Hành động này không thể hoàn tác và độc giả sẽ bị xóa khỏi hệ thống."
                onConfirm={confirmDelete}
                variant="destructive"
            />

            {/* --- BORROWED BOOKS DIALOG --- */}
            <Dialog open={borrowedBooksDialogOpen} onOpenChange={setBorrowedBooksDialogOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Sách đang mượn - {viewingReaderName}</DialogTitle>
                        <DialogDescription>
                            Danh sách các quyển sách mà độc giả hiện đang mượn
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {isLoadingBorrowedBooks ? (
                            <div className="text-center py-8 text-slate-500">
                                Đang tải dữ liệu...
                            </div>
                        ) : borrowedBooks.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                Độc giả hiện không mượn sách nào
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-semibold">Tên sách</TableHead>
                                            <TableHead className="font-semibold">Ngày mượn</TableHead>
                                            <TableHead className="font-semibold">Hạn trả</TableHead>
                                            <TableHead className="font-semibold">Trạng thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {borrowedBooks.map((book, index) => {
                                            const today = new Date();
                                            const dueDate = new Date(book.dueDate);
                                            const isOverdue = today > dueDate;
                                            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                                            return (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{book.bookTitle}</TableCell>
                                                    <TableCell>{book.loanDate}</TableCell>
                                                    <TableCell>{book.dueDate}</TableCell>
                                                    <TableCell>
                                                        {isOverdue ? (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Quá hạn {book.overdueDays} ngày
                                                            </Badge>
                                                        ) : daysUntilDue <= 2 ? (
                                                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                                                Sắp đến hạn
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                                                Còn {daysUntilDue} ngày
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBorrowedBooksDialogOpen(false)}>
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}