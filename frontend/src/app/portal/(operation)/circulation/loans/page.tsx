'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
    Search, Plus, User, Book, Trash2,
    FileText, Eye, BookOpen, Clock, X, ChevronDown, Check,
    AlertCircle, DollarSign, Calendar, MapPin, Phone, Mail, Cake
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

// Helper function to get current date in Vietnam timezone
function getVietnamDate(dateInput?: string | Date): Date {
    const date = dateInput ? new Date(dateInput) : new Date();
    const vietnamTimeString = date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    return new Date(vietnamTimeString);
}

// Helper function to parse Vietnamese date string (dd/mm/yyyy) to Date
function parseVietnameseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
}

// Helper function to check if a date is within a range
function isDateInRange(dateStr: string, fromDate: string, toDate: string): boolean {
    if (!dateStr) return false;
    
    const date = parseVietnameseDate(dateStr);
    if (!date) return false;
    
    if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        if (date < from) return false;
    }
    
    if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        date.setHours(0, 0, 0, 0);
        if (date > to) return false;
    }
    
    return true;
}

// --- UI COMPONENTS ---
// Add interface for Parameter
interface ApiParameter {
    _id: string;
    paramName: string;
    paramValue: string;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost' | 'secondary' | 'danger' | 'success';
    size?: 'default' | 'sm' | 'icon';
    className?: string;
}

const Button = ({ children, variant = 'primary', size = 'default', className = '', ...props }: ButtonProps) => {
    const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<string, string> = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        outline: "border border-border bg-card hover:bg-accent/40 text-foreground",
        ghost: "hover:bg-accent/40 hover:text-foreground text-muted-foreground",
        secondary: "bg-muted text-foreground hover:bg-muted/70",
        danger: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    };
    const sizes: Record<string, string> = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        icon: "h-10 w-10",
    };
    return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
    label?: string; // Optional label for cleaner JSX
}

const Input = ({ className = '', ...props }: InputProps) => (
    <input className={`flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground ${className}`} {...props} />
);

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'success' | 'danger' | 'warning';
    className?: string;
}

