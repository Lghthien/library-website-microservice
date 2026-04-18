'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from 'react';

function FeedbackContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let title = "Thành công!";
    let message = "Thao tác đã được thực hiện thành công.";
    let icon = <CheckCircle2 className="h-12 w-12 text-green-600" />;

    if (type === 'register') {
        if (status === 'active') {
            title = "Kích hoạt thành công!";
            message = "Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.";
            icon = <ShieldCheck className="h-12 w-12 text-blue-600" />;
        } else {
            title = "Đăng ký thành công!";
            message = "Tài khoản của bạn đã được khởi tạo. Vui lòng kiểm tra email để kích hoạt tài khoản.";
        }
    } else if (type === 'change') {
        title = "Đổi mật khẩu thành công!";
        message = "Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại với mật khẩu mới.";
    } else if (type === 'reset') {
        title = "Đặt lại mật khẩu thành công!";
        message = "Mật khẩu của bạn đã được đặt lại. Vui lòng đăng nhập với mật khẩu mới.";
    } else if (type === 'verify') {
        if (status === 'active') {
            title = "Xác thực thành công!";
            message = "Email của bạn đã được xác thực. Tài khoản đã được kích hoạt.";
            icon = <ShieldCheck className="h-12 w-12 text-blue-600" />;
        } else {
            title = "Xác thực thành công!";
            message = "Email của bạn đã được xác thực. Vui lòng chờ Quản trị viên duyệt tài khoản.";
        }
    }

    return (
        <Card className="shadow-lg border-slate-100 max-w-md mx-auto mt-10 text-center">
            <CardHeader className="space-y-4">
                <div className="mx-auto bg-green-100 p-3 rounded-full w-fit animate-in zoom-in duration-300">
                    {icon}
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">{title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-slate-600">
                <p>{message}</p>

                {type === 'register' && status !== 'active' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3 text-left">
                        <Mail className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <span className="font-bold text-base">Kiểm tra email</span>
                            <br />
                            Chúng tôi đã gửi một liên kết kích hoạt đến hộp thư của bạn.
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
                <Link href="/auth/login" className="w-full">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 group">
                        Quay lại trang Đăng nhập
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

export default function FeedbackSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FeedbackContent />
        </Suspense>
    );
}