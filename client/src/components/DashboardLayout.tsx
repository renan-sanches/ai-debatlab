import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  LogOut,
  History,
  Moon,
  Sun,
  Plus,
  User2,
  Trophy,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: History, label: "History", path: "/library" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { loading, user, firebaseUser, refresh } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  // Firebase user exists but server hasn't confirmed yet – keep loading
  // instead of showing "Sign in" (avoids false redirect-loop after login).
  if (!user && firebaseUser) {
    // Temporary debug log: remove after auth migration stabilises.
    console.warn("[DashboardLayout] Firebase user present but server user null – retrying…");
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to
              launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-blue-500/20"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayoutContent
      sidebarWidth={sidebarWidth}
      setSidebarWidth={setSidebarWidth}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    >
      {children}
    </DashboardLayoutContent>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
};

function DashboardLayoutContent({
  children,
  sidebarWidth,
  setSidebarWidth,
  isCollapsed,
  setIsCollapsed,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const actualWidth = isCollapsed ? 72 : sidebarWidth;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        style={{ width: actualWidth } as CSSProperties}
        className="h-full bg-white dark:bg-[#05080f] border-r border-border flex flex-col justify-between flex-shrink-0 transition-all duration-200 relative z-20"
      >
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
                <span className="material-symbols-outlined text-sm">analytics</span>
              </div>
              {!isCollapsed && (
                <span className="text-lg font-bold tracking-tight text-foreground">
                  Debate<span className="text-primary">Lab</span>
                </span>
              )}
            </button>
          </div>

          {/* New Debate Button */}
          <div className="p-4 mt-[50px]">
            <Button
              onClick={() => setLocation("/")}
              className={`bg-primary hover:bg-primary/90 text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 rounded-xl h-11 ${
                isCollapsed ? "w-11 p-0" : "w-full"
              }`}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>New Debate</span>}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="px-3 space-y-1">
            {!isCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Navigation
              </p>
            )}
            {menuItems.map((item) => {
              const isActive =
                location === item.path ||
                (item.path === "/" && location === "/");
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg w-full transition-colors relative ${
                    isActive
                      ? "text-primary bg-blue-50 dark:bg-blue-900/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-primary" : ""
                    }`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {!isCollapsed ? (
            <div className="bg-muted/50 rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                VERSION
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground font-semibold">
                  DebateLab v1.4.2
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
        >
          <ChevronLeft
            className={`h-3 w-3 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
            onMouseDown={() => setIsResizing(true)}
            style={{ zIndex: 50 }}
          />
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-white dark:bg-[#05080f] flex items-center justify-between px-6 z-10 sticky top-0 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Breadcrumb or context can go here */}
          </div>

          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                STATUS: READY
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full hover:opacity-80 transition-opacity">
                    <div className="hidden lg:block text-right">
                      <p className="text-sm font-semibold text-foreground leading-none">
                        {user?.name || "User"}
                      </p>
                      <p className="text-[10px] text-primary mt-0.5 font-medium">
                        Premium Plan
                      </p>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-white dark:border-card shadow-lg shadow-blue-500/20">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl p-2"
                >
                  <DropdownMenuItem
                    onClick={() => setLocation("/account")}
                    className="cursor-pointer rounded-lg p-3"
                  >
                    <User2 className="mr-3 h-4 w-4" />
                    <span className="font-medium text-sm">Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocation("/settings")}
                    className="cursor-pointer rounded-lg p-3"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    <span className="font-medium text-sm">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLocation("/leaderboard")}
                    className="cursor-pointer rounded-lg p-3"
                  >
                    <Trophy className="mr-3 h-4 w-4" />
                    <span className="font-medium text-sm">Leaderboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive rounded-lg p-3"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium text-sm">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">{children}</main>
      </div>
    </div>
  );
}
