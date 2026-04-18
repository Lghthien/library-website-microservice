'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, ArrowLeft, Loader2, Phone, Eye, EyeOff } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/components/ui/ToastContext';

export default function RegisterPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // State riêng biệt cho việc ẩn/hiện mật khẩu
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleRegister = async () => {
        // 1. Validate Form
        if (!formData.fullName || !formData.email || !formData.password || !formData.phoneNumber) {
            showToast("Vui lòng điền đầy đủ thông tin!", 'warning');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            showToast("Mật khẩu xác nhận không khớp!", 'error');
            return;
        }

        try {
            setIsLoading(true);

            // 2. GỌI API ĐĂNG KÝ (POST /auth/public-register)
            const payload = {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password, // Gửi password thô, backend sẽ hash
                phoneNumber: formData.phoneNumber,
            };

            const res = await fetch('http://localhost:4000/api/auth/public-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Đăng ký thất bại');
            }

            // 3. CHUYỂN HƯỚNG
            router.push('/auth/feedback-success');

        } catch (error) {
            showToast(error instanceof Error ? error.message : "Có lỗi xảy ra", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-slate-100 max-w-md mx-auto mt-10">
            {/* Header */}
            <CardHeader className="text-center space-y-1">
                <div className="flex justify-start w-full mb-2">
                    <Link href="/auth/login" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Quay lại
                    </Link>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">Đăng ký thành viên</CardTitle>
                <CardDescription>Tạo tài khoản mới để sử dụng dịch vụ thư viện</CardDescription>
            </CardHeader>

            {/* Form Fields */}
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input id="fullName" placeholder="Nguyễn Văn A" className="pl-9" value={formData.fullName} onChange={handleChange} disabled={isLoading} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input id="email" type="email" placeholder="example@email.com" className="pl-9" value={formData.email} onChange={handleChange} disabled={isLoading} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Số điện thoại</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input id="phoneNumber" type="tel" placeholder="0912345678" className="pl-9" value={formData.phoneNumber} onChange={handleChange} disabled={isLoading} />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-9 pr-10"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-9 pr-10"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </CardContent>

            {/* Footer */}
            <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleRegister} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...</> : "Đăng ký & Xác thực"}
                </Button>
            </CardFooter>
        </Card>
    );
}