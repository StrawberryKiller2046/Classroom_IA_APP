import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { LayoutDashboard, School } from "lucide-react"
import {
  listActivities,
  listClassrooms,
  listGradingResultsForClassroom,
  listStudents,
} from "@/lib/api"
import type { Activity, Classroom, GradingResult, Student } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Stat, StatStrip } from "@/components/ui/stat"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ClassroomStats {
  classroom: Classroom
  studentCount: number
  activityCount: number
  subjects: string[]
  average: number | null
  lastActivityAt: string | null
}

export default function Dashboard() {
  const [rows, setRows] = useState<ClassroomStats[]>([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"recent" | "average" | "students">("recent")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [classrooms, activities] = await Promise.all([listClassrooms(), listActivities()])

      const results = await Promise.all(
        classrooms.map(async (classroom): Promise<ClassroomStats> => {
          const [students, gradingResults] = await Promise.all([
            listStudents(classroom.id) as Promise<Student[]>,
            listGradingResultsForClassroom(classroom.id) as Promise<GradingResult[]>,
          ])
          const classroomActivities = activities.filter(
            (a: Activity) => a.classroom_id === classroom.id
          )
          const average = gradingResults.length
            ? gradingResults.reduce((sum, r) => sum + Number(r.score), 0) / gradingResults.length
            : null
          const lastActivityAt = classroomActivities[0]?.created_at ?? null
          const subjects = Array.from(new Set(classroomActivities.map((a) => a.subject))).sort()
          return {
            classroom,
            studentCount: students.length,
            activityCount: classroomActivities.length,
            subjects,
            average,
            lastActivityAt,
          }
        })
      )
      if (!cancelled) {
        setRows(results)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const grades = useMemo(
    () => Array.from(new Set(rows.map((r) => r.classroom.grade))).sort(),
    [rows]
  )

  const filtered = rows
    .filter((r) => gradeFilter === "all" || r.classroom.grade === gradeFilter)
    .sort((a, b) => {
      if (sortBy === "average") return (b.average ?? -1) - (a.average ?? -1)
      if (sortBy === "students") return b.studentCount - a.studentCount
      return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "")
    })

  const totals = {
    classrooms: rows.length,
    students: rows.reduce((sum, r) => sum + r.studentCount, 0),
    activities: rows.reduce((sum, r) => sum + r.activityCount, 0),
    average: (() => {
      const withAvg = rows.filter((r) => r.average !== null)
      if (!withAvg.length) return null
      return withAvg.reduce((sum, r) => sum + (r.average ?? 0), 0) / withAvg.length
    })(),
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Compare performance across all of your classrooms.</p>
      </div>

      <StatStrip className="sm:grid-cols-4">
        <Stat label="Classrooms" value={String(totals.classrooms)} />
        <Stat label="Students" value={String(totals.students)} />
        <Stat label="Activities" value={String(totals.activities)} />
        <Stat
          label="Overall average"
          value={totals.average !== null ? `${totals.average.toFixed(0)}%` : "-"}
        />
      </StatStrip>

      <div className="flex flex-wrap gap-3">
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Sort: Most recent activity</SelectItem>
            <SelectItem value="average">Sort: Highest average</SelectItem>
            <SelectItem value="students">Sort: Most students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loading && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <LayoutDashboard className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No classrooms match these filters.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ classroom, studentCount, activityCount, subjects, average }) => (
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
                  <Badge variant="secondary">{classroom.grade}</Badge>
                  {subjects.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-3 font-mono text-sm text-muted-foreground">
                  <span>{studentCount} students</span>
                  <span>{activityCount} activities</span>
                  <span>{average !== null ? `${average.toFixed(0)}% avg` : "No grades yet"}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
