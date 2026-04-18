'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, BookType, Users, UserCog, Save,
    Search, FileText, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Cookies from 'js-cookie';

// --- TYPES ---

type Category = { _id?: string; categoryName: string; };
type Author = { _id?: string; authorName: string; };
type UserType = { _id?: string; readerTypeName: string; maxBorrowLimit: number; cardValidityMonths: number };

export default function ReferencesPage() {
    const [activeTab, setActiveTab] = useState("categories");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // ================= STATE QUẢN LÝ THỂ LOẠI (CATEGORIES) =================
    const [categories, setCategories] = useState<Category[]>([]);
    const [catLoading, setCatLoading] = useState(false);
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [catForm, setCatForm] = useState<Category>({ categoryName: "" });

    const fetchCategories = async () => {
        setCatLoading(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setCatLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'categories') fetchCategories();
    }, [activeTab]);

    const handleEditCat = (cat: Category) => {
        setEditingCat(cat);
        setCatForm(cat);
        setCatDialogOpen(true);
    };
    const handleAddCat = () => {
        setEditingCat(null);
        setCatForm({ categoryName: "" });
        setCatDialogOpen(true);
    };
    const handleSaveCat = async () => {
        try {
            const token = Cookies.get('access_token');
            
            // Kiểm tra trùng lặp CHỈ khi TẠO MỚI
            if (!editingCat) {
                const duplicate = categories.find(c => 
                    c.categoryName.toLowerCase() === catForm.categoryName.trim().toLowerCase()
                );
                
                if (duplicate) {
                    toast.warning("Cảnh báo", { 
                        description: "Thể loại này đã tồn tại. Vui lòng nhập tên khác.", 
                        duration: 3000 
                    });
                    return;
                }
            }
            
            const method = editingCat ? 'PATCH' : 'POST';
            const url = editingCat ? `${API_URL}/categories/${editingCat._id}` : `${API_URL}/categories`;
            
            const payload = {
                categoryName: catForm.categoryName
            };

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save category');

            toast.success("Thành công", { description: "Đã lưu thông tin thể loại.", duration: 3000 });
            setCatDialogOpen(false);
            fetchCategories();
        } catch (error) {
            toast.error("Lỗi", { description: "Không thể lưu thể loại.", duration: 3000 });
        }
    };
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });

    const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
        setConfirmConfig({
            isOpen: true,
            title,
            description,
            onConfirm,
        });
    };

    const handleDeleteCat = async (id: string) => {
        // Kiểm tra xem có sách nào đang dùng thể loại này không
        try {
            const token = Cookies.get('access_token');
            const checkRes = await fetch(`${API_URL}/title-books`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (checkRes.ok) {
                const allBooks = await checkRes.json();
                // Filter ở client-side để tìm những sách có categoryId khớp
                const booksUsingCategory = Array.isArray(allBooks) 
                    ? allBooks.filter((book: any) => book.categoryId === id || book.categoryId?._id === id)
                    : [];
                    
                if (booksUsingCategory.length > 0) {
                    toast.error("Không thể xóa", { 
                        description: `Thể loại này đang được sử dụng bởi ${booksUsingCategory.length} đầu sách. Vui lòng xóa hoặc chuyển thể loại của các sách trước.`,
                        duration: 3000
                    });
                    return;
                }
            }
        } catch (error) {
            console.error("Error checking category usage:", error);
        }

        triggerConfirm("Xóa thể loại này?", "Hành động này không thể hoàn tác.", async () => {
            try {
                const token = Cookies.get('access_token');
                const res = await fetch(`${API_URL}/categories/${id}`, { 
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to delete');
                toast.success("Thành công", { description: "Đã xóa thể loại.", duration: 3000 });
                fetchCategories();
            } catch (error) {
                toast.error("Lỗi", { description: "Không thể xóa thể loại.", duration: 3000 });
            } finally {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // ================= STATE QUẢN LÝ TÁC GIẢ (AUTHORS) =================
    const [authors, setAuthors] = useState<Author[]>([]);
    const [authLoading, setAuthLoading] = useState(false);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [editingAuth, setEditingAuth] = useState<Author | null>(null);
    const [authForm, setAuthForm] = useState<Author>({ authorName: "" });

    const fetchAuthors = async () => {
        setAuthLoading(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/authors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAuthors(data);
            }
        } catch (error) {
            console.error("Failed to fetch authors", error);
        } finally {
            setAuthLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'authors') fetchAuthors();
    }, [activeTab]);

    const handleEditAuth = (auth: Author) => {
        setEditingAuth(auth);
        setAuthForm(auth);
        setAuthDialogOpen(true);
    };
    const handleAddAuth = () => {
        setEditingAuth(null);
        setAuthForm({ authorName: "" });
        setAuthDialogOpen(true);
    };
const handleSaveAuth = async () => {
    try {
        const token = Cookies.get('access_token');
        
        // Kiểm tra trùng lặp CHỈ khi TẠO MỚI
        if (!editingAuth) {
            const duplicate = authors.find(a => 
                a.authorName.toLowerCase() === authForm.authorName.trim().toLowerCase()
            );
            
            if (duplicate) {
                toast.warning("Cảnh báo", { 
                    description: "Tác giả này đã tồn tại. Vui lòng nhập tên khác.", 
                    duration: 3000 
                });
                return;
            }
        }
        
        const method = editingAuth ? 'PATCH' : 'POST';
        const url = editingAuth ? `${API_URL}/authors/${editingAuth._id}` : `${API_URL}/authors`;
        
        const payload = {
            authorName: authForm.authorName
        };

        const res = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to save author');

        toast.success("Thành công", { description: "Đã lưu thông tin tác giả.", duration: 3000 });
        setAuthDialogOpen(false);
        fetchAuthors();
    } catch (error) {
        toast.error("Lỗi", { description: "Không thể lưu tác giả.", duration: 3000 });
    }
};
    const handleDeleteAuth = async (id: string) => {
        // Kiểm tra xem có sách nào đang liên kết với tác giả này không
        try {
            const token = Cookies.get('access_token');
            const checkRes = await fetch(`${API_URL}/title-authors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (checkRes.ok) {
                const allTitleAuthors = await checkRes.json();
                // Filter ở client-side để tìm những liên kết có authorId khớp
                const linksUsingAuthor = Array.isArray(allTitleAuthors)
                    ? allTitleAuthors.filter((ta: any) => ta.authorId === id || ta.authorId?._id === id)
                    : [];
                    
                if (linksUsingAuthor.length > 0) {
                    toast.error("Không thể xóa", { 
                        description: `Tác giả này đang được liên kết với ${linksUsingAuthor.length} đầu sách. Vui lòng xóa liên kết trước.`,
                        duration: 3000
                    });
                    return;
                }
            }
        } catch (error) {
            console.error("Error checking author usage:", error);
        }

        triggerConfirm("Xóa tác giả này?", "Hành động này không thể hoàn tác.", async () => {
            try {
                const token = Cookies.get('access_token');
                const res = await fetch(`${API_URL}/authors/${id}`, { 
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to delete');
                toast.success("Thành công", { description: "Đã xóa tác giả.", duration: 3000 });
                fetchAuthors();
            } catch (error) {
                toast.error("Lỗi", { description: "Không thể xóa tác giả.", duration: 3000 });
            } finally {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // ================= STATE QUẢN LÝ LOẠI ĐỘC GIẢ (USER TYPES) =================
    const [userTypes, setUserTypes] = useState<UserType[]>([]);
    const [typeLoading, setTypeLoading] = useState(false);
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<UserType | null>(null);
    const [typeForm, setTypeForm] = useState<UserType>({ readerTypeName: "", maxBorrowLimit: 5, cardValidityMonths: 6 });

    const fetchUserTypes = async () => {
        setTypeLoading(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/reader-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserTypes(data);
            }
        } catch (error) {
            console.error("Failed to fetch reader types", error);
        } finally {
            setTypeLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'usertypes') fetchUserTypes();
    }, [activeTab]);

    const handleEditType = (type: UserType) => {
        setEditingType(type);
        setTypeForm(type);
        setTypeDialogOpen(true);
    };
    const handleAddType = () => {
        setEditingType(null);
        setTypeForm({ readerTypeName: "", maxBorrowLimit: 5, cardValidityMonths: 6 });
        setTypeDialogOpen(true);
    };
const handleSaveType = async () => {
    try {
        const token = Cookies.get('access_token');
        
        // Kiểm tra trùng lặp CHỈ khi TẠO MỚI
        if (!editingType) {
            const duplicate = userTypes.find(t => 
                t.readerTypeName.toLowerCase() === typeForm.readerTypeName.trim().toLowerCase()
            );
            
            if (duplicate) {
                toast.warning("Cảnh báo", { 
                    description: "Loại độc giả này đã tồn tại. Vui lòng nhập tên khác.", 
                    duration: 3000 
                });
                return;
            }
        }
        
        const method = editingType ? 'PATCH' : 'POST';
        const url = editingType ? `${API_URL}/reader-types/${editingType._id}` : `${API_URL}/reader-types`;
        
        const payload = {
            readerTypeName: typeForm.readerTypeName,
            maxBorrowLimit: typeForm.maxBorrowLimit,
            cardValidityMonths: typeForm.cardValidityMonths
        };

        const res = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to save reader type');

        toast.success("Thành công", { description: "Đã lưu loại độc giả.", duration: 3000 });
        setTypeDialogOpen(false);
        fetchUserTypes();
    } catch (error) {
        toast.error("Lỗi", { description: "Không thể lưu loại độc giả.", duration: 3000 });
    }
};
    const handleDeleteType = async (id: string) => {
        // Kiểm tra xem có độc giả nào đang dùng loại độc giả này không
        try {
            const token = Cookies.get('access_token');
            const checkRes = await fetch(`${API_URL}/readers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (checkRes.ok) {
                const allReaders = await checkRes.json();
                // Filter ở client-side để tìm những độc giả có readerTypeId khớp
                const readersUsingType = Array.isArray(allReaders)
                    ? allReaders.filter((reader: any) => reader.readerTypeId === id || reader.readerTypeId?._id === id)
                    : [];
                    
                if (readersUsingType.length > 0) {
                    toast.error("Không thể xóa", { 
                        description: `Loại độc giả này đang được sử dụng bởi ${readersUsingType.length} độc giả. Vui lòng chuyển loại độc giả hoặc xóa độc giả trước.`,
                        duration: 3000
                    });
                    return;
                }
            }
        } catch (error) {
            console.error("Error checking reader type usage:", error);
        }

         triggerConfirm("Xóa loại độc giả này?", "Hành động này không thể hoàn tác.", async () => {
             try {
                const token = Cookies.get('access_token');
                const res = await fetch(`${API_URL}/reader-types/${id}`, { 
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to delete');
                toast.success("Thành công", { description: "Đã xóa loại độc giả.", duration: 3000 });
                fetchUserTypes();
            } catch (error) {
                toast.error("Lỗi", { description: "Không thể xóa loại độc giả.", duration: 3000 });
            } finally {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
         });
    };

    // ================= RENDER UI =================
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dữ liệu tham chiếu</h1>
                <p className="text-sm text-slate-500">Quản lý các danh mục dùng chung cho toàn hệ thống.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-6 bg-slate-100 p-1">
                    <TabsTrigger value="categories" className="gap-2"><BookType className="w-4 h-4" /> Thể loại Sách</TabsTrigger>
                    <TabsTrigger value="authors" className="gap-2"><Users className="w-4 h-4" /> Tác giả</TabsTrigger>
                    <TabsTrigger value="usertypes" className="gap-2"><UserCog className="w-4 h-4" /> Loại Độc giả</TabsTrigger>
                </TabsList>

                {/* ---------------- TAB 1: THỂ LOẠI SÁCH ---------------- */}
                <TabsContent value="categories">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Danh sách Thể loại</CardTitle>
                                <CardDescription>Định nghĩa các mã phân loại sách (A, B, C...).</CardDescription>
                            </div>
                            <Button onClick={handleAddCat} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" /> Thêm mới
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {catLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div> : (
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Tên thể loại</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((cat) => (
                                        <TableRow key={cat._id}>
                                            <TableCell className="font-bold">{cat.categoryName}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => handleEditCat(cat)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDeleteCat(cat._id!)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ---------------- TAB 2: TÁC GIẢ ---------------- */}
                <TabsContent value="authors">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Danh sách Tác giả</CardTitle>
                                <CardDescription>Quản lý hồ sơ các tác giả có sách trong thư viện.</CardDescription>
                            </div>
                            <Button onClick={handleAddAuth} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" /> Thêm tác giả
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {authLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div> : (
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Tên Tác giả</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {authors.map((author) => (
                                        <TableRow key={author._id}>
                                            <TableCell className="font-medium">{author.authorName}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => handleEditAuth(author)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDeleteAuth(author._id!)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ---------------- TAB 3: LOẠI ĐỘC GIẢ ---------------- */}
                <TabsContent value="usertypes">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Phân loại Độc giả</CardTitle>
                                <CardDescription>Cấu hình quyền hạn (sách mượn, hạn thẻ) cho từng nhóm.</CardDescription>
                            </div>
                            <Button onClick={handleAddType} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" /> Thêm mới
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {typeLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div> : (
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Tên nhóm</TableHead>
                                        <TableHead>Sách mượn tối đa</TableHead>
                                        <TableHead>Thời hạn mượn (tháng)</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userTypes.map((type) => (
                                        <TableRow key={type._id}>
                                            <TableCell className="font-bold">{type.readerTypeName}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                    {type.maxBorrowLimit} cuốn
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{type.cardValidityMonths} tháng</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => handleEditType(type)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDeleteType(type._id!)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ================= DIALOGS ================= */}

                {/* 1. Dialog Thể Loại */}
                <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCat ? "Cập nhật Thể loại" : "Thêm Thể loại mới"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Tên</Label>
                                <Input value={catForm.categoryName} onChange={(e) => setCatForm({ ...catForm, categoryName: e.target.value })} className="col-span-3" placeholder="VD: Sách giáo khoa" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveCat}>Lưu thay đổi</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 2. Dialog Tác Giả */}
                <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingAuth ? "Cập nhật Tác giả" : "Thêm Tác giả mới"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Họ tên</Label>
                                <Input value={authForm.authorName} onChange={(e) => setAuthForm({ ...authForm, authorName: e.target.value })} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveAuth}>Lưu thay đổi</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 3. Dialog Loại Độc Giả */}
                <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingType ? "Cập nhật Loại độc giả" : "Thêm Loại độc giả mới"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Tên nhóm</Label>
                                <Input value={typeForm.readerTypeName} onChange={(e) => setTypeForm({ ...typeForm, readerTypeName: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Max Sách</Label>
                                <Input 
                                    type="number" 
                                    min="1"
                                    value={typeForm.maxBorrowLimit} 
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > 0 && Number.isInteger(val)) {
                                            setTypeForm({ ...typeForm, maxBorrowLimit: val });
                                        }
                                    }}
                                    onInput={(e) => {
                                        const input = e.currentTarget;
                                        input.value = input.value.replace(/[.,\-e]/g, '');
                                    }}
                                    className="col-span-3" 
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Hạn mượn</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        min="1"
                                        value={typeForm.cardValidityMonths} 
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            if (val > 0 && Number.isInteger(val)) {
                                                setTypeForm({ ...typeForm, cardValidityMonths: val });
                                            }
                                        }}
                                        onInput={(e) => {
                                            const input = e.currentTarget;
                                            input.value = input.value.replace(/[.,\-e]/g, '');
                                        }}
                                    />
                                    <span className="text-sm text-slate-500 whitespace-nowrap">tháng</span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveType}>Lưu thay đổi</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* 4. Global Confirm Dialog */}
                <ConfirmDialog
                    isOpen={confirmConfig.isOpen}
                    onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, isOpen: open }))}
                    title={confirmConfig.title}
                    description={confirmConfig.description}
                    onConfirm={confirmConfig.onConfirm}
                    variant="destructive"
                />
            </Tabs>

        </div>
    );
}
