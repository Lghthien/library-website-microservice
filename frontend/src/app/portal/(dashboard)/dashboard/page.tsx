'use client';

import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Users, BookOpen, ArrowUpRight, Wallet, MoreHorizontal, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DashboardStats = {
    readers: { active: number; expired: number; total: number };
    books: { total: number; available: number; borrowed: number };
    loans: { overdue: number };
    fines: { unpaidCount: number; unpaidTotal: number };
};

type CategoryStat = { categoryName: string; borrowCount: number; uniqueReaders: number };

// Dá»¯ liá»‡u trend Ä‘Æ°á»£c láº¥y tá»« API /reports/trend - Ä‘áº¿m tá»« báº£ng loansdetail Ä‘á»ƒ chÃ­nh xÃ¡c sá»‘ lÆ°á»£ng sÃ¡ch
type TrendStat = { month: string; fullDate: string; loans: number; returns: number; overdue: number };

// PhÃ¢n bá»‘ Ä‘á»™ tuá»•i Ä‘á»™c giáº£
type ReaderAgeDistribution = { ageGroup: string; count: number };

// TÃ¬nh tráº¡ng ná»£ theo loáº¡i Ä‘á»™c giáº£
type ReaderDebtStatus = { 
    readerType: string; 
    'KhÃ´ng ná»£': number; 
    'DÆ°á»›i 50k': number; 
    '50k-100k': number; 
    'TrÃªn 100k': number; 
};

type AuditLog = {
    _id: string;
    userId: { _id: string; fullName: string; email: string };
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    tableName: string;
    recordId?: string;
    description: string;
    timestamp: string;
};

const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#8b5cf6'];

