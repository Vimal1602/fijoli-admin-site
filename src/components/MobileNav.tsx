import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LayoutDashboard, FileImage, Users, AlertTriangle, LifeBuoy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
    {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Posts",
        url: "/admin/posts",
        icon: FileImage,
    },
    {
        title: "Users",
        url: "/admin/users",
        icon: Users,
    },
    {
        title: "Reports",
        url: "/admin/reports",
        icon: AlertTriangle,
    },
    {
        title: "Support",
        url: "/admin/supports",
        icon: LifeBuoy,
    },
    {
        title: "Reviews",
        url: "/admin/reviews",
        icon: Star,
    },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Button - Mobile Only */}
            <button
                onClick={toggleMenu}
                className="md:hidden fixed top-4 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-lg shadow-lg touch-target"
                aria-label="Toggle menu"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={closeMenu}
                />
            )}

            {/* Right Sidebar */}
            <div
                className={`md:hidden fixed top-0 right-0 h-full w-64 bg-background border-l border-border shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-bold text-foreground">Navigation</h2>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.title}
                                to={item.url}
                                onClick={closeMenu}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors touch-target"
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                <span className="font-medium">{item.title}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center">
                            Fitness Social Admin
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
