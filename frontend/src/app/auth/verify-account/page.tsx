'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, Suspense } from 'react';
import { toast } from "sonner";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!email || !token) {
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                const res = await fetch(`${apiUrl}/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, token }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Xác thực thất bại');
                }

                router.push(`/auth/feedback-success?type=verify&status=${data.status}`);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
                toast.error(message);
                router.push('/auth/login');
            }
        };

        verifyEmail();
    }, [email, token, router]);

    return (
        <Card className="shadow-lg border-slate-100 text-center max-w-md mx-auto mt-10">
            <CardContent className="py-10 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800">Đang xác thực...</h3>
                    <p className="text-sm text-slate-500">Vui lòng đợi trong giây lát.</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function VerifyAccountPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyContent />
        </Suspense>
    );
}