// ====================================================================================
// 1. ADMIN DASHBOARD (VÄ© mÃ´ - PhÃ¢n tÃ­ch - Xu hÆ°á»›ng)
// ====================================================================================
const AdminDashboardView = ({ 
    stats, 
    categories, 
    trend, 
    readerAgeDistribution,
    readerDebtStatus,
    auditLogs 
}: { 
    stats: DashboardStats; 
    categories: CategoryStat[]; 
    trend: TrendStat[]; 
    readerAgeDistribution: ReaderAgeDistribution[];
    readerDebtStatus: ReaderDebtStatus[];
    auditLogs: AuditLog[]; 
}) => {
    const barData = useMemo(() => trend?.map(t => ({ name: t.month, loans: t.loans, returns: t.returns })) ?? [], [trend]);
    const pieData = useMemo(() => categories?.map((c, i) => ({ name: c.categoryName, value: c.borrowCount, color: chartColors[i % chartColors.length] })) ?? [], [categories]);
    const topCats = (categories ?? []).slice(0, 3);
    const latestMonth = trend?.[trend.length - 1];

    // Reader analytics data
    const ageHistogramData = useMemo(() => readerAgeDistribution ?? [], [readerAgeDistribution]);
    const debtStackedData = useMemo(() => readerDebtStatus ?? [], [readerDebtStatus]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'INSERT': return 'âž•';
            case 'UPDATE': return 'âœï¸';
            case 'DELETE': return 'ðŸ—‘ï¸';
            default: return 'ðŸ“';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'INSERT': return 'text-green-600 bg-green-50';
            case 'UPDATE': return 'text-blue-600 bg-blue-50';
            case 'DELETE': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vá»«a xong';
        if (minutes < 60) return `${minutes} phÃºt trÆ°á»›c`;
        if (hours < 24) return `${hours} giá» trÆ°á»›c`;
        if (days < 7) return `${days} ngÃ y trÆ°á»›c`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* --- KHá»I KPI CAO Cáº¤P --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tá»•ng Äá»™c giáº£</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.readers.total.toLocaleString('vi-VN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Hoáº¡t Ä‘á»™ng: {stats.readers.active.toLocaleString('vi-VN')} â€¢ Háº¿t háº¡n: {stats.readers.expired.toLocaleString('vi-VN')}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tá»•ng SÃ¡ch</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.books.total.toLocaleString('vi-VN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Äang cÃ³ sáºµn: {stats.books.available.toLocaleString('vi-VN')} | Äang mÆ°á»£n: {stats.books.borrowed.toLocaleString('vi-VN')}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">SÃ¡ch mÆ°á»£n/tráº£ (thÃ¡ng gáº§n nháº¥t)</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latestMonth ? latestMonth.loans.toLocaleString('vi-VN') : '-'}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tráº£: {latestMonth ? latestMonth.returns.toLocaleString('vi-VN') : '-'}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tiá»n pháº¡t chÆ°a thu</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.fines.unpaidTotal.toLocaleString('vi-VN')} â‚«</div>
                        <p className="text-[11px] text-muted-foreground mt-1">{stats.fines.unpaidCount} phiáº¿u thu</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- KHá»I BIá»‚U Äá»’ TRUNG TÃ‚M --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Biá»ƒu Ä‘á»“ Cá»™t (Bar Chart) - Thá»‘ng kÃª MÆ°á»£n/Tráº£ */}
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Thá»‘ng kÃª LÆ°u thÃ´ng</CardTitle>
                        <CardDescription>Sá»‘ lÆ°á»£ng sÃ¡ch mÆ°á»£n vÃ  tráº£ 7 thÃ¡ng gáº§n nháº¥t.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Bar dataKey="loans" name="SÃ¡ch MÆ°á»£n" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="returns" name="SÃ¡ch Tráº£" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Biá»ƒu Ä‘á»“ TrÃ²n (Pie Chart) - Tá»· lá»‡ Thá»ƒ loáº¡i */}
                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>PhÃ¢n bá»‘ Thá»ƒ loáº¡i</CardTitle>
                        <CardDescription>Tá»· lá»‡ lÆ°á»£t mÆ°á»£n theo danh má»¥c.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="mt-4 space-y-3">
                            <h4 className="text-sm font-semibold text-foreground">Danh má»¥c ná»•i báº­t</h4>
                            <div className="space-y-2">
                                {topCats.map((cat, i) => (
                                    <div key={cat.categoryName} className="flex items-center gap-2 text-sm">
                                        <span className="w-6 text-muted-foreground font-mono">#{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-foreground">{cat.categoryName}</span>
                                                <span className="text-muted-foreground">{cat.borrowCount} lÆ°á»£t</span>
                                            </div>
                                            <Progress value={cat.borrowCount ? Math.min(100, (cat.borrowCount / (topCats[0]?.borrowCount || 1)) * 100) : 0} className="h-1.5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- KHá»I PHÃ‚N TÃCH Äá»˜C GIáº¢ --- */}
            <div className="grid gap-4 md:grid-cols-2">

                {/* Biá»ƒu Ä‘á»“ Histogram - PhÃ¢n bá»‘ Äá»™ tuá»•i */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>PhÃ¢n bá»‘ Äá»™ tuá»•i</CardTitle>
                        <CardDescription>NhÃ³m tuá»•i cá»§a Ä‘á»™c giáº£.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={ageHistogramData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="ageGroup" fontSize={12} tickLine={false} axisLine={false} width={60} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" name="Sá»‘ lÆ°á»£ng" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Biá»ƒu Ä‘á»“ Stacked Bar - TÃ¬nh tráº¡ng Ná»£ */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>TÃ¬nh tráº¡ng Ná»£</CardTitle>
                        <CardDescription>PhÃ¢n bá»‘ ná»£ theo loáº¡i Ä‘á»™c giáº£.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={debtStackedData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="readerType" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Bar dataKey="KhÃ´ng ná»£" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="DÆ°á»›i 50k" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="50k-100k" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="TrÃªn 100k" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* --- DANH SÃCH HOáº T Äá»˜NG Gáº¦N ÄÃ‚Y --- */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Nháº­t kÃ½ Há»‡ thá»‘ng</CardTitle>
                        <CardDescription>Hoáº¡t Ä‘á»™ng gáº§n Ä‘Ã¢y trong há»‡ thá»‘ng</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {auditLogs.length} hoáº¡t Ä‘á»™ng
                    </Badge>
                </CardHeader>
                <CardContent>
                    {auditLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">ChÆ°a cÃ³ hoáº¡t Ä‘á»™ng nÃ o Ä‘Æ°á»£c ghi nháº­n.</p>
                    ) : (
                        <div className="space-y-3">
                            {auditLogs.map((log) => (
                                <div key={log._id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                                    <div className={`mt-1 px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                                        {getActionIcon(log.action)} {log.action}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800">
                                            {log.description || `${log.action} trÃªn ${log.tableName}`}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                            <span className="font-medium">{log.userId?.fullName || 'Há»‡ thá»‘ng'}</span>
                                            <span>â€¢</span>
                                            <span>{log.tableName}</span>
                                            {log.recordId && (
                                                <>
                                                    <span>â€¢</span>
                                                    <span className="font-mono">#{log.recordId.slice(-6)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 whitespace-nowrap">
                                        {formatTimestamp(log.timestamp)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// ====================================================================================
// 2. LIBRARIAN DASHBOARD (Giá»‘ng Admin nhÆ°ng khÃ´ng cÃ³ Nháº­t kÃ½ Há»‡ thá»‘ng)
// ====================================================================================
const LibrarianDashboardView = ({ stats, categories, trend }: { stats: DashboardStats; categories: CategoryStat[]; trend: TrendStat[]; }) => {
    const barData = useMemo(() => trend?.map(t => ({ name: t.month, loans: t.loans, returns: t.returns })) ?? [], [trend]);
    const pieData = useMemo(() => categories?.map((c, i) => ({ name: c.categoryName, value: c.borrowCount, color: chartColors[i % chartColors.length] })) ?? [], [categories]);
    const topCats = (categories ?? []).slice(0, 3);
    const latestMonth = trend?.[trend.length - 1];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* --- KHá»I KPI CAO Cáº¤P --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tá»•ng Äá»™c giáº£</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.readers.total.toLocaleString('vi-VN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Hoáº¡t Ä‘á»™ng: {stats.readers.active.toLocaleString('vi-VN')} â€¢ Háº¿t háº¡n: {stats.readers.expired.toLocaleString('vi-VN')}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tá»•ng SÃ¡ch</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.books.total.toLocaleString('vi-VN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Äang cÃ³ sáºµn: {stats.books.available.toLocaleString('vi-VN')} | Äang mÆ°á»£n: {stats.books.borrowed.toLocaleString('vi-VN')}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">SÃ¡ch mÆ°á»£n/tráº£ (thÃ¡ng gáº§n nháº¥t)</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latestMonth ? latestMonth.loans.toLocaleString('vi-VN') : '-'}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tráº£: {latestMonth ? latestMonth.returns.toLocaleString('vi-VN') : '-'}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-600 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tiá»n pháº¡t chÆ°a thu</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.fines.unpaidTotal.toLocaleString('vi-VN')} â‚«</div>
                        <p className="text-[11px] text-muted-foreground mt-1">{stats.fines.unpaidCount} phiáº¿u thu</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- KHá»I BIá»‚U Äá»’ TRUNG TÃ‚M --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Biá»ƒu Ä‘á»“ Cá»™t (Bar Chart) - Thá»‘ng kÃª MÆ°á»£n/Tráº£ */}
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Thá»‘ng kÃª LÆ°u thÃ´ng</CardTitle>
                        <CardDescription>Sá»‘ lÆ°á»£ng sÃ¡ch mÆ°á»£n vÃ  tráº£ 7 thÃ¡ng gáº§n nháº¥t.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Bar dataKey="loans" name="SÃ¡ch MÆ°á»£n" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="returns" name="SÃ¡ch Tráº£" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Biá»ƒu Ä‘á»“ TrÃ²n (Pie Chart) - Tá»· lá»‡ Thá»ƒ loáº¡i */}
                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>PhÃ¢n bá»‘ Thá»ƒ loáº¡i</CardTitle>
                        <CardDescription>Tá»· lá»‡ lÆ°á»£t mÆ°á»£n theo danh má»¥c.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="mt-4 space-y-3">
                            <h4 className="text-sm font-semibold text-foreground">Danh má»¥c ná»•i báº­t</h4>
                            <div className="space-y-2">
                                {topCats.map((cat, i) => (
                                    <div key={cat.categoryName} className="flex items-center gap-2 text-sm">
                                        <span className="w-6 text-muted-foreground font-mono">#{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-foreground">{cat.categoryName}</span>
                                                <span className="text-muted-foreground">{cat.borrowCount} lÆ°á»£t</span>
                                            </div>
                                            <Progress value={cat.borrowCount ? Math.min(100, (cat.borrowCount / (topCats[0]?.borrowCount || 1)) * 100) : 0} className="h-1.5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

};

// ====================================================================================
// 3. MAIN PAGE COMPONENT
// ====================================================================================
export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [categories, setCategories] = useState<CategoryStat[]>([]);
    const [trend, setTrend] = useState<TrendStat[]>([]);
    const [readerAgeDistribution, setReaderAgeDistribution] = useState<ReaderAgeDistribution[]>([]);
    const [readerDebtStatus, setReaderDebtStatus] = useState<ReaderDebtStatus[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [role] = useState<'ADMIN' | 'LIBRARIAN' | null>(() => {
        // Äá»c role tá»« cookie (hoáº·c láº¥y tá»« context)
        const savedRole = Cookies.get('user_role') as 'ADMIN' | 'LIBRARIAN';
        return savedRole || null;
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const token = Cookies.get('access_token');
                if (!token) {
                    setError('PhiÃªn Ä‘Äƒng nháº­p Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i.');
                    setIsLoading(false);
                    return;
                }

                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                const headers = { 'Authorization': `Bearer ${token}` };

                const now = new Date();
                const startRange = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                const endRange = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

                const [statsRes, catRes, trendRes, ageDistRes, debtStatusRes, auditLogsRes] = await Promise.all([
                    fetch(`${baseUrl}/reports/dashboard`, { headers }),
                    fetch(`${baseUrl}/reports/borrow-by-category?startDate=${startRange.toISOString()}&endDate=${endRange.toISOString()}`, { headers }),
                    fetch(`${baseUrl}/reports/trend?months=7`, { headers }),
                    fetch(`${baseUrl}/reports/reader-age-distribution`, { headers }),
                    fetch(`${baseUrl}/reports/reader-debt-status`, { headers }),
                    fetch(`${baseUrl}/audit-logs/recent?limit=10`, { headers }),
                ]);

                if (statsRes.ok) {
                    setStats(await statsRes.json());
                } else {
                    setError('KhÃ´ng táº£i Ä‘Æ°á»£c thá»‘ng kÃª tá»•ng quan.');
                }

                if (catRes.ok) {
                    const catData = await catRes.json();
                    setCategories(Array.isArray(catData) ? catData : []);
                } else {
                    setCategories([]);
                }

                if (trendRes.ok) {
                    const trendData = await trendRes.json();
                    setTrend(Array.isArray(trendData) ? trendData : []);
                } else {
                    setTrend([]);
                }

                if (ageDistRes.ok) {
                    const ageDistData = await ageDistRes.json();
                    setReaderAgeDistribution(Array.isArray(ageDistData) ? ageDistData : []);
                } else {
                    setReaderAgeDistribution([]);
                }

                if (debtStatusRes.ok) {
                    const debtStatusData = await debtStatusRes.json();
                    setReaderDebtStatus(Array.isArray(debtStatusData) ? debtStatusData : []);
                } else {
                    setReaderDebtStatus([]);
                }

                if (auditLogsRes.ok) {
                    const auditLogsData = await auditLogsRes.json();
                    setAuditLogs(Array.isArray(auditLogsData) ? auditLogsData : []);
                } else {
                    setAuditLogs([]);
                }
            } catch (err) {
                console.error('Dashboard fetch error', err);
                setError('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u dashboard.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (!role) return null; // Hoáº·c Loading Skeleton

    return (
        <div className="space-y-6 pb-10">
            {/* Header ChÃ o má»«ng */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {role === 'ADMIN' ? 'Tá»•ng quan Há»‡ thá»‘ng' : 'BÃ n lÃ m viá»‡c'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {role === 'ADMIN'
                            ? 'ChÃ o Admin, Ä‘Ã¢y lÃ  bÃ¡o cÃ¡o hiá»‡u suáº¥t toÃ n há»‡ thá»‘ng.'
                            : `Xin chÃ o, chÃºc báº¡n má»™t ngÃ y lÃ m viá»‡c nÄƒng suáº¥t!`
                        }
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thá»i gian há»‡ thá»‘ng</p>
                    <p className="text-xl font-mono text-slate-700 font-medium">
                        {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-500">
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Render ná»™i dung tÆ°Æ¡ng á»©ng */}
            <div className="mt-6">
                {isLoading && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 text-sm text-muted-foreground">Äang táº£i dá»¯ liá»‡u dashboard...</CardContent>
                    </Card>
                )}

                {error && !isLoading && (
                    <Card className="shadow-sm border-red-200 bg-red-50 text-red-800">
                        <CardContent className="p-4 text-sm">{error}</CardContent>
                    </Card>
                )}

                {!isLoading && !error && stats && (
                    role === 'ADMIN'
                        ? <AdminDashboardView 
                            stats={stats} 
                            categories={categories} 
                            trend={trend} 
                            readerAgeDistribution={readerAgeDistribution}
                            readerDebtStatus={readerDebtStatus}
                            auditLogs={auditLogs} 
                        />
                        : <LibrarianDashboardView stats={stats} categories={categories} trend={trend} />
                )}
            </div>
        </div>
    );
}
