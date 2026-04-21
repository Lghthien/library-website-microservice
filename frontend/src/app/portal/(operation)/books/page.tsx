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

// --- COMPONENT TÃƒÆ’Ã¢â€žÂ¢Y CHÃƒÂ¡Ã‚Â»Ã‹â€ NH: SEARCHABLE INPUT ---
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

// --- COMPONENT TÃƒÆ’Ã¢â€žÂ¢Y CHÃƒÂ¡Ã‚Â»Ã‹â€ NH: CURRENCY INPUT (XÃƒÂ¡Ã‚Â»Ã‚Â¬ LÃƒÆ’Ã‚Â TIÃƒÂ¡Ã‚Â»Ã¢â€šÂ¬N TÃƒÂ¡Ã‚Â»Ã¢â‚¬Â ) ---
// --- COMPONENT TÃƒÆ’Ã¢â€žÂ¢Y CHÃƒÂ¡Ã‚Â»Ã‹â€ NH: CURRENCY INPUT (Ãƒâ€žÃ‚ÂÃƒÆ’Ã†â€™ NÃƒÆ’Ã¢â‚¬Å¡NG CÃƒÂ¡Ã‚ÂºÃ‚Â¤P) ---
// --- COMPONENT TÃƒÆ’Ã¢â€žÂ¢Y CHÃƒÂ¡Ã‚Â»Ã‹â€ NH: CURRENCY INPUT (CÃƒÂ¡Ã‚ÂºÃ‚Â¬P NHÃƒÂ¡Ã‚ÂºÃ‚Â¬T MAX VALUE) ---
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
    max?: number // ThÃƒÆ’Ã‚Âªm prop max (tÃƒÆ’Ã‚Â¹y chÃƒÂ¡Ã‚Â»Ã‚Ân)
}) => {
    // HÃƒÆ’Ã‚Â m Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh dÃƒÂ¡Ã‚ÂºÃ‚Â¡ng sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ: 50000 -> 50,000
    const formatNumber = (num: string) => {
        return num.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // LoÃƒÂ¡Ã‚ÂºÃ‚Â¡i bÃƒÂ¡Ã‚Â»Ã‚Â dÃƒÂ¡Ã‚ÂºÃ‚Â¥u phÃƒÂ¡Ã‚ÂºÃ‚Â©y Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ lÃƒÂ¡Ã‚ÂºÃ‚Â¥y giÃƒÆ’Ã‚Â¡ trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ thÃƒÆ’Ã‚Â´
        const rawValue = e.target.value.replace(/,/g, "");

        if (!rawValue) {
            onChange(0);
            return;
        }

        let numericValue = parseInt(rawValue, 10);

        // 1. ChÃƒÂ¡Ã‚ÂºÃ‚Â·n sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ ÃƒÆ’Ã‚Â¢m hoÃƒÂ¡Ã‚ÂºÃ‚Â·c khÃƒÆ’Ã‚Â´ng phÃƒÂ¡Ã‚ÂºÃ‚Â£i sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ
        if (isNaN(numericValue) || numericValue < 0) return;

        // 2. ChÃƒÂ¡Ã‚ÂºÃ‚Â·n sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ vÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t quÃƒÆ’Ã‚Â¡ giÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi hÃƒÂ¡Ã‚ÂºÃ‚Â¡n Max (nÃƒÂ¡Ã‚ÂºÃ‚Â¿u cÃƒÆ’Ã‚Â³ prop max)
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
                // HiÃƒÂ¡Ã‚Â»Ã†â€™n thÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ format
                value={value ? formatNumber(value.toString()) : ""}
                onChange={handleChange}
                className="pr-12 text-right font-mono font-medium"
            />
            {/* PhÃƒÂ¡Ã‚ÂºÃ‚Â§n Ãƒâ€žÃ¢â‚¬ËœuÃƒÆ’Ã‚Â´i VNÃƒâ€žÃ‚Â */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400 text-sm font-semibold">VNÃƒâ€žÃ‚Â</span>
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

    // Maps Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ convert Name ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Â ID
    const [categoryNameToIdMap, setCategoryNameToIdMap] = useState<Map<string, string>>(new Map());
    const [authorNameToIdMap, setAuthorNameToIdMap] = useState<Map<string, string>>(new Map());

    // States cho tÃƒÆ’Ã‚Â­nh nÃƒâ€žÃ†â€™ng "NhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Âªm bÃƒÂ¡Ã‚ÂºÃ‚Â£n sao" (SÃƒÆ’Ã‚Â¡ch cÃƒÆ’Ã‚Â³ sÃƒÂ¡Ã‚ÂºÃ‚Âµn)
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
                ]) as [ApiBook[], ApiBookCopy[], ApiCategory[], ApiAuthor[], ApiTitleAuthor[], ApiTitleBook[], any[]];

                // LÃƒÂ¡Ã‚ÂºÃ‚Â¥y giÃƒÆ’Ã‚Â¡ trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ KhoÃƒÂ¡Ã‚ÂºÃ‚Â£ng cÃƒÆ’Ã‚Â¡ch nÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n tÃƒÂ¡Ã‚Â»Ã‚Â« parameters
                const publishYearParam = parametersData.find((p: any) => p.paramName === 'QD2_PUBLISH_YEAR_DISTANCE');
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

                    const label = `${tTitle} - ${b.publisher} (${b.publishYear}) - GiÃƒÆ’Ã‚Â¡: ${new Intl.NumberFormat('vi-VN').format(b.price)}Ãƒâ€žÃ¢â‚¬Ëœ`;
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

    // Logic kiÃƒÂ¡Ã‚Â»Ã†â€™m tra QÃƒâ€žÃ‚Â2
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

    const handleBulkImport = async (data: any[]) => {
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
            const successCount = results.filter((r: any) => r.status === 'success').length;
            const errorCount = results.filter((r: any) => r.status === 'error').length;
            
            if (errorCount > 0) {
                const errorMessages = results
                    .filter((r: any) => r.status === 'error')
                    .map((r: any) => `ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ ${r.title}: ${r.message}`)
                    .join('\n');
                
                showToast(
                    `HoÃƒÆ’Ã‚Â n thÃƒÆ’Ã‚Â nh: ${successCount} thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng, ${errorCount} bÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ lÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i.\n${errorMessages}`,
                    errorCount === results.length ? 'error' : 'warning'
                );
            } else {
                showToast(`Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ nhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng ${successCount} dÃƒÆ’Ã‚Â²ng dÃƒÂ¡Ã‚Â»Ã‚Â¯ liÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡u.`, "success");
            }
            
            if (successCount > 0) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Import error:", error);
            showToast("LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i khi nhÃƒÂ¡Ã‚ÂºÃ‚Â­p dÃƒÂ¡Ã‚Â»Ã‚Â¯ liÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡u.", "error");
        }
    };

    // HÃƒÆ’Ã‚Â m lÃƒâ€ Ã‚Â°u sÃƒÆ’Ã‚Â¡ch (TÃƒÂ¡Ã‚ÂºÃ‚Â¡o mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi hoÃƒÂ¡Ã‚ÂºÃ‚Â·c CÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t)
    // HÃƒÆ’Ã‚Â m kiÃƒÂ¡Ã‚Â»Ã†â€™m tra hÃƒÂ¡Ã‚Â»Ã‚Â£p lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡
    const validateForm = (): boolean => {
         // Validation chung
         if (!editingBookId && (!formQuantity || formQuantity < 1) && inputMode !== 'existing') {
             showToast("SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p phÃƒÂ¡Ã‚ÂºÃ‚Â£i ÃƒÆ’Ã‚Â­t nhÃƒÂ¡Ã‚ÂºÃ‚Â¥t lÃƒÆ’Ã‚Â  1", 'warning');
             return false;
        }

        // EDIT MODE
        if (editingBookId) {
            if (!formBookName.trim()) { 
                showToast("Vui lÃƒÆ’Ã‚Â²ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p tÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch", 'warning'); 
                return false; 
            }
            return true;
        }

        // EXISTING BOOK MODE
        if (inputMode === 'existing') {
            if (!selectedBookLabel) {
                showToast("Vui lÃƒÆ’Ã‚Â²ng chÃƒÂ¡Ã‚Â»Ã‚Ân sÃƒÆ’Ã‚Â¡ch cÃƒÂ¡Ã‚ÂºÃ‚Â§n nhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Âªm", 'warning');
                return false;
            }
            const existingBookId = bookLabelToIdMap.get(selectedBookLabel);
            if (!existingBookId) {
                 showToast("SÃƒÆ’Ã‚Â¡ch Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ chÃƒÂ¡Ã‚Â»Ã‚Ân khÃƒÆ’Ã‚Â´ng hÃƒÂ¡Ã‚Â»Ã‚Â£p lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡", 'error');
                 return false;
            }
            return true;
        }

        // NEW BOOK MODE
        if (!formBookName.trim()) {
            showToast("Vui lÃƒÆ’Ã‚Â²ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p tÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch", 'warning');
            return false;
        }
        if (!formPrice || formPrice <= 0) {
            showToast("Vui lÃƒÆ’Ã‚Â²ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p trÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ giÃƒÆ’Ã‚Â¡ sÃƒÆ’Ã‚Â¡ch", 'warning');
            return false;
        }
        if (!formPublishYear) {
            showToast("Vui lÃƒÆ’Ã‚Â²ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p nÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n", 'warning');
            return false;
        }

        const publishYear = parseInt(formPublishYear);
        if (publishYear < minPublishYear || publishYear > currentYear) {
            showToast(`NÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n phÃƒÂ¡Ã‚ÂºÃ‚Â£i tÃƒÂ¡Ã‚Â»Ã‚Â« ${minPublishYear} Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â¿n ${currentYear} (QÃƒâ€žÃ‚Â2)`, 'error');
            return false;
        }
        if (!formCategory.trim()) {
            showToast("Vui lÃƒÆ’Ã‚Â²ng chÃƒÂ¡Ã‚Â»Ã‚Ân thÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i", 'warning');
            return false;
        }
        if (!formDateReceived) {
            showToast("Vui lÃƒÆ’Ã‚Â²ng chÃƒÂ¡Ã‚Â»Ã‚Ân ngÃƒÆ’Ã‚Â y nhÃƒÂ¡Ã‚ÂºÃ‚Â­p sÃƒÆ’Ã‚Â¡ch", 'warning');
            return false;
        }
        
        
        return true;
    };

    // HÃƒÆ’Ã‚Â m xÃƒÂ¡Ã‚Â»Ã‚Â­ lÃƒÆ’Ã‚Â½ khi bÃƒÂ¡Ã‚ÂºÃ‚Â¥m nÃƒÆ’Ã‚Âºt LÃƒâ€ Ã‚Â°u (Trigger Validation & Dialog)
    const handlePreSave = async () => {
        if (!validateForm()) {
            return;
        }

        // KiÃƒÂ¡Ã‚Â»Ã†â€™m tra trÃƒÆ’Ã‚Â¹ng lÃƒÂ¡Ã‚ÂºÃ‚Â·p CHÃƒÂ¡Ã‚Â»Ã‹â€  khi TÃƒÂ¡Ã‚ÂºÃ‚Â O MÃƒÂ¡Ã‚Â»Ã…Â¡I (inputMode === 'new' vÃƒÆ’Ã‚Â  khÃƒÆ’Ã‚Â´ng editingBookId)
        if (inputMode === 'new' && !editingBookId) {
            try {
                const token = Cookies.get('access_token');
                const headers = { 'Authorization': `Bearer ${token}` };
                const baseUrl = 'http://localhost:4000/api';

                // CÃƒÂ¡Ã‚ÂºÃ‚Â§n tÃƒÂ¡Ã‚ÂºÃ‚Â¡o title trÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ kiÃƒÂ¡Ã‚Â»Ã†â€™m tra
                const categoryId = categoryNameToIdMap.get(formCategory);
                if (!categoryId) {
                    showToast('KhÃƒÆ’Ã‚Â´ng tÃƒÆ’Ã‚Â¬m thÃƒÂ¡Ã‚ÂºÃ‚Â¥y ID thÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i. Vui lÃƒÆ’Ã‚Â²ng chÃƒÂ¡Ã‚Â»Ã‚Ân lÃƒÂ¡Ã‚ÂºÃ‚Â¡i.', 'error');
                    return;
                }

                const publishYear = parseInt(formPublishYear);

                // KiÃƒÂ¡Ã‚Â»Ã†â€™m tra xem cÃƒÆ’Ã‚Â³ TitleBook vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi tÃƒÆ’Ã‚Âªn nÃƒÆ’Ã‚Â y chÃƒâ€ Ã‚Â°a
                const allTitlesRes = await fetch(`${baseUrl}/title-books`, { headers });
                if (allTitlesRes.ok) {
                    const allTitles = await allTitlesRes.json();
                    const existingTitle = allTitles.find((t: any) => t.title === formBookName);
                    
                    if (existingTitle) {
                        const titleId = existingTitle._id;
                        
                        // KiÃƒÂ¡Ã‚Â»Ã†â€™m tra xem Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ cÃƒÆ’Ã‚Â³ Book vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi cÃƒÆ’Ã‚Â¹ng titleId, publishYear, publisher chÃƒâ€ Ã‚Â°a
                        const allBooksRes = await fetch(`${baseUrl}/books`, { headers });
                        if (allBooksRes.ok) {
                            const allBooks = await allBooksRes.json();
                            const duplicateBook = allBooks.find((book: any) => {
                                const bookTitleId = typeof book.titleId === 'object' ? book.titleId._id : book.titleId;
                                return (
                                    bookTitleId === titleId &&
                                    book.publishYear === publishYear &&
                                    book.publisher === (formPublisher || 'KhÃƒÆ’Ã‚Â´ng xÃƒÆ’Ã‚Â¡c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh')
                                );
                            });

                            if (duplicateBook) {
                                showToast(
                                    'SÃƒÆ’Ã‚Â¡ch nÃƒÆ’Ã‚Â y Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ tÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“n tÃƒÂ¡Ã‚ÂºÃ‚Â¡i vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi cÃƒÆ’Ã‚Â¹ng thÃƒÆ’Ã‚Â´ng tin (tÃƒÆ’Ã‚Âªn, tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£, thÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i, nÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n, nhÃƒÆ’Ã‚Â  xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n). Vui lÃƒÆ’Ã‚Â²ng sÃƒÂ¡Ã‚Â»Ã‚Â­ dÃƒÂ¡Ã‚Â»Ã‚Â¥ng chÃƒÂ¡Ã‚Â»Ã‚Â©c nÃƒâ€žÃ†â€™ng "NhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Âªm bÃƒÂ¡Ã‚ÂºÃ‚Â£n sao" Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒâ€žÃ†â€™ng sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng.',
                                    'warning'
                                );
                                return; // ChÃƒÂ¡Ã‚ÂºÃ‚Â·n luÃƒÆ’Ã‚Â´n, KHÃƒÆ’Ã¢â‚¬ÂNG mÃƒÂ¡Ã‚Â»Ã…Â¸ dialog confirm
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking duplicates:', error);
                // NÃƒÂ¡Ã‚ÂºÃ‚Â¿u lÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i khi kiÃƒÂ¡Ã‚Â»Ã†â€™m tra, vÃƒÂ¡Ã‚ÂºÃ‚Â«n cho phÃƒÆ’Ã‚Â©p tiÃƒÂ¡Ã‚ÂºÃ‚Â¿p tÃƒÂ¡Ã‚Â»Ã‚Â¥c (backend sÃƒÂ¡Ã‚ÂºÃ‚Â½ kiÃƒÂ¡Ã‚Â»Ã†â€™m tra lÃƒÂ¡Ã‚ÂºÃ‚Â¡i)
            }
        }

        // NÃƒÂ¡Ã‚ÂºÃ‚Â¿u pass hÃƒÂ¡Ã‚ÂºÃ‚Â¿t validation vÃƒÆ’Ã‚Â  khÃƒÆ’Ã‚Â´ng trÃƒÆ’Ã‚Â¹ng, mÃƒÂ¡Ã‚Â»Ã…Â¸ dialog confirm
        setIsConfirmDialogOpen(true);
    };

    // HÃƒÆ’Ã‚Â m thÃƒÂ¡Ã‚Â»Ã‚Â±c thi lÃƒâ€ Ã‚Â°u (Sau khi confirm)
    const handleConfirmSave = async () => {
        setIsConfirmDialogOpen(false);
        
        const token = Cookies.get('access_token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const baseUrl = 'http://localhost:4000/api';

        // === LOGIC CÃƒÂ¡Ã‚ÂºÃ‚Â¬P NHÃƒÂ¡Ã‚ÂºÃ‚Â¬T (EDIT) ===
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
                
                showToast("CÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t thÃƒÆ’Ã‚Â´ng tin sÃƒÆ’Ã‚Â¡ch thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng!", "success");
                window.location.reload();

            } catch (error) {
                console.error(error);
                showToast("LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i khi cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t", "error");
            } finally {
                setIsSaving(false);
            }
            return;
        }
        
        // === LOGIC CHO CHÃƒÂ¡Ã‚ÂºÃ‚Â¾ Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã‹Å“ "SÃƒÆ’Ã‚ÂCH CÃƒÆ’Ã¢â‚¬Å“ SÃƒÂ¡Ã‚ÂºÃ‚Â´N" ===
        if (inputMode === 'existing') {
            const existingBookId = bookLabelToIdMap.get(selectedBookLabel);
            // Re-check id validity though checked in validateForm
            if (!existingBookId) return;

            setIsSaving(true);
            try {
                const token = Cookies.get('access_token');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                const baseUrl = 'http://localhost:4000/api';

                console.log(`[Existing Mode] ThÃƒÆ’Ã‚Âªm ${formQuantity} bÃƒÂ¡Ã‚ÂºÃ‚Â£n sao cho Book ID: ${existingBookId}`);
                
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
                showToast(`Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ thÃƒÆ’Ã‚Âªm ${formQuantity} bÃƒÂ¡Ã‚ÂºÃ‚Â£n sao thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng!`, 'success');
                
                // Reset & Reload
                setSelectedBookLabel("");
                setFormQuantity(1);
                setIsDialogOpen(false);
                window.location.reload();

            } catch (error) {
                console.error(error);
                showToast("LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i khi thÃƒÆ’Ã‚Âªm bÃƒÂ¡Ã‚ÂºÃ‚Â£n sao", 'error');
            } finally {
                setIsSaving(false);
            }
            return;
        }

        // === LOGIC CHO CHÃƒÂ¡Ã‚ÂºÃ‚Â¾ Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã‹Å“ "SÃƒÆ’Ã‚ÂCH MÃƒÂ¡Ã‚Â»Ã…Â¡I" (Code cÃƒâ€¦Ã‚Â©) ===
        const publishYear = parseInt(formPublishYear);

        setIsSaving(true);
        try {
            const token = Cookies.get('access_token');
            const baseUrl = 'http://localhost:4000/api';
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            // Convert categoryName ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ categoryId
            const categoryId = categoryNameToIdMap.get(formCategory);
            if (!categoryId) {
                throw new Error('KhÃƒÆ’Ã‚Â´ng tÃƒÆ’Ã‚Â¬m thÃƒÂ¡Ã‚ÂºÃ‚Â¥y ID thÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i. Vui lÃƒÆ’Ã‚Â²ng chÃƒÂ¡Ã‚Â»Ã‚Ân lÃƒÂ¡Ã‚ÂºÃ‚Â¡i.');
            }

            // 1. XÃƒÂ¡Ã‚Â»Ã‚Â­ lÃƒÆ’Ã‚Â½ Author trÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc (kiÃƒÂ¡Ã‚Â»Ã†â€™m tra hoÃƒÂ¡Ã‚ÂºÃ‚Â·c tÃƒÂ¡Ã‚ÂºÃ‚Â¡o mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi)
            let authorId: string | undefined;
            if (formAuthor.trim()) {
                authorId = authorNameToIdMap.get(formAuthor);
                
                // NÃƒÂ¡Ã‚ÂºÃ‚Â¿u tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ chÃƒâ€ Ã‚Â°a tÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“n tÃƒÂ¡Ã‚ÂºÃ‚Â¡i, tÃƒÂ¡Ã‚ÂºÃ‚Â¡o mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi
                if (!authorId) {
                    console.log('TÃƒÂ¡Ã‚ÂºÃ‚Â¡o tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi:', formAuthor);
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
                        console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ TÃƒÂ¡Ã‚ÂºÃ‚Â¡o tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng, ID:', authorId);
                    } else {
                        const errorData = await newAuthorRes.json().catch(() => ({}));
                        console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i tÃƒÂ¡Ã‚ÂºÃ‚Â¡o tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£:', errorData);
                        throw new Error('KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒÂ¡Ã‚ÂºÃ‚Â¡o tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£');
                    }
                } else {
                    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ SÃƒÂ¡Ã‚Â»Ã‚Â­ dÃƒÂ¡Ã‚Â»Ã‚Â¥ng tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ cÃƒÆ’Ã‚Â³ sÃƒÂ¡Ã‚ÂºÃ‚Âµn, ID:', authorId);
                }
            }

            // 2. TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Title Book
            let titleBookId: string;
            console.log('TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Title Book:', formBookName);
            
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
                throw new Error(`KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒÂ¡Ã‚ÂºÃ‚Â¡o tÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch: ${titleRes.status}`);
            }

            const titleData = await titleRes.json();
            titleBookId = titleData._id || titleData.id;
            console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Title Book thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng, ID:', titleBookId);

            // 3. TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Title-Author (liÃƒÆ’Ã‚Âªn kÃƒÂ¡Ã‚ÂºÃ‚Â¿t tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi sÃƒÆ’Ã‚Â¡ch)
            if (authorId) {
                console.log('TÃƒÂ¡Ã‚ÂºÃ‚Â¡o liÃƒÆ’Ã‚Âªn kÃƒÂ¡Ã‚ÂºÃ‚Â¿t Title-Author:', { titleId: titleBookId, authorId });
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
                    console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i tÃƒÂ¡Ã‚ÂºÃ‚Â¡o liÃƒÆ’Ã‚Âªn kÃƒÂ¡Ã‚ÂºÃ‚Â¿t tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£:', errorData);
                    throw new Error('KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ liÃƒÆ’Ã‚Âªn kÃƒÂ¡Ã‚ÂºÃ‚Â¿t tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi sÃƒÆ’Ã‚Â¡ch');
                } else {
                    const linkData = await titleAuthorRes.json();
                    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ LiÃƒÆ’Ã‚Âªn kÃƒÂ¡Ã‚ÂºÃ‚Â¿t tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng:', linkData);
                }
            }

            // 4. TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Book (Edition)
            console.log('TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Book (Edition)');
            const bookRes = await fetch(`${baseUrl}/books`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    titleId: titleBookId,
                    publishYear,
                    publisher: formPublisher || 'KhÃƒÆ’Ã‚Â´ng xÃƒÆ’Ã‚Â¡c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh',
                    importDate: formDateReceived,
                    price: formPrice,
                })
            });

            if (!bookRes.ok) {
                const errorData = await bookRes.json().catch(() => ({}));
                console.error('Book creation response:', errorData);
                throw new Error(`KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒÂ¡Ã‚ÂºÃ‚Â¡o bÃƒÂ¡Ã‚ÂºÃ‚Â£n sÃƒÆ’Ã‚Â¡ch: ${bookRes.status}`);
            }

            const bookData = await bookRes.json();
            const bookId = bookData._id || bookData.id;

            // 5. TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Book Copy (theo sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng)
            console.log(`TÃƒÂ¡Ã‚ÂºÃ‚Â¡o ${formQuantity} bÃƒÂ¡Ã‚ÂºÃ‚Â£n sao sÃƒÆ’Ã‚Â¡ch...`);
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
                             throw new Error(`LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i tÃƒÂ¡Ã‚ÂºÃ‚Â¡o bÃƒÂ¡Ã‚ÂºÃ‚Â£n sao ${i+1}: ${err.message || res.status}`);
                         }
                         return res.json();
                    })
                );
            }

            await Promise.all(copyPromises);
            console.log(`ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ TÃƒÂ¡Ã‚ÂºÃ‚Â¡o ${formQuantity} Book Copy thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng`);
            showToast('LÃƒâ€ Ã‚Â°u sÃƒÆ’Ã‚Â¡ch thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng!', 'success');

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
            showToast(`LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i: ${error instanceof Error ? error.message : 'KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ lÃƒâ€ Ã‚Â°u sÃƒÆ’Ã‚Â¡ch'}`, 'error');
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
            
            // KiÃƒÂ¡Ã‚Â»Ã†â€™m tra Ãƒâ€žÃ¢â‚¬ËœiÃƒÂ¡Ã‚Â»Ã‚Âu kiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n xÃƒÆ’Ã‚Â³a
            const checkRes = await fetch(`${baseUrl}/title-books/${book.id}/check-delete`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!checkRes.ok) {
                showToast('KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ kiÃƒÂ¡Ã‚Â»Ã†â€™m tra Ãƒâ€žÃ¢â‚¬ËœiÃƒÂ¡Ã‚Â»Ã‚Âu kiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n xÃƒÆ’Ã‚Â³a', 'error');
                return;
            }
            
            const checkData = await checkRes.json();
            
            // NÃƒÂ¡Ã‚ÂºÃ‚Â¿u cÃƒÆ’Ã‚Â³ sÃƒÆ’Ã‚Â¡ch Ãƒâ€žÃ¢â‚¬Ëœang mÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£n, khÃƒÆ’Ã‚Â´ng cho xÃƒÆ’Ã‚Â³a
            if (!checkData.canDelete) {
                showToast(`KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ xÃƒÆ’Ã‚Â³a: CÃƒÆ’Ã‚Â²n ${checkData.borrowedCount} cuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœn sÃƒÆ’Ã‚Â¡ch Ãƒâ€žÃ¢â‚¬Ëœang Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c mÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£n. Vui lÃƒÆ’Ã‚Â²ng Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â£i trÃƒÂ¡Ã‚ÂºÃ‚Â£ hÃƒÂ¡Ã‚ÂºÃ‚Â¿t sÃƒÆ’Ã‚Â¡ch trÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc khi xÃƒÆ’Ã‚Â³a.`, 'error');
                return;
            }
            
            // Cho phÃƒÆ’Ã‚Â©p xÃƒÆ’Ã‚Â³a - luÃƒÆ’Ã‚Â´n xÃƒÆ’Ã‚Â³a mÃƒÂ¡Ã‚Â»Ã‚Âm
            setDeletingBookId(book.id);
            setIsDeleteDialogOpen(true);
        } catch (error) {
            console.error('Error checking delete conditions:', error);
            showToast('LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i khi kiÃƒÂ¡Ã‚Â»Ã†â€™m tra Ãƒâ€žÃ¢â‚¬ËœiÃƒÂ¡Ã‚Â»Ã‚Âu kiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n xÃƒÆ’Ã‚Â³a', 'error');
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
                throw new Error('KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ xÃƒÆ’Ã‚Â³a sÃƒÆ’Ã‚Â¡ch');
            }
            
            showToast('Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ xÃƒÆ’Ã‚Â³a sÃƒÆ’Ã‚Â¡ch thÃƒÆ’Ã‚Â nh cÃƒÆ’Ã‚Â´ng', 'success');
            setIsDeleteDialogOpen(false);
            setDeletingBookId(null);
            
            // Reload data
            window.location.reload();
        } catch (error) {
            console.error('Error deleting book:', error);
            showToast('LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i khi xÃƒÆ’Ã‚Â³a sÃƒÆ’Ã‚Â¡ch', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">QuÃƒÂ¡Ã‚ÂºÃ‚Â£n lÃƒÆ’Ã‚Â½ SÃƒÆ’Ã‚Â¡ch</h1>
                    <p className="text-sm text-slate-500">TiÃƒÂ¡Ã‚ÂºÃ‚Â¿p nhÃƒÂ¡Ã‚ÂºÃ‚Â­n sÃƒÆ’Ã‚Â¡ch mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi (BM2) vÃƒÆ’Ã‚Â  tra cÃƒÂ¡Ã‚Â»Ã‚Â©u thÃƒÆ’Ã‚Â´ng tin (BM3).</p>
                </div>
                <div className="flex gap-2">
                    <ExcelImporter 
                        buttonLabel="NhÃƒÂ¡Ã‚ÂºÃ‚Â­p Excel" 
                        onImport={handleBulkImport}
                        templateHeaders={['Title', 'Author', 'Category', 'Price', 'Quantity']}
                    />
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> TiÃƒÂ¡Ã‚ÂºÃ‚Â¿p nhÃƒÂ¡Ã‚ÂºÃ‚Â­n sÃƒÆ’Ã‚Â¡ch
                    </Button>
                </div>
            </div>

            {/* --- BÃƒÂ¡Ã‚Â»Ã‹Å“ LÃƒÂ¡Ã‚Â»Ã…â€™C TRA CÃƒÂ¡Ã‚Â»Ã‚Â¨U (BM3) --- */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        {/* Row 1: Search Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* TÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">TÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch</label>
                                <SearchableInput
                                    options={suggestedTitles}
                                    value={filterTitle}
                                    onChange={setFilterTitle}
                                    placeholder="NhÃƒÂ¡Ã‚ÂºÃ‚Â­p tÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch..."
                                />
                            </div>
                            
                            {/* TÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">TÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£</label>
                                <SearchableInput
                                    options={suggestedAuthors}
                                    value={filterAuthor}
                                    onChange={setFilterAuthor}
                                    placeholder="NhÃƒÂ¡Ã‚ÂºÃ‚Â­p tÃƒÆ’Ã‚Âªn tÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£..."
                                />
                            </div>
                            
                            {/* NhÃƒÆ’Ã‚Â  xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">NhÃƒÆ’Ã‚Â  xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n</label>
                                <SearchableInput
                                    options={suggestedPublishers}
                                    value={filterPublisher}
                                    onChange={setFilterPublisher}
                                    placeholder="NhÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÆ’Ã‚Â  xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n..."
                                />
                            </div>
                        </div>
                        
                        {/* Row 2: Category + Clear Button */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2">
                                <label className="text-xs font-medium text-slate-600 whitespace-nowrap">ThÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i:</label>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="ThÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">TÃƒÂ¡Ã‚ÂºÃ‚Â¥t cÃƒÂ¡Ã‚ÂºÃ‚Â£ thÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i</SelectItem>
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
                                <X className="w-4 h-4 mr-1" /> XÃƒÆ’Ã‚Â³a bÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ lÃƒÂ¡Ã‚Â»Ã‚Âc
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- DANH SÃƒÆ’Ã‚ÂCH SÃƒÆ’Ã‚ÂCH (BM3) --- */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800">Kho sÃƒÆ’Ã‚Â¡ch hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n cÃƒÆ’Ã‚Â³</CardTitle>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">TÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢ng: {filteredBooks.length} cuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœn</div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                    <TableHead>TiÃƒÆ’Ã‚Âªu Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã‚Â</TableHead>
                                    <TableHead>ThÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i</TableHead>
                                    <TableHead>TÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£</TableHead>
                                    <TableHead>NÃƒâ€žÃ†â€™m XB</TableHead>
                                    <TableHead className="truncate max-w-[120px]">NXB</TableHead>
                                    <TableHead className="text-center">TÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢ng sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ</TableHead>
                                    <TableHead className="text-center">CÃƒÆ’Ã‚Â²n trÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœng</TableHead>
                                    <TableHead className="text-center">Ãƒâ€žÃ‚Âang mÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£n</TableHead>
                                    <TableHead className="text-center">Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ mÃƒÂ¡Ã‚ÂºÃ‚Â¥t</TableHead>
                                    <TableHead className="text-right">Thao tÃƒÆ’Ã‚Â¡c</TableHead>
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
                                                <DropdownMenuLabel>TÃƒÆ’Ã‚Â¡c vÃƒÂ¡Ã‚Â»Ã‚Â¥</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(book)}>
                                                    <Edit className="mr-2 h-4 w-4" /> SÃƒÂ¡Ã‚Â»Ã‚Â­a thÃƒÆ’Ã‚Â´ng tin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(book)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> XÃƒÆ’Ã‚Â³a sÃƒÆ’Ã‚Â¡ch
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
                        <DialogTitle>{editingBookId ? "CÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t ThÃƒÆ’Ã‚Â´ng tin SÃƒÆ’Ã‚Â¡ch" : "TiÃƒÂ¡Ã‚ÂºÃ‚Â¿p nhÃƒÂ¡Ã‚ÂºÃ‚Â­n sÃƒÆ’Ã‚Â¡ch mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi (BM2)"}</DialogTitle>
                        <DialogDescription>
                            {editingBookId ? "ChÃƒÂ¡Ã‚Â»Ã¢â‚¬Â°nh sÃƒÂ¡Ã‚Â»Ã‚Â­a thÃƒÆ’Ã‚Â´ng tin chi tiÃƒÂ¡Ã‚ÂºÃ‚Â¿t." : "NhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Â´ng tin chi tiÃƒÂ¡Ã‚ÂºÃ‚Â¿t cÃƒÂ¡Ã‚Â»Ã‚Â§a sÃƒÆ’Ã‚Â¡ch. LÃƒâ€ Ã‚Â°u ÃƒÆ’Ã‚Â½ quy Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh vÃƒÂ¡Ã‚Â»Ã‚Â nÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n."}
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
                                NhÃƒÂ¡Ã‚ÂºÃ‚Â­p Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚ÂºÃ‚Â§u SÃƒÆ’Ã‚Â¡ch MÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputMode === 'existing' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setInputMode('existing')}
                            >
                                NhÃƒÂ¡Ã‚ÂºÃ‚Â­p ThÃƒÆ’Ã‚Âªm BÃƒÂ¡Ã‚ÂºÃ‚Â£n Sao
                            </button>
                        </div>
                        )}

                        {/* --- FORM CHÃƒÂ¡Ã‚ÂºÃ‚Â¾ Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã‹Å“: SÃƒÆ’Ã‚ÂCH CÃƒÆ’Ã¢â‚¬Å“ SÃƒÂ¡Ã‚ÂºÃ‚Â´N --- */}
                        {inputMode === 'existing' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700 mb-2">
                                    <span className="font-semibold">ChÃƒÂ¡Ã‚ÂºÃ‚Â¿ Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ nÃƒÆ’Ã‚Â y dÃƒÆ’Ã‚Â¹ng Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™:</span> NhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Âªm sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng cho mÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢t cuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœn sÃƒÆ’Ã‚Â¡ch (ÃƒÂ¡Ã‚ÂºÃ‚Â¥n bÃƒÂ¡Ã‚ÂºÃ‚Â£n) Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ cÃƒÆ’Ã‚Â³ sÃƒÂ¡Ã‚ÂºÃ‚Âµn trong kho.
                                </div>
                                <div className="space-y-2">
                                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">ChÃƒÂ¡Ã‚Â»Ã‚Ân sÃƒÆ’Ã‚Â¡ch cÃƒÆ’Ã‚Â³ sÃƒÂ¡Ã‚ÂºÃ‚Âµn</Label>
                                    <SearchableInput
                                        id="existingBook"
                                        options={selectableBooks}
                                        value={selectedBookLabel}
                                        onChange={setSelectedBookLabel}
                                        placeholder="TÃƒÆ’Ã‚Â¬m theo TÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch - NXB - NÃƒâ€žÃ†â€™m XB..."
                                    />
                                    <p className="text-xs text-slate-500">GÃƒÆ’Ã‚Âµ tÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒÆ’Ã‚Â¬m kiÃƒÂ¡Ã‚ÂºÃ‚Â¿m nhanh.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantityExisting" className="after:content-['*'] after:ml-0.5 after:text-red-500">SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Âªm</Label>
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

                        {/* --- FORM CHÃƒÂ¡Ã‚ÂºÃ‚Â¾ Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã‹Å“: SÃƒÆ’Ã‚ÂCH MÃƒÂ¡Ã‚Â»Ã…Â¡I (Form cÃƒâ€¦Ã‚Â©) --- */}
                        {inputMode === 'new' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                        {/* HÃƒÆ’Ã‚Â ng 1: TÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch + ThÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="bookName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    TÃƒÆ’Ã‚Âªn sÃƒÆ’Ã‚Â¡ch
                                </Label>
                                <Input 
                                    id="bookName" 
                                    placeholder="VD: NhÃƒÂ¡Ã‚ÂºÃ‚Â­p mÃƒÆ’Ã‚Â´n CNPM"
                                    value={formBookName}
                                    onChange={(e) => setFormBookName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">ThÃƒÂ¡Ã‚Â»Ã†â€™ loÃƒÂ¡Ã‚ÂºÃ‚Â¡i</Label>
                                <SearchableInput
                                    id="category"
                                    options={suggestedCategories}
                                    value={formCategory}
                                    onChange={setFormCategory}
                                    placeholder="ChÃƒÂ¡Ã‚Â»Ã‚Ân/NhÃƒÂ¡Ã‚ÂºÃ‚Â­p"
                                />
                            </div>
                        </div>

                        {/* HÃƒÆ’Ã‚Â ng 2: TÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£ + NÃƒâ€žÃ†â€™m XB */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="author">TÃƒÆ’Ã‚Â¡c giÃƒÂ¡Ã‚ÂºÃ‚Â£</Label>
                                <SearchableInput
                                    id="author"
                                    options={suggestedAuthors}
                                    value={formAuthor}
                                    onChange={setFormAuthor}
                                    placeholder="NhÃƒÂ¡Ã‚ÂºÃ‚Â­p hoÃƒÂ¡Ã‚ÂºÃ‚Â·c chÃƒÂ¡Ã‚Â»Ã‚Ân..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="publishYear">NÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n</Label>
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
                                    QÃƒâ€žÃ‚Â2: ChÃƒÂ¡Ã‚Â»Ã¢â‚¬Â° nhÃƒÂ¡Ã‚ÂºÃ‚Â­n sÃƒÆ’Ã‚Â¡ch tÃƒÂ¡Ã‚Â»Ã‚Â« nÃƒâ€žÃ†â€™m {minPublishYear} trÃƒÂ¡Ã‚Â»Ã…Â¸ lÃƒÂ¡Ã‚ÂºÃ‚Â¡i Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â¢y.
                                </div>
                            </div>
                        </div>

                        {/* HÃƒÆ’Ã‚Â ng 3: NXB + NgÃƒÆ’Ã‚Â y nhÃƒÂ¡Ã‚ÂºÃ‚Â­p */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="publisher">NhÃƒÆ’Ã‚Â  xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n</Label>
                                <Input 
                                    id="publisher" 
                                    placeholder="VD: NXB TrÃƒÂ¡Ã‚ÂºÃ‚Â»"
                                    value={formPublisher}
                                    onChange={(e) => setFormPublisher(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateReceived" className="after:content-['*'] after:ml-0.5 after:text-red-500">NgÃƒÆ’Ã‚Â y nhÃƒÂ¡Ã‚ÂºÃ‚Â­p</Label>
                                <Input
                                    id="dateReceived"
                                    type="date"
                                    value={formDateReceived}
                                    onChange={(e) => setFormDateReceived(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* HÃƒÆ’Ã‚Â ng 4: TrÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ giÃƒÆ’Ã‚Â¡ + SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={editingBookId ? "col-span-2 space-y-2" : "space-y-2"}>
                                <Label htmlFor="price" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    TrÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ giÃƒÆ’Ã‚Â¡
                                </Label>

                                <CurrencyInput
                                    id="price"
                                    placeholder="0"
                                    value={formPrice}
                                    onChange={setFormPrice}
                                    max={100000000} // GiÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi hÃƒÂ¡Ã‚ÂºÃ‚Â¡n max lÃƒÆ’Ã‚Â  100 triÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡u
                                />

                                {/* HiÃƒÂ¡Ã‚Â»Ã†â€™n thÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ Helper text */}
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-slate-400">
                                        TÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœi Ãƒâ€žÃ¢â‚¬Ëœa: 100.000.000 VNÃƒâ€žÃ‚Â
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
                                    SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng
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
                            HÃƒÂ¡Ã‚Â»Ã‚Â§y bÃƒÂ¡Ã‚Â»Ã‚Â
                        </Button>
                        <Button 
                            onClick={handlePreSave} 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isSaving}
                        >
                            {isSaving ? (editingBookId ? 'Ãƒâ€žÃ‚Âang cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t...' : 'Ãƒâ€žÃ‚Âang lÃƒâ€ Ã‚Â°u...') : (editingBookId ? 'CÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t' : 'LÃƒâ€ Ã‚Â°u thÃƒÆ’Ã‚Â´ng tin')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CONFIRMATION DIALOG */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>XÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n lÃƒâ€ Ã‚Â°u</DialogTitle>
                        <DialogDescription>
                            BÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÆ’Ã‚Â³ chÃƒÂ¡Ã‚ÂºÃ‚Â¯c chÃƒÂ¡Ã‚ÂºÃ‚Â¯n muÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœn lÃƒâ€ Ã‚Â°u thÃƒÆ’Ã‚Â´ng tin nÃƒÆ’Ã‚Â y vÃƒÆ’Ã‚Â o hÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡ thÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœng?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                            HÃƒÂ¡Ã‚Â»Ã‚Â§y bÃƒÂ¡Ã‚Â»Ã‚Â
                        </Button>
                        <Button onClick={handleConfirmSave} className="bg-blue-600 hover:bg-blue-700">
                            XÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="XÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n xÃƒÆ’Ã‚Â³a sÃƒÆ’Ã‚Â¡ch"
                description="BÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÆ’Ã‚Â³ chÃƒÂ¡Ã‚ÂºÃ‚Â¯c chÃƒÂ¡Ã‚ÂºÃ‚Â¯n muÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœn xÃƒÆ’Ã‚Â³a sÃƒÆ’Ã‚Â¡ch nÃƒÆ’Ã‚Â y? HÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡ thÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœng sÃƒÂ¡Ã‚ÂºÃ‚Â½ thÃƒÂ¡Ã‚Â»Ã‚Â±c hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n xÃƒÆ’Ã‚Â³a."
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    );
}