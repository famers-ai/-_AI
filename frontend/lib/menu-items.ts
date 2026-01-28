import { LayoutDashboard, Stethoscope, Sprout, TrendingUp, FileText, Mic } from "lucide-react";

export const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "AI Crop Doctor", href: "/crop-doctor", icon: Stethoscope },
    { name: "Pest Forecast", href: "/pest-forecast", icon: Sprout },
    { name: "Market Prices", href: "/market-prices", icon: TrendingUp },
    { name: "Weekly Report", href: "/reports", icon: FileText },
    { name: "Voice Log", href: "/voice-log", icon: Mic },
];
