import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="h-full flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="p-4 bg-slate-100 rounded-full">
                <FileQuestion className="h-12 w-12 text-slate-400" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy trang</h2>
                <p className="text-slate-500 max-w-[400px]">
                    Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
                </p>
            </div>
            <Link href="/portal/dashboard">
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                    Trở về Dashboard
                </Button>
            </Link>
        </div>
    );
}