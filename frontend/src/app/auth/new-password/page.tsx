'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Suspense } from 'react';

function NewPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const otp = searchParams.get('otp');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!email || !otp) {
            toast.error("Thông tin xác thực không hợp lệ");
            router.push('/auth/forgot-password');
        }
    }, [email, otp, router]);

    const handleSubmit = async () => {
        if (!password || !confirmPassword) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Mật khẩu nhập lại không khớp");
            return;
        }

        if (password.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${apiUrl}/auth/reset-password-with-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword: password }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Đặt lại mật khẩu thất bại");
            }

            toast.success("Đặt lại mật khẩu thành công");
            router.push('/auth/feedback-success?type=reset');
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-slate-100">
            <CardHeader className="text-center space-y-1">
                <CardTitle className="text-2xl font-bold text-slate-800">Đặt lại mật khẩu</CardTitle>
                <CardDescription>Nhập mật khẩu mới cho tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new-pass">Mật khẩu mới</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="new-pass" 
                            type="password" 
                            className="pl-9" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cập nhật mật khẩu"}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function NewPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewPasswordContent />
        </Suspense>
    );
}