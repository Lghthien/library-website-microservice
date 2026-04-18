'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCcw, Info, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/components/ui/ToastContext';
import Cookies from 'js-cookie';

interface Parameter {
    paramName: string;
    paramValue: string;
}

export default function RegulationsPage() {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState({
        minAge: 18,
        maxAge: 55,
        publishYearLimit: 8,
        maxBorrowDays: 4,
        finePerDay: 1000,
        checkDebtRule: true
    });

    useEffect(() => {
        fetchParameters();
    }, []);

    const fetchParameters = async () => {
        try {
            const token = Cookies.get('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const res = await fetch(`${apiUrl}/parameters`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch parameters');
            const data = await res.json();
            
            const newConfig = { ...config };
            data.forEach((param: Parameter) => {
                switch (param.paramName) {
                    case 'QD1_MIN_AGE': newConfig.minAge = Number(param.paramValue); break;
                    case 'QD1_MAX_AGE': newConfig.maxAge = Number(param.paramValue); break;
                    case 'QD2_PUBLISH_YEAR_DISTANCE': newConfig.publishYearLimit = Number(param.paramValue); break;
                    case 'QD4_MAX_BORROW_DAYS': newConfig.maxBorrowDays = Number(param.paramValue); break;
                    case 'QD_FINE_PER_DAY': newConfig.finePerDay = Number(param.paramValue); break;
                    case 'QD6_CHECK_DEBT': newConfig.checkDebtRule = param.paramValue === 'true'; break;
                }
            });
            setConfig(newConfig);
        } catch (error) {
            showToast('Không thể tải dữ liệu quy định', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (isAgeInvalid) {
            showToast('Vui lòng kiểm tra lại các trường không hợp lệ', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const token = Cookies.get('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const updates = [
                { name: 'QD1_MIN_AGE', value: config.minAge.toString() },
                { name: 'QD1_MAX_AGE', value: config.maxAge.toString() },
                { name: 'QD2_PUBLISH_YEAR_DISTANCE', value: config.publishYearLimit.toString() },
                { name: 'QD4_MAX_BORROW_DAYS', value: config.maxBorrowDays.toString() },
                { name: 'QD_FINE_PER_DAY', value: config.finePerDay.toString() },
                { name: 'QD6_CHECK_DEBT', value: config.checkDebtRule.toString() },
            ];

            await Promise.all(updates.map(param => 
                fetch(`${apiUrl}/parameters/name/${param.name}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ paramValue: param.value })
                })
            ));

            showToast('Lưu quy định thành công', 'success');
            
            // Refresh parameters to ensure UI is in sync with database
            await fetchParameters();
            
            // Broadcast event to notify other pages/tabs about parameter update
            window.dispatchEvent(new CustomEvent('parameters-updated'));
        } catch (error) {
            showToast('Lưu quy định thất bại', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (key: string, value: number | boolean) => {
        if (typeof value === 'number') {
            // Chỉ chấp nhận số nguyên dương (> 0)
            if (value < 0 || !Number.isInteger(value)) return;
            // Không cho phép giá trị 0 cho các tham số quan trọng
            if (value === 0 && key !== 'minAge') return;
        }
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        e.currentTarget.blur();
    };

    // Xử lý input để ngăn nhập số thập phân
    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;
        // Chỉ cho phép số nguyên (không có dấu chấm, dấu phẩy)
        if (value.includes('.') || value.includes(',') || value.includes('-') || value.includes('e')) {
            e.currentTarget.value = value.replace(/[.,\-e]/g, '');
        }
    };

    const isAgeInvalid = config.minAge > config.maxAge;

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quy định & Tham số</h1>
                <p className="text-sm text-slate-500">Cấu hình các quy tắc nghiệp vụ toàn cục (QĐ1, QĐ2, QĐ4).</p>
            </div>

            <div className="grid gap-6">
                {/* --- NHÓM 1: TUỔI ĐỘC GIẢ --- */}
                <Card className={`shadow-sm transition-colors ${isAgeInvalid ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-blue-700">1. Quy định về Độc giả (QĐ1)</CardTitle>
                        <CardDescription>Điều chỉnh giới hạn độ tuổi được phép làm thẻ.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className={isAgeInvalid ? "text-red-600" : ""}>Tuổi tối thiểu</Label>
                            <Input
                                type="number" min={0}
                                value={config.minAge === 0 ? '' : config.minAge}
                                onChange={(e) => handleChange('minAge', Number(e.target.value))}
                                onInput={handleInput}
                                onWheel={handleWheel}
                                className={isAgeInvalid ? "border-red-300 ring-red-200 focus-visible:ring-red-500" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={isAgeInvalid ? "text-red-600" : ""}>Tuổi tối đa</Label>
                            <Input
                                type="number" min={0}
                                value={config.maxAge === 0 ? '' : config.maxAge}
                                onChange={(e) => handleChange('maxAge', Number(e.target.value))}
                                onInput={handleInput}
                                onWheel={handleWheel}
                                className={isAgeInvalid ? "border-red-300 ring-red-200 focus-visible:ring-red-500" : ""}
                            />
                        </div>
                        {isAgeInvalid && (
                            <div className="md:col-span-2 flex items-center text-sm text-red-600 bg-red-100 p-2 rounded border border-red-200">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Lỗi: Tuổi tối thiểu không được lớn hơn Tuổi tối đa.
                            </div>
                        )}
                        <div className="md:col-span-2 text-xs text-slate-500 bg-blue-50 p-2 rounded border border-blue-100 italic">
                            <Info className="w-3 h-3 inline-block mr-1 mb-0.5" />
                            Thời hạn thẻ được cấu hình riêng cho từng loại độc giả tại trang <b>Dữ liệu tham chiếu</b>.
                        </div>
                    </CardContent>
                </Card>

                {/* --- NHÓM 2: SÁCH --- */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-blue-700">2. Quy định về Sách (QĐ2)</CardTitle>
                        <CardDescription>Điều kiện tiếp nhận sách vào thư viện.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-w-sm">
                            <div className="flex items-center gap-2">
                                <Label>Khoảng cách năm xuất bản</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>Chỉ nhận sách xuất bản trong vòng n năm trở lại đây.</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number" min={0}
                                    value={config.publishYearLimit === 0 ? '' : config.publishYearLimit}
                                    onChange={(e) => handleChange('publishYearLimit', Number(e.target.value))}
                                    onInput={handleInput}
                                    onWheel={handleWheel}
                                />
                                <span className="text-sm text-slate-500 shrink-0">năm</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- NHÓM 3: MƯỢN TRẢ & PHẠT --- */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-blue-700">3. Mượn trả & Tiền phạt (QĐ4, QĐ6)</CardTitle>
                        <CardDescription>Giới hạn thời gian mượn và mức phạt quá hạn.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Số ngày mượn tối đa</Label>
                            <Input
                                type="number" min={0}
                                value={config.maxBorrowDays === 0 ? '' : config.maxBorrowDays}
                                onChange={(e) => handleChange('maxBorrowDays', Number(e.target.value))}
                                onInput={handleInput}
                                onWheel={handleWheel}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-red-600 font-semibold">Tiền phạt quá hạn (VNĐ/ngày)</Label>
                            <Input
                                type="number" min={0}
                                className="border-red-200 focus-visible:ring-red-500 text-red-700 font-medium"
                                value={config.finePerDay === 0 ? '' : config.finePerDay}
                                onChange={(e) => handleChange('finePerDay', Number(e.target.value))}
                                onInput={handleInput}
                                onWheel={handleWheel}
                            />
                        </div>
                        <div className="md:col-span-2 text-xs text-slate-500 bg-blue-50 p-2 rounded border border-blue-100 italic">
                            <Info className="w-3 h-3 inline-block mr-1 mb-0.5" />
                            Số sách mượn tối đa được cấu hình riêng cho từng loại độc giả tại trang <b>Dữ liệu tham chiếu</b>.
                        </div>
                        <div className="md:col-span-2 text-xs text-slate-500 bg-blue-50 p-2 rounded border border-blue-100 italic">
                            <Info className="w-3 h-3 inline-block mr-1 mb-0.5" />
                            QĐ6: Số tiền thu không được vượt quá số tiền độc giả đang nợ.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-4 py-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-sm border-t border-slate-200">
                <Button variant="outline" className="bg-white" onClick={fetchParameters} disabled={isSaving}>
                    <RefreshCcw className={`w-4 h-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} /> Khôi phục
                </Button>
                <Button 
                    className="bg-blue-600 hover:bg-blue-700 min-w-[150px]" 
                    disabled={isAgeInvalid || isSaving}
                    onClick={handleSave}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </div>
        </div>
    );
}