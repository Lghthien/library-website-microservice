'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import {
    Search, Plus, Filter, MoreHorizontal,
    Edit, Trash2, AlertCircle, FileText, Check, X
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
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/ToastContext';
import { ExcelImporter } from "@/components/ui/excel-importer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// --- INTERFACES ---
interface Book {
    id: string; // titleId
    name: string; // title
    category: string;
    author: string;
    publishYear: number;
    publisher: string;
    totalCopies: number;
    availableCopies: number;
    borrowedCopies: number;
    copyIds: string[]; // Array of copy IDs for this title
    lostCopies: number; // NEW: Track lost copies
    price: number;
    latestBookId?: string;
    titleAuthorLinkId?: string;
}

interface ApiBook {
    _id: string;
    publisher: string;
    publishYear: number;
    importDate: string;
    price: number;
    titleId: ApiTitleBook | string;
}

interface ApiBookCopy {
    _id: string;
    status: number;
    bookId: ApiBook | string;
}

interface ApiTitleBook {
    _id: string;
    title: string;
    categoryId: ApiCategory | string;
}

interface ApiCategory {
    _id: string;
    categoryName: string;
}

interface ApiAuthor {
    _id: string;
    authorName: string;
}

interface ApiTitleAuthor {
    _id?: string;
    titleId: ApiTitleBook | string;
    authorId: ApiAuthor | string;
}

// --- COMPONENT TÃ™Y CHá»ˆNH: SEARCHABLE INPUT ---
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

