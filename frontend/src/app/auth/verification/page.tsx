'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function VerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    useEffect(() => {
        if (!email) {
            toast.error("Không tìm thấy email");
            router.push('/auth/forgot-password');
        }
    }, [email, router]);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        const newOtp = [...otp];
        pastedData.forEach((char, index) => {
            if (index < 6 && !isNaN(Number(char))) {
                newOtp[index] = char;
            }
        });
        setOtp(newOtp);
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        
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
                throw new Error(error.message || "Gửi lại mã thất bại");
            }

            toast.success("Đã gửi lại mã OTP");
            setCountdown(60);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            toast.error("Vui lòng nhập đủ 6 số OTP");
            return;
        }

        setIsLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${apiUrl}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpValue }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Xác thực thất bại");
            }

            toast.success("Xác thực thành công");
            router.push(`/auth/new-password?email=${encodeURIComponent(email!)}&otp=${otpValue}`);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-slate-100 text-center">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-slate-800">Xác thực OTP</CardTitle>
                <CardDescription>Nhập mã 6 số đã được gửi đến {email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                        <Input
                            key={index}
                            type="text"
                            maxLength={1}
                            className="w-10 h-12 text-center text-lg font-bold"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            ref={(el) => { inputRefs.current[index] = el }}
                        />
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Xác nhận"}
                </Button>
                <div className="text-sm text-slate-500">
                    Bạn chưa nhận được mã?{' '}
                    <button
                        onClick={handleResend}
                        disabled={countdown > 0 || isLoading}
                        className="text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                        {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại'}
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
}

export default function VerificationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerificationContent />
        </Suspense>
    );
}