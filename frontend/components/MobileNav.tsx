"use client";

import { Home, Camera, BarChart3, Settings, LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
    icon: LucideIcon;
    label: string;
    path: string;
}

const NAV_ITEMS: NavItem[] = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Camera, label: "Diagnose", path: "/crop-doctor" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/admin" }
];

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <>
            {/* Spacer to prevent content from being hidden behind fixed nav */}
            <div className="h-20 md:hidden" />

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
                <div className="flex justify-around items-center h-16">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${isActive
                                        ? 'text-purple-600'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <div className={`relative ${isActive ? 'animate-pulse-glow' : ''}`}>
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    {isActive && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full" />
                                    )}
                                </div>
                                <span className={`text-xs mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
