import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Home, FileImage, Users, AlertTriangle, LifeBuoy } from "lucide-react";

const menuItems = [
    {
        title: "Home",
        url: "/admin",
        icon: Home,
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
        title: "Reported Posts",
        url: "/admin/reports",
        icon: AlertTriangle,
    },
    {
        title: "Support",
        url: "/admin/supports",
        icon: LifeBuoy,
    },
];

export function AdminMobileHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleNavigation = (url: string) => {
        navigate(url);
        setIsOpen(false);
    };

    return (
        <>
            {/* Mobile Header - Only visible on mobile */}
            <header className="md:hidden sticky top-0 z-40 w-full bg-background border-b border-border">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">A</span>
                        </div>
                        <h1 className="font-semibold text-primary">Fijoli Admin</h1>
                    </div>

                    <button
                        onClick={toggleMenu}
                        className="p-2 hover:bg-accent rounded-lg touch-target"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="md:hidden fixed top-14 right-0 left-0 bg-background border-b border-border shadow-lg z-30">
                    <nav className="p-2">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.url;
                            return (
                                <button
                                    key={item.title}
                                    onClick={() => handleNavigation(item.url)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg touch-target transition-colors ${isActive
                                            ? "bg-accent text-accent-foreground font-medium"
                                            : "hover:bg-accent/50"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    <span>{item.title}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            )}
        </>
    );
}