// --- COMPONENT TÃ™Y CHá»ˆNH: CURRENCY INPUT (Xá»¬ LÃ TIá»€N Tá»†) ---
// --- COMPONENT TÃ™Y CHá»ˆNH: CURRENCY INPUT (ÄÃƒ NÃ‚NG Cáº¤P) ---
// --- COMPONENT TÃ™Y CHá»ˆNH: CURRENCY INPUT (Cáº¬P NHáº¬T MAX VALUE) ---
const CurrencyInput = ({
    value,
    onChange,
    placeholder,
    id,
    max
}: {
    value: string | number,
    onChange: (val: number) => void,
    placeholder?: string,
    id?: string,
    max?: number // ThÃªm prop max (tÃ¹y chá»n)
}) => {
    // HÃ m Ä‘á»‹nh dáº¡ng sá»‘: 50000 -> 50,000
    const formatNumber = (num: string) => {
        return num.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Loáº¡i bá» dáº¥u pháº©y Ä‘á»ƒ láº¥y giÃ¡ trá»‹ sá»‘ thÃ´
        const rawValue = e.target.value.replace(/,/g, "");

        if (!rawValue) {
            onChange(0);
            return;
        }

        let numericValue = parseInt(rawValue, 10);

        // 1. Cháº·n sá»‘ Ã¢m hoáº·c khÃ´ng pháº£i sá»‘
        if (isNaN(numericValue) || numericValue < 0) return;

        // 2. Cháº·n sá»‘ vÆ°á»£t quÃ¡ giá»›i háº¡n Max (náº¿u cÃ³ prop max)
        if (max !== undefined && numericValue > max) {
            numericValue = max;
        }

        onChange(numericValue);
    };

    return (
        <div className="relative">
            <Input
                id={id}
                placeholder={placeholder}
                // Hiá»ƒn thá»‹ sá»‘ Ä‘Ã£ format
                value={value ? formatNumber(value.toString()) : ""}
                onChange={handleChange}
                className="pr-12 text-right font-mono font-medium"
            />
            {/* Pháº§n Ä‘uÃ´i VNÄ */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400 text-sm font-semibold">VNÄ</span>
            </div>
        </div>
    );
};

export default function BooksPage() {
    const {showToast } = useToast();
    const [books, setBooks] = useState<Book[]>([]);
    const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
    const [suggestedAuthors, setSuggestedAuthors] = useState<string[]>([]);
    const [suggestedPublishers, setSuggestedPublishers] = useState<string[]>([]);
    const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
    
    // Edit State
    const [editingBookId, setEditingBookId] = useState<string | null>(null);
    const [editingBookData, setEditingBookData] = useState<Book | null>(null);

    // Maps Ä‘á»ƒ convert Name â†” ID
    const [categoryNameToIdMap, setCategoryNameToIdMap] = useState<Map<string, string>>(new Map());
    const [authorNameToIdMap, setAuthorNameToIdMap] = useState<Map<string, string>>(new Map());

    // States cho tÃ­nh nÄƒng "Nháº­p thÃªm báº£n sao" (SÃ¡ch cÃ³ sáºµn)
    const [inputMode, setInputMode] = useState<'new' | 'existing'>('new');
    const [selectableBooks, setSelectableBooks] = useState<string[]>([]);
    const [bookLabelToIdMap, setBookLabelToIdMap] = useState<Map<string, string>>(new Map());
    const [selectedBookLabel, setSelectedBookLabel] = useState("");

    // Filter State
    const [filterTitle, setFilterTitle] = useState("");
    const [filterAuthor, setFilterAuthor] = useState("");
    const [filterPublisher, setFilterPublisher] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = Cookies.get('access_token');
                const headers = { 'Authorization': `Bearer ${token}` };
                const baseUrl = 'http://localhost:4000/api';

                const [
                    resBooks,
                    resBookCopies,
                    resCategories,
                    resAuthors,
                    resTitleAuthors,
                    resTitleBooks,
                    resParameters
                ] = await Promise.all([
                    fetch(`${baseUrl}/books`, { headers }),
                    fetch(`${baseUrl}/book-copies`, { headers }),
                    fetch(`${baseUrl}/categories`, { headers }),
                    fetch(`${baseUrl}/authors`, { headers }),
                    fetch(`${baseUrl}/title-authors`, { headers }),
                    fetch(`${baseUrl}/title-books`, { headers }),
                    fetch(`${baseUrl}/parameters`, { headers })
                ]);

                const [
                    booksData,
                    bookCopiesData,
                    categoriesData,
                    authorsData,
                    titleAuthorsData,
                    titleBooksData,
                    parametersData
                ] = await Promise.all([
                    resBooks.json(),
                    resBookCopies.json(),
                    resCategories.json(),
                    resAuthors.json(),
                    resTitleAuthors.json(),
                    resTitleBooks.json(),
                    resParameters.json()
                ]) as [ApiBook[], ApiBookCopy[], ApiCategory[], ApiAuthor[], ApiTitleAuthor[], ApiTitleBook[], unknown[]];

                // Láº¥y giÃ¡ trá»‹ Khoáº£ng cÃ¡ch nÄƒm xuáº¥t báº£n tá»« parameters
                const publishYearParam = parametersData.find((p: unknown) => p.paramName === 'QD2_PUBLISH_YEAR_DISTANCE');
                if (publishYearParam && publishYearParam.paramValue) {
                    setPublishYearGap(parseInt(publishYearParam.paramValue));
                }

                // Map Categories
                const categoryMap = new Map(categoriesData.map(c => [c._id, c.categoryName]));
                const catNameToIdMap = new Map(categoriesData.map(c => [c.categoryName, c._id]));
                setCategoryNameToIdMap(catNameToIdMap);
                setSuggestedCategories(categoriesData.map(c => c.categoryName));

                // Map Authors
                const authorMap = new Map(authorsData.map(a => [a._id, a.authorName]));
                const authNameToIdMap = new Map(authorsData.map(a => [a.authorName, a._id]));
                setAuthorNameToIdMap(authNameToIdMap);
                setSuggestedAuthors(authorsData.map(a => a.authorName));

                // Extract unique titles
                const uniqueTitles = Array.from(new Set(titleBooksData.map(t => t.title)));
                setSuggestedTitles(uniqueTitles);

                // Extract unique publishers
                const uniquePublishers = Array.from(new Set(booksData.map(b => b.publisher)));
                setSuggestedPublishers(uniquePublishers);

                // Map Title Authors (TitleId -> AuthorNames[])
                const titleAuthorMap = new Map<string, string[]>();
                titleAuthorsData.forEach(ta => {
                    const tId = (ta.titleId && typeof ta.titleId === 'object') ? (ta.titleId as ApiTitleBook)._id : ta.titleId as string;
                    const aId = (ta.authorId && typeof ta.authorId === 'object') ? (ta.authorId as ApiAuthor)._id : ta.authorId as string;
                    
                    if (!tId || !aId) return;

                    const authorName = authorMap.get(aId);
                    if (authorName) {
                        if (!titleAuthorMap.has(tId)) {
                            titleAuthorMap.set(tId, []);
                        }
                        titleAuthorMap.get(tId)?.push(authorName);
                    }
                });

                // Map Title Books
                const titleBookMap = new Map(titleBooksData.map(t => [t._id, t]));

                // Map Books (Edition)
                const bookMap = new Map(booksData.map(b => [b._id, b]));

                // Aggregate Book Copies by Title
                const titleMap = new Map<string, {
                    titleBook: ApiTitleBook;
                    books: ApiBook[];
                    copies: Array<{copy: ApiBookCopy; book: ApiBook}>;
                }>();

                // Group copies by title
                bookCopiesData.forEach(copy => {
                    const bookId = typeof copy.bookId === 'object' ? (copy.bookId as ApiBook)._id : copy.bookId as string;
                    const book = bookMap.get(bookId);
                    if (!book) return;

                    let titleBook: ApiTitleBook | undefined;
                    if (book.titleId) {
                        if (typeof book.titleId === 'object') {
                            titleBook = book.titleId as ApiTitleBook;
                        } else {
                            // Ensure titleId is a string and Map has it
                            const tIdString = book.titleId as string;
                            if (tIdString && titleBookMap.has(tIdString)) {
                                titleBook = titleBookMap.get(tIdString);
                            }
                        }
                    }
                    if (!titleBook) return;

                    const titleId = titleBook._id;
                    if (!titleMap.has(titleId)) {
                        titleMap.set(titleId, {
                            titleBook,
                            books: [],
                            copies: []
                        });
                    }
                    
                    const entry = titleMap.get(titleId)!;
                    if (!entry.books.find(b => b._id === book._id)) {
                        entry.books.push(book);
                    }
                    entry.copies.push({copy, book});
                });

                // Prepare Selectable Books for "Add Copy" mode
                const bkLabelMap = new Map<string, string>();
                const sBooks: string[] = [];

                booksData.forEach(b => {
                    let tTitle = "Unknown";
                    // Handle populate or id titleId
                    if (b.titleId && typeof b.titleId === 'object') {
                         tTitle = (b.titleId as ApiTitleBook).title;
                    } else if (b.titleId && titleBookMap.has(b.titleId as string)) {
                         tTitle = titleBookMap.get(b.titleId as string)?.title || "Unknown";
                    }

                    const label = `${tTitle} - ${b.publisher} (${b.publishYear}) - GiÃ¡: ${new Intl.NumberFormat('vi-VN').format(b.price)}Ä‘`;
                    bkLabelMap.set(label, b._id);
                    sBooks.push(label);
                });

                setSelectableBooks(sBooks);
                setBookLabelToIdMap(bkLabelMap);

                // Convert to aggregated Book array
                const mappedBooks: Book[] = Array.from(titleMap.entries()).map(([titleId, data]) => {
                    const { titleBook, books, copies } = data;
                    
                    // Get category
                    const catId = titleBook.categoryId && typeof titleBook.categoryId === 'object'
                        ? (titleBook.categoryId as ApiCategory)._id
                        : titleBook.categoryId as string;
                    const categoryName = categoryMap.get(catId) || "Unknown";

                    // Get authors
                    const authors = titleAuthorMap.get(titleId);
                    const authorNames = authors && authors.length > 0 ? authors.join(", ") : "Unknown";

                    // Calculate statistics
                    const totalCopies = copies.length;
                    const availableCopies = copies.filter(c => c.copy.status === 1).length;
                    const lostCopies = copies.filter(c => c.copy.status === 2).length; // NEW
                    const borrowedCopies = totalCopies - availableCopies - lostCopies;

                    // Use most recent book for publish year and publisher
                    const latestBook = books.sort((a, b) => b.publishYear - a.publishYear)[0];
                    
                    // Find TitleAuthor Link (approximate)
                    const taLink = titleAuthorsData.find(ta => {
                         const tId = typeof ta.titleId === 'object' ? (ta.titleId as ApiTitleBook)._id : ta.titleId as string;
                         return tId === titleId;
                    });

                    return {
                        id: titleId,
                        name: titleBook.title,
                        category: categoryName,
                        author: authorNames,
                        publishYear: latestBook.publishYear,
                        publisher: latestBook.publisher,
                        price: latestBook.price,
                        totalCopies,
                        availableCopies,
                        borrowedCopies,
                        lostCopies, // NEW
                        copyIds: copies.map(c => c.copy._id),
                        latestBookId: latestBook._id,
                        titleAuthorLinkId: taLink?._id
                    };
                });

                setBooks(mappedBooks);

            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };

        fetchData();
    }, []);

    // State cho Form
    const [formBookName, setFormBookName] = useState("");
    const [formAuthor, setFormAuthor] = useState("");
    const [formCategory, setFormCategory] = useState("");
    const [formPublishYear, setFormPublishYear] = useState("");
    const [formPublisher, setFormPublisher] = useState("");
    const [formDateReceived, setFormDateReceived] = useState(new Date().toISOString().split('T')[0]);
    const [formPrice, setFormPrice] = useState<number>(0);
    const [formQuantity, setFormQuantity] = useState<number>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [publishYearGap, setPublishYearGap] = useState<number>(8); // Default value

    // Logic kiá»ƒm tra QÄ2
    const currentYear = new Date().getFullYear();
    const minPublishYear = currentYear - publishYearGap;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Filter Logic
    const filteredBooks = books.filter(book => {
        // Filter by title
        if (filterTitle && !book.name.toLowerCase().includes(filterTitle.toLowerCase())) {
            return false;
        }
        
        // Filter by author
        if (filterAuthor && !book.author.toLowerCase().includes(filterAuthor.toLowerCase())) {
            return false;
        }
        
        // Filter by publisher
        if (filterPublisher && !book.publisher.toLowerCase().includes(filterPublisher.toLowerCase())) {
            return false;
        }
        
        // Filter by category
        if (filterCategory !== "all" && book.category !== filterCategory) {
            return false;
        }
        
        return true;
    });

    // Clear all filters function
    const clearFilters = () => {
        setFilterTitle("");
        setFilterAuthor("");
        setFilterPublisher("");
        setFilterCategory("all");
    };

    const handleBulkImport = async (data: unknown[]) => {
        try {
            const payload = data.map(item => ({
                title: item['Title'] || item['title'],
                author: item['Author'] || item['author'],
                category: item['Category'] || item['category'],
                publisher: item['Publisher'] || item['publisher'],
                publishYear: item['PublishYear'] || item['publishYear'],
                price: item['Price'] || item['price'],
                quantity: item['Quantity'] || item['quantity'] || 1, 
            }));

            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${baseUrl}/title-books/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Bulk import failed");
            
            const results = await res.json();
            
            // Count success and error results
            const successCount = results.filter((r: unknown) => r.status === 'success').length;
            const errorCount = results.filter((r: unknown) => r.status === 'error').length;
            
            if (errorCount > 0) {
                const errorMessages = results
                    .filter((r: unknown) => r.status === 'error')
                    .map((r: unknown) => `â€¢ ${r.title}: ${r.message}`)
                    .join('\n');
                
                showToast(
                    `HoÃ n thÃ nh: ${successCount} thÃ nh cÃ´ng, ${errorCount} bá»‹ lá»—i.\n${errorMessages}`,
                    errorCount === results.length ? 'error' : 'warning'
                );
            } else {
                showToast(`ÄÃ£ nháº­p thÃ nh cÃ´ng ${successCount} dÃ²ng dá»¯ liá»‡u.`, "success");
            }
            
            if (successCount > 0) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Import error:", error);
            showToast("Lá»—i khi nháº­p dá»¯ liá»‡u.", "error");
        }
    };

    // HÃ m lÆ°u sÃ¡ch (Táº¡o má»›i hoáº·c Cáº­p nháº­t)
    // HÃ m kiá»ƒm tra há»£p lá»‡
    const validateForm = (): boolean => {
         // Validation chung
         if (!editingBookId && (!formQuantity || formQuantity < 1) && inputMode !== 'existing') {
             showToast("Sá»‘ lÆ°á»£ng nháº­p pháº£i Ã­t nháº¥t lÃ  1", 'warning');
             return false;
        }

        // EDIT MODE
        if (editingBookId) {
            if (!formBookName.trim()) { 
                showToast("Vui lÃ²ng nháº­p tÃªn sÃ¡ch", 'warning'); 
                return false; 
            }
            return true;
        }

        // EXISTING BOOK MODE
        if (inputMode === 'existing') {
            if (!selectedBookLabel) {
                showToast("Vui lÃ²ng chá»n sÃ¡ch cáº§n nháº­p thÃªm", 'warning');
                return false;
            }
            const existingBookId = bookLabelToIdMap.get(selectedBookLabel);
            if (!existingBookId) {
                 showToast("SÃ¡ch Ä‘Ã£ chá»n khÃ´ng há»£p lá»‡", 'error');
                 return false;
            }
            return true;
        }

        // NEW BOOK MODE
        if (!formBookName.trim()) {
            showToast("Vui lÃ²ng nháº­p tÃªn sÃ¡ch", 'warning');
            return false;
        }
        if (!formPrice || formPrice <= 0) {
            showToast("Vui lÃ²ng nháº­p trá»‹ giÃ¡ sÃ¡ch", 'warning');
            return false;
        }
        if (!formPublishYear) {
            showToast("Vui lÃ²ng nháº­p nÄƒm xuáº¥t báº£n", 'warning');
            return false;
        }

        const publishYear = parseInt(formPublishYear);
        if (publishYear < minPublishYear || publishYear > currentYear) {
            showToast(`NÄƒm xuáº¥t báº£n pháº£i tá»« ${minPublishYear} Ä‘áº¿n ${currentYear} (QÄ2)`, 'error');
            return false;
        }
        if (!formCategory.trim()) {
            showToast("Vui lÃ²ng chá»n thá»ƒ loáº¡i", 'warning');
            return false;
        }
        if (!formDateReceived) {
            showToast("Vui lÃ²ng chá»n ngÃ y nháº­p sÃ¡ch", 'warning');
            return false;
        }
        
        
        return true;
    };

    // HÃ m xá»­ lÃ½ khi báº¥m nÃºt LÆ°u (Trigger Validation & Dialog)
    const handlePreSave = async () => {
        if (!validateForm()) {
            return;
        }

        // Kiá»ƒm tra trÃ¹ng láº·p CHá»ˆ khi Táº O Má»šI (inputMode === 'new' vÃ  khÃ´ng editingBookId)
        if (inputMode === 'new' && !editingBookId) {
            try {
                const token = Cookies.get('access_token');
                const headers = { 'Authorization': `Bearer ${token}` };
                const baseUrl = 'http://localhost:4000/api';

                // Cáº§n táº¡o title trÆ°á»›c Ä‘á»ƒ kiá»ƒm tra
                const categoryId = categoryNameToIdMap.get(formCategory);
                if (!categoryId) {
                    showToast('KhÃ´ng tÃ¬m tháº¥y ID thá»ƒ loáº¡i. Vui lÃ²ng chá»n láº¡i.', 'error');
                    return;
                }

                const publishYear = parseInt(formPublishYear);

                // Kiá»ƒm tra xem cÃ³ TitleBook vá»›i tÃªn nÃ y chÆ°a
                const allTitlesRes = await fetch(`${baseUrl}/title-books`, { headers });
                if (allTitlesRes.ok) {
                    const allTitles = await allTitlesRes.json();
                    const existingTitle = allTitles.find((t: unknown) => t.title === formBookName);
                    
                    if (existingTitle) {
                        const titleId = existingTitle._id;
                        
                        // Kiá»ƒm tra xem Ä‘Ã£ cÃ³ Book vá»›i cÃ¹ng titleId, publishYear, publisher chÆ°a
                        const allBooksRes = await fetch(`${baseUrl}/books`, { headers });
                        if (allBooksRes.ok) {
                            const allBooks = await allBooksRes.json();
                            const duplicateBook = allBooks.find((book: unknown) => {
                                const bookTitleId = typeof book.titleId === 'object' ? book.titleId._id : book.titleId;
                                return (
                                    bookTitleId === titleId &&
                                    book.publishYear === publishYear &&
                                    book.publisher === (formPublisher || 'KhÃ´ng xÃ¡c Ä‘á»‹nh')
                                );
                            });

                            if (duplicateBook) {
                                showToast(
                                    'SÃ¡ch nÃ y Ä‘Ã£ tá»“n táº¡i vá»›i cÃ¹ng thÃ´ng tin (tÃªn, tÃ¡c giáº£, thá»ƒ loáº¡i, nÄƒm xuáº¥t báº£n, nhÃ  xuáº¥t báº£n). Vui lÃ²ng sá»­ dá»¥ng chá»©c nÄƒng "Nháº­p thÃªm báº£n sao" Ä‘á»ƒ tÄƒng sá»‘ lÆ°á»£ng.',
                                    'warning'
                                );
                                return; // Cháº·n luÃ´n, KHÃ”NG má»Ÿ dialog confirm
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking duplicates:', error);
                // Náº¿u lá»—i khi kiá»ƒm tra, váº«n cho phÃ©p tiáº¿p tá»¥c (backend sáº½ kiá»ƒm tra láº¡i)
            }
        }

        // Náº¿u pass háº¿t validation vÃ  khÃ´ng trÃ¹ng, má»Ÿ dialog confirm
        setIsConfirmDialogOpen(true);
    };

    // HÃ m thá»±c thi lÆ°u (Sau khi confirm)
    const handleConfirmSave = async () => {
        setIsConfirmDialogOpen(false);
        
        const token = Cookies.get('access_token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const baseUrl = 'http://localhost:4000/api';

        // === LOGIC Cáº¬P NHáº¬T (EDIT) ===
        if (editingBookId && editingBookData) {
            setIsSaving(true);
            try {
                // 1. Update Title Book
                const categoryId = categoryNameToIdMap.get(formCategory); // Resolve ID
                await fetch(`${baseUrl}/title-books/${editingBookId}`, {
                    method: 'PATCH', headers,
                    body: JSON.stringify({ title: formBookName, categoryId })
                });

                // 2. Update Author (Resolve ID -> Update Link)
                let authorId = authorNameToIdMap.get(formAuthor);
                if (formAuthor && !authorId) {
                     // Create new author if needed
                    const newAuthRes = await fetch(`${baseUrl}/authors`, { method: 'POST', headers, body: JSON.stringify({ authorName: formAuthor }) });
                    if(newAuthRes.ok) {
                        const d = await newAuthRes.json();
                        authorId = d._id || d.id;
                    }
                }
                
                if (authorId && editingBookData.titleAuthorLinkId) {
                    await fetch(`${baseUrl}/title-authors/${editingBookData.titleAuthorLinkId}`, {
                        method: 'PATCH', headers,
                        body: JSON.stringify({ authorId })
                    });
                } else if (authorId) {
                    // Create new link if missing
                     await fetch(`${baseUrl}/title-authors`, {
                        method: 'POST', headers,
                        body: JSON.stringify({ titleId: editingBookId, authorId })
                    });
                }

                // 3. Update Book (Edition Info) - Update ONLY the latest book to avoid conflicts
                if (editingBookData.latestBookId) {
                    await fetch(`${baseUrl}/books/${editingBookData.latestBookId}`, {
                         method: 'PATCH', headers,
                         body: JSON.stringify({
                             publisher: formPublisher,
                             publishYear: parseInt(formPublishYear),
                             price: formPrice
                         })
                    });
                }
                
                showToast("Cáº­p nháº­t thÃ´ng tin sÃ¡ch thÃ nh cÃ´ng!", "success");
                window.location.reload();

            } catch (error) {
                console.error(error);
                showToast("Lá»—i khi cáº­p nháº­t", "error");
            } finally {
                setIsSaving(false);
            }
            return;
        }
        
        // === LOGIC CHO CHáº¾ Äá»˜ "SÃCH CÃ“ Sáº´N" ===
        if (inputMode === 'existing') {
            const existingBookId = bookLabelToIdMap.get(selectedBookLabel);
            // Re-check id validity though checked in validateForm
            if (!existingBookId) return;

            setIsSaving(true);
            try {
                const token = Cookies.get('access_token');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                const baseUrl = 'http://localhost:4000/api';

                console.log(`[Existing Mode] ThÃªm ${formQuantity} báº£n sao cho Book ID: ${existingBookId}`);
                
                const copyPromises = [];
                for (let i = 0; i < formQuantity; i++) {
                     copyPromises.push(
                        fetch(`${baseUrl}/book-copies`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ bookId: existingBookId, status: 1 })
                        }).then(async res => {
                            if(!res.ok) throw new Error("Failed");
                            return res.json();
                        })
                     );
                }
                
                await Promise.all(copyPromises);
                showToast(`ÄÃ£ thÃªm ${formQuantity} báº£n sao thÃ nh cÃ´ng!`, 'success');
                
                // Reset & Reload
                setSelectedBookLabel("");
                setFormQuantity(1);
                setIsDialogOpen(false);
                window.location.reload();

            } catch (error) {
                console.error(error);
                showToast("Lá»—i khi thÃªm báº£n sao", 'error');
            } finally {
                setIsSaving(false);
            }
            return;
        }

        // === LOGIC CHO CHáº¾ Äá»˜ "SÃCH Má»šI" (Code cÅ©) ===
        const publishYear = parseInt(formPublishYear);

        setIsSaving(true);
        try {
            const token = Cookies.get('access_token');
            const baseUrl = 'http://localhost:4000/api';
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            // Convert categoryName â†’ categoryId
            const categoryId = categoryNameToIdMap.get(formCategory);
            if (!categoryId) {
                throw new Error('KhÃ´ng tÃ¬m tháº¥y ID thá»ƒ loáº¡i. Vui lÃ²ng chá»n láº¡i.');
            }

            // 1. Xá»­ lÃ½ Author trÆ°á»›c (kiá»ƒm tra hoáº·c táº¡o má»›i)
            let authorId: string | undefined;
            if (formAuthor.trim()) {
                authorId = authorNameToIdMap.get(formAuthor);
                
                // Náº¿u tÃ¡c giáº£ chÆ°a tá»“n táº¡i, táº¡o má»›i
                if (!authorId) {
                    console.log('Táº¡o tÃ¡c giáº£ má»›i:', formAuthor);
                    const newAuthorRes = await fetch(`${baseUrl}/authors`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            authorName: formAuthor
                        })
                    });

                    if (newAuthorRes.ok) {
                        const newAuthorData = await newAuthorRes.json();
                        authorId = newAuthorData._id || newAuthorData.id;
                        console.log('âœ“ Táº¡o tÃ¡c giáº£ thÃ nh cÃ´ng, ID:', authorId);
                    } else {
                        const errorData = await newAuthorRes.json().catch(() => ({}));
                        console.error('âœ— Lá»—i táº¡o tÃ¡c giáº£:', errorData);
                        throw new Error('KhÃ´ng thá»ƒ táº¡o tÃ¡c giáº£');
                    }
                } else {
                    console.log('âœ“ Sá»­ dá»¥ng tÃ¡c giáº£ cÃ³ sáºµn, ID:', authorId);
                }
            }

            // 2. Táº¡o Title Book
            let titleBookId: string;
            console.log('Táº¡o Title Book:', formBookName);
            
            const titleRes = await fetch(`${baseUrl}/title-books`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title: formBookName,
                    categoryId: categoryId,
                })
            });

            if (!titleRes.ok) {
                const errorData = await titleRes.json().catch(() => ({}));
                console.error('Title creation response:', errorData);
                throw new Error(`KhÃ´ng thá»ƒ táº¡o tÃªn sÃ¡ch: ${titleRes.status}`);
            }

            const titleData = await titleRes.json();
            titleBookId = titleData._id || titleData.id;
            console.log('âœ“ Táº¡o Title Book thÃ nh cÃ´ng, ID:', titleBookId);

            // 3. Táº¡o Title-Author (liÃªn káº¿t tÃ¡c giáº£ vá»›i sÃ¡ch)
            if (authorId) {
                console.log('Táº¡o liÃªn káº¿t Title-Author:', { titleId: titleBookId, authorId });
                const titleAuthorRes = await fetch(`${baseUrl}/title-authors`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        titleId: titleBookId,
                        authorId: authorId,
                    })
                });

                if (!titleAuthorRes.ok) {
                    const errorData = await titleAuthorRes.json().catch(() => ({}));
                    console.error('âœ— Lá»—i táº¡o liÃªn káº¿t tÃ¡c giáº£:', errorData);
                    throw new Error('KhÃ´ng thá»ƒ liÃªn káº¿t tÃ¡c giáº£ vá»›i sÃ¡ch');
                } else {
                    const linkData = await titleAuthorRes.json();
                    console.log('âœ“ LiÃªn káº¿t tÃ¡c giáº£ thÃ nh cÃ´ng:', linkData);
                }
            }

            // 4. Táº¡o Book (Edition)
            console.log('Táº¡o Book (Edition)');
            const bookRes = await fetch(`${baseUrl}/books`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    titleId: titleBookId,
                    publishYear,
                    publisher: formPublisher || 'KhÃ´ng xÃ¡c Ä‘á»‹nh',
                    importDate: formDateReceived,
                    price: formPrice,
                })
            });

            if (!bookRes.ok) {
                const errorData = await bookRes.json().catch(() => ({}));
                console.error('Book creation response:', errorData);
                throw new Error(`KhÃ´ng thá»ƒ táº¡o báº£n sÃ¡ch: ${bookRes.status}`);
            }

            const bookData = await bookRes.json();
            const bookId = bookData._id || bookData.id;

            // 5. Táº¡o Book Copy (theo sá»‘ lÆ°á»£ng)
            console.log(`Táº¡o ${formQuantity} báº£n sao sÃ¡ch...`);
            const copyPromises = [];
            for (let i = 0; i < formQuantity; i++) {
                copyPromises.push(
                    fetch(`${baseUrl}/book-copies`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            bookId,
                            status: 1, // 1 = available
                        })
                    }).then(async (res) => {
                         if (!res.ok) {
                             const err = await res.json().catch(() => ({}));
                             throw new Error(`Lá»—i táº¡o báº£n sao ${i+1}: ${err.message || res.status}`);
                         }
                         return res.json();
                    })
                );
            }

            await Promise.all(copyPromises);
            console.log(`âœ“ Táº¡o ${formQuantity} Book Copy thÃ nh cÃ´ng`);
            showToast('LÆ°u sÃ¡ch thÃ nh cÃ´ng!', 'success');

            // Reset form
            setFormBookName("");
            setFormAuthor("");
            setFormCategory("");
            setFormPublishYear("");

            setFormPublisher("");
            setFormDateReceived(new Date().toISOString().split('T')[0]);
            setFormPrice(0);
            setFormQuantity(1);
            setFormQuantity(1);
            setSelectedBookLabel("");
            setEditingBookId(null);
            setEditingBookData(null);
            setIsDialogOpen(false);

            // Reload data
            window.location.reload();

        } catch (error) {
            console.error('Error saving book:', error);
            showToast(`Lá»—i: ${error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ lÆ°u sÃ¡ch'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Edit Action
    const handleEdit = (book: Book) => {
        setEditingBookId(book.id);
        setEditingBookData(book);
        
        setFormBookName(book.name);
        setFormCategory(book.category);
        setFormAuthor(book.author);
        setFormPublisher(book.publisher);
        setFormPublishYear(book.publishYear.toString());
        setFormPrice(book.price || 0);
        
        // Switch to 'new' mode UI (creates/updates form) but hide tabs
        setInputMode('new');
        setIsDialogOpen(true);
    };

    // Handle Delete Action
    const handleDelete = async (book: Book) => {
        try {
            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            
            // Kiá»ƒm tra Ä‘iá»u kiá»‡n xÃ³a
            const checkRes = await fetch(`${baseUrl}/title-books/${book.id}/check-delete`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!checkRes.ok) {
                showToast('KhÃ´ng thá»ƒ kiá»ƒm tra Ä‘iá»u kiá»‡n xÃ³a', 'error');
                return;
            }
            
            const checkData = await checkRes.json();
            
            // Náº¿u cÃ³ sÃ¡ch Ä‘ang mÆ°á»£n, khÃ´ng cho xÃ³a
            if (!checkData.canDelete) {
                showToast(`KhÃ´ng thá»ƒ xÃ³a: CÃ²n ${checkData.borrowedCount} cuá»‘n sÃ¡ch Ä‘ang Ä‘Æ°á»£c mÆ°á»£n. Vui lÃ²ng Ä‘á»£i tráº£ háº¿t sÃ¡ch trÆ°á»›c khi xÃ³a.`, 'error');
                return;
            }
            
            // Cho phÃ©p xÃ³a - luÃ´n xÃ³a má»m
            setDeletingBookId(book.id);
            setIsDeleteDialogOpen(true);
        } catch (error) {
            console.error('Error checking delete conditions:', error);
            showToast('Lá»—i khi kiá»ƒm tra Ä‘iá»u kiá»‡n xÃ³a', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deletingBookId) return;
        
        try {
            const token = Cookies.get('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            
            const res = await fetch(`${baseUrl}/title-books/${deletingBookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                throw new Error('KhÃ´ng thá»ƒ xÃ³a sÃ¡ch');
            }
            
            showToast('ÄÃ£ xÃ³a sÃ¡ch thÃ nh cÃ´ng', 'success');
            setIsDeleteDialogOpen(false);
            setDeletingBookId(null);
            
            // Reload data
            window.location.reload();
        } catch (error) {
            console.error('Error deleting book:', error);
            showToast('Lá»—i khi xÃ³a sÃ¡ch', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quáº£n lÃ½ SÃ¡ch</h1>
                    <p className="text-sm text-slate-500">Tiáº¿p nháº­n sÃ¡ch má»›i (BM2) vÃ  tra cá»©u thÃ´ng tin (BM3).</p>
                </div>
                <div className="flex gap-2">
                    <ExcelImporter 
                        buttonLabel="Nháº­p Excel" 
                        onImport={handleBulkImport}
                        templateHeaders={['Title', 'Author', 'Category', 'Price', 'Quantity']}
                    />
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Tiáº¿p nháº­n sÃ¡ch
                    </Button>
                </div>
            </div>

            {/* --- Bá»˜ Lá»ŒC TRA Cá»¨U (BM3) --- */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        {/* Row 1: Search Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* TÃªn sÃ¡ch */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">TÃªn sÃ¡ch</label>
                                <SearchableInput
                                    options={suggestedTitles}
                                    value={filterTitle}
                                    onChange={setFilterTitle}
                                    placeholder="Nháº­p tÃªn sÃ¡ch..."
                                />
                            </div>
                            
                            {/* TÃ¡c giáº£ */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">TÃ¡c giáº£</label>
                                <SearchableInput
                                    options={suggestedAuthors}
                                    value={filterAuthor}
                                    onChange={setFilterAuthor}
                                    placeholder="Nháº­p tÃªn tÃ¡c giáº£..."
                                />
                            </div>
                            
                            {/* NhÃ  xuáº¥t báº£n */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">NhÃ  xuáº¥t báº£n</label>
                                <SearchableInput
                                    options={suggestedPublishers}
                                    value={filterPublisher}
                                    onChange={setFilterPublisher}
                                    placeholder="Nháº­p nhÃ  xuáº¥t báº£n..."
                                />
                            </div>
                        </div>
                        
                        {/* Row 2: Category + Clear Button */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2">
                                <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Thá»ƒ loáº¡i:</label>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Thá»ƒ loáº¡i" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Táº¥t cáº£ thá»ƒ loáº¡i</SelectItem>
                                        {suggestedCategories.map((cat, idx) => (
                                            <SelectItem key={idx} value={cat}>{cat}</SelectItem>
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
                                <X className="w-4 h-4 mr-1" /> XÃ³a bá»™ lá»c
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- DANH SÃCH SÃCH (BM3) --- */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800">Kho sÃ¡ch hiá»‡n cÃ³</CardTitle>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Tá»•ng: {filteredBooks.length} cuá»‘n</div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                    <TableHead>TiÃªu Ä‘á»</TableHead>
                                    <TableHead>Thá»ƒ loáº¡i</TableHead>
                                    <TableHead>TÃ¡c giáº£</TableHead>
                                    <TableHead>NÄƒm XB</TableHead>
                                    <TableHead className="truncate max-w-[120px]">NXB</TableHead>
                                    <TableHead className="text-center">Tá»•ng sá»‘</TableHead>
                                    <TableHead className="text-center">CÃ²n trá»‘ng</TableHead>
                                    <TableHead className="text-center">Äang mÆ°á»£n</TableHead>
                                    <TableHead className="text-center">ÄÃ£ máº¥t</TableHead>
                                    <TableHead className="text-right">Thao tÃ¡c</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBooks.map((book) => (
                                <TableRow key={book.id}>
                                    <TableCell>
                                        <span className="font-medium text-slate-800">{book.name}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">
                                            {book.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{book.author}</TableCell>
                                    <TableCell>{book.publishYear}</TableCell>
                                    <TableCell className="text-slate-500 text-sm truncate max-w-[120px]" title={book.publisher}>
                                        {book.publisher}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                            {book.totalCopies}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none">
                                            {book.availableCopies}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 shadow-none">
                                            {book.borrowedCopies}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 shadow-none">
                                            {book.lostCopies}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>TÃ¡c vá»¥</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(book)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Sá»­a thÃ´ng tin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(book)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> XÃ³a sÃ¡ch
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

            {/* --- FORM MODAL (BM2) --- */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>{editingBookId ? "Cáº­p nháº­t ThÃ´ng tin SÃ¡ch" : "Tiáº¿p nháº­n sÃ¡ch má»›i (BM2)"}</DialogTitle>
                        <DialogDescription>
                            {editingBookId ? "Chá»‰nh sá»­a thÃ´ng tin chi tiáº¿t." : "Nháº­p thÃ´ng tin chi tiáº¿t cá»§a sÃ¡ch. LÆ°u Ã½ quy Ä‘á»‹nh vá» nÄƒm xuáº¥t báº£n."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* --- TAB SWITCHER (Hide when editing) --- */}
                        {!editingBookId && (
                        <div className="flex bg-slate-100 p-1 rounded-md mb-2">
                            <button
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'new' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setInputMode('new')}
                            >
                                Nháº­p Äáº§u SÃ¡ch Má»›i
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'existing' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setInputMode('existing')}
                            >
                                Nháº­p ThÃªm Báº£n Sao
                            </button>
                        </div>
                        )}

                        {/* --- FORM CHáº¾ Äá»˜: SÃCH CÃ“ Sáº´N --- */}
                        {inputMode === 'existing' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700 mb-2">
                                    <span className="font-semibold">Cháº¿ Ä‘á»™ nÃ y dÃ¹ng Ä‘á»ƒ:</span> Nháº­p thÃªm sá»‘ lÆ°á»£ng cho má»™t cuá»‘n sÃ¡ch (áº¥n báº£n) Ä‘Ã£ cÃ³ sáºµn trong kho.
                                </div>
                                <div className="space-y-2">
                                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Chá»n sÃ¡ch cÃ³ sáºµn</Label>
                                    <SearchableInput
                                        id="existingBook"
                                        options={selectableBooks}
                                        value={selectedBookLabel}
                                        onChange={setSelectedBookLabel}
                                        placeholder="TÃ¬m theo TÃªn sÃ¡ch - NXB - NÄƒm XB..."
                                    />
                                    <p className="text-xs text-slate-500">GÃµ tÃªn sÃ¡ch Ä‘á»ƒ tÃ¬m kiáº¿m nhanh.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantityExisting" className="after:content-['*'] after:ml-0.5 after:text-red-500">Sá»‘ lÆ°á»£ng nháº­p thÃªm</Label>
                                    <Input
                                        id="quantityExisting"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={formQuantity}
                                        onChange={(e) => setFormQuantity(parseInt(e.target.value) || 1)}
                                        className="h-11 text-lg font-medium text-blue-700"
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- FORM CHáº¾ Äá»˜: SÃCH Má»šI (Form cÅ©) --- */}
                        {inputMode === 'new' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                        {/* HÃ ng 1: TÃªn sÃ¡ch + Thá»ƒ loáº¡i */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="bookName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    TÃªn sÃ¡ch
                                </Label>
                                <Input 
                                    id="bookName" 
                                    placeholder="VD: Nháº­p mÃ´n CNPM"
                                    value={formBookName}
                                    onChange={(e) => setFormBookName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Thá»ƒ loáº¡i</Label>
                                <SearchableInput
                                    id="category"
                                    options={suggestedCategories}
                                    value={formCategory}
                                    onChange={setFormCategory}
                                    placeholder="Chá»n/Nháº­p"
                                />
                            </div>
                        </div>

                        {/* HÃ ng 2: TÃ¡c giáº£ + NÄƒm XB */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="author">TÃ¡c giáº£</Label>
                                <SearchableInput
                                    id="author"
                                    options={suggestedAuthors}
                                    value={formAuthor}
                                    onChange={setFormAuthor}
                                    placeholder="Nháº­p hoáº·c chá»n..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="publishYear">NÄƒm xuáº¥t báº£n</Label>
                                <Input
                                    id="publishYear"
                                    type="number"
                                    placeholder={`VD: ${currentYear}`}
                                    min={minPublishYear}
                                    max={currentYear}
                                    value={formPublishYear}
                                    onChange={(e) => setFormPublishYear(e.target.value)}
                                />
                                <div className="flex items-center text-xs text-amber-600 mt-1 bg-amber-50 p-1.5 rounded border border-amber-100">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    QÄ2: Chá»‰ nháº­n sÃ¡ch tá»« nÄƒm {minPublishYear} trá»Ÿ láº¡i Ä‘Ã¢y.
                                </div>
                            </div>
                        </div>

                        {/* HÃ ng 3: NXB + NgÃ y nháº­p */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="publisher">NhÃ  xuáº¥t báº£n</Label>
                                <Input 
                                    id="publisher" 
                                    placeholder="VD: NXB Tráº»"
                                    value={formPublisher}
                                    onChange={(e) => setFormPublisher(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateReceived" className="after:content-['*'] after:ml-0.5 after:text-red-500">NgÃ y nháº­p</Label>
                                <Input
                                    id="dateReceived"
                                    type="date"
                                    value={formDateReceived}
                                    onChange={(e) => setFormDateReceived(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* HÃ ng 4: Trá»‹ giÃ¡ + Sá»‘ lÆ°á»£ng */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={editingBookId ? "col-span-2 space-y-2" : "space-y-2"}>
                                <Label htmlFor="price" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Trá»‹ giÃ¡
                                </Label>

                                <CurrencyInput
                                    id="price"
                                    placeholder="0"
                                    value={formPrice}
                                    onChange={setFormPrice}
                                    max={100000000} // Giá»›i háº¡n max lÃ  100 triá»‡u
                                />

                                {/* Hiá»ƒn thá»‹ Helper text */}
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-slate-400">
                                        Tá»‘i Ä‘a: 100.000.000 VNÄ
                                    </span>
                                    {formPrice > 0 && (
                                        <span className="text-[11px] text-blue-600 font-medium italic">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formPrice)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {!editingBookId && (
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Sá»‘ lÆ°á»£ng
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={formQuantity}
                                    onChange={(e) => setFormQuantity(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            )}
                        </div>
                        </div>
                        )} {/* End inputMode === 'new' */}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Há»§y bá»
                        </Button>
                        <Button 
                            onClick={handlePreSave} 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isSaving}
                        >
                            {isSaving ? (editingBookId ? 'Äang cáº­p nháº­t...' : 'Äang lÆ°u...') : (editingBookId ? 'Cáº­p nháº­t' : 'LÆ°u thÃ´ng tin')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>XÃ¡c nháº­n lÆ°u</DialogTitle>
                        <DialogDescription>
                            Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n lÆ°u thÃ´ng tin nÃ y vÃ o há»‡ thá»‘ng?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                            Há»§y bá»
                        </Button>
                        <Button onClick={handleConfirmSave} className="bg-blue-600 hover:bg-blue-700">
                            XÃ¡c nháº­n
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="XÃ¡c nháº­n xÃ³a sÃ¡ch"
                description="Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a sÃ¡ch nÃ y? Há»‡ thá»‘ng sáº½ thá»±c hiá»‡n xÃ³a."
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    );
}