const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
    const styles = variant === 'outline' ? "border border-border text-foreground" :
        variant === 'success' ? "bg-emerald-100 text-emerald-800 border-emerald-200 border" :
            variant === 'danger' ? "bg-destructive/15 text-destructive border-destructive/30 border" :
                variant === 'warning' ? "bg-amber-100 text-amber-800 border-amber-200 border" :
                    "bg-primary/10 text-primary border-primary/20 border";
    return <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none ${styles} ${className}`}>{children}</div>;
};

// --- API INTERFACES ---
interface ApiReader {
    _id: string;
    fullName: string;
    email: string;
    dateOfBirth: string;
    address: string;
    totalDebt: number;
    expiryDate: string;
    readerTypeId: {
        _id: string;
        readerTypeName: string;
        maxBorrowLimit: number;
    } | string;
}

interface ApiBook {
    _id: string;
    name: string;
    author: string;
    category: string;
    titleId?: {
        title: string;
        categoryId?: {
            categoryName: string;
        };
        authors?: any[];
    };
}

interface ApiBookCopy {
    _id: string;
    status: number; // 1 = Available, 0 = Borrowed
    bookId: ApiBook;
}

interface ApiLoan {
    _id: string;
    borrowDate: string;
    readerId: ApiReader;
}

interface ApiLoanDetail {
    _id: string;
    loanId: string;
    copyId: ApiBookCopy;
    returnDate?: string;
    fineAmount: number;
}

interface LoanDetail {
    bookCode: string;
    title: string;
    category: string;
    status: string;
    returnDate?: string;
    fine?: number;
    note?: string;
    copyId: string;
    detailId: string;
    price?: number; // Added price
}

interface Loan {
    id: string;
    readerId: string;
    readerName: string;
    date: string;
    dueDate: string;
    returnDate?: string;
    status: 'active' | 'overdue' | 'returned';
    count: number;
    totalFine: number; // Backend calculated
    details?: LoanDetail[];
}

interface BorrowRow {
    id: number;
    title: string;
    author: string;
    category: string;
    copyId?: string;
}

interface ReaderInfo {
    id: string;
    name: string;
    class: string;
    email: string;
    dob: string;
    phone: string;
    address: string;
    currentBorrowedBooks?: number;
    maxBorrowLimit?: number;
    expiryDate?: string;
    isExpired?: boolean;
}

interface ReturnPreviewData {
    loanInfo: Loan;
    books: LoanDetail[];
    overdueDays: number;
    estimatedFine: number;
    currentDebt: number; // NÃ¡Â»Â£ hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i cÃ¡Â»Â§a Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£
    readerInfo: {
        fullName: string;
        totalDebt: number;
        _id: string;
    };
}

// --- COMPONENT: COMBOBOX ---
interface ComboboxProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const Combobox = ({ options, value, onChange, placeholder, className, disabled }: ComboboxProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setInputValue(value); }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (inputValue !== value) onChange(inputValue);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [inputValue, value, onChange]);

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()));

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className={`w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 bg-card text-foreground ${disabled ? 'bg-muted text-muted-foreground' : ''}`}
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); onChange(e.target.value); }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                />
                <div className="absolute right-2 top-2.5 pointer-events-none text-muted-foreground"><ChevronDown className="w-4 h-4" /></div>
            </div>
            {isOpen && !disabled && filteredOptions.length > 0 && (
                <div
                    className="absolute z-[9999] bg-card border border-border rounded-md shadow-xl max-h-60 overflow-auto py-1 mt-1 w-full left-0"
                >
                    {filteredOptions.map((opt, index) => (
                        <li key={index} className="px-3 py-2 text-sm hover:bg-primary/10 cursor-pointer flex justify-between items-center group list-none"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setInputValue(opt);
                                onChange(opt);
                                setIsOpen(false);
                            }}>
                            <span className="text-foreground">{opt}</span>
                            {opt === value && <Check className="w-4 h-4 text-primary" />}
                        </li>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

export default function CirculationPage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'borrow' | 'return'>('borrow');

    // Modal States
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

    // Data States
    const [readers, setReaders] = useState<ApiReader[]>([]);
    const [availableCopies, setAvailableCopies] = useState<ApiBookCopy[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loanDetailsMap, setLoanDetailsMap] = useState<Record<string, LoanDetail[]>>({});

    // State LÃ¡ÂºÂ­p phiÃ¡ÂºÂ¿u
    const [borrowReaderId, setBorrowReaderId] = useState("");
    const [borrowReaderDisplayName, setBorrowReaderDisplayName] = useState("");
    const [borrowReaderInfo, setBorrowReaderInfo] = useState<ReaderInfo | null>(null);
    const [borrowRows, setBorrowRows] = useState<BorrowRow[]>([{ id: 1, title: "", author: "", category: "" }]);
    const [isBorrowing, setIsBorrowing] = useState(false);

    // State XÃ¡Â»Â­ lÃƒÂ½ TrÃ¡ÂºÂ£ sÃƒÂ¡ch
    const [returnQuery, setReturnQuery] = useState("");
    const [returnPreview, setReturnPreview] = useState<ReturnPreviewData | null>(null);
    const [isReturning, setIsReturning] = useState(false);
    const [lostBookIds, setLostBookIds] = useState<Set<string>>(new Set()); // NEW: Track lost books
    const [selectedBookToReturn, setSelectedBookToReturn] = useState<any>(null); // NEW
    const [returnOverdueDays, setReturnOverdueDays] = useState(0); // NEW
    const [returnFineAmount, setReturnFineAmount] = useState(0); // NEW

    // Search state
    const [activeLoansSearch, setActiveLoansSearch] = useState("");
    const [returnedLoansSearch, setReturnedLoansSearch] = useState("");

    // Date filter states - Active Loans
    const [activeBorrowDateFrom, setActiveBorrowDateFrom] = useState("");
    const [activeBorrowDateTo, setActiveBorrowDateTo] = useState("");
    const [activeDueDateFrom, setActiveDueDateFrom] = useState("");
    const [activeDueDateTo, setActiveDueDateTo] = useState("");

    // Date filter states - Returned Loans
    const [returnedBorrowDateFrom, setReturnedBorrowDateFrom] = useState("");
    const [returnedBorrowDateTo, setReturnedBorrowDateTo] = useState("");
    const [returnedReturnDateFrom, setReturnedReturnDateFrom] = useState("");
    const [returnedReturnDateTo, setReturnedReturnDateTo] = useState("");

    // System Parameters (QÃ„Â4 & Fine)
    const [maxBorrowQuantity, setMaxBorrowQuantity] = useState(5);
    const [maxBorrowDays, setMaxBorrowDays] = useState(4);
    const [finePerDay, setFinePerDay] = useState(1000);
    const [lostBookFine, setLostBookFine] = useState(50000); // NEW: QD_FINE_LOST_BOOK
    

    const fetchData = useCallback(async () => {
        try {
            const token = Cookies.get('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [readersRes, copiesRes, loansRes, loadDetailsRes, paramsRes] = await Promise.all([
                fetch('http://localhost:4000/api/readers', { headers }),
                fetch('http://localhost:4000/api/book-copies', { headers }),
                fetch('http://localhost:4000/api/loans', { headers }),
                fetch('http://localhost:4000/api/loans-details', { headers }),
                fetch('http://localhost:4000/api/parameters', { headers })
            ]);

            if (readersRes.status === 401) {
                router.push('/auth/login');
                return;
            }

            if (!readersRes.ok) console.error("Failed to fetch readers", readersRes.status, await readersRes.text());
            if (!copiesRes.ok) console.error("Failed to fetch copies", copiesRes.status, await copiesRes.text());
            if (!loansRes.ok) console.error("Failed to fetch loans", loansRes.status, await loansRes.text());
            if (!loadDetailsRes.ok) console.error("Failed to fetch loan details", loadDetailsRes.status, await loadDetailsRes.text());

            const readersData = readersRes.ok ? await readersRes.json() : [];
            const copiesData = copiesRes.ok ? await copiesRes.json() : [];
            const loansData = loansRes.ok ? await loansRes.json() : [];
            const loadDetailsData = loadDetailsRes.ok ? await loadDetailsRes.json() : [];
            
            // Fetch parameters
            const pRes = await fetch('http://localhost:4000/api/parameters', { headers });
            let localMaxBorrowDays = 4; // Default value
            if (pRes.ok) {
                const pData = await pRes.json();
                const q4Qty = pData.find((p: any) => p.paramName === 'QD4_MAX_BORROW_QUANTITY');
                if (q4Qty) setMaxBorrowQuantity(parseInt(q4Qty.paramValue));
                
                const q4Days = pData.find((p: any) => p.paramName === 'QD4_MAX_BORROW_DAYS');
                if (q4Days) {
                    localMaxBorrowDays = parseInt(q4Days.paramValue);
                    setMaxBorrowDays(localMaxBorrowDays);
                }
                
                const fineP = pData.find((p: any) => p.paramName === 'QD_FINE_PER_DAY');
                if (fineP) setFinePerDay(parseInt(fineP.paramValue));
                
                const lostFineP = pData.find((p: any) => p.paramName === 'QD_FINE_LOST_BOOK');
                if (lostFineP) setLostBookFine(parseInt(lostFineP.paramValue));
            }

            setReaders(Array.isArray(readersData) ? readersData : []);
            setAvailableCopies(Array.isArray(copiesData) ? copiesData.filter((c: any) => c.status === 1) : []);

            // Map Details
            const detailsMap: Record<string, LoanDetail[]> = {};
            (Array.isArray(loadDetailsData) ? loadDetailsData : []).forEach((d: any) => {
                const loanId = typeof d.loanId === 'object' ? d.loanId._id : d.loanId;
                if (!detailsMap[loanId]) detailsMap[loanId] = [];

                const book = d.copyId?.bookId;
                const title = book?.titleId;
                const category = title?.categoryId;

                detailsMap[loanId].push({
                    bookCode: d.copyId?._id,
                    title: title?.title || 'Unknown',
                    category: category?.categoryName || 'Unknown',
                    status: d.returnDate ? 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£' : 'Ã„Âang mÃ†Â°Ã¡Â»Â£n',
                    returnDate: d.returnDate ? new Date(d.returnDate).toLocaleDateString('vi-VN') : undefined,
                    fine: d.fineAmount,
                    copyId: d.copyId?._id,
                    detailId: d._id,
                    price: book?.price !== undefined ? book.price : title?.price // Use Book price first, then TitleBook price
                });
            });

            // Use loans data directly from backend - already calculated
            const mappedLoans = (Array.isArray(loansData) ? loansData : []).map((l: any) => {
                const details = detailsMap[l._id] || [];
                
                return {
                    id: l._id,
                    readerId: typeof l.readerId === 'object' ? l.readerId._id : l.readerId,
                    readerName: typeof l.readerId === 'object' ? l.readerId.fullName : 'Unknown',
                    date: l.borrowDate, // Already formatted by backend
                    dueDate: l.dueDate, // Already formatted by backend
                    returnDate: l.returnDate, // Already formatted by backend
                    status: l.status, // Calculated by backend
                    count: l.bookCount || details.length,
                    totalFine: l.totalFine || 0, // Backend calculated fine
                    details: details
                };
            });

            setLoans(mappedLoans);
            setLoanDetailsMap(detailsMap);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
        
        // Listen for parameter updates from other pages
        const handleParametersUpdated = () => {
            fetchData(); // Reload data to get updated parameters
        };
        
        window.addEventListener('parameters-updated', handleParametersUpdated);
        
        return () => {
            window.removeEventListener('parameters-updated', handleParametersUpdated);
        };
    }, [fetchData]);

    // --- LOGIC ---

    // Helper function to generate unique display names for readers
    const getReaderDisplayName = (reader: ApiReader, allReaders: ApiReader[]) => {
        return `${reader.fullName} - ${reader.email}`;
    };

    const handleReaderChange = (displayName: string) => {
        if (!displayName) {
            setBorrowReaderId("");
            setBorrowReaderDisplayName("");
            setBorrowReaderInfo(null);
            return;
        }

        // Find reader by matching the generated display name
        const reader = readers.find(r => getReaderDisplayName(r, readers) === displayName);

        if (reader) {
            // TÃƒÂ­nh sÃ¡Â»â€˜ sÃƒÂ¡ch Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ Ã„â€˜ang mÃ†Â°Ã¡Â»Â£n
            const readerActiveLoans = loans.filter(l => 
                l.readerId === reader._id && 
                (l.status === 'active' || l.status === 'overdue')
            );
            const currentBorrowedBooks = readerActiveLoans.reduce((sum, loan) => {
                const activeBooks = (loan.details || []).filter(d => d.status !== 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£');
                return sum + activeBooks.length;
            }, 0);

            // Check if reader card is expired
            const expiryDate = new Date(reader.expiryDate);
            const isExpired = getVietnamDate() > expiryDate;

            if (isExpired) {
                showToast(`ThÃ¡ÂºÂ» Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n tÃ¡Â»Â« ${expiryDate.toLocaleDateString('vi-VN')}. Vui lÃƒÂ²ng gia hÃ¡ÂºÂ¡n thÃ¡ÂºÂ» trÃ†Â°Ã¡Â»â€ºc khi mÃ†Â°Ã¡Â»Â£n sÃƒÂ¡ch!`, 'error');
            }

            setBorrowReaderId(reader._id);
            setBorrowReaderDisplayName(displayName); // Save display name
            setBorrowReaderInfo({
                id: reader._id,
                name: reader.fullName,
                class: typeof reader.readerTypeId === 'object' ? reader.readerTypeId.readerTypeName : '',
                email: reader.email,
                dob: new Date(reader.dateOfBirth).toLocaleDateString('vi-VN'),
                phone: (reader as any).phoneNumber || '',
                address: reader.address || '',
                currentBorrowedBooks: currentBorrowedBooks,
                maxBorrowLimit: typeof reader.readerTypeId === 'object' ? reader.readerTypeId.maxBorrowLimit : maxBorrowQuantity,
                expiryDate: expiryDate.toLocaleDateString('vi-VN'),
                isExpired: isExpired
            });
        } else {
            setBorrowReaderId("");
            setBorrowReaderDisplayName("");
            setBorrowReaderInfo(null);
        }
    }

    const activeLoansList = loans
        .filter(l => l.status === 'active' || l.status === 'overdue')
        .filter(l => {
            // Text search
            if (activeLoansSearch) {
                const searchLower = activeLoansSearch.toLowerCase();
                
                // LÃ¡ÂºÂ¥y reader info Ã„â€˜Ã¡Â»Æ’ search email
                const reader = readers.find(r => r._id === l.readerId);
                const readerEmail = reader?.email || '';
                
                const matchesSearch = l.id.toLowerCase().includes(searchLower) || 
                       l.readerName.toLowerCase().includes(searchLower) ||
                       readerEmail.toLowerCase().includes(searchLower);
                
                if (!matchesSearch) return false;
            }
            
            // Date filters
            // Filter by borrow date
            if (!isDateInRange(l.date, activeBorrowDateFrom, activeBorrowDateTo)) {
                return false;
            }
            
            // Filter by due date
            if (!isDateInRange(l.dueDate, activeDueDateFrom, activeDueDateTo)) {
                return false;
            }
            
            return true;
        });
    
    const returnedLoansList = loans
        .filter(l => l.status === 'returned')
        .filter(l => {
            // Text search
            if (returnedLoansSearch) {
                const searchLower = returnedLoansSearch.toLowerCase();
                
                // LÃ¡ÂºÂ¥y reader info Ã„â€˜Ã¡Â»Æ’ search email
                const reader = readers.find(r => r._id === l.readerId);
                const readerEmail = reader?.email || '';
                
                const matchesSearch = l.id.toLowerCase().includes(searchLower) || 
                       l.readerName.toLowerCase().includes(searchLower) ||
                       readerEmail.toLowerCase().includes(searchLower);
                
                if (!matchesSearch) return false;
            }
            
            // Date filters
            // Filter by borrow date
            if (!isDateInRange(l.date, returnedBorrowDateFrom, returnedBorrowDateTo)) {
                return false;
            }
            
            // Filter by return date
            if (l.returnDate && !isDateInRange(l.returnDate, returnedReturnDateFrom, returnedReturnDateTo)) {
                return false;
            }
            
            return true;
        });

    const handleViewDetail = (loan: Loan) => {
        setSelectedLoan(loan);
        setIsDetailModalOpen(true);
    };


    // Clear filter functions
    const clearActiveFilters = () => {
        setActiveLoansSearch("");
        setActiveBorrowDateFrom("");
        setActiveBorrowDateTo("");
        setActiveDueDateFrom("");
        setActiveDueDateTo("");
    };

    const clearReturnedFilters = () => {
        setReturnedLoansSearch("");
        setReturnedBorrowDateFrom("");
        setReturnedBorrowDateTo("");
        setReturnedReturnDateTo("");
    };

    // --- LOGIC TRÃ¡ÂºÂ¢ SÃƒÂCH ---
    // Unified function to prepare return preview
    const handlePrepareReturnPreview = async (loan: Loan) => {
        const reader = readers.find(r => r._id === loan.readerId);
        if (!reader) return;

        // Trigger checking logic
        const today = getVietnamDate();
        today.setHours(0, 0, 0, 0);
        const [day, month, year] = loan.dueDate.split('/').map(Number);
        const due = new Date(year, month - 1, day);
        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Use ceil to count partial days as full
        const isOverdue = today > due;
        const overdueDays = isOverdue ? diffDays : 0;
        const estimatedFinePerBook = overdueDays * finePerDay;

        setLostBookIds(new Set()); // Reset lost books state

        // Fetch reader's current debt
        try {
            const token = Cookies.get('access_token');
            const readerRes = await fetch(`http://localhost:4000/api/readers/${reader._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (readerRes.ok) {
                const readerData = await readerRes.json();
                
                setReturnPreview({
                    loanInfo: loan,
                    books: loanDetailsMap[loan.id] || [],
                    overdueDays: overdueDays,
                    estimatedFine: estimatedFinePerBook,
                    currentDebt: readerData.totalDebt || 0,
                    readerInfo: {
                        fullName: readerData.fullName,
                        totalDebt: readerData.totalDebt || 0,
                        _id: readerData._id
                    }
                });
            } else {
                // Fallback
                setReturnPreview({
                    loanInfo: loan,
                    books: loanDetailsMap[loan.id] || [],
                    overdueDays: overdueDays,
                    estimatedFine: estimatedFinePerBook,
                    currentDebt: 0,
                    readerInfo: {
                        fullName: reader.fullName,
                        totalDebt: 0,
                        _id: reader._id
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching reader debt:', error);
            setReturnPreview({
                loanInfo: loan,
                books: loanDetailsMap[loan.id] || [],
                overdueDays: overdueDays,
                estimatedFine: estimatedFinePerBook,
                currentDebt: 0,
                readerInfo: {
                    fullName: reader.fullName,
                    totalDebt: 0,
                    _id: reader._id
                }
            });
        }
    };

    const handleConfirmReturn = async () => {
        if (!returnPreview || isReturning) return;

        setIsReturning(true);
        try {
            const token = Cookies.get('access_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Process return for each book in the loan that is not yet returned
            const activeDetails = returnPreview.books.filter(b => b.status !== 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£');
            
            const totalFines = 0;
            // We use Promise.all to return all books
            // NEW: Use POST /return-book endpoint which handles isLost logic
            const results = await Promise.all(activeDetails.map(detail => {
                const isLost = lostBookIds.has(detail.detailId);
                // detail object in loanDetailsMap has copyId
                return fetch(`http://localhost:4000/api/loans/${returnPreview.loanInfo.id}/return-book`, { 
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        copyId: detail.copyId,
                        returnDate: getVietnamDate().toISOString(),
                        isLost: isLost
                    })
                }).then(async res => {
                    const data = await res.json();
                    return { ok: res.ok, data };
                });
            }));
            
            // Get the updated debt from the last response if available
            // Calculate total fines from results if possible, or refetch
            // The return-book endpoint returns the updated Loan object, but not explicitly the fine amount for *that* transaction unless we parse it.
            // But we have estimatedFine in preview.
            // Let's calculate total fines based on what we sent/estimated + lost book fine?
            // Actually, the user wants to see the fine result.
            // The POST /return-book updates the debt.
            // Let's fetch the reader again to show updated debt.
            const readerRes = await fetch(`http://localhost:4000/api/readers/${returnPreview.readerInfo._id}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            const updatedReader = readerRes.ok ? await readerRes.json() : null;
            const updatedDebt = updatedReader?.totalDebt || 0;

            if (totalFines > 0) {
                showToast(`Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£ sÃƒÂ¡ch! Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ bÃ¡Â»â€¹ phÃ¡ÂºÂ¡t thÃƒÂªm ${totalFines.toLocaleString('vi-VN')} Ã„â€˜. TÃ¡Â»â€¢ng nÃ¡Â»Â£ hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i: ${updatedDebt?.toLocaleString('vi-VN')} Ã„â€˜`, 'warning');
            } else {
                showToast("Ã„ÂÃƒÂ£ xÃ¡Â»Â­ lÃƒÂ½ trÃ¡ÂºÂ£ sÃƒÂ¡ch thÃƒÂ nh cÃƒÂ´ng!", 'success');
            }

            setIsReturnModalOpen(false);
            setReturnPreview(null);
            setReturnQuery("");
            await fetchData(); // Refresh data
        } catch (error) {
            console.error("Error returning books:", error);
            showToast("CÃƒÂ³ lÃ¡Â»â€”i xÃ¡ÂºÂ£y ra khi trÃ¡ÂºÂ£ sÃƒÂ¡ch!", 'error');
        } finally {
            setIsReturning(false);
        }
    };



    const handleConfirmBorrow = async () => {
        if (isBorrowing) return;

        const reader = readers.find(r => r._id === borrowReaderId);
        const realReaderId = reader ? reader._id : borrowReaderId;

        if (!realReaderId || borrowRows.length === 0 || !borrowRows[0].title) {
            showToast("Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡ÂºÂ§y Ã„â€˜Ã¡Â»Â§ thÃƒÂ´ng tin!", 'warning');
            return;
        }

        // Check if reader card is expired
        if (borrowReaderInfo?.isExpired) {
            showToast(`ThÃ¡ÂºÂ» Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n. Vui lÃƒÂ²ng gia hÃ¡ÂºÂ¡n thÃ¡ÂºÂ» trÃ†Â°Ã¡Â»â€ºc khi mÃ†Â°Ã¡Â»Â£n sÃƒÂ¡ch!`, 'error');
            return;
        }

        // Validate that all rows have valid book selections
        const bookIds = borrowRows.map(row => row.copyId).filter(Boolean);
        if (bookIds.length === 0) {
            showToast("Vui lÃƒÂ²ng chÃ¡Â»Ân sÃƒÂ¡ch Ã„â€˜Ã¡Â»Æ’ mÃ†Â°Ã¡Â»Â£n!", 'warning');
            return;
        }

        if (bookIds.length !== borrowRows.length) {
            showToast("Vui lÃƒÂ²ng chÃ¡Â»Ân Ã„â€˜Ã¡ÂºÂ§y Ã„â€˜Ã¡Â»Â§ thÃƒÂ´ng tin sÃƒÂ¡ch cho tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ cÃƒÂ¡c dÃƒÂ²ng!", 'warning');
            return;
        }

        setIsBorrowing(true);
        try {
            const token = Cookies.get('access_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // 1. Create Loan
            console.log('Creating loan with data:', {
                readerId: realReaderId,
                bookIds: bookIds
            });

            const loadRes = await fetch('http://localhost:4000/api/loans', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    readerId: realReaderId,
                    bookIds: bookIds
                })
            });

            if (!loadRes.ok) {
                const errorData = await loadRes.json();
                console.error("Loan creation failed:", errorData);
                console.error("Error details:", JSON.stringify(errorData, null, 2));
                
                // Show detailed error messages if available
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    const errorMessages = errorData.errors.map((e: any) => e.message).join('; ');
                    throw new Error(errorMessages);
                }
                
                throw new Error(errorData.message || "Failed to create loan");
            }
            
            const loadData = await loadRes.json();
            console.log('Loan created successfully:', loadData);
            const loanId = loadData._id;

            // 2. Create Loan Details
            console.log('Creating loan details for loan:', loanId);
            const detailPromises = borrowRows.map(row => {
                if (!row.copyId) return Promise.resolve();
                console.log('Creating detail for copy:', row.copyId);
                return fetch('http://localhost:4000/api/loans-details', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        loanId: loanId,
                        copyId: row.copyId
                    })
                }).then(async res => {
                    if (!res.ok) {
                        const errData = await res.json();
                        console.error('Failed to create loan detail:', errData);
                        throw new Error(`Failed to create loan detail: ${errData.message}`);
                    }
                    return res.json();
                });
            });

            await Promise.all(detailPromises);
            console.log('All loan details created successfully');

            showToast("LÃ¡ÂºÂ­p phiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n thÃƒÂ nh cÃƒÂ´ng!", 'success');
            setIsLoanModalOpen(false);
            setBorrowReaderId("");
            setBorrowReaderDisplayName("");
            setBorrowReaderInfo(null);
            setBorrowRows([{ id: Date.now(), title: "", author: "", category: "" }]);
            fetchData(); // Refresh data

        } catch (error: any) {
            console.error("Error creating loan:", error);
            showToast(error.message || "CÃƒÂ³ lÃ¡Â»â€”i xÃ¡ÂºÂ£y ra khi lÃ¡ÂºÂ­p phiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n!", 'error');
        } finally {
            setIsBorrowing(false);
        }
    };

    const addRow = () => {
        const maxLimit = borrowReaderInfo?.maxBorrowLimit || maxBorrowQuantity;
        const currentlyBorrowed = borrowReaderInfo?.currentBorrowedBooks || 0;
        const availableSlots = maxLimit - currentlyBorrowed;
        
        if (borrowRows.length >= availableSlots) {
            showToast(`Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ chÃ¡Â»â€° cÃƒÂ²n Ã„â€˜Ã†Â°Ã¡Â»Â£c mÃ†Â°Ã¡Â»Â£n thÃƒÂªm ${availableSlots} cuÃ¡Â»â€˜n (Ã„â€˜ang mÃ†Â°Ã¡Â»Â£n ${currentlyBorrowed}/${maxLimit})`, 'warning');
            return;
        }
        setBorrowRows([...borrowRows, { id: Date.now(), title: "", author: "", category: "" }]);
    };

    const removeRow = (id: number) => {
        if (borrowRows.length === 1) {
            setBorrowRows([{ id: Date.now(), title: "", author: "", category: "" }]);
        } else {
            setBorrowRows(borrowRows.filter(r => r.id !== id));
        }
    };

    const getAuthorName = (copy: any) => {
        const authors = copy.bookId?.titleId?.authors;
        if (Array.isArray(authors) && authors.length > 0) {
            return authors.map((a: any) => a.authorId?.authorName).filter(Boolean).join(', ');
        }
        return 'Unknown';
    };

    const updateRow = (id: number, field: keyof BorrowRow, value: string) => {
        const newRows = borrowRows.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row, [field]: value };
                if (field === 'title') {
                    // Auto-fill category and find copy if title is selected
                    const copy = availableCopies.find(c => c.bookId?.titleId?.title === value);
                    if (copy) {
                        updatedRow.category = copy.bookId?.titleId?.categoryId?.categoryName || 'Unknown';
                        updatedRow.author = getAuthorName(copy);
                        updatedRow.copyId = copy._id;
                    }
                } else if (field === 'category') {
                    // Clear title if it doesn't match the new category
                    if (updatedRow.title) {
                        const currentTitleCopy = availableCopies.find(c => c.bookId?.titleId?.title === updatedRow.title);
                        if (currentTitleCopy?.bookId?.titleId?.categoryId?.categoryName !== value) {
                            updatedRow.title = "";
                            updatedRow.copyId = undefined;
                            updatedRow.author = "";
                        }
                    }
                } else if (field === 'author') {
                    // Clear title if it doesn't match the new author
                    if (updatedRow.title) {
                        const currentTitleCopy = availableCopies.find(c => c.bookId?.titleId?.title === updatedRow.title);
                        if (currentTitleCopy && !getAuthorName(currentTitleCopy).includes(value)) {
                            updatedRow.title = "";
                            updatedRow.copyId = undefined;
                        }
                    }
                }
                return updatedRow;
            }
            return row;
        });
        setBorrowRows(newRows);
    };

    const optionsReaderIds = readers.map(r => r._id);

    return (
        <div className="min-h-screen bg-background p-6 font-sans text-foreground space-y-8">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">QuÃ¡ÂºÂ£n lÃƒÂ½ LÃ†Â°u thÃƒÂ´ng</h1>
                <p className="text-muted-foreground mt-1">Theo dÃƒÂµi MÃ†Â°Ã¡Â»Â£n - TrÃ¡ÂºÂ£ & LÃ¡Â»â€¹ch sÃ¡Â»Â­ giao dÃ¡Â»â€¹ch</p>
            </div>

            {/* TABS */}
            <div className="w-full space-y-6">
                <div className="flex p-1 bg-card border border-border rounded-lg w-fit shadow-sm">
                    <button onClick={() => setActiveTab('borrow')} className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'borrow' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        <BookOpen className="w-4 h-4" /> Danh sÃƒÂ¡ch Ã„Âang mÃ†Â°Ã¡Â»Â£n
                    </button>
                    <button onClick={() => setActiveTab('return')} className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'return' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Clock className="w-4 h-4" /> LÃ¡Â»â€¹ch sÃ¡Â»Â­ Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£
                    </button>
                </div>

                <div className="bg-card rounded-xl border border-border shadow-sm min-h-[500px]">
                    {/* TAB CONTENT */}
                    {activeTab === 'borrow' && (
                        <div className="p-6 space-y-6 animate-in fade-in">
                            {/* Search and Filters */}
                            <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-4">
                                {/* Text Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="TÃƒÂ¬m theo mÃƒÂ£ phiÃ¡ÂºÂ¿u, Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£, email..." 
                                        className="pl-9" 
                                        value={activeLoansSearch}
                                        onChange={(e) => setActiveLoansSearch(e.target.value)}
                                    />
                                </div>
                                
                                {/* Date Filters */}
                                <div className="space-y-3">
                                    {/* NgÃƒÂ y MÃ†Â°Ã¡Â»Â£n */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-slate-700 w-24">NgÃƒÂ y MÃ†Â°Ã¡Â»Â£n</label>
                                        <div className="flex gap-2 items-center flex-1">
                                            <Input
                                                type="date"
                                                value={activeBorrowDateFrom}
                                                onChange={(e) => setActiveBorrowDateFrom(e.target.value)}
                                                className="text-sm"
                                            />
                                            <span className="text-slate-400">-</span>
                                            <Input
                                                type="date"
                                                value={activeBorrowDateTo}
                                                onChange={(e) => setActiveBorrowDateTo(e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* HÃ¡ÂºÂ¡n TrÃ¡ÂºÂ£ */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-slate-700 w-24">HÃ¡ÂºÂ¡n TrÃ¡ÂºÂ£</label>
                                        <div className="flex gap-2 items-center flex-1">
                                            <Input
                                                type="date"
                                                value={activeDueDateFrom}
                                                onChange={(e) => setActiveDueDateFrom(e.target.value)}
                                                className="text-sm"
                                            />
                                            <span className="text-slate-400">-</span>
                                            <Input
                                                type="date"
                                                value={activeDueDateTo}
                                                onChange={(e) => setActiveDueDateTo(e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Clear Filters Button */}
                                <div className="flex justify-end">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={clearActiveFilters}
                                        className="text-slate-600"
                                    >
                                        <X className="w-4 h-4 mr-1" /> XÃƒÂ³a bÃ¡Â»â„¢ lÃ¡Â»Âc
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="flex justify-end">
                                <Button onClick={() => {
                                    setBorrowReaderId("");
                                    setBorrowReaderInfo(null);
                                    setBorrowRows([{ id: Date.now(), title: "", author: "", category: "" }]);
                                    setIsLoanModalOpen(true);
                                }}>
                                    <Plus className="w-4 h-4 mr-2" /> LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n
                                </Button>
                            </div>
                            
                            <LoanTable data={activeLoansList} onViewDetail={handleViewDetail} />
                        </div>
                    )}

                    {activeTab === 'return' && (
                        <div className="p-6 space-y-6 animate-in fade-in">
                            {/* Search and Filters */}
                            <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-4">
                                {/* Text Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="TÃƒÂ¬m theo mÃƒÂ£ phiÃ¡ÂºÂ¿u, Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£, email..." 
                                        className="pl-9" 
                                        value={returnedLoansSearch}
                                        onChange={(e) => setReturnedLoansSearch(e.target.value)}
                                    />
                                </div>
                                
                                {/* Date Filters */}
                                <div className="space-y-3">
                                    {/* NgÃƒÂ y MÃ†Â°Ã¡Â»Â£n */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-slate-700 w-24">NgÃƒÂ y MÃ†Â°Ã¡Â»Â£n</label>
                                        <div className="flex gap-2 items-center flex-1">
                                            <Input
                                                type="date"
                                                value={returnedBorrowDateFrom}
                                                onChange={(e) => setReturnedBorrowDateFrom(e.target.value)}
                                                className="text-sm"
                                            />
                                            <span className="text-slate-400">-</span>
                                            <Input
                                                type="date"
                                                value={returnedBorrowDateTo}
                                                onChange={(e) => setReturnedBorrowDateTo(e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* NgÃƒÂ y TrÃ¡ÂºÂ£ */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-slate-700 w-24">NgÃƒÂ y TrÃ¡ÂºÂ£</label>
                                        <div className="flex gap-2 items-center flex-1">
                                            <Input
                                                type="date"
                                                value={returnedReturnDateFrom}
                                                onChange={(e) => setReturnedReturnDateFrom(e.target.value)}
                                                className="text-sm"
                                            />
                                            <span className="text-slate-400">-</span>
                                            <Input
                                                type="date"
                                                value={returnedReturnDateTo}
                                                onChange={(e) => setReturnedReturnDateTo(e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Clear Filters Button */}
                                <div className="flex justify-end">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={clearReturnedFilters}
                                        className="text-slate-600"
                                    >
                                        <X className="w-4 h-4 mr-1" /> XÃƒÂ³a bÃ¡Â»â„¢ lÃ¡Â»Âc
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="flex justify-end">
                                <Button variant="success" onClick={() => {
                                    setIsReturnModalOpen(true);
                                }} className="shadow-md">
                                    <Check className="w-4 h-4 mr-2" /> NhÃ¡ÂºÂ­n TrÃ¡ÂºÂ£ SÃƒÂ¡ch
                                </Button>
                            </div>
                            
                            <LoanTable data={returnedLoansList} onViewDetail={handleViewDetail} isHistory />
                        </div>
                    )}
                </div>
            </div>

            {/* === MODAL 1: LÃ¡ÂºÂ¬P PHIÃ¡ÂºÂ¾U MÃ†Â¯Ã¡Â»Â¢N (Ã„ÂÃƒÆ’ UPDATE THÃƒÅ M FIELD) === */}
            {isLoanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/40">
                            <div><h2 className="text-lg font-bold text-foreground">LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n MÃ¡Â»â€ºi</h2></div>
                            <button onClick={() => setIsLoanModalOpen(false)}><X className="w-6 h-6 text-muted-foreground hover:text-foreground" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/20">
                            {/* SECTION THÃƒâ€NG TIN Ã„ÂÃ¡Â»ËœC GIÃ¡ÂºÂ¢ */}
                            <div className="bg-card p-5 rounded-lg border border-border shadow-sm">
                                <div className="flex items-center gap-2 mb-4 text-primary font-semibold text-sm uppercase">
                                    <User className="w-4 h-4" /> ThÃƒÂ´ng tin Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£
                                </div>
                                {/* Layout Grid 3 CÃ¡Â»â„¢t */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Row 1 */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ <span className="text-destructive">*</span></label>
                                        <Combobox 
                                            value={borrowReaderDisplayName} 
                                            onChange={handleReaderChange} 
                                            options={readers.map(r => getReaderDisplayName(r, readers))} 
                                            placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»Æ’ tÃƒÂ¬m..." 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">HÃ¡Â»Â tÃƒÂªn</label>
                                        <Input disabled value={borrowReaderInfo?.name || ""} placeholder="..." className="bg-muted" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">LoÃ¡ÂºÂ¡i Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£</label>
                                        <Input disabled value={borrowReaderInfo?.class || ""} placeholder="..." className="bg-muted" />
                                    </div>

                                    {/* Row 2 */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> SÃ¡Â»â€˜ Ã„â€˜iÃ¡Â»â€¡n thoÃ¡ÂºÂ¡i</label>
                                        <Input disabled value={borrowReaderInfo?.phone || ""} placeholder="..." className="bg-muted" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium flex items-center gap-1"><Cake className="w-3 h-3" /> NgÃƒÂ y sinh</label>
                                        <Input disabled value={borrowReaderInfo?.dob || ""} placeholder="..." className="bg-muted" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> HÃ¡ÂºÂ¡n thÃ¡ÂºÂ»</label>
                                        <Input 
                                            disabled 
                                            value={borrowReaderInfo?.expiryDate || ""} 
                                            placeholder="..." 
                                            className={`bg-muted font-semibold ${borrowReaderInfo?.isExpired ? 'text-destructive' : ''}`} 
                                        />
                                    </div>

                                    {/* Row 3 */}
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-sm font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> Ã„ÂÃ¡Â»â€¹a chÃ¡Â»â€°</label>
                                        <Input disabled value={borrowReaderInfo?.address || ""} placeholder="..." className="bg-muted" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">SÃ¡Â»â€˜ sÃƒÂ¡ch Ã„â€˜ang mÃ†Â°Ã¡Â»Â£n</label>
                                        <Input 
                                            disabled 
                                            value={borrowReaderInfo ? `${borrowReaderInfo.currentBorrowedBooks || 0}/${borrowReaderInfo.maxBorrowLimit || maxBorrowQuantity}` : ""} 
                                            placeholder="..." 
                                            className="bg-muted font-semibold text-center" 
                                        />
                                    </div>
                                </div>
                                
                                {/* Warning if card expired */}
                                {borrowReaderInfo?.isExpired && (
                                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                                        <p className="text-sm text-destructive font-medium">
                                            ThÃ¡ÂºÂ» Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n tÃ¡Â»Â« {borrowReaderInfo.expiryDate}. Vui lÃƒÂ²ng gia hÃ¡ÂºÂ¡n thÃ¡ÂºÂ» trÃ†Â°Ã¡Â»â€ºc khi mÃ†Â°Ã¡Â»Â£n sÃƒÂ¡ch!
                                        </p>
                                    </div>
                                )}
                                
                                {/* Warning if reached borrow limit */}
                                {borrowReaderInfo && !borrowReaderInfo.isExpired && 
                                    borrowReaderInfo.currentBorrowedBooks !== undefined && 
                                    borrowReaderInfo.maxBorrowLimit !== undefined &&
                                    borrowReaderInfo.currentBorrowedBooks >= borrowReaderInfo.maxBorrowLimit && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <p className="text-sm text-amber-800 font-medium">
                                            Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ Ã„â€˜ÃƒÂ£ Ã„â€˜Ã¡ÂºÂ¡t giÃ¡Â»â€ºi hÃ¡ÂºÂ¡n mÃ†Â°Ã¡Â»Â£n sÃƒÂ¡ch ({borrowReaderInfo.currentBorrowedBooks}/{borrowReaderInfo.maxBorrowLimit}). KhÃƒÂ´ng thÃ¡Â»Æ’ mÃ†Â°Ã¡Â»Â£n thÃƒÂªm sÃƒÂ¡ch!
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* SECTION CHI TIÃ¡ÂºÂ¾T SÃƒÂCH - ChÃ¡Â»â€° hiÃ¡Â»Æ’n khi Ã„â€˜ÃƒÂ£ chÃ¡Â»Ân Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ vÃƒÂ  hÃ¡Â»Â£p lÃ¡Â»â€¡ */}
                            {borrowReaderInfo && !borrowReaderInfo.isExpired && 
                                borrowReaderInfo.currentBorrowedBooks !== undefined && 
                                borrowReaderInfo.maxBorrowLimit !== undefined &&
                                borrowReaderInfo.currentBorrowedBooks < borrowReaderInfo.maxBorrowLimit && (
                            <div className="bg-card p-5 rounded-lg border border-border shadow-sm min-h-[300px]">                                
                            <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase"><Book className="w-4 h-4" /> Chi tiÃ¡ÂºÂ¿t SÃƒÂ¡ch ({borrowRows.length}/{(borrowReaderInfo?.maxBorrowLimit || maxBorrowQuantity) - (borrowReaderInfo?.currentBorrowedBooks || 0)})</div>
                                    <ExpectedDueDate days={maxBorrowDays} />
                                </div>
                                <div className="border border-border rounded-lg pb-4">
                                    <table className="w-full text-sm text-left table-fixed">
                                        <thead className="bg-muted/60 text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2 w-12 text-center">#</th>
                                                <th className="px-3 py-2">TÃƒÂªn SÃƒÂ¡ch</th>
                                                <th className="px-3 py-2 w-48">TÃƒÂ¡c giÃ¡ÂºÂ£</th>
                                                <th className="px-3 py-2 w-40">ThÃ¡Â»Æ’ loÃ¡ÂºÂ¡i</th>
                                                <th className="px-3 py-2 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {borrowRows.map((row, index) => {
                                                const rowCategory = row.category;
                                                const rowTitle = row.title;
                                                const rowAuthor = row.author;

                                                // Get codes selected in OTHER rows
                                                const otherSelectedTitles = borrowRows
                                                    .filter(r => r.id !== row.id)
                                                    .map(r => r.title)
                                                    .filter(Boolean);

                                                const copiesForTitle = availableCopies.filter(c => {
                                                    const title = c.bookId?.titleId?.title;
                                                    const categoryName = c.bookId?.titleId?.categoryId?.categoryName;
                                                    return (!rowCategory || categoryName === rowCategory) &&
                                                        (!rowAuthor || getAuthorName(c).includes(rowAuthor)) &&
                                                        !otherSelectedTitles.includes(title || "");
                                                });
                                                const rowOptionsTitles = [...new Set(copiesForTitle.map(c => c.bookId?.titleId?.title).filter((x): x is string => !!x))];

                                                const rowOptionsCategories = [...new Set(availableCopies.map(c => c.bookId?.titleId?.categoryId?.categoryName).filter((x): x is string => !!x))];

                                                // Extract all individual authors from available copies
                                                const allAuthors = availableCopies.flatMap(c => {
                                                    const authors = c.bookId?.titleId?.authors;
                                                    if (Array.isArray(authors)) {
                                                        return authors.map((a: any) => a.authorId?.authorName);
                                                    }
                                                    return [];
                                                }).filter((x): x is string => !!x);
                                                const rowOptionsAuthors = [...new Set(allAuthors)];

                                                return (
                                                    <tr key={row.id} className="bg-card">
                                                        <td className="px-3 py-2 text-center text-muted-foreground w-12">{index + 1}</td>
                                                        <td className="px-3 py-2"><Combobox value={row.title} onChange={(val) => updateRow(row.id, 'title', val)} options={rowOptionsTitles} placeholder="TÃƒÂªn sÃƒÂ¡ch..." /></td>
                                                        <td className="px-3 py-2 w-48"><Combobox value={row.author} onChange={(val) => updateRow(row.id, 'author', val)} options={rowOptionsAuthors} placeholder="TÃƒÂ¡c giÃ¡ÂºÂ£..." /></td>
                                                        <td className="px-3 py-2 w-40"><Combobox value={row.category} onChange={(val) => updateRow(row.id, 'category', val)} options={rowOptionsCategories} placeholder="ThÃ¡Â»Æ’ loÃ¡ÂºÂ¡i..." /></td>
                                                        <td className="px-3 py-2 text-center w-12"><button onClick={() => removeRow(row.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-3"><Button variant="outline" size="sm" onClick={addRow} className="border-dashed w-full text-muted-foreground hover:text-primary"><Plus className="w-4 h-4 mr-2" /> ThÃƒÂªm dÃƒÂ²ng</Button></div>
                            </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-muted/40 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsLoanModalOpen(false)}>HÃ¡Â»Â§y</Button>
                            <Button 
                                onClick={handleConfirmBorrow}
                                disabled={
                                    isBorrowing ||
                                    !borrowReaderInfo || 
                                    borrowReaderInfo.isExpired || 
                                    (borrowReaderInfo.currentBorrowedBooks !== undefined && 
                                     borrowReaderInfo.maxBorrowLimit !== undefined &&
                                     borrowReaderInfo.currentBorrowedBooks >= borrowReaderInfo.maxBorrowLimit) ||
                                    borrowRows.length === 0 ||
                                    !borrowRows.some(row => row.title) // PhÃ¡ÂºÂ£i chÃ¡Â»Ân ÃƒÂ­t nhÃ¡ÂºÂ¥t 1 sÃƒÂ¡ch
                                }
                            >
                                {isBorrowing ? 'Ã„Âang xÃ¡Â»Â­ lÃƒÂ½...' : 'LÃ†Â°u PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL 2: XÃ¡Â»Â¬ LÃƒÂ TRÃ¡ÂºÂ¢ SÃƒÂCH === */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 h-[90vh]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/40">
                            <div>
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Check className="w-5 h-5 text-primary" /> NhÃ¡ÂºÂ­n TrÃ¡ÂºÂ£ SÃƒÂ¡ch
                                </h2>
                            </div>
                            <button onClick={() => { setIsReturnModalOpen(false); setReturnPreview(null); setReturnQuery(""); }}><X className="w-6 h-6 text-muted-foreground hover:text-foreground" /></button>
                        </div>

                        <div className="p-6 bg-muted/20 flex-1 overflow-y-auto">
                            {!returnPreview ? (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>TÃƒÂ¬m kiÃ¡ÂºÂ¿m Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ Ã„â€˜Ã¡Â»Æ’ xem phiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n cÃ¡ÂºÂ§n trÃ¡ÂºÂ£</span>
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <div className="w-full">
                                                    {/* ONLY Reader Search - Filtered by Active Loans */}
                                                    <Combobox
                                                    value={returnQuery} 
                                                    onChange={(val) => setReturnQuery(val)}
                                                    options={(() => {
                                                        // Get IDs of readers who have active or overdue loans
                                                        const activeReaderIds = new Set(loans
                                                            .filter(l => l.status === 'active' || l.status === 'overdue')
                                                            .map(l => l.readerId)
                                                        );
                                                        
                                                        // Filter readers list
                                                        const activeReaders = readers.filter(r => activeReaderIds.has(r._id));
                                                        
                                                        return activeReaders.map(r => getReaderDisplayName(r, readers));
                                                    })()}
                                                    placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ hoÃ¡ÂºÂ·c email..."
                                                    className="w-full pl-9"
                                                    />
                                            </div>
                                        </div>
                                    </div>

                                    {/* LIST OF LOANS FOR SELECTED READER */}
                                    {(() => {
                                         const reader = readers.find(r => getReaderDisplayName(r, readers) === returnQuery);
                                         if (reader) {
                                             const readerLoans = loans.filter(l => 
                                                 l.readerId === reader._id && 
                                                 (l.status === 'active' || l.status === 'overdue')
                                             );

                                             return (
                                                 <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                                     <div className="flex items-center justify-between">
                                                         <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                                                             PhiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n Ã„â€˜ang mÃ¡Â»Å¸ cÃ¡Â»Â§a {reader.fullName} ({readerLoans.length})
                                                         </h3>
                                                     </div>
                                                     
                                                     {readerLoans.length > 0 ? (
                                                         <div className="grid gap-3">
                                                             {readerLoans.map(loan => (
                                                                 <div 
                                                                     key={loan.id} 
                                                                     className="bg-card hover:bg-accent/40 border border-border rounded-lg p-4 cursor-pointer transition-all flex justify-between items-center group shadow-sm"
                                                                     onClick={() => handlePrepareReturnPreview(loan)}
                                                                 >
                                                                     <div className="flex items-center gap-4">
                                                                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                              <FileText className="w-5 h-5" />
                                                                          </div>
                                                                          <div>
                                                                              <div className="font-bold text-foreground">{loan.id}</div>
                                                                              <div className="text-sm text-muted-foreground">MÃ†Â°Ã¡Â»Â£n ngÃƒÂ y: {loan.date}</div>
                                                                          </div>
                                                                     </div>
                                                                     <div className="text-right">
                                                                         <div className={`font-semibold ${loan.status === 'overdue' ? 'text-destructive' : 'text-emerald-600'}`}>
                                                                             {loan.status === 'overdue' ? 'QuÃƒÂ¡ hÃ¡ÂºÂ¡n' : 'Ã„Âang mÃ†Â°Ã¡Â»Â£n'}
                                                                         </div>
                                                                         <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-end gap-1">
                                                                             ChÃ¡Â»Ân Ã„â€˜Ã¡Â»Æ’ trÃ¡ÂºÂ£ <ChevronDown className="w-3 h-3 -rotate-90" />
                                                                         </div>
                                                                     </div>
                                                                 </div>
                                                             ))}
                                                         </div>
                                                     ) : (
                                                         <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
                                                             Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ nÃƒÂ y khÃƒÂ´ng cÃƒÂ³ phiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n nÃƒÂ o Ã„â€˜ang mÃ¡Â»Å¸.
                                                         </div>
                                                     )}
                                                 </div>
                                             );
                                         }
                                         
                                         // Suggestion/Empty state when no reader selected or search is empty
                                         if (!returnQuery) {
                                             return (
                                                 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                                                     <User className="w-12 h-12 mb-3 opacity-20" />
                                                     <p>Vui lÃƒÂ²ng chÃ¡Â»Ân Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ Ã„â€˜Ã¡Â»Æ’ xem danh sÃƒÂ¡ch sÃƒÂ¡ch Ã„â€˜ang mÃ†Â°Ã¡Â»Â£n</p>
                                                 </div>
                                             );
                                         }
                                         
                                         return null;
                                    })()}
                                </div>
                            ) : (
                                /* Step 2: Preview Details (SAME AS BEFORE) */
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button variant="ghost" size="sm" onClick={() => setReturnPreview(null)} className="pl-0 gap-1 hover:pl-2 transition-all">
                                             <ChevronDown className="w-4 h-4 rotate-90" /> Quay lÃ¡ÂºÂ¡i tÃƒÂ¬m kiÃ¡ÂºÂ¿m
                                        </Button>
                                    </div>

                                    {/* Info Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">ThÃƒÂ´ng tin Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£</div>
                                            <div className="font-medium text-lg text-foreground">{returnPreview.loanInfo.readerName}</div>
                                            <div className="text-muted-foreground text-sm">MÃƒÂ£: {returnPreview.loanInfo.readerId}</div>
                                            <div className="text-muted-foreground text-sm font-mono mt-1">PhiÃ¡ÂºÂ¿u: {returnPreview.loanInfo.id}</div>
                                        </div>
                                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">TrÃ¡ÂºÂ¡ng thÃƒÂ¡i PhiÃ¡ÂºÂ¿u</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">HÃ¡ÂºÂ¡n trÃ¡ÂºÂ£: </span>
                                                <span className="font-bold">{returnPreview.loanInfo.dueDate}</span>
                                            </div>
                                            {returnPreview.overdueDays > 0 ? (
                                                <div className="mt-1 flex items-center text-destructive font-bold text-sm">
                                                    <AlertCircle className="w-4 h-4 mr-1" /> QuÃƒÂ¡ hÃ¡ÂºÂ¡n {returnPreview.overdueDays} ngÃƒÂ y
                                                </div>
                                            ) : (
                                                <div className="mt-1 text-emerald-600 font-medium text-sm">Ã„ÂÃƒÂºng hÃ¡ÂºÂ¡n</div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Books List */}
                                    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 bg-muted/60 border-b border-border font-semibold text-sm flex justify-between">
                                            <span>SÃƒÂ¡ch Ã„â€˜ang mÃ†Â°Ã¡Â»Â£n ({returnPreview.books.length})</span>
                                            <span className="text-muted-foreground font-normal">TÃ¡Â»Â± Ã„â€˜Ã¡Â»â„¢ng chÃ¡Â»Ân tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£</span>
                                        </div>
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/40 text-muted-foreground">
                                                <tr>
                                                    <th className="px-4 py-2 w-10"><input type="checkbox" checked readOnly className="rounded" /></th>
                                                    <th className="px-4 py-2">MÃƒÂ£ sÃƒÂ¡ch</th>
                                                    <th className="px-4 py-2">TÃƒÂªn sÃƒÂ¡ch</th>
                                                    <th className="px-4 py-2">GiÃƒÂ¡ sÃƒÂ¡ch</th>
                                                    <th className="px-4 py-2">Ghi chÃƒÂº (TÃƒÂ¬nh trÃ¡ÂºÂ¡ng)</th>
                                                    <th className="px-4 py-2 text-center">MÃ¡ÂºÂ¥t sÃƒÂ¡ch?</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {returnPreview.books.map((book, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3"><input type="checkbox" checked={book.status !== 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£'} readOnly className="rounded text-primary" /></td>
                                                        <td className="px-4 py-3 font-mono text-muted-foreground">{book.bookCode}</td>
                                                        <td className="px-4 py-3 font-medium">{book.title}</td>
                                                        <td className="px-4 py-3 font-mono text-muted-foreground">{(book.price || 50000).toLocaleString('vi-VN')} Ã„â€˜</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`text-xs px-2 py-1 rounded border ${book.status === 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-primary/10 text-primary border-primary/30'}`}>
                                                                {book.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {book.status !== 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£' && (
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="rounded text-destructive focus:ring-destructive"
                                                                    checked={lostBookIds.has(book.detailId)}
                                                                    onChange={(e) => {
                                                                        const newSet = new Set(lostBookIds);
                                                                        if (e.target.checked) {
                                                                            newSet.add(book.detailId);
                                                                        } else {
                                                                            newSet.delete(book.detailId);
                                                                        }
                                                                        setLostBookIds(newSet);
                                                                    }}
                                                                />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Fine Calculation */}
                                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="font-bold text-destructive flex items-center gap-2">
                                                <DollarSign className="w-5 h-5" /> CHI TIÃ¡ÂºÂ¾T TIÃ¡Â»â‚¬N PHÃ¡ÂºÂ T
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm text-destructive">
                                            {(() => {
                                                const [day, month, year] = returnPreview.loanInfo.dueDate.split('/').map(Number);
                                                const dueDate = new Date(year, month - 1, day);
                                                const today = getVietnamDate();
                                                today.setHours(0, 0, 0, 0);
                                                
                                                // Calculate fine for each book being returned
                                                const booksToReturn = returnPreview.books.filter(b => b.status !== 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£');
                                                let totalFine = 0;
                                                
                                                booksToReturn.forEach(book => {
                                                    if (today > dueDate) {
                                                        const diffTime = today.getTime() - dueDate.getTime();
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                        totalFine += diffDays * finePerDay;
                                                    }
                                                    if (lostBookIds.has(book.detailId)) {
                                                        // Use book price for lost fine
                                                        totalFine += book.price || 50000;
                                                    }
                                                });
                                                
                                                const overdueDays = today > dueDate ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                                                
                                                return (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span>SÃ¡Â»â€˜ ngÃƒÂ y quÃƒÂ¡ hÃ¡ÂºÂ¡n:</span>
                                                            <span className="font-medium">{overdueDays} ngÃƒÂ y</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Ã„ÂÃ†Â¡n giÃƒÂ¡ phÃ¡ÂºÂ¡t:</span>
                                                            <span className="font-medium">{finePerDay.toLocaleString('vi-VN')} Ã„â€˜ / cuÃ¡Â»â€˜n / ngÃƒÂ y</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>SÃ¡Â»â€˜ sÃƒÂ¡ch trÃ¡ÂºÂ£:</span>
                                                            <span className="font-medium">{booksToReturn.length} cuÃ¡Â»â€˜n</span>
                                                        </div>
                                                        <div className="border-t border-destructive/40 my-2 pt-2 flex justify-between items-center font-bold text-destructive">
                                                            <span>TiÃ¡Â»Ân phÃ¡ÂºÂ¡t tÃ¡Â»Â« phiÃ¡ÂºÂ¿u nÃƒÂ y:</span>
                                                            <span>{totalFine.toLocaleString('vi-VN')} Ã„â€˜</span>
                                                        </div>
                                                        {lostBookIds.size > 0 && (
                                                            <div className="text-xs text-destructive text-right italic">
                                                                (Ã„ÂÃƒÂ£ bao gÃ¡Â»â€œm phÃƒÂ­ mÃ¡ÂºÂ¥t sÃƒÂ¡ch theo giÃƒÂ¡ bÃƒÂ¬a)
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Debt Summary - New Section */}
                                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="font-bold text-amber-900 flex items-center gap-2 text-base">
                                                <AlertCircle className="w-5 h-5" /> TÃ¡Â»â€NG KÃ¡ÂºÂ¾T NÃ¡Â»Â¢
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            {(() => {
                                                const [day, month, year] = returnPreview.loanInfo.dueDate.split('/').map(Number);
                                                const dueDate = new Date(year, month - 1, day);
                                                const today = getVietnamDate();
                                                today.setHours(0, 0, 0, 0);
                                                
                                                const booksToReturn = returnPreview.books.filter(b => b.status !== 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£');
                                                let totalFine = 0;
                                                
                                                booksToReturn.forEach(book => {
                                                    if (today > dueDate) {
                                                        const diffTime = today.getTime() - dueDate.getTime();
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                        totalFine += diffDays * finePerDay;
                                                    }
                                                    if (lostBookIds.has(book.detailId)) {
                                                        totalFine += book.price || 50000;
                                                    }
                                                });
                                                
                                                const currentDebt = returnPreview.currentDebt || 0;
                                                const totalDebtAfterReturn = currentDebt + totalFine;
                                                
                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center text-amber-800">
                                                            <span className="font-medium">NÃ¡Â»Â£ hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i:</span>
                                                            <span className="font-semibold text-base">{currentDebt.toLocaleString('vi-VN')} Ã„â€˜</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-amber-800">
                                                            <span className="font-medium">TiÃ¡Â»Ân phÃ¡ÂºÂ¡t mÃ¡Â»â€ºi:</span>
                                                            <span className="font-semibold text-base">+ {totalFine.toLocaleString('vi-VN')} Ã„â€˜</span>
                                                        </div>
                                                        <div className="border-t-2 border-amber-400 my-2 pt-3 flex justify-between items-center">
                                                            <span className="text-lg font-bold text-amber-900">TÃ¡Â»â€¢ng nÃ¡Â»Â£ sau khi trÃ¡ÂºÂ£:</span>
                                                            <span className="text-xl font-bold text-amber-900">{totalDebtAfterReturn.toLocaleString('vi-VN')} Ã„â€˜</span>
                                                        </div>
                                                        {totalDebtAfterReturn > 0 && (
                                                            <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-300">
                                                                <p className="text-xs text-amber-800 font-medium">
                                                                    Ã¢Å¡Â Ã¯Â¸Â Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ cÃ¡ÂºÂ§n thanh toÃƒÂ¡n sÃ¡Â»â€˜ nÃ¡Â»Â£ nÃƒÂ y trÃ†Â°Ã¡Â»â€ºc khi Ã„â€˜Ã†Â°Ã¡Â»Â£c phÃƒÂ©p mÃ†Â°Ã¡Â»Â£n sÃƒÂ¡ch tiÃ¡ÂºÂ¿p theo.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {returnPreview && (
                            <div className="px-6 py-4 border-t border-border bg-muted/40 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => { setReturnPreview(null); }} disabled={isReturning}>Quay lÃ¡ÂºÂ¡i</Button>
                                <Button variant="primary" onClick={handleConfirmReturn} className="px-8" disabled={isReturning}>
                                    {isReturning ? 'Ã„Âang xÃ¡Â»Â­ lÃƒÂ½...' : 'XÃƒÂ¡c nhÃ¡ÂºÂ­n TrÃ¡ÂºÂ£ & Thu tiÃ¡Â»Ân'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === MODAL 3: XEM CHI TIÃ¡ÂºÂ¾T === */}
            {isDetailModalOpen && selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/40">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Chi tiÃ¡ÂºÂ¿t PhiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n: <span className="font-mono text-muted-foreground">{selectedLoan.id}</span>
                                </h2>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Detail Header Info */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1 space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£</p>
                                    <p className="font-medium text-foreground">{selectedLoan.readerName}</p>
                                    <p className="text-sm text-muted-foreground">MÃƒÂ£: {selectedLoan.readerId}</p>
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">ThÃ¡Â»Âi gian</p>
                                    <div className="text-sm flex items-center gap-2"><Calendar className="w-3 h-3" /> MÃ†Â°Ã¡Â»Â£n: {selectedLoan.date}</div>
                                    <div className={`text-sm flex items-center gap-2 font-medium ${selectedLoan.status === 'overdue' ? 'text-destructive' : 'text-foreground'}`}>
                                        <AlertCircle className="w-3 h-3" /> HÃ¡ÂºÂ¡n: {selectedLoan.dueDate}
                                    </div>
                                </div>
                                <div className="col-span-1 bg-muted/30 p-3 rounded border border-border/70">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">TÃ¡Â»â€¢ng quan tÃƒÂ i chÃƒÂ­nh</p>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>TrÃ¡ÂºÂ¡ng thÃƒÂ¡i:</span>
                                        {selectedLoan.status === 'returned' ? <span className="text-emerald-600 font-bold">Ã„ÂÃƒÂ£ hoÃƒÂ n tÃ¡ÂºÂ¥t</span> : <span className="text-primary font-bold">Ã„Âang mÃ¡Â»Å¸</span>}
                                    </div>
                                    <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                                        <span>PhÃ¡ÂºÂ¡t quÃƒÂ¡ hÃ¡ÂºÂ¡n:</span>
                                        <span className="text-destructive">
                                            {(() => {
                                                const details = loanDetailsMap[selectedLoan.id] || [];
                                                const [day, month, year] = selectedLoan.dueDate.split('/').map(Number);
                                                const dueDate = new Date(year, month - 1, day);
                                                dueDate.setHours(0, 0, 0, 0);
                                                
                                                let totalFine = 0;
                                                
                                                details.forEach(detail => {
                                                    if (detail.returnDate) {
                                                        // SÃƒÂ¡ch Ã„â€˜ÃƒÂ£ trÃ¡ÂºÂ£ - dÃƒÂ¹ng fineAmount tÃ¡Â»Â« backend (Ã„â€˜ÃƒÂ£ tÃƒÂ­nh khi trÃ¡ÂºÂ£)
                                                        totalFine += detail.fine || 0;
                                                    } else {
                                                        // SÃƒÂ¡ch chÃ†Â°a trÃ¡ÂºÂ£ - tÃƒÂ­nh tiÃ¡Â»Ân phÃ¡ÂºÂ¡t dÃ¡Â»Â± kiÃ¡ÂºÂ¿n nÃ¡ÂºÂ¿u trÃ¡ÂºÂ£ hÃƒÂ´m nay
                                                        const todayTemp = getVietnamDate();
                                                        const today = new Date(todayTemp.getFullYear(), todayTemp.getMonth(), todayTemp.getDate());
                                                        
                                                        if (today > dueDate) {
                                                            const diffTime = today.getTime() - dueDate.getTime();
                                                            const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                            totalFine += overdueDays * finePerDay;
                                                        }
                                                    }
                                                });
                                                
                                                return totalFine.toLocaleString('vi-VN');
                                            })()} Ã„â€˜
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Table */}
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/60 text-muted-foreground font-semibold">
                                        <tr>
                                            <th className="px-4 py-2">MÃƒÂ£ sÃƒÂ¡ch</th>
                                            <th className="px-4 py-2">TÃƒÂªn sÃƒÂ¡ch</th>
                                            <th className="px-4 py-2">TrÃ¡ÂºÂ¡ng thÃƒÂ¡i</th>
                                            <th className="px-4 py-2">Ghi chÃƒÂº</th>
                                            {selectedLoan.status === 'returned' && <th className="px-4 py-2 text-right">NgÃƒÂ y trÃ¡ÂºÂ£</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {loanDetailsMap[selectedLoan.id] ? loanDetailsMap[selectedLoan.id].map((book, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2 font-mono text-muted-foreground">{book.bookCode}</td>
                                                <td className="px-4 py-2 font-medium">{book.title}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-xs px-2 py-1 rounded border ${book.status === 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-primary/10 text-primary border-primary/30'}`}>
                                                        {book.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-muted-foreground italic">{book.note || "-"}</td>
                                                {selectedLoan.status === 'returned' ? (
                                                    <td className="px-4 py-2 text-right font-mono text-xs">{book.returnDate}</td>
                                                ) : (
                                                    <td className="px-4 py-2 text-right">
                                                        {book.status !== 'Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£' && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                className="h-7 text-xs border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                                                                onClick={() => {
                                                                    setIsDetailModalOpen(false);
                                                                    setReturnQuery(selectedLoan.readerName);
                                                                    setIsReturnModalOpen(true);
                                                                    handlePrepareReturnPreview(selectedLoan);
                                                                }}
                                                            >
                                                                TrÃ¡ÂºÂ£ sÃƒÂ¡ch
                                                            </Button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">KhÃƒÂ´ng cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u chi tiÃ¡ÂºÂ¿t</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-muted/40 text-right border-t border-border">
                            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Ã„ÂÃƒÂ³ng</Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// Helper Component for Clean Table
const LoanTable = ({ data, onViewDetail, isHistory = false }: { data: Loan[], onViewDetail: (l: Loan) => void, isHistory?: boolean }) => (
    <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground font-medium">
                <tr>
                    <th className="px-4 py-3">MÃƒÂ£ PhiÃ¡ÂºÂ¿u</th>
                    <th className="px-4 py-3">Ã„ÂÃ¡Â»â„¢c GiÃ¡ÂºÂ£</th>
                    <th className="px-4 py-3">NgÃƒÂ y MÃ†Â°Ã¡Â»Â£n</th>
                    <th className="px-4 py-3">{isHistory ? 'NgÃƒÂ y TrÃ¡ÂºÂ£' : 'HÃ¡ÂºÂ¡n TrÃ¡ÂºÂ£'}</th>
                    <th className="px-4 py-3">TrÃ¡ÂºÂ¡ng thÃƒÂ¡i</th>
                    <th className="px-4 py-3 text-right">Thao tÃƒÂ¡c</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {data.map((loan) => (
                    <tr key={loan.id} className="hover:bg-accent/30">
                        <td className={`px-4 py-3 font-medium ${isHistory ? 'text-emerald-600' : 'text-primary'}`}>{loan.id}</td>
                        <td className="px-4 py-3 font-medium">{loan.readerName}</td>
                        <td className="px-4 py-3">{loan.date}</td>
                        <td className={`px-4 py-3 ${loan.status === 'overdue' ? 'text-destructive font-bold' : ''}`}>{isHistory ? loan.returnDate : loan.dueDate}</td>
                        <td className="px-4 py-3">
                            {loan.status === 'overdue' ? <Badge variant="danger">QuÃƒÂ¡ hÃ¡ÂºÂ¡n</Badge> :
                                loan.status === 'returned' ? <Badge variant="success">Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£</Badge> : <Badge>Ã„Âang mÃ†Â°Ã¡Â»Â£n</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => onViewDetail(loan)}>
                                <Eye className="w-4 h-4 mr-2" /> {isHistory ? 'Xem lÃ¡ÂºÂ¡i' : 'Chi tiÃ¡ÂºÂ¿t'}
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ExpectedDueDate = ({ days }: { days: number }) => {
    const [dueDate, setDueDate] = useState('');
    useEffect(() => {
        setDueDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'));
    }, [days]);
    
    return <span className="text-xs text-muted-foreground">HÃ¡ÂºÂ¡n trÃ¡ÂºÂ£ dÃ¡Â»Â± kiÃ¡ÂºÂ¿n: <b>{dueDate}</b></span>;
};
