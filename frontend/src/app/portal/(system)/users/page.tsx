'use client';

import { useState, useEffect } from 'react';
import {
    Search, Plus, MoreHorizontal, Shield, User,
    Lock, Unlock, RotateCcw, Trash2, Edit, Save, MapPin, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog"; // Import ConfirmDialog
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Cookies from 'js-cookie';
import { useToast } from '@/components/ui/ToastContext';

// --- TYPE DEFINITION (Khớp với Schema Backend) ---
interface UserAccount {
    _id?: string; // MongoDB ID thường là _id
    id?: string;  // Hoặc id tùy backend trả về
    name?: string; // Backend có thể trả về fullName
    fullName?: string;
    email: string;
    phoneNumber?: string; // Backend dùng phoneNumber thay vì phone
    phone?: string;
    // address?: string; // Tạm thời bỏ
    role: 'ADMIN' | 'LIBRARIAN';
    status: 'active' | 'locked' | 'pending';
    isVerified?: boolean;
    lastLogin?: string;
}

interface BackendUser {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    // address?: string; // Tạm thời bỏ
    role: 'ADMIN' | 'LIBRARIAN';
    status: 'active' | 'locked' | 'pending';
    isVerified?: boolean;
    lastLogin?: string;
}

interface SaveUserPayload {
    fullName: string;
    email: string;
    phoneNumber: string;
    // address: string; // Tạm thời bỏ
    role: 'ADMIN' | 'LIBRARIAN';
    password?: string;
    status?: 'active' | 'locked' | 'pending';
}

export default function UsersPage() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // State quản lý Dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // State cho Form
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        // address: "",
        role: "LIBRARIAN" as "ADMIN" | "LIBRARIAN",
        password: "" // Thêm password cho trường hợp tạo mới
    });

    // --- 1. FETCH DATA (GET) ---
    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const token = Cookies.get('access_token');
            console.log("Token sent:", token);

            if (!token) {
                console.error("No access token found. Redirecting to login.");
                // window.location.href = '/auth/login';
                return;
            }

            const res = await fetch(`${API_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }); // API endpoint

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Fetch error:", res.status, errorText);
                if (res.status === 401) {
                    showToast("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", 'error');
                    // window.location.href = '/auth/login'; // Optional: Redirect
                }
                throw new Error(`Failed to fetch: ${res.status} ${errorText}`);
            }
            const data = await res.json();

            // Map dữ liệu từ backend về format của frontend nếu cần
            // Ví dụ: backend trả về fullName, frontend đang dùng name (hoặc ngược lại)
            const mappedData = data.map((u: BackendUser) => ({
                id: u._id,
                name: u.fullName, // Mapping fullName -> name để hiển thị
                email: u.email,
                phone: u.phoneNumber, // Mapping phoneNumber -> phone
                // address: u.address,
                role: u.role,
                status: u.status,
                isVerified: u.isVerified,
                lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập'
            }));

            setUsers(mappedData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- ACTIONS ---

    // 1. Mở Dialog để THÊM MỚI
    const handleAddNew = () => {
        setEditingUser(null);
        setFormData({ fullName: "", email: "", phoneNumber: "", role: "LIBRARIAN", password: "" });
        setIsDialogOpen(true);
    };

    // 2. Mở Dialog để CHỈNH SỬA
    const handleEdit = (user: UserAccount) => {
        setEditingUser(user);
        setFormData({
            fullName: user.name || "",
            email: user.email,
            phoneNumber: user.phone || "",
            // address: user.address || "",
            role: user.role,
            password: "" // Không load password cũ
        });
        setIsDialogOpen(true);
    };

    // 3. LƯU DỮ LIỆU (CREATE / UPDATE)
    const handleSave = async () => {
        if (!formData.fullName || !formData.email) {
            showToast("Vui lòng nhập tên và email", 'warning');
            return;
        }

        // Ngăn chặn submit nhiều lần
        if (isSaving) return;
        setIsSaving(true);

        try {
            const url = editingUser
                ? `${API_URL}/users/${editingUser.id}`
                : `${API_URL}/users`;

            const method = editingUser ? 'PATCH' : 'POST';

            // Chuẩn bị payload khớp với DTO Backend
            const payload: SaveUserPayload = {
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                // address: formData.address,
                role: formData.role
            };

            // Nếu tạo mới, cần gửi kèm password (hoặc backend tự tạo default)
            if (!editingUser) {
                payload.password = formData.password || "123456"; // Default pass nếu user không nhập
                payload.status = 'active';
            }

            const token = Cookies.get('access_token');
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Action failed');
            }

            await fetchUsers(); // Reload danh sách
            setIsDialogOpen(false);
            showToast(editingUser ? "Cập nhật thành công!" : "Tạo tài khoản thành công!", 'success');

        } catch (error) {
            console.error("Save error:", error);
            showToast("Có lỗi xảy ra khi lưu dữ liệu.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // 4. Khóa/Mở khóa (UPDATE STATUS)
    const toggleStatus = async (user: UserAccount) => {
        try {
            let newStatus = user.status;

            if (user.status === 'pending') {
                newStatus = 'active'; // Approve
            } else if (user.status === 'active') {
                newStatus = 'locked'; // Lock
            } else if (user.status === 'locked') {
                // Chỉ mở khóa được nếu đã verify email
                if (!user.isVerified) {
                    showToast("Tài khoản chưa xác thực email, không thể mở khóa!", 'warning');
                    return;
                }
                newStatus = 'active'; // Unlock
            }

            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');
            await fetchUsers(); // Reload UI
        } catch (error) {
            console.error("Status update error:", error);
            showToast("Không thể thay đổi trạng thái.", 'error');
        }
    };

    // 5. Xóa tài khoản (DELETE) - Trigger Dialog
    const handleDelete = (id: string) => {
        setDeletingUserId(id);
        setDeleteConfirmOpen(true);
    };

    // 5.1 Xác nhận Xóa (Execute)
    const confirmDelete = async () => {
        if (!deletingUserId) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/users/${deletingUserId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to delete');
            await fetchUsers();
            showToast("Đã xóa tài khoản thành công", 'success');
        } catch (error) {
            console.error("Delete error:", error);
            showToast("Không thể xóa tài khoản này.", 'error');
        } finally {
            setDeleteConfirmOpen(false);
            setDeletingUserId(null);
        }
    };

    // 6. Reset mật khẩu
    const handleResetPassword = async (userId: string) => {
        const newPassword = prompt("Nhập mật khẩu mới cho người dùng này:", "123456");
        if (newPassword === null) return; // User cancelled
        if (!newPassword) {
            showToast("Mật khẩu không được để trống!", 'warning');
            return;
        }

        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, newPassword })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Reset password failed');
            }

            showToast("Đã reset mật khẩu thành công!", 'success');
        } catch (error) {
            console.error("Reset password error:", error);
            showToast(error instanceof Error ? error.message : "Có lỗi xảy ra khi reset mật khẩu.", 'error');
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header và Search giữ nguyên như cũ, chỉ thêm logic loading ở Table */}

            {/* ... (Phần Header UI giữ nguyên) ... */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý Người dùng</h1>
                    <p className="text-sm text-slate-500">Phân quyền và quản lý tài khoản nhân viên hệ thống.</p>
                </div>
                <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Thêm tài khoản
                </Button>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold">Danh sách nhân viên</CardTitle>
                    <CardDescription>Bao gồm Quản trị viên và Thủ thư.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[250px]">Nhân viên</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    {/* <TableHead className="hidden md:table-cell">Địa chỉ</TableHead> */}
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Đăng nhập cuối</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2 text-slate-500">
                                                <Loader2 className="h-5 w-5 animate-spin" /> Đang tải dữ liệu...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            Không tìm thấy nhân viên nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => {
                                        // --- LOGIC KIỂM TRA QUYỀN ---
                                        const isTargetAdmin = user.role === 'ADMIN';

                                        return (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarFallback className={user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}>
                                                                {(user.name || "U").charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{user.name}</p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`gap-1 pr-2.5 ${user.role === 'ADMIN'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}>
                                                        {user.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                {/* <TableCell className="hidden md:table-cell text-slate-600 max-w-[200px] truncate" title={user.address}>
                                                    <div className="flex items-center gap-2">
                                                        {user.address || "---"}
                                                    </div>
                                                </TableCell> */}
                                                <TableCell>
                                                    {user.status === 'active' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-0">Hoạt động</Badge>}
                                                    {user.status === 'locked' && <Badge variant="destructive" className="shadow-none">Đã khóa</Badge>}
                                                    {user.status === 'pending' && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 shadow-none border-0">Chờ duyệt</Badge>}
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">{user.lastLogin}</TableCell>

                                                {/* --- CỘT THAO TÁC --- */}
                                                <TableCell className="text-right">
                                                    {isTargetAdmin ? (
                                                        // Nếu là ADMIN -> Không hiển thị nút thao tác hoặc hiển thị text mờ
                                                        <span className="text-slate-300 text-xs italic select-none cursor-not-allowed">
                                                            Quyền Admin
                                                        </span>
                                                    ) : (
                                                        // Nếu là LIBRARIAN -> Hiển thị Menu bình thường
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Tác vụ</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                                    <Edit className="mr-2 h-4 w-4 text-blue-600" /> Chỉnh sửa
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => toggleStatus(user)} disabled={user.status === 'locked' && !user.isVerified}>
                                                                    {user.status === 'active' && <><Lock className="mr-2 h-4 w-4 text-orange-500" /> Khóa tài khoản</>}
                                                                    {user.status === 'locked' && (
                                                                        !user.isVerified ?
                                                                            <><Lock className="mr-2 h-4 w-4 text-gray-400" /> Chưa xác thực email</> :
                                                                            <><Unlock className="mr-2 h-4 w-4 text-green-500" /> Mở khóa</>
                                                                    )}
                                                                    {user.status === 'pending' && <><Shield className="mr-2 h-4 w-4 text-blue-500" /> Duyệt tài khoản</>}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleResetPassword(user.id!)}>
                                                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset mật khẩu
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleDelete(user.id!)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa tài khoản
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* --- FORM DIALOG (Updated binding) --- */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? "Cập nhật thông tin" : "Tạo tài khoản mới"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Thay đổi thông tin cá nhân và quyền hạn của nhân viên."
                                : "Tạo tài khoản mới cho nhân viên thư viện."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullname">Họ và tên</Label>
                                <Input
                                    id="fullname"
                                    placeholder="Nguyễn Văn A"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Số điện thoại</Label>
                                <Input
                                    id="phone"
                                    placeholder="090..."
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email đăng nhập</Label>
                            <Input
                                id="email"
                                placeholder="user@library.edu.vn"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!!editingUser}
                                className={editingUser ? "bg-slate-50 text-slate-500" : ""}
                            />
                        </div>

                        {!editingUser && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Mật khẩu (Mặc định: 123456)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Nhập mật khẩu..."
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        )}

                        {/* <div className="space-y-2">
                            <Label htmlFor="address">Địa chỉ thường trú</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="address"
                                    placeholder="Số nhà, Đường, Quận/Huyện..."
                                    className="pl-9"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div> */}

                        <div className="space-y-2">
                            <Label htmlFor="role">Phân quyền</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val: "ADMIN" | "LIBRARIAN") => setFormData({ ...formData, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LIBRARIAN">Thủ thư</SelectItem>
                                    <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Hủy bỏ</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</>
                            ) : (
                                <>
                                    {editingUser ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- DELETE CONFIRMATION DIALOG --- */}
            {/* --- DELETE CONFIRMATION DIALOG --- */}
            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Xác nhận xóa tài khoản"
                description="Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác và tài khoản sẽ mất quyền truy cập hệ thống."
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div >
    );
}