import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center min-h-[500px] text-slate-400">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
            <p className="text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
    );
}