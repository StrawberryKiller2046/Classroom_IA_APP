import type { ReactNode } from "react"
import { Loader2, TriangleAlert } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

// Waits for the automatic anonymous session before rendering the app.
// There's no login screen — see AuthProvider for how the session is created.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <div className="flex max-w-sm flex-col items-center gap-2 text-center">
          <TriangleAlert className="size-6 text-destructive" />
          <p className="font-medium">Couldn't start a session</p>
          <p className="text-sm text-muted-foreground">
            Enable anonymous sign-ins for this Supabase project (Authentication → Providers → Anonymous) and reload.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
