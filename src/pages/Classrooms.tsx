import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, School, Users } from "lucide-react"
import { toast } from "sonner"
import { createClassroom, listStudents, listClassrooms } from "@/lib/api"
import type { Classroom } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classrooms</h1>
          <p className="text-muted-foreground">Manage your classrooms, students, and grading.</p>
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
              <p className="font-medium">No classrooms yet</p>
              <p className="text-sm text-muted-foreground">Create one to start tracking students and grades.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classrooms.map((classroom) => (
          <Link key={classroom.id} to={`/classrooms/${classroom.id}`}>
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <School className="size-4 text-muted-foreground" />
                  {classroom.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{classroom.subject}</Badge>
                  <Badge variant="secondary">{classroom.grade}</Badge>
                </div>
                <div className="flex items-center gap-1.5 border-t pt-3 font-mono text-sm text-muted-foreground">
                  <Users className="size-3.5" />
                  {studentCounts[classroom.id] ?? 0} students
                </div>
              </CardContent>
            </Card>
          </Link>
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
  const [subject, setSubject] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async () => {
    if (!name || !grade || !subject) return
    setSubmitting(true)
    try {
      await createClassroom({ name, grade, subject })
      setName("")
      setGrade("")
      setSubject("")
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create classroom")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New classroom
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New classroom</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 5A Science" />
          </div>
          <div className="grid gap-1.5">
            <Label>Grade</Label>
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 5th Grade" />
          </div>
          <div className="grid gap-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Science" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitting}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
