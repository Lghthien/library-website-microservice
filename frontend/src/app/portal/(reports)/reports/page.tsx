'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
    FileDown, Printer, Filter, Calendar as CalendarIcon,
    TrendingUp, AlertTriangle, BookOpen, Layers, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ExcelJS from 'exceljs';

// --- INTERFACES ---
interface TrendData {
    month: string;
    fullDate: string;
    loans: number;
    returns: number;
    overdue: number;
}

interface CategoryReportData {
    id: string;
    name: string;
    total: number;
    ratio: number;
    color: string;
    [key: string]: any;
}

interface LateReturnData {
    id: string;
    displayId: string;
    bookName: string;
    borrowDate: string;
    returnDate: string | null;
    daysLate: number;
    reader: string;
}

interface DashboardStats {
    readers: { active: number; expired: number; total: number };
    books: { total: number; available: number; borrowed: number };
    loans: { overdue: number };
    fines: { unpaidCount: number; unpaidTotal: number };
}

export default function ReportsPage() {
    const currentDate = new Date();
    const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
    const [year, setYear] = useState(currentDate.getFullYear().toString());
    const [viewDate, setViewDate] = useState<Date | undefined>(new Date());
    const [isLoading, setIsLoading] = useState(true);

    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [categoryReportData, setCategoryReportData] = useState<CategoryReportData[]>([]);
    const [lateReturnData, setLateReturnData] = useState<LateReturnData[]>([]);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        fetchData();
    }, [month, year, viewDate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('access_token');
            if (!token) {
                toast.error('Phên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => { window.location.href = '/auth/login'; }, 2000);
                return;
            }

            const headers = { 'Authorization': `Bearer ${token}` };
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

            // 1. Fetch Dashboard Stats
            const statsRes = await fetch(`${baseUrl}/reports/dashboard`, { headers });
            if (statsRes.ok) {
                setDashboardStats(await statsRes.json());
            } else {
                console.error('Failed to load dashboard stats:', await statsRes.text());
            }

            // 2. Fetch Trend Data (12 months)
            const trendRes = await fetch(`${baseUrl}/reports/trend?months=12`, { headers });
            if (trendRes.ok) {
                const data = await trendRes.json();
                console.log('📊 Trend data received:', data.length, 'months');
                console.log('📅 First month:', data[0]?.month, 'Last month:', data[data.length - 1]?.month);
                setTrendData(data);
            } else {
                console.error('Failed to load trend data:', await trendRes.text());
            }

            // 3. Fetch Category Report (BM7.1)
            // Calculate start and end date of selected month
            const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999).toISOString();

            const catRes = await fetch(`${baseUrl}/reports/borrow-by-category?startDate=${startDate}&endDate=${endDate}`, { headers });
            if (catRes.ok) {
                const data = await catRes.json();
                if (Array.isArray(data) && data.length > 0) {
                    const totalBorrows = data.reduce((sum: number, item: any) => sum + item.borrowCount, 0);
                    const colors = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#64748b", "#ef4444", "#06b6d4"];

                    const formattedData = data.map((item: any, index: number) => ({
                        id: item._id || `TL${index + 1}`,
                        name: item.categoryName || 'Không rõ',
                        total: item.borrowCount || 0,
                        ratio: totalBorrows > 0 ? parseFloat(((item.borrowCount / totalBorrows) * 100).toFixed(2)) : 0,
                        color: colors[index % colors.length]
                    }));
                    setCategoryReportData(formattedData);
                } else {
                    setCategoryReportData([]);
                }
            } else {
                console.error('Failed to load category report:', await catRes.text());
                setCategoryReportData([]);
            }

            // 4. Fetch Overdue Loans (BM7.2) - Filter by selected month AND viewDate (snapshot)
            const viewDateParam = viewDate ? `&viewDate=${viewDate.toISOString()}` : '';
            const overdueRes = await fetch(`${baseUrl}/reports/overdue-loans?startDate=${startDate}&endDate=${endDate}${viewDateParam}`, { headers });
            if (overdueRes.ok) {
                const data = await overdueRes.json();
                if (Array.isArray(data)) {
                    const formattedData = data.map((item: any, index: number) => ({
                        id: `${item._id}-${item.bookCopyId || index}`, // Composite key: loanId + copyId
                        displayId: item.bookCopyId ? item.bookCopyId.toString().slice(-6).toUpperCase() : 'N/A',
                        bookName: item.bookTitle || 'Không rõ',
                        borrowDate: item.borrowDate || new Date().toISOString(),
                        returnDate: item.dueDate || null,
                        daysLate: item.overdueDays || 0,
                        reader: item.readerName || 'Không rõ'
                    }));
                    setLateReturnData(formattedData);
                } else {
                    setLateReturnData([]);
                }
            } else {
                console.error('Failed to load overdue loans:', await overdueRes.text());
                setLateReturnData([]);
            }

        } catch (error) {
            console.error("Failed to fetch report data", error);
            toast.error('Không thể tải dữ liệu báo cáo. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Export Excel
    const handleExportExcel = async () => {
        const wb = new ExcelJS.Workbook();

        // Sheet 1: Tổng quan (Dashboard)
        const wsOverview = wb.addWorksheet('Tổng quan');
        wsOverview.addRows([
            [`BÁO CÁO THỐNG KÊ THƯ VIỆN`, `Tháng ${month}/${year}`],
            [''],
            ['THỐNG KÊ CHUNG'],
            ['Tổng số độc giả', dashboardStats?.readers.total || 0],
            ['Sách đang mượn', dashboardStats?.books.borrowed || 0],
            ['Sách trả trễ', dashboardStats?.loans.overdue || 0],
            [''],
            ['CHI TIẾT MƯỢN TRẢ THEO THÁNG (Biểu đồ)'],
            ['Tháng', 'Lượt mượn', 'Lượt trả', 'Lượt trễ'],
            ...trendData.map(t => [t.month, t.loans, t.returns, t.overdue])
        ]);

        // Sheet 2: Mượn theo thể loại (BM7.1)
        const wsCat = wb.addWorksheet('BM7.1 - Thể loại');
        wsCat.addRows([
            [`BÁO CÁO TÌNH HÌNH MƯỢN SÁCH THEO THỂ LOẠI`, `Tháng ${month}/${year}`],
            [''],
            ['Mã TL', 'Tên Thể loại', 'Số lượt mượn', 'Tỷ lệ (%)'],
            ...categoryReportData.map(c => [c.id, c.name, c.total, c.ratio])
        ]);

        // Sheet 3: Sách trả trễ (BM7.2)
        const wsLate = wb.addWorksheet('BM7.2 - Trả trễ');
        wsLate.addRows([
            ['DANH SÁCH SÁCH TRẢ TRỄ', `Tính đến ngày: ${viewDate ? viewDate.toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`],
            [''],
            ['Ngày mượn', 'Mã Sách', 'Tên Sách', 'Người mượn', 'Hạn trả', 'Ngày trả thực tế', 'Số ngày trễ'],
            ...lateReturnData.map(l => [
                new Date(l.borrowDate).toLocaleDateString('vi-VN'),
                l.displayId,
                l.bookName,
                l.reader,
                l.returnDate ? new Date(l.returnDate).toLocaleDateString('vi-VN') : 'Chưa trả',
                l.returnDate ? new Date(l.returnDate).toLocaleDateString('vi-VN') : 'Chưa trả',
                l.daysLate
            ])
        ]);

        // Save File via browser download
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BaoCao_Thuvien_T${month}_${year}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">

            {/* HEADER: Tiêu đề & Bộ lọc */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Báo cáo & Thống kê</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Tổng quan hệ thống và báo cáo theo tháng {month}/{year}.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Bộ lọc tháng */}
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <CalendarIcon className="w-4 h-4 text-slate-500 ml-2" />
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-[70px] border-0 bg-transparent h-8 focus:ring-0">
                                <SelectValue placeholder="Tháng" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <SelectItem key={m} value={m.toString()}>T{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-slate-300">/</span>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-[80px] border-0 bg-transparent h-8 focus:ring-0">
                                <SelectValue placeholder="Năm" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="text-xs text-slate-400 hidden md:inline">(Áp dụng cho BM7.1 & BM7.2)</span>

                    <Button 
                        onClick={handleExportExcel}
                        className="h-10 gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <FileDown className="w-4 h-4" /> Xuất Excel
                    </Button>
                </div>
            </div>

            {/* NỘI DUNG CHÍNH (TABS) */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-6 bg-slate-100 p-1">
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="bm71">Mượn theo Thể loại (BM7.1)</TabsTrigger>
                    <TabsTrigger value="bm72">Sách trả trễ (BM7.2)</TabsTrigger>
                </TabsList>

                {/* --- TAB 1: TỔNG QUAN (DASHBOARD ANALYTICS) --- */}
                <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
                    {/* Chart Xu hướng */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-2 shadow-sm">
                            <CardHeader>
                                <CardTitle>Xu hướng Mượn & Trả</CardTitle>
                                <CardDescription>So sánh lượng sách lưu thông trong 12 tháng gần nhất (dữ liệu tổng hợp).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="loans" name="Sách Mượn" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLoans)" />
                                            <Area type="monotone" dataKey="returns" name="Sách Trả" stroke="#10b981" fillOpacity={1} fill="url(#colorReturns)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* KPI nhỏ bên cạnh */}
                        <div className="space-y-6">
                            <Card className="shadow-sm border-l-4 border-l-blue-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Tổng lượt mượn (Năm nay)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-800">{dashboardStats?.books.borrowed || 0}</div>
                                    <p className="text-xs text-green-600 mt-1 flex items-center font-medium">
                                        <TrendingUp className="w-3 h-3 mr-1" /> Đang được mượn
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-l-4 border-l-orange-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Sách trả trễ</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-orange-600">
                                        {dashboardStats?.loans.overdue || 0}
                                    </div>
                                    <p className="text-xs text-orange-600 mt-1 flex items-center font-medium">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> {dashboardStats?.loans.overdue || 0} sách quá hạn
                                    </p>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500"
                                            style={{ width: `${dashboardStats?.loans.overdue ? Math.min(((dashboardStats.loans.overdue / (dashboardStats.books.borrowed || 1)) * 100), 100) : 0}%` }}
                                        ></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TAB 2: BM7.1 - MƯỢN THEO THỂ LOẠI --- */}
                <TabsContent value="bm71" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid gap-6 md:grid-cols-2">

                        {/* Bảng Dữ liệu */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-blue-600" /> Báo cáo BM7.1
                                </CardTitle>
                                <CardDescription>Thống kê tình hình mượn sách theo thể loại trong tháng {month}/{year}.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Mã Thể loại</TableHead>
                                            <TableHead>Tên Thể loại</TableHead>
                                            <TableHead className="text-right">Số lượt mượn</TableHead>
                                            <TableHead className="text-right">Tỷ lệ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categoryReportData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-slate-500">{item.id}</TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-right">{item.total}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="secondary" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                                        {item.ratio}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-50 font-bold">
                                            <TableCell colSpan={2}>TỔNG CỘNG</TableCell>
                                            <TableCell className="text-right">
                                                {categoryReportData.reduce((sum, item) => sum + item.total, 0)}
                                            </TableCell>
                                            <TableCell className="text-right">100%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Biểu đồ Tròn */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Biểu đồ Tỷ lệ</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <div className="w-full h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryReportData}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="total"
                                            >
                                                {categoryReportData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- TAB 3: BM7.2 - SÁCH TRẢ TRỄ --- */}
                <TabsContent value="bm72" className="animate-in slide-in-from-bottom-2 duration-300">
                    <Card className="shadow-sm border-red-100">
                        <CardHeader className="bg-red-50/30 border-b border-red-100 pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-red-700">
                                        <AlertTriangle className="w-5 h-5" /> Báo cáo BM7.2
                                    </CardTitle>
                                    <CardDescription>
                                        Danh sách sách quá hạn trả tính đến ngày {viewDate ? viewDate.toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}.
                                        {lateReturnData.length > 0 && (
                                            <span className="block text-red-600 font-medium mt-1">
                                                ⚠️ {lateReturnData.length} sách đang trễ hạn
                                            </span>
                                        )}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2 items-center">
                                     <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-sm">
                                        <span className="text-sm text-slate-500">Xem tại ngày:</span>
                                        <input 
                                            type="date" 
                                            className="text-sm border-0 focus:ring-0 p-0 text-slate-700"
                                            value={viewDate ? viewDate.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setViewDate(e.target.value ? new Date(e.target.value) : undefined)}
                                        />
                                    </div>

                                    <Button variant="outline" size="sm" className="bg-white text-red-600 border-red-200 hover:bg-red-50">
                                        <Filter className="w-4 h-4 mr-2" /> Lọc trễ {'>'} 10 ngày
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead>Ngày mượn</TableHead>
                                        <TableHead>Mã Sách</TableHead>
                                        <TableHead>Tên Sách</TableHead>
                                        <TableHead>Người mượn</TableHead>
                                        <TableHead>Hạn trả</TableHead>
                                        <TableHead className="text-right">trễ (so với ngày xem)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lateReturnData.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{new Date(item.borrowDate).toLocaleDateString('vi-VN')}</TableCell>
                                            <TableCell className="font-mono text-slate-500">{item.displayId}</TableCell>
                                            <TableCell className="font-medium">{item.bookName}</TableCell>
                                            <TableCell>{item.reader}</TableCell>
                                            <TableCell className="text-red-600 font-medium">
                                                {item.returnDate ? new Date(item.returnDate).toLocaleDateString('vi-VN') : 'Chưa trả'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge className={`${item.daysLate > 30 ? 'bg-red-600' : item.daysLate > 10 ? 'bg-orange-500' : 'bg-yellow-500'} hover:opacity-90`}>
                                                    {item.daysLate} ngày
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}