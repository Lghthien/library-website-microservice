'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/components/ui/ToastContext';

export default function ForgotPasswordPage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) {
            showToast("Vui lòng nhập email", 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${apiUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Gửi mã thất bại");
            }

            showToast("Mã xác thực đã được gữi đến email của bạn", 'success');
            router.push(`/auth/verification?email=${encodeURIComponent(email)}`);
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : "Đã xảy ra lỗi", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-slate-100">
            <CardHeader className="text-center space-y-1">
                <div className="flex justify-start w-full mb-2">
                    <Link href="/auth/login" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Quay lại
                    </Link>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">Quên mật khẩu?</CardTitle>
                <CardDescription>Nhập email để nhận mã xác thực đặt lại mật khẩu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email đăng ký</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="user@library.edu.vn" 
                            className="pl-9" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gửi mã xác nhận"}
                </Button>
            </CardFooter>
        </Card>
    );
}