import { NavLink, Outlet } from "react-router-dom"
import { GraduationCap, LayoutDashboard, School, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "Generator", icon: Sparkles, end: true },
  { to: "/classrooms", label: "Classrooms", icon: School },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

export default function AppShell() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30 md:flex-row">
      <aside className="hidden shrink-0 border-r bg-background md:flex md:w-60 md:flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" />
          </div>
          <span className="font-semibold tracking-tight">Classroom AI</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">Classroom AI</span>
          </div>
        </header>

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
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
