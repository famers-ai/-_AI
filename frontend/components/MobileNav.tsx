"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { menuItems } from "@/lib/menu-items";

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <div className="md:hidden">
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                aria-label="Open menu"
            >
                <Menu size={24} />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
            )}

            {/* Drawer */}
            <div
                className={clsx(
                    "fixed top-0 left-0 z-50 h-full w-[280px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-4 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                ForHuman AI
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">Smart Agronomist</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={clsx(
                                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon size={20} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="pt-4 mt-auto border-t border-slate-100 text-xs text-slate-400 text-center">
                        v2.0 Mobile
                    </div>
                </div>
            </div>
        </div>
    );
}
