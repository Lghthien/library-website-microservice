// app/auth/layout.tsx
import React from 'react';
import { BookOpen } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
            {/* Header nhận diện thương hiệu */}
            <div className="mb-6 flex flex-col items-center space-y-2">
                <div className="p-3 bg-blue-600 rounded-full shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thư Viện Số</h1>
                    <p className="text-sm text-slate-500">Trường ĐH Công nghệ Thông tin - Nhóm 15</p>
                </div>
            </div>

            {/* Container chính dạng Card */}
            <div className="w-full max-w-[400px]">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-slate-400">
                &copy; 2025 Library Management System
            </div>
        </div>
    );
}