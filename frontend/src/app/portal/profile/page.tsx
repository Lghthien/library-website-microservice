'use client';

import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import {
    Mail, Phone, MapPin, Camera,
    Save, Key, ShieldCheck, AlertCircle,
    Laptop, Smartphone, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/components/ui/ToastContext';

export default function ProfilePage() {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState("");
    const [userName, setUserName] = useState("");
    const [userId, setUserId] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [status, setStatus] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const id = Cookies.get('user_id');
            const token = Cookies.get('access_token');

            console.log("Cookie user_id:", id);
            console.log("Cookie access_token:", token ? "exists" : "missing");

            if (!id || !token || id === 'undefined') {
                console.warn("Invalid session - user_id or token missing/invalid");
                setIsLoading(false);
                showToast("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.", 'error');
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 2000);
                return;
            }

            setUserId(id);

            try {
                const res = await fetch(`http://localhost:4000/api/users/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("Profile data received:", data);
                    setUserName(data.fullName || "");
                    setRole(data.role || "");
                    setEmail(data.email || "");
                    setPhone(data.phoneNumber || "");
                    setStatus(data.status || "");
                    setAvatarUrl(data.avatar ? `http://localhost:4000${data.avatar}` : "");
                } else {
                    const errorText = await res.text();
                    console.error("Failed to fetch profile:", res.status, res.statusText, errorText);
                    showToast(`Không thể tải thông tin hồ sơ: ${res.status} ${res.statusText}`, 'error');
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
                showToast("Lỗi kết nối đến máy chủ", 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("File quá lớn (tối đa 5MB)", 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const token = Cookies.get('access_token');
        const id = Cookies.get('user_id');

        try {
            const res = await fetch(`http://localhost:4000/api/users/${id}/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                const newAvatarUrl = `http://localhost:4000${data.avatar}?t=${new Date().getTime()}`;
                setAvatarUrl(newAvatarUrl);
                showToast("Cập nhật ảnh đại diện thành công", 'success');
                
                // Dispatch event to update header
                window.dispatchEvent(new CustomEvent('avatar-updated', { detail: newAvatarUrl }));
            } else {
                showToast("Cập nhật ảnh đại diện thất bại", 'error');
            }
        } catch (error) {
            console.error("Upload avatar error:", error);
            showToast("Lỗi kết nối đến máy chủ", 'error');
        }
    };

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast("Vui lòng điền đầy đủ thông tin", 'warning');
            return;
        }

        if (newPassword.length < 6) {
            showToast("Mật khẩu mới phải có ít nhất 6 ký tự", 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast("Mật khẩu xác nhận không khớp", 'error');
            return;
        }

        setIsChangingPassword(true);
        const token = Cookies.get('access_token');

        try {
            const res = await fetch('http://localhost:4000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                showToast("Đổi mật khẩu thành công", 'success');
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                showToast(data.message || "Đổi mật khẩu thất bại", 'error');
            }
        } catch (error) {
            console.error("Change password error:", error);
            showToast("Lỗi kết nối đến máy chủ", 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hồ sơ cá nhân</h1>
                <p className="text-sm text-slate-500">Quản lý thông tin định danh và bảo mật tài khoản.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                        <CardContent className="pt-0 flex flex-col items-center text-center -mt-12">
                            <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                                    <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                                        {userName.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <h2 className="text-xl font-bold text-slate-800">{userName}</h2>
                            <p className="text-slate-500 font-medium text-sm mb-3">
                                {role === 'ADMIN' ? 'Quản trị hệ thống' : 'Thủ thư'}
                            </p>

                            <Badge variant="outline" className={`px-3 py-1 border-0 ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                {role}
                            </Badge>

                            <div className="w-full grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">ID</p>
                                    <p className="font-mono font-medium text-slate-700 mt-1 text-xs truncate px-2" title={userId}>{userId}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Trạng thái</p>
                                    <p className={`font-medium mt-1 flex items-center justify-center gap-1 ${status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                        <ShieldCheck className="w-3 h-3" /> {status === 'active' ? 'Active' : status}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1">
                            <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                            <TabsTrigger value="security">Bảo mật & Mật khẩu</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Cập nhật hồ sơ</CardTitle>
                                    <CardDescription>Thay đổi các thông tin hiển thị cá nhân.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullname">Họ và tên</Label>
                                            <Input
                                                id="fullname"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                value={email}
                                                disabled
                                                className="bg-slate-50 text-slate-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Số điện thoại</Label>
                                            <Input
                                                id="phone"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-4 bg-slate-50/50">
                                    <Button className="bg-blue-600 hover:bg-blue-700"><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Đổi mật khẩu</CardTitle>
                                    <CardDescription>Tạo mật khẩu mạnh để bảo vệ tài khoản.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Mật khẩu hiện tại</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="password"
                                                className="pl-9"
                                                placeholder="Nhập mật khẩu hiện tại"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                disabled={isChangingPassword}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mật khẩu mới</Label>
                                        <Input
                                            type="password"
                                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={isChangingPassword}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Xác nhận mật khẩu mới</Label>
                                        <Input
                                            type="password"
                                            placeholder="Nhập lại mật khẩu mới"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={isChangingPassword}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-4 bg-slate-50/50">
                                    <Button
                                        className="bg-slate-900 hover:bg-slate-800"
                                        onClick={handleChangePassword}
                                        disabled={isChangingPassword}
                                    >
                                        {isChangingPassword ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang cập nhật...</>
                                        ) : (
                                            "Cập nhật mật khẩu"
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}