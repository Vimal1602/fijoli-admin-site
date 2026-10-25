import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileImage,
  Users,
  AlertTriangle,
  LifeBuoy,
  Star,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

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
    title: "Reported Posts",
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

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    return isActive(path)
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50";
  };

  return (
    <Sidebar
      className={isCollapsed ? "w-14 md:w-14" : "w-60 md:w-60"}
      collapsible="icon"
    >
      <div className="p-3 md:p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="font-semibold text-sidebar-foreground truncate">Fijoli Admin</h2>
              <p className="text-xs text-sidebar-foreground/60 truncate">Fitness Social</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="touch-target">
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="p-3 md:p-4 border-t border-sidebar-border mt-auto">
        <SidebarTrigger className="w-full touch-target" />
      </div>
    </Sidebar>
  );
}