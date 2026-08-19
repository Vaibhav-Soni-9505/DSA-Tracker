import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  Settings,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
} from "lucide-react";
import { useTheme } from "@/app/providers";
import { useAuth } from "@/features/auth/AuthContext";
import { SimulatedDateControl } from "@/components/shared/SimulatedDateControl";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/sheet", icon: BookOpen, label: "A2Z Sheet" },
  { to: "/revision", icon: RotateCcw, label: "Revision" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order = ["light", "dark", "system"] as const;
    const currentIndex = order.indexOf(theme);
    const next = order[(currentIndex + 1) % order.length];
    setTheme(next);
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label =
    theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title={`Theme: ${label}`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

export default function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col bg-background md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        {/* Logo / App Name */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-sidebar-foreground">
            A2Z DSA Tracker
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, icon: NavIcon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <NavIcon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User / Theme Toggle */}
        <div className="border-t border-border p-3 space-y-2">
          {isAuthenticated ? (
            <div className="mb-2 flex flex-col gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2 px-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[140px]">{user?.name}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="mb-2 border-b border-border pb-3">
              <button
                onClick={() => navigate("/login")}
                className="flex w-full items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          <ThemeToggle />
          {/* Simulated Date Controls (Development Only) */}
          {import.meta.env.DEV && <SimulatedDateControl />}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="flex shrink-0 items-center justify-around border-t border-border bg-background px-2 py-2 md:hidden">
        {navItems.map(({ to, icon: NavIcon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <NavIcon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </NavLink>
        ))}
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <User className="h-5 w-5" />
          </button>
        )}
      </nav>
    </div>
  );
}
