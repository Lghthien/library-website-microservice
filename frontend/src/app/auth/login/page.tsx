'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowLeft, Loader2, Library } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/components/ui/ToastContext';

export default function LoginPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('Vui lòng nhập email và mật khẩu', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Đăng nhập thất bại');
            }

            // Lưu token và thông tin user vào Cookie
            Cookies.set('access_token', data.access_token, { expires: 1 });
            Cookies.set('user_role', data.user.role, { expires: 1 });
            Cookies.set('user_name', data.user.fullName, { expires: 1 });
            Cookies.set('user_id', data.user.id, { expires: 1 });

            router.push('/portal/dashboard');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng nhập', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
            <Card className="shadow-xl border-0 w-full max-w-md mx-auto overflow-hidden relative">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-purple-600"></div>

                {/* Back to home button positioned absolutely */}
                <div className="absolute top-4 left-4">
                    <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors px-3 py-2 rounded-full hover:bg-slate-100">
                        <ArrowLeft className="h-3 w-3" /> Trang chủ
                    </Link>
                </div>

                <CardHeader className="text-center space-y-2 pb-6 pt-12">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center shadow-sm">
                            <Library className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    <CardTitle className="text-2xl font-bold text-slate-800">Chào mừng trở lại</CardTitle>
                    <CardDescription className="text-slate-500 text-sm">
                        Đăng nhập vào hệ thống quản lý thư viện
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 px-8">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email hoặc Mã số</Label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                id="email"
                                placeholder="user@library.edu.vn"
                                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-medium text-slate-700">Mật khẩu</Label>
                            <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="pl-10 pr-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 outline-none transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all h-10"
                            onClick={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            Đăng nhập
                        </Button>
                    </div>

                    <p className="text-[11px] text-center text-slate-400 italic">
                        *Chọn vai trò để mô phỏng đăng nhập nhanh
                    </p>
                </CardContent>

                <CardFooter className="justify-center py-6 bg-slate-50/50 border-t border-slate-100 mt-2">
                    <div className="text-center text-sm text-slate-600">
                        Chưa có tài khoản?{' '}
                        <Link href="/auth/register" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
                            Đăng ký ngay
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}