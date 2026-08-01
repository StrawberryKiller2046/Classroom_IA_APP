import { NavLink, Outlet } from "react-router-dom"
import { FlaskConical, GraduationCap, History, LayoutDashboard, School, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { isSupabaseConfigured } from "@/lib/supabase"

const NAV_ITEMS = [
  { to: "/", label: "Generator", icon: Sparkles, end: true },
  { to: "/history", label: "History", icon: History },
  { to: "/classrooms", label: "Classrooms", icon: School },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

export default function AppShell() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30 md:flex-row">
      <aside className="hidden shrink-0 border-r bg-background md:flex md:w-60 md:flex-col">
        <div className="flex items-center gap-2.5 border-b px-5 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" strokeWidth={2} />
          </div>
          <span className="font-semibold tracking-tight">Classroom AI</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-primary/8 text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="size-4" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" strokeWidth={2} />
            </div>
            <span className="font-semibold tracking-tight">Classroom AI</span>
          </div>
        </header>

        {!isSupabaseConfigured && (
          <div className="flex items-center gap-2 border-b bg-warning/15 px-4 py-2 text-sm text-warning-foreground">
            <FlaskConical className="size-4 shrink-0" strokeWidth={2} />
            <span>Demo mode: sample data stored on this device only. Connect Supabase to make it real.</span>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors duration-150",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="size-5" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
