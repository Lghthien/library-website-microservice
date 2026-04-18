'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Cookies from 'js-cookie';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu mới không khớp");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        const token = Cookies.get('access_token');
        if (!token) {
            toast.error("Phiên đăng nhập hết hạn");
            router.push('/auth/login');
            return;
        }

        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${apiUrl}/auth/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Đổi mật khẩu thất bại");
            }

            toast.success("Đổi mật khẩu thành công");
            router.push('/auth/feedback-success?type=change');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Đổi mật khẩu thất bại";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-slate-100">
            <CardHeader className="text-center space-y-1">
                <div className="flex justify-start w-full mb-2">
                    <Link href="/portal/dashboard" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Hủy bỏ
                    </Link>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">Đổi mật khẩu</CardTitle>
                <CardDescription>Bảo mật tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-pass">Mật khẩu hiện tại</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="current-pass" 
                            type="password" 
                            className="pl-9 bg-slate-50" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>
                </div>
                <hr className="border-slate-100" />
                <div className="space-y-2">
                    <Label htmlFor="new-pass">Mật khẩu mới</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="new-pass" 
                            type="password" 
                            className="pl-9" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-pass">Nhập lại mật khẩu mới</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="confirm-pass" 
                            type="password" 
                            className="pl-9" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cập nhật"}
                </Button>
            </CardFooter>
        </Card>
    );
}