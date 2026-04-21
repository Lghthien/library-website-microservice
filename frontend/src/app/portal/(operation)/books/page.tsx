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

// --- COMPONENT TÃƒâ„¢Y CHÃ¡Â»Ë†NH: SEARCHABLE INPUT ---
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

// --- COMPONENT TÃƒâ„¢Y CHÃ¡Â»Ë†NH: CURRENCY INPUT (XÃ¡Â»Â¬ LÃƒÂ TIÃ¡Â»â‚¬N TÃ¡Â»â€ ) ---
// --- COMPONENT TÃƒâ„¢Y CHÃ¡Â»Ë†NH: CURRENCY INPUT (Ã„ÂÃƒÆ’ NÃƒâ€šNG CÃ¡ÂºÂ¤P) ---
// --- COMPONENT TÃƒâ„¢Y CHÃ¡Â»Ë†NH: CURRENCY INPUT (CÃ¡ÂºÂ¬P NHÃ¡ÂºÂ¬T MAX VALUE) ---
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
    max?: number // ThÃƒÂªm prop max (tÃƒÂ¹y chÃ¡Â»Ân)
}) => {
    // HÃƒÂ m Ã„â€˜Ã¡Â»â€¹nh dÃ¡ÂºÂ¡ng sÃ¡Â»â€˜: 50000 -> 50,000
    const formatNumber = (num: string) => {
        return num.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // LoÃ¡ÂºÂ¡i bÃ¡Â»Â dÃ¡ÂºÂ¥u phÃ¡ÂºÂ©y Ã„â€˜Ã¡Â»Æ’ lÃ¡ÂºÂ¥y giÃƒÂ¡ trÃ¡Â»â€¹ sÃ¡Â»â€˜ thÃƒÂ´
        const rawValue = e.target.value.replace(/,/g, "");

        if (!rawValue) {
            onChange(0);
            return;
        }

        let numericValue = parseInt(rawValue, 10);

        // 1. ChÃ¡ÂºÂ·n sÃ¡Â»â€˜ ÃƒÂ¢m hoÃ¡ÂºÂ·c khÃƒÂ´ng phÃ¡ÂºÂ£i sÃ¡Â»â€˜
        if (isNaN(numericValue) || numericValue < 0) return;

        // 2. ChÃ¡ÂºÂ·n sÃ¡Â»â€˜ vÃ†Â°Ã¡Â»Â£t quÃƒÂ¡ giÃ¡Â»â€ºi hÃ¡ÂºÂ¡n Max (nÃ¡ÂºÂ¿u cÃƒÂ³ prop max)
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
                // HiÃ¡Â»Æ’n thÃ¡Â»â€¹ sÃ¡Â»â€˜ Ã„â€˜ÃƒÂ£ format
                value={value ? formatNumber(value.toString()) : ""}
                onChange={handleChange}
                className="pr-12 text-right font-mono font-medium"
            />
            {/* PhÃ¡ÂºÂ§n Ã„â€˜uÃƒÂ´i VNÃ„Â */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400 text-sm font-semibold">VNÃ„Â</span>
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

    // Maps Ã„â€˜Ã¡Â»Æ’ convert Name Ã¢â€ â€ ID
    const [categoryNameToIdMap, setCategoryNameToIdMap] = useState<Map<string, string>>(new Map());
    const [authorNameToIdMap, setAuthorNameToIdMap] = useState<Map<string, string>>(new Map());

    // States cho tÃƒÂ­nh nÃ„Æ’ng "NhÃ¡ÂºÂ­p thÃƒÂªm bÃ¡ÂºÂ£n sao" (SÃƒÂ¡ch cÃƒÂ³ sÃ¡ÂºÂµn)
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

                // LÃ¡ÂºÂ¥y giÃƒÂ¡ trÃ¡Â»â€¹ KhoÃ¡ÂºÂ£ng cÃƒÂ¡ch nÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n tÃ¡Â»Â« parameters
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

                    const label = `${tTitle} - ${b.publisher} (${b.publishYear}) - GiÃƒÂ¡: ${new Intl.NumberFormat('vi-VN').format(b.price)}Ã„â€˜`;
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

    // Logic kiÃ¡Â»Æ’m tra QÃ„Â2
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
                    .map((r: unknown) => `Ã¢â‚¬Â¢ ${r.title}: ${r.message}`)
                    .join('\n');
                
                showToast(
                    `HoÃƒÂ n thÃƒÂ nh: ${successCount} thÃƒÂ nh cÃƒÂ´ng, ${errorCount} bÃ¡Â»â€¹ lÃ¡Â»â€”i.\n${errorMessages}`,
                    errorCount === results.length ? 'error' : 'warning'
                );
            } else {
                showToast(`Ã„ÂÃƒÂ£ nhÃ¡ÂºÂ­p thÃƒÂ nh cÃƒÂ´ng ${successCount} dÃƒÂ²ng dÃ¡Â»Â¯ liÃ¡Â»â€¡u.`, "success");
            }
            
            if (successCount > 0) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Import error:", error);
            showToast("LÃ¡Â»â€”i khi nhÃ¡ÂºÂ­p dÃ¡Â»Â¯ liÃ¡Â»â€¡u.", "error");
        }
    };

    // HÃƒÂ m lÃ†Â°u sÃƒÂ¡ch (TÃ¡ÂºÂ¡o mÃ¡Â»â€ºi hoÃ¡ÂºÂ·c CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t)
    // HÃƒÂ m kiÃ¡Â»Æ’m tra hÃ¡Â»Â£p lÃ¡Â»â€¡
    const validateForm = (): boolean => {
         // Validation chung
         if (!editingBookId && (!formQuantity || formQuantity < 1) && inputMode !== 'existing') {
             showToast("SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng nhÃ¡ÂºÂ­p phÃ¡ÂºÂ£i ÃƒÂ­t nhÃ¡ÂºÂ¥t lÃƒÂ  1", 'warning');
             return false;
        }

        // EDIT MODE
        if (editingBookId) {
            if (!formBookName.trim()) { 
                showToast("Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p tÃƒÂªn sÃƒÂ¡ch", 'warning'); 
                return false; 
            }
            return true;
        }

        // EXISTING BOOK MODE
        if (inputMode === 'existing') {
            if (!selectedBookLabel) {
                showToast("Vui lÃƒÂ²ng chÃ¡Â»Ân sÃƒÂ¡ch cÃ¡ÂºÂ§n nhÃ¡ÂºÂ­p thÃƒÂªm", 'warning');
                return false;
            }
            const existingBookId = bookLabelToIdMap.get(selectedBookLabel);
            if (!existingBookId) {
                 showToast("SÃƒÂ¡ch Ã„â€˜ÃƒÂ£ chÃ¡Â»Ân khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡", 'error');
                 return false;
            }
            return true;
        }

        // NEW BOOK MODE
        if (!formBookName.trim()) {
            showToast("Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p tÃƒÂªn sÃƒÂ¡ch", 'warning');
            return false;
        }
        if (!formPrice || formPrice <= 0) {
            showToast("Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p trÃ¡Â»â€¹ giÃƒÂ¡ sÃƒÂ¡ch", 'warning');
            return false;
        }
        if (!formPublishYear) {
            showToast("Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p nÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n", 'warning');
            return false;
        }

        const publishYear = parseInt(formPublishYear);
        if (publishYear < minPublishYear || publishYear > currentYear) {
            showToast(`NÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n phÃ¡ÂºÂ£i tÃ¡Â»Â« ${minPublishYear} Ã„â€˜Ã¡ÂºÂ¿n ${currentYear} (QÃ„Â2)`, 'error');
            return false;
        }
        if (!formCategory.trim()) {
            showToast("Vui lÃƒÂ²ng chÃ¡Â»Ân thÃ¡Â»Æ’ loÃ¡ÂºÂ¡i", 'warning');
            return false;
        }
        if (!formDateReceived) {
            showToast("Vui lÃƒÂ²ng chÃ¡Â»Ân ngÃƒÂ y nhÃ¡ÂºÂ­p sÃƒÂ¡ch", 'warning');
            return false;
        }
        
        
        return true;
    };

    // HÃƒÂ m xÃ¡Â»Â­ lÃƒÂ½ khi bÃ¡ÂºÂ¥m nÃƒÂºt LÃ†Â°u (Trigger Validation & Dialog)
    const handlePreSave = async () => {
        if (!validateForm()) {
            return;
        }

        // KiÃ¡Â»Æ’m tra trÃƒÂ¹ng lÃ¡ÂºÂ·p CHÃ¡Â»Ë† khi TÃ¡ÂºÂ O MÃ¡Â»Å¡I (inputMode === 'new' vÃƒÂ  khÃƒÂ´ng editingBookId)
        if (inputMode === 'new' && !editingBookId) {
            try {
                const token = Cookies.get('access_token');
                const headers = { 'Authorization': `Bearer ${token}` };
                const baseUrl = 'http://localhost:4000/api';

                // CÃ¡ÂºÂ§n tÃ¡ÂºÂ¡o title trÃ†Â°Ã¡Â»â€ºc Ã„â€˜Ã¡Â»Æ’ kiÃ¡Â»Æ’m tra
                const categoryId = categoryNameToIdMap.get(formCategory);
                if (!categoryId) {
                    showToast('KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y ID thÃ¡Â»Æ’ loÃ¡ÂºÂ¡i. Vui lÃƒÂ²ng chÃ¡Â»Ân lÃ¡ÂºÂ¡i.', 'error');
                    return;
                }

                const publishYear = parseInt(formPublishYear);

                // KiÃ¡Â»Æ’m tra xem cÃƒÂ³ TitleBook vÃ¡Â»â€ºi tÃƒÂªn nÃƒÂ y chÃ†Â°a
                const allTitlesRes = await fetch(`${baseUrl}/title-books`, { headers });
                if (allTitlesRes.ok) {
                    const allTitles = await allTitlesRes.json();
                    const existingTitle = allTitles.find((t: unknown) => t.title === formBookName);
                    
                    if (existingTitle) {
                        const titleId = existingTitle._id;
                        
                        // KiÃ¡Â»Æ’m tra xem Ã„â€˜ÃƒÂ£ cÃƒÂ³ Book vÃ¡Â»â€ºi cÃƒÂ¹ng titleId, publishYear, publisher chÃ†Â°a
                        const allBooksRes = await fetch(`${baseUrl}/books`, { headers });
                        if (allBooksRes.ok) {
                            const allBooks = await allBooksRes.json();
                            const duplicateBook = allBooks.find((book: unknown) => {
                                const bookTitleId = typeof book.titleId === 'object' ? book.titleId._id : book.titleId;
                                return (
                                    bookTitleId === titleId &&
                                    book.publishYear === publishYear &&
                                    book.publisher === (formPublisher || 'KhÃƒÂ´ng xÃƒÂ¡c Ã„â€˜Ã¡Â»â€¹nh')
                                );
                            });

                            if (duplicateBook) {
                                showToast(
                                    'SÃƒÂ¡ch nÃƒÂ y Ã„â€˜ÃƒÂ£ tÃ¡Â»â€œn tÃ¡ÂºÂ¡i vÃ¡Â»â€ºi cÃƒÂ¹ng thÃƒÂ´ng tin (tÃƒÂªn, tÃƒÂ¡c giÃ¡ÂºÂ£, thÃ¡Â»Æ’ loÃ¡ÂºÂ¡i, nÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n, nhÃƒÂ  xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n). Vui lÃƒÂ²ng sÃ¡Â»Â­ dÃ¡Â»Â¥ng chÃ¡Â»Â©c nÃ„Æ’ng "NhÃ¡ÂºÂ­p thÃƒÂªm bÃ¡ÂºÂ£n sao" Ã„â€˜Ã¡Â»Æ’ tÃ„Æ’ng sÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng.',
                                    'warning'
                                );
                                return; // ChÃ¡ÂºÂ·n luÃƒÂ´n, KHÃƒâ€NG mÃ¡Â»Å¸ dialog confirm
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking duplicates:', error);
                // NÃ¡ÂºÂ¿u lÃ¡Â»â€”i khi kiÃ¡Â»Æ’m tra, vÃ¡ÂºÂ«n cho phÃƒÂ©p tiÃ¡ÂºÂ¿p tÃ¡Â»Â¥c (backend sÃ¡ÂºÂ½ kiÃ¡Â»Æ’m tra lÃ¡ÂºÂ¡i)
            }
        }

        // NÃ¡ÂºÂ¿u pass hÃ¡ÂºÂ¿t validation vÃƒÂ  khÃƒÂ´ng trÃƒÂ¹ng, mÃ¡Â»Å¸ dialog confirm
        setIsConfirmDialogOpen(true);
    };

    // HÃƒÂ m thÃ¡Â»Â±c thi lÃ†Â°u (Sau khi confirm)
    const handleConfirmSave = async () => {
        setIsConfirmDialogOpen(false);
        
        const token = Cookies.get('access_token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const baseUrl = 'http://localhost:4000/api';

        // === LOGIC CÃ¡ÂºÂ¬P NHÃ¡ÂºÂ¬T (EDIT) ===
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
                
                showToast("CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t thÃƒÂ´ng tin sÃƒÂ¡ch thÃƒÂ nh cÃƒÂ´ng!", "success");
                window.location.reload();

            } catch (error) {
                console.error(error);
                showToast("LÃ¡Â»â€”i khi cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t", "error");
            } finally {
                setIsSaving(false);
            }
            return;
        }
        
        // === LOGIC CHO CHÃ¡ÂºÂ¾ Ã„ÂÃ¡Â»Ëœ "SÃƒÂCH CÃƒâ€œ SÃ¡ÂºÂ´N" ===
        if (inputMode === 'existing') {
            const existingBookId = bookLabelToIdMap.get(selectedBookLabel);
            // Re-check id validity though checked in validateForm
            if (!existingBookId) return;

            setIsSaving(true);
            try {
                const token = Cookies.get('access_token');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                const baseUrl = 'http://localhost:4000/api';

                console.log(`[Existing Mode] ThÃƒÂªm ${formQuantity} bÃ¡ÂºÂ£n sao cho Book ID: ${existingBookId}`);
                
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
                showToast(`Ã„ÂÃƒÂ£ thÃƒÂªm ${formQuantity} bÃ¡ÂºÂ£n sao thÃƒÂ nh cÃƒÂ´ng!`, 'success');
                
                // Reset & Reload
                setSelectedBookLabel("");
                setFormQuantity(1);
                setIsDialogOpen(false);
                window.location.reload();

            } catch (error) {
                console.error(error);
                showToast("LÃ¡Â»â€”i khi thÃƒÂªm bÃ¡ÂºÂ£n sao", 'error');
            } finally {
                setIsSaving(false);
            }
            return;
        }

        // === LOGIC CHO CHÃ¡ÂºÂ¾ Ã„ÂÃ¡Â»Ëœ "SÃƒÂCH MÃ¡Â»Å¡I" (Code cÃ…Â©) ===
        const publishYear = parseInt(formPublishYear);

        setIsSaving(true);
        try {
            const token = Cookies.get('access_token');
            const baseUrl = 'http://localhost:4000/api';
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            // Convert categoryName Ã¢â€ â€™ categoryId
            const categoryId = categoryNameToIdMap.get(formCategory);
            if (!categoryId) {
                throw new Error('KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y ID thÃ¡Â»Æ’ loÃ¡ÂºÂ¡i. Vui lÃƒÂ²ng chÃ¡Â»Ân lÃ¡ÂºÂ¡i.');
            }

            // 1. XÃ¡Â»Â­ lÃƒÂ½ Author trÃ†Â°Ã¡Â»â€ºc (kiÃ¡Â»Æ’m tra hoÃ¡ÂºÂ·c tÃ¡ÂºÂ¡o mÃ¡Â»â€ºi)
            let authorId: string | undefined;
            if (formAuthor.trim()) {
                authorId = authorNameToIdMap.get(formAuthor);
                
                // NÃ¡ÂºÂ¿u tÃƒÂ¡c giÃ¡ÂºÂ£ chÃ†Â°a tÃ¡Â»â€œn tÃ¡ÂºÂ¡i, tÃ¡ÂºÂ¡o mÃ¡Â»â€ºi
                if (!authorId) {
                    console.log('TÃ¡ÂºÂ¡o tÃƒÂ¡c giÃ¡ÂºÂ£ mÃ¡Â»â€ºi:', formAuthor);
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
                        console.log('Ã¢Å“â€œ TÃ¡ÂºÂ¡o tÃƒÂ¡c giÃ¡ÂºÂ£ thÃƒÂ nh cÃƒÂ´ng, ID:', authorId);
                    } else {
                        const errorData = await newAuthorRes.json().catch(() => ({}));
                        console.error('Ã¢Å“â€” LÃ¡Â»â€”i tÃ¡ÂºÂ¡o tÃƒÂ¡c giÃ¡ÂºÂ£:', errorData);
                        throw new Error('KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ¡o tÃƒÂ¡c giÃ¡ÂºÂ£');
                    }
                } else {
                    console.log('Ã¢Å“â€œ SÃ¡Â»Â­ dÃ¡Â»Â¥ng tÃƒÂ¡c giÃ¡ÂºÂ£ cÃƒÂ³ sÃ¡ÂºÂµn, ID:', authorId);
                }
            }

            // 2. TÃ¡ÂºÂ¡o Title Book
            let titleBookId: string;
            console.log('TÃ¡ÂºÂ¡o Title Book:', formBookName);
            
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
                throw new Error(`KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ¡o tÃƒÂªn sÃƒÂ¡ch: ${titleRes.status}`);
            }

            const titleData = await titleRes.json();
            titleBookId = titleData._id || titleData.id;
            console.log('Ã¢Å“â€œ TÃ¡ÂºÂ¡o Title Book thÃƒÂ nh cÃƒÂ´ng, ID:', titleBookId);

            // 3. TÃ¡ÂºÂ¡o Title-Author (liÃƒÂªn kÃ¡ÂºÂ¿t tÃƒÂ¡c giÃ¡ÂºÂ£ vÃ¡Â»â€ºi sÃƒÂ¡ch)
            if (authorId) {
                console.log('TÃ¡ÂºÂ¡o liÃƒÂªn kÃ¡ÂºÂ¿t Title-Author:', { titleId: titleBookId, authorId });
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
                    console.error('Ã¢Å“â€” LÃ¡Â»â€”i tÃ¡ÂºÂ¡o liÃƒÂªn kÃ¡ÂºÂ¿t tÃƒÂ¡c giÃ¡ÂºÂ£:', errorData);
                    throw new Error('KhÃƒÂ´ng thÃ¡Â»Æ’ liÃƒÂªn kÃ¡ÂºÂ¿t tÃƒÂ¡c giÃ¡ÂºÂ£ vÃ¡Â»â€ºi sÃƒÂ¡ch');
                } else {
                    const linkData = await titleAuthorRes.json();
                    console.log('Ã¢Å“â€œ LiÃƒÂªn kÃ¡ÂºÂ¿t tÃƒÂ¡c giÃ¡ÂºÂ£ thÃƒÂ nh cÃƒÂ´ng:', linkData);
                }
            }

            // 4. TÃ¡ÂºÂ¡o Book (Edition)
            console.log('TÃ¡ÂºÂ¡o Book (Edition)');
            const bookRes = await fetch(`${baseUrl}/books`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    titleId: titleBookId,
                    publishYear,
                    publisher: formPublisher || 'KhÃƒÂ´ng xÃƒÂ¡c Ã„â€˜Ã¡Â»â€¹nh',
                    importDate: formDateReceived,
                    price: formPrice,
                })
            });

            if (!bookRes.ok) {
                const errorData = await bookRes.json().catch(() => ({}));
                console.error('Book creation response:', errorData);
                throw new Error(`KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ¡o bÃ¡ÂºÂ£n sÃƒÂ¡ch: ${bookRes.status}`);
            }

            const bookData = await bookRes.json();
            const bookId = bookData._id || bookData.id;

            // 5. TÃ¡ÂºÂ¡o Book Copy (theo sÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng)
            console.log(`TÃ¡ÂºÂ¡o ${formQuantity} bÃ¡ÂºÂ£n sao sÃƒÂ¡ch...`);
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
                             throw new Error(`LÃ¡Â»â€”i tÃ¡ÂºÂ¡o bÃ¡ÂºÂ£n sao ${i+1}: ${err.message || res.status}`);
                         }
                         return res.json();
                    })
                );
            }

            await Promise.all(copyPromises);
            console.log(`Ã¢Å“â€œ TÃ¡ÂºÂ¡o ${formQuantity} Book Copy thÃƒÂ nh cÃƒÂ´ng`);
            showToast('LÃ†Â°u sÃƒÂ¡ch thÃƒÂ nh cÃƒÂ´ng!', 'success');

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
            showToast(`LÃ¡Â»â€”i: ${error instanceof Error ? error.message : 'KhÃƒÂ´ng thÃ¡Â»Æ’ lÃ†Â°u sÃƒÂ¡ch'}`, 'error');
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
            
            // KiÃ¡Â»Æ’m tra Ã„â€˜iÃ¡Â»Âu kiÃ¡Â»â€¡n xÃƒÂ³a
            const checkRes = await fetch(`${baseUrl}/title-books/${book.id}/check-delete`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!checkRes.ok) {
                showToast('KhÃƒÂ´ng thÃ¡Â»Æ’ kiÃ¡Â»Æ’m tra Ã„â€˜iÃ¡Â»Âu kiÃ¡Â»â€¡n xÃƒÂ³a', 'error');
                return;
            }
            
            const checkData = await checkRes.json();
            
            // NÃ¡ÂºÂ¿u cÃƒÂ³ sÃƒÂ¡ch Ã„â€˜ang mÃ†Â°Ã¡Â»Â£n, khÃƒÂ´ng cho xÃƒÂ³a
            if (!checkData.canDelete) {
                showToast(`KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ³a: CÃƒÂ²n ${checkData.borrowedCount} cuÃ¡Â»â€˜n sÃƒÂ¡ch Ã„â€˜ang Ã„â€˜Ã†Â°Ã¡Â»Â£c mÃ†Â°Ã¡Â»Â£n. Vui lÃƒÂ²ng Ã„â€˜Ã¡Â»Â£i trÃ¡ÂºÂ£ hÃ¡ÂºÂ¿t sÃƒÂ¡ch trÃ†Â°Ã¡Â»â€ºc khi xÃƒÂ³a.`, 'error');
                return;
            }
            
            // Cho phÃƒÂ©p xÃƒÂ³a - luÃƒÂ´n xÃƒÂ³a mÃ¡Â»Âm
            setDeletingBookId(book.id);
            setIsDeleteDialogOpen(true);
        } catch (error) {
            console.error('Error checking delete conditions:', error);
            showToast('LÃ¡Â»â€”i khi kiÃ¡Â»Æ’m tra Ã„â€˜iÃ¡Â»Âu kiÃ¡Â»â€¡n xÃƒÂ³a', 'error');
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
                throw new Error('KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ³a sÃƒÂ¡ch');
            }
            
            showToast('Ã„ÂÃƒÂ£ xÃƒÂ³a sÃƒÂ¡ch thÃƒÂ nh cÃƒÂ´ng', 'success');
            setIsDeleteDialogOpen(false);
            setDeletingBookId(null);
            
            // Reload data
            window.location.reload();
        } catch (error) {
            console.error('Error deleting book:', error);
            showToast('LÃ¡Â»â€”i khi xÃƒÂ³a sÃƒÂ¡ch', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">QuÃ¡ÂºÂ£n lÃƒÂ½ SÃƒÂ¡ch</h1>
                    <p className="text-sm text-slate-500">TiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n sÃƒÂ¡ch mÃ¡Â»â€ºi (BM2) vÃƒÂ  tra cÃ¡Â»Â©u thÃƒÂ´ng tin (BM3).</p>
                </div>
                <div className="flex gap-2">
                    <ExcelImporter 
                        buttonLabel="NhÃ¡ÂºÂ­p Excel" 
                        onImport={handleBulkImport}
                        templateHeaders={['Title', 'Author', 'Category', 'Price', 'Quantity']}
                    />
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> TiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n sÃƒÂ¡ch
                    </Button>
                </div>
            </div>

            {/* --- BÃ¡Â»Ëœ LÃ¡Â»Å’C TRA CÃ¡Â»Â¨U (BM3) --- */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        {/* Row 1: Search Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* TÃƒÂªn sÃƒÂ¡ch */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">TÃƒÂªn sÃƒÂ¡ch</label>
                                <SearchableInput
                                    options={suggestedTitles}
                                    value={filterTitle}
                                    onChange={setFilterTitle}
                                    placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn sÃƒÂ¡ch..."
                                />
                            </div>
                            
                            {/* TÃƒÂ¡c giÃ¡ÂºÂ£ */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">TÃƒÂ¡c giÃ¡ÂºÂ£</label>
                                <SearchableInput
                                    options={suggestedAuthors}
                                    value={filterAuthor}
                                    onChange={setFilterAuthor}
                                    placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn tÃƒÂ¡c giÃ¡ÂºÂ£..."
                                />
                            </div>
                            
                            {/* NhÃƒÂ  xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">NhÃƒÂ  xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n</label>
                                <SearchableInput
                                    options={suggestedPublishers}
                                    value={filterPublisher}
                                    onChange={setFilterPublisher}
                                    placeholder="NhÃ¡ÂºÂ­p nhÃƒÂ  xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n..."
                                />
                            </div>
                        </div>
                        
                        {/* Row 2: Category + Clear Button */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2">
                                <label className="text-xs font-medium text-slate-600 whitespace-nowrap">ThÃ¡Â»Æ’ loÃ¡ÂºÂ¡i:</label>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="ThÃ¡Â»Æ’ loÃ¡ÂºÂ¡i" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ thÃ¡Â»Æ’ loÃ¡ÂºÂ¡i</SelectItem>
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
                                <X className="w-4 h-4 mr-1" /> XÃƒÂ³a bÃ¡Â»â„¢ lÃ¡Â»Âc
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- DANH SÃƒÂCH SÃƒÂCH (BM3) --- */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800">Kho sÃƒÂ¡ch hiÃ¡Â»â€¡n cÃƒÂ³</CardTitle>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">TÃ¡Â»â€¢ng: {filteredBooks.length} cuÃ¡Â»â€˜n</div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                    <TableHead>TiÃƒÂªu Ã„â€˜Ã¡Â»Â</TableHead>
                                    <TableHead>ThÃ¡Â»Æ’ loÃ¡ÂºÂ¡i</TableHead>
                                    <TableHead>TÃƒÂ¡c giÃ¡ÂºÂ£</TableHead>
                                    <TableHead>NÃ„Æ’m XB</TableHead>
                                    <TableHead className="truncate max-w-[120px]">NXB</TableHead>
                                    <TableHead className="text-center">TÃ¡Â»â€¢ng sÃ¡Â»â€˜</TableHead>
                                    <TableHead className="text-center">CÃƒÂ²n trÃ¡Â»â€˜ng</TableHead>
                                    <TableHead className="text-center">Ã„Âang mÃ†Â°Ã¡Â»Â£n</TableHead>
                                    <TableHead className="text-center">Ã„ÂÃƒÂ£ mÃ¡ÂºÂ¥t</TableHead>
                                    <TableHead className="text-right">Thao tÃƒÂ¡c</TableHead>
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
                                                <DropdownMenuLabel>TÃƒÂ¡c vÃ¡Â»Â¥</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(book)}>
                                                    <Edit className="mr-2 h-4 w-4" /> SÃ¡Â»Â­a thÃƒÂ´ng tin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(book)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> XÃƒÂ³a sÃƒÂ¡ch
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
                        <DialogTitle>{editingBookId ? "CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t ThÃƒÂ´ng tin SÃƒÂ¡ch" : "TiÃ¡ÂºÂ¿p nhÃ¡ÂºÂ­n sÃƒÂ¡ch mÃ¡Â»â€ºi (BM2)"}</DialogTitle>
                        <DialogDescription>
                            {editingBookId ? "ChÃ¡Â»â€°nh sÃ¡Â»Â­a thÃƒÂ´ng tin chi tiÃ¡ÂºÂ¿t." : "NhÃ¡ÂºÂ­p thÃƒÂ´ng tin chi tiÃ¡ÂºÂ¿t cÃ¡Â»Â§a sÃƒÂ¡ch. LÃ†Â°u ÃƒÂ½ quy Ã„â€˜Ã¡Â»â€¹nh vÃ¡Â»Â nÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n."}
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
                                NhÃ¡ÂºÂ­p Ã„ÂÃ¡ÂºÂ§u SÃƒÂ¡ch MÃ¡Â»â€ºi
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'existing' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setInputMode('existing')}
                            >
                                NhÃ¡ÂºÂ­p ThÃƒÂªm BÃ¡ÂºÂ£n Sao
                            </button>
                        </div>
                        )}

                        {/* --- FORM CHÃ¡ÂºÂ¾ Ã„ÂÃ¡Â»Ëœ: SÃƒÂCH CÃƒâ€œ SÃ¡ÂºÂ´N --- */}
                        {inputMode === 'existing' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700 mb-2">
                                    <span className="font-semibold">ChÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ nÃƒÂ y dÃƒÂ¹ng Ã„â€˜Ã¡Â»Æ’:</span> NhÃ¡ÂºÂ­p thÃƒÂªm sÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng cho mÃ¡Â»â„¢t cuÃ¡Â»â€˜n sÃƒÂ¡ch (Ã¡ÂºÂ¥n bÃ¡ÂºÂ£n) Ã„â€˜ÃƒÂ£ cÃƒÂ³ sÃ¡ÂºÂµn trong kho.
                                </div>
                                <div className="space-y-2">
                                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">ChÃ¡Â»Ân sÃƒÂ¡ch cÃƒÂ³ sÃ¡ÂºÂµn</Label>
                                    <SearchableInput
                                        id="existingBook"
                                        options={selectableBooks}
                                        value={selectedBookLabel}
                                        onChange={setSelectedBookLabel}
                                        placeholder="TÃƒÂ¬m theo TÃƒÂªn sÃƒÂ¡ch - NXB - NÃ„Æ’m XB..."
                                    />
                                    <p className="text-xs text-slate-500">GÃƒÂµ tÃƒÂªn sÃƒÂ¡ch Ã„â€˜Ã¡Â»Æ’ tÃƒÂ¬m kiÃ¡ÂºÂ¿m nhanh.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantityExisting" className="after:content-['*'] after:ml-0.5 after:text-red-500">SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng nhÃ¡ÂºÂ­p thÃƒÂªm</Label>
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

                        {/* --- FORM CHÃ¡ÂºÂ¾ Ã„ÂÃ¡Â»Ëœ: SÃƒÂCH MÃ¡Â»Å¡I (Form cÃ…Â©) --- */}
                        {inputMode === 'new' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                        {/* HÃƒÂ ng 1: TÃƒÂªn sÃƒÂ¡ch + ThÃ¡Â»Æ’ loÃ¡ÂºÂ¡i */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="bookName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    TÃƒÂªn sÃƒÂ¡ch
                                </Label>
                                <Input 
                                    id="bookName" 
                                    placeholder="VD: NhÃ¡ÂºÂ­p mÃƒÂ´n CNPM"
                                    value={formBookName}
                                    onChange={(e) => setFormBookName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">ThÃ¡Â»Æ’ loÃ¡ÂºÂ¡i</Label>
                                <SearchableInput
                                    id="category"
                                    options={suggestedCategories}
                                    value={formCategory}
                                    onChange={setFormCategory}
                                    placeholder="ChÃ¡Â»Ân/NhÃ¡ÂºÂ­p"
                                />
                            </div>
                        </div>

                        {/* HÃƒÂ ng 2: TÃƒÂ¡c giÃ¡ÂºÂ£ + NÃ„Æ’m XB */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="author">TÃƒÂ¡c giÃ¡ÂºÂ£</Label>
                                <SearchableInput
                                    id="author"
                                    options={suggestedAuthors}
                                    value={formAuthor}
                                    onChange={setFormAuthor}
                                    placeholder="NhÃ¡ÂºÂ­p hoÃ¡ÂºÂ·c chÃ¡Â»Ân..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="publishYear">NÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n</Label>
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
                                    QÃ„Â2: ChÃ¡Â»â€° nhÃ¡ÂºÂ­n sÃƒÂ¡ch tÃ¡Â»Â« nÃ„Æ’m {minPublishYear} trÃ¡Â»Å¸ lÃ¡ÂºÂ¡i Ã„â€˜ÃƒÂ¢y.
                                </div>
                            </div>
                        </div>

                        {/* HÃƒÂ ng 3: NXB + NgÃƒÂ y nhÃ¡ÂºÂ­p */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="publisher">NhÃƒÂ  xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n</Label>
                                <Input 
                                    id="publisher" 
                                    placeholder="VD: NXB TrÃ¡ÂºÂ»"
                                    value={formPublisher}
                                    onChange={(e) => setFormPublisher(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateReceived" className="after:content-['*'] after:ml-0.5 after:text-red-500">NgÃƒÂ y nhÃ¡ÂºÂ­p</Label>
                                <Input
                                    id="dateReceived"
                                    type="date"
                                    value={formDateReceived}
                                    onChange={(e) => setFormDateReceived(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* HÃƒÂ ng 4: TrÃ¡Â»â€¹ giÃƒÂ¡ + SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={editingBookId ? "col-span-2 space-y-2" : "space-y-2"}>
                                <Label htmlFor="price" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    TrÃ¡Â»â€¹ giÃƒÂ¡
                                </Label>

                                <CurrencyInput
                                    id="price"
                                    placeholder="0"
                                    value={formPrice}
                                    onChange={setFormPrice}
                                    max={100000000} // GiÃ¡Â»â€ºi hÃ¡ÂºÂ¡n max lÃƒÂ  100 triÃ¡Â»â€¡u
                                />

                                {/* HiÃ¡Â»Æ’n thÃ¡Â»â€¹ Helper text */}
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-slate-400">
                                        TÃ¡Â»â€˜i Ã„â€˜a: 100.000.000 VNÃ„Â
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
                                    SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng
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
                            HÃ¡Â»Â§y bÃ¡Â»Â
                        </Button>
                        <Button 
                            onClick={handlePreSave} 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isSaving}
                        >
                            {isSaving ? (editingBookId ? 'Ã„Âang cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t...' : 'Ã„Âang lÃ†Â°u...') : (editingBookId ? 'CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t' : 'LÃ†Â°u thÃƒÂ´ng tin')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>XÃƒÂ¡c nhÃ¡ÂºÂ­n lÃ†Â°u</DialogTitle>
                        <DialogDescription>
                            BÃ¡ÂºÂ¡n cÃƒÂ³ chÃ¡ÂºÂ¯c chÃ¡ÂºÂ¯n muÃ¡Â»â€˜n lÃ†Â°u thÃƒÂ´ng tin nÃƒÂ y vÃƒÂ o hÃ¡Â»â€¡ thÃ¡Â»â€˜ng?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                            HÃ¡Â»Â§y bÃ¡Â»Â
                        </Button>
                        <Button onClick={handleConfirmSave} className="bg-blue-600 hover:bg-blue-700">
                            XÃƒÂ¡c nhÃ¡ÂºÂ­n
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="XÃƒÂ¡c nhÃ¡ÂºÂ­n xÃƒÂ³a sÃƒÂ¡ch"
                description="BÃ¡ÂºÂ¡n cÃƒÂ³ chÃ¡ÂºÂ¯c chÃ¡ÂºÂ¯n muÃ¡Â»â€˜n xÃƒÂ³a sÃƒÂ¡ch nÃƒÂ y? HÃ¡Â»â€¡ thÃ¡Â»â€˜ng sÃ¡ÂºÂ½ thÃ¡Â»Â±c hiÃ¡Â»â€¡n xÃƒÂ³a."
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    );
}