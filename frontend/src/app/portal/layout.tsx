'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
    Home, Users, Book, ArrowLeftRight, Receipt,
    BarChart3, Database, Laptop, LogOut, User,
    Sliders, Menu, Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type Role = 'ADMIN' | 'LIBRARIAN';

// Config Menu
const MENU_CONFIG = [
    {
        group: "Tổng quan",
        items: [
            { name: "Dashboard", href: "/portal/dashboard", icon: Home, roles: ['ADMIN', 'LIBRARIAN'] }
        ]
    },
    {
        group: "Quản trị hệ thống",
        items: [
            { name: "Quản lý Người dùng", href: "/portal/users", icon: Users, roles: ['ADMIN'] },
            { name: "Quy định & Tham số", href: "/portal/regulations", icon: Sliders, roles: ['ADMIN'] },
            { name: "Dữ liệu tham chiếu", href: "/portal/references", icon: Database, roles: ['ADMIN'] },
        ]
    },
    {
        group: "Nghiệp vụ Thư viện",
        items: [
            { name: "Quản lý Độc giả", href: "/portal/readers", icon: User, roles: ['LIBRARIAN', 'ADMIN'] },
            { name: "Quản lý Sách", href: "/portal/books", icon: Book, roles: ['LIBRARIAN', 'ADMIN'] },
            { name: "Mượn - Trả sách", href: "/portal/circulation/loans", icon: ArrowLeftRight, roles: ['LIBRARIAN', 'ADMIN'] },
            { name: "Thu tiền phạt", href: "/portal/circulation/fines", icon: Receipt, roles: ['LIBRARIAN', 'ADMIN'] },
        ]
    },
    {
        group: "Báo cáo & Tiện ích",
        items: [
            { name: "Báo cáo thống kê", href: "/portal/reports", icon: BarChart3, roles: ['ADMIN', 'LIBRARIAN'] },
            { name: "Cài đặt ứng dụng", href: "/portal/system", icon: Laptop, roles: ['ADMIN', 'LIBRARIAN'] },
        ]
    }
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [role, setRole] = useState<Role | null>(null);
    const [userName, setUserName] = useState<string>("Người dùng");
    const [avatarUrl, setAvatarUrl] = useState<string>("");

    useEffect(() => {
        // FIX: Wrap logic in setTimeout to prevent synchronous state update error
        const timeout = setTimeout(async () => {
            const savedRole = Cookies.get('user_role') as Role;
            const savedName = Cookies.get('user_name');
            const userId = Cookies.get('user_id');
            const token = Cookies.get('access_token');

            // 1. Check Login
            if (!savedRole) {
                router.replace('/auth/login');
                return;
            }

            // 2. Security Check (Role vs URL)
            const restrictedPaths = ['/portal/users', '/portal/regulations', '/portal/references'];
            if (savedRole === 'LIBRARIAN' && restrictedPaths.some(path => pathname.startsWith(path))) {
                router.replace('/portal/dashboard');
                return;
            }

            // 3. Success -> Update State
            setRole(savedRole);
            if (savedName) setUserName(savedName);
            setIsAuthorized(true);

            // 4. Fetch Avatar
            if (userId && token) {
                try {
                    const res = await fetch(`http://localhost:4000/api/users/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (res.ok) {
                        const text = await res.text();
                        if (text) {
                            try {
                                const data = JSON.parse(text);
                                if (data.avatar) {
                                    setAvatarUrl(`http://localhost:4000${data.avatar}`);
                                }
                            } catch (e) {
                                console.error("Error parsing user avatar response:", e);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch user avatar", error);
                }
            }
        }, 0); // 0ms delay breaks the sync cycle

        return () => clearTimeout(timeout);
    }, [pathname, router]);

    useEffect(() => {
        const handleAvatarUpdate = (event: CustomEvent) => {
            setAvatarUrl(event.detail);
        };

        window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);

        return () => {
            window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
        };
    }, []);

    const handleLogout = () => {
        Cookies.remove('user_role');
        Cookies.remove('user_name');
        router.replace('/auth/login');
    };

    // Show Loading
    if (!isAuthorized || !role) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Đang xác thực...</p>
            </div>
        );
    }

    // Filter Menu based on Role
    const filteredMenu = MENU_CONFIG.map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(role))
    })).filter(group => group.items.length > 0);

    return (
        <div className="min-h-screen bg-background flex font-sans text-foreground">
            {/* SIDEBAR */}
            <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:flex flex-col fixed h-full z-20 shadow-sm">
                <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                    <div className="p-2 bg-sidebar-primary rounded-lg mr-3 shadow-sm shadow-black/20">
                        <Book className="w-5 h-5 text-sidebar-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg text-sidebar-foreground tracking-tight">LibraryPro</span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-sidebar-border">
                    {filteredMenu.map((group, idx) => (
                        <div key={idx} className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                            <h3 className="px-3 text-[11px] font-bold text-sidebar-foreground/70 uppercase tracking-wider mb-2">
                                {group.group}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link key={item.href} href={item.href} className="block group">
                                            <span className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                                : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                }`}>
                                                <item.icon className={`w-4 h-4 transition-colors ${isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"}`} />
                                                {item.name}
                                            </span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
                    <div className="flex items-center gap-3 px-2">
                        <Avatar className="h-9 w-9 border ring-2 ring-sidebar-border shadow-sm">
                            <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                            <AvatarFallback className={role === 'ADMIN' ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-emerald-600 text-white'}>
                                {role === 'ADMIN' ? 'AD' : 'LB'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-sidebar-foreground truncate">
                                {userName}
                            </p>
                            <Badge variant="outline" className={`h-4 px-1.5 text-[10px] border-0 mt-0.5 ${role === 'ADMIN' ? 'bg-sidebar-primary/20 text-sidebar-primary' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                {role}
                            </Badge>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all">
                {/* HEADER */}
                <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Trigger */}
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="w-5 h-5 text-muted-foreground" />
                        </Button>

                        <h2 className="text-lg font-semibold text-foreground tracking-tight">
                            {MENU_CONFIG.flatMap(g => g.items).find(i => i.href === pathname)?.name || 'Cổng thông tin'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/40">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                                        <AvatarFallback className="bg-muted text-foreground">
                                            {role === 'ADMIN' ? 'A' : 'L'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 shadow-lg border border-border bg-card">
                                <DropdownMenuLabel className="text-foreground">Tài khoản</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/portal/profile" className="cursor-pointer w-full flex items-center">
                                        <User className="mr-2 h-4 w-4 text-muted-foreground" /> Hồ sơ cá nhân
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer w-full flex items-center text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}