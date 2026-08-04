import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, Download, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteLessonPlan, listLessonPlans } from "@/lib/api"
import { downloadExcel } from "@/lib/excel"
import type { LessonPlan } from "@/types/database"
import { WEEKDAYS } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function exportPlan(plan: LessonPlan) {
  downloadExcel(
    plan.periods,
    [
      { header: "Hora", cell: (p) => p.time_label },
      ...WEEKDAYS.map((day) => ({
        header: day.label,
        cell: (p: LessonPlan["periods"][number]) => p[day.key],
      })),
    ],
    plan.name
  )
}

export default function Planner() {
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  const refresh = async () => {
    setLoading(true)
    try {
      setPlans(await listLessonPlans())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return plans
    return plans.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.grade ?? "").toLowerCase().includes(q)
    )
  }, [plans, query])

  const onDelete = async (id: string) => {
    try {
      await deleteLessonPlan(id)
      toast.success("Plan de clase eliminado")
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el plan de clase")
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planificador de Clases</h1>
          <p className="text-muted-foreground">Arma un horario semanal y descárgalo cuando lo necesites.</p>
        </div>
        <Button asChild>
          <Link to="/planner/new">
            <Plus />
            Nuevo plan
          </Link>
        </Button>
      </div>

      {plans.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar planes por nombre o grado"
            className="pl-9"
          />
        </div>
      )}

      {!loading && plans.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarDays className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Aún no hay planes de clase</p>
              <p className="text-sm text-muted-foreground">Crea uno para empezar a armar tu horario semanal.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && plans.length > 0 && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Search className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Ningún plan coincide con "{query}".</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {filtered.map((plan) => (
          <Card key={plan.id} className="overflow-hidden py-0">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <Link to={`/planner/${plan.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium hover:underline">{plan.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {plan.grade && <Badge variant="secondary">{plan.grade}</Badge>}
                  <Badge variant="outline">{plan.periods.length} períodos</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    Actualizado{" "}
                    {new Date(plan.updated_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Descargar plan de clase"
                  onClick={() => exportPlan(plan)}
                >
                  <Download className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar plan de clase"
                  onClick={() => onDelete(plan.id)}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
