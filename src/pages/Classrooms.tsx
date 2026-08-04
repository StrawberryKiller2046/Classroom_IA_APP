import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, School, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { createClassroom, deleteClassroom, listStudents, listClassrooms } from "@/lib/api"
import type { Classroom } from "@/types/database"
import { GRADES } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await listClassrooms()
      setClassrooms(data)
      const counts = await Promise.all(
        data.map(async (c) => [c.id, (await listStudents(c.id)).length] as const)
      )
      setStudentCounts(Object.fromEntries(counts))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const onDelete = async (classroom: Classroom) => {
    const ok = window.confirm(
      `¿Eliminar "${classroom.name}"? Esto también borra sus estudiantes e historial de calificaciones. No se puede deshacer.`
    )
    if (!ok) return
    try {
      await deleteClassroom(classroom.id)
      toast.success("Salón eliminado")
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el salón")
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Salones</h1>
          <p className="text-muted-foreground">
            Una lista por grupo de grado — vincula actividades de cualquier materia.
          </p>
        </div>
        <CreateClassroomDialog
          open={open}
          onOpenChange={setOpen}
          onCreated={() => {
            setOpen(false)
            refresh()
          }}
        />
      </div>

      {!loading && classrooms.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <School className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Aún no hay salones</p>
              <p className="text-sm text-muted-foreground">Crea uno para empezar a llevar el control de estudiantes y calificaciones.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classrooms.map((classroom) => (
          <Card
            key={classroom.id}
            className="relative h-full transition-colors hover:border-primary/40 hover:bg-accent/30"
          >
            <Link to={`/classrooms/${classroom.id}`} className="block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 pr-8 text-base">
                  <School className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{classroom.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Badge variant="secondary" className="w-fit">
                  {classroom.grade}
                </Badge>
                <div className="flex items-center gap-1.5 border-t pt-3 font-mono text-sm text-muted-foreground">
                  <Users className="size-3.5" />
                  {studentCounts[classroom.id] ?? 0} estudiantes
                </div>
              </CardContent>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar salón"
              className="absolute right-2 top-2"
              onClick={() => onDelete(classroom)}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CreateClassroomDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async () => {
    if (!name || !grade) return
    setSubmitting(true)
    try {
      await createClassroom({ name, grade })
      setName("")
      setGrade("")
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el salón")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nuevo salón
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo salón</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. 5A" />
          </div>
          <div className="grid gap-1.5">
            <Label>Grado</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un grado" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
