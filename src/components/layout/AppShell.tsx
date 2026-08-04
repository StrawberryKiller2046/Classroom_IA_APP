import { NavLink, Outlet } from "react-router-dom"
import {
  CalendarDays,
  FlaskConical,
  History,
  LayoutDashboard,
  School,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { isSupabaseConfigured } from "@/lib/supabase"
import Logo from "@/components/layout/Logo"

const NAV_ITEMS = [
  { to: "/", label: "Generador", icon: Sparkles, end: true },
  { to: "/history", label: "Historial", icon: History },
  { to: "/classrooms", label: "Salones", icon: School },
  { to: "/planner", label: "Planificador", icon: CalendarDays },
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard },
]

export default function AppShell() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30 md:flex-row">
      <aside className="hidden shrink-0 bg-background shadow-[2px_0_12px_-2px_rgb(0_0_0_/_0.08)] md:flex md:w-60 md:flex-col">
        <div className="flex items-center gap-2.5 border-b px-5 py-4">
          <Logo className="size-8" />
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
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                  isActive
                    ? "bg-primary/12 font-semibold text-primary"
                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
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
            <Logo className="size-7" />
            <span className="font-semibold tracking-tight">Classroom AI</span>
          </div>
        </header>

        {!isSupabaseConfigured && (
          <div className="flex items-center gap-2 border-b bg-warning/15 px-4 py-2 text-sm text-warning-foreground">
            <FlaskConical className="size-4 shrink-0" strokeWidth={2} />
            <span>Modo demo: los datos de muestra se guardan solo en este dispositivo. Conecta Supabase para hacerlo real.</span>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">
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
