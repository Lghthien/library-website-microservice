'use client';

import { useEffect, useState } from 'react';
import {
    Palette, Globe, Bell, Moon, Sun,
    CheckCircle2, Monitor, Laptop
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/components/ui/ToastContext';

type ThemeOption = 'light' | 'dark' | 'system';
type AccentOption = 'blue' | 'violet' | 'green' | 'rose' | 'orange';
type LanguageOption = 'vi' | 'en' | 'jp';
type DateFormatOption = 'dmy' | 'mdy' | 'ymd';

interface SystemSettings {
    theme: ThemeOption;
    color: AccentOption;
    language: LanguageOption;
    dateFormat: DateFormatOption;
    emailReminder: boolean;
    systemToast: boolean;
}

const SETTINGS_KEY = 'librarypro:system-settings';

const defaultSettings: SystemSettings = {
    theme: 'light',
    color: 'blue',
    language: 'vi',
    dateFormat: 'dmy',
    emailReminder: true,
    systemToast: true,
};

export default function SystemAppPage() {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
    const [draftSettings, setDraftSettings] = useState<SystemSettings>(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);

    // Load persisted settings
    useEffect(() => {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<SystemSettings>;
                const merged = { ...defaultSettings, ...parsed };
                setSettings(merged);
                setDraftSettings(merged);
            }
        } catch (error) {
            console.error('Failed to load system settings', error);
        }
    }, []);

    // Apply theme to the entire document and stay in sync with system changes
    useEffect(() => {
        const root = document.documentElement;
        const setThemeClass = (isDark: boolean) => {
            root.classList.toggle('dark', isDark);
            root.classList.toggle('light', !isDark);
            root.style.colorScheme = isDark ? 'dark' : 'light';
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        if (settings.theme === 'system') {
            setThemeClass(mediaQuery.matches);
            const handleChange = (event: MediaQueryListEvent) => setThemeClass(event.matches);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        setThemeClass(settings.theme === 'dark');
        return undefined;
    }, [settings.theme]);

    // Apply accent color to global CSS variables so the whole UI follows the selection
    useEffect(() => {
        const root = document.documentElement;
        const palette: Record<AccentOption, {
            primary: string;
            primaryForeground: string;
            ring: string;
            hue: string;
        }> = {
            blue: { primary: '#2563eb', primaryForeground: '#f8fafc', ring: '#93c5fd', hue: '265' },
            violet: { primary: '#7c3aed', primaryForeground: '#f8fafc', ring: '#c4b5fd', hue: '290' },
            green: { primary: '#10b981', primaryForeground: '#f8fafc', ring: '#6ee7b7', hue: '150' },
            rose: { primary: '#e11d48', primaryForeground: '#fff7fb', ring: '#fda4af', hue: '0' },
            orange: { primary: '#f97316', primaryForeground: '#fff7ed', ring: '#fdba74', hue: '45' },
        };

        const accent = palette[settings.color];
        root.style.setProperty('--primary', accent.primary);
        root.style.setProperty('--primary-foreground', accent.primaryForeground);
        root.style.setProperty('--ring', accent.ring);
        root.style.setProperty('--accent', accent.primary);
        root.style.setProperty('--accent-foreground', accent.primaryForeground);
        root.style.setProperty('--sidebar-primary', accent.primary);
        root.style.setProperty('--sidebar-primary-foreground', accent.primaryForeground);
        root.style.setProperty('--accent-color', accent.primary);
        
        // Apply Dynamic Hue for Tinting
        root.style.setProperty('--app-hue', accent.hue);
    }, [settings.color]);

    const handleSave = () => {
        setIsSaving(true);
        setSettings(draftSettings); // Apply changes
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(draftSettings));
        showToast('Đã áp dấn cài đặt', 'success');
        setTimeout(() => setIsSaving(false), 400);
    };

    const handleReset = () => {
        setSettings(defaultSettings);
        setDraftSettings(defaultSettings);
        localStorage.removeItem(SETTINGS_KEY);
        showToast('Đã khôi phục mặc định', 'info');
    };

    const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        setDraftSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cài đặt Ứng dụng</h1>
                <p className="text-sm text-slate-500">Tùy chỉnh giao diện và trải nghiệm cá nhân.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- 1. GIAO DIỆN (Appearance) --- */}
                <Card className="md:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Palette className="w-5 h-5 text-blue-600" />
                            Giao diện & Hiển thị
                        </CardTitle>
                        <CardDescription>Chọn màu sắc và chế độ hiển thị phù hợp với mắt của bạn.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Chế độ Sáng/Tối */}
                        <div className="space-y-3">
                            <Label>Chế độ nền</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div
                                    className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-slate-50 transition-all ${draftSettings.theme === 'light' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200'}`}
                                    onClick={() => updateSetting('theme', 'light')}
                                >
                                    <Sun className="w-6 h-6 text-orange-500" />
                                    <span className="font-medium text-sm">Sáng</span>
                                </div>
                                <div
                                    className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-slate-50 transition-all ${draftSettings.theme === 'dark' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200'}`}
                                    onClick={() => updateSetting('theme', 'dark')}
                                >
                                    <Moon className="w-6 h-6 text-slate-600" />
                                    <span className="font-medium text-sm">Tối</span>
                                </div>
                                <div
                                    className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-slate-50 transition-all ${draftSettings.theme === 'system' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200'}`}
                                    onClick={() => updateSetting('theme', 'system')}
                                >
                                    <Monitor className="w-6 h-6 text-slate-400" />
                                    <span className="font-medium text-sm">Hệ thống</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Màu chủ đạo */}
                        <div className="space-y-3">
                            <Label>Màu chủ đạo</Label>
                            <div className="flex gap-4">
                                {['blue', 'violet', 'green', 'rose', 'orange'].map((c) => (
                                    <div
                                        key={c}
                                        onClick={() => updateSetting('color', c as AccentOption)}
                                        className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center border-2 transition-all shadow-sm
                      ${c === 'blue' ? 'bg-blue-600' : ''}
                      ${c === 'violet' ? 'bg-violet-600' : ''}
                      ${c === 'green' ? 'bg-emerald-600' : ''}
                      ${c === 'rose' ? 'bg-rose-600' : ''}
                      ${c === 'orange' ? 'bg-orange-600' : ''}
                      ${draftSettings.color === c ? 'border-slate-900 scale-110 ring-2 ring-offset-2 ring-slate-300' : 'border-transparent'}
                    `}
                                    >
                                        {draftSettings.color === c && <CheckCircle2 className="w-5 h-5 text-white" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- 2. NGÔN NGỮ (Language) --- */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="w-5 h-5 text-blue-600" />
                            Ngôn ngữ & Khu vực
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Ngôn ngữ hiển thị</Label>
                            <Select value={draftSettings.language} onValueChange={(v) => updateSetting('language', v as LanguageOption)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn ngôn ngữ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vi">Tiếng Việt (Vietnamese)</SelectItem>
                                    <SelectItem value="en">Tiếng Anh (English)</SelectItem>
                                    <SelectItem value="jp">Tiếng Nhật (Japanese)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Định dạng ngày tháng</Label>
                            <Select value={draftSettings.dateFormat} onValueChange={(v) => updateSetting('dateFormat', v as DateFormatOption)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dmy">DD/MM/YYYY (31/12/2025)</SelectItem>
                                    <SelectItem value="mdy">MM/DD/YYYY (12/31/2025)</SelectItem>
                                    <SelectItem value="ymd">YYYY-MM-DD (2025-12-31)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* --- 3. THÔNG BÁO (Notifications) --- */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bell className="w-5 h-5 text-blue-600" />
                            Cấu hình Thông báo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Email nhắc nhở</Label>
                                <p className="text-xs text-slate-500">Tự động gửi email cho độc giả khi sách sắp hết hạn.</p>
                            </div>
                            <Switch checked={draftSettings.emailReminder} onCheckedChange={(v) => updateSetting('emailReminder', v)} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Thông báo hệ thống</Label>
                                <p className="text-xs text-slate-500">Hiển thị popup (Toast) khi thao tác thành công.</p>
                            </div>
                            <Switch checked={draftSettings.systemToast} onCheckedChange={(v) => updateSetting('systemToast', v)} />
                        </div>
                    </CardContent>
                </Card>

            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleReset}>Khôi phục mặc định</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : 'Áp dụng cài đặt'}
                </Button>
            </div>
        </div>
    );
}