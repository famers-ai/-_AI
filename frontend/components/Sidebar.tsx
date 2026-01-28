"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import clsx from "clsx";

import { menuItems } from "@/lib/menu-items";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-sm hidden md:flex">
            {/* Brand */}
            <div className="p-6 border-b border-slate-100">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                    ForHuman AI
                </h1>
                <p className="text-xs text-slate-500 mt-1">Smart Agronomist</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon size={18} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500">
                    <Settings size={16} />
                    <span>v2.0 Pro</span>
                </div>
            </div>
        </div>
    );
}
