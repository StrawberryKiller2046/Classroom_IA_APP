import type { ReactNode } from "react"
import { Loader2, TriangleAlert } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { isSupabaseConfigured } from "@/lib/supabase"

// Waits for the automatic anonymous session before rendering the app.
// There's no login screen; see AuthProvider for how the session is created.
// When Supabase isn't configured yet, the app runs on local demo data
// instead (see lib/mock-store.ts), so there's no session to wait for.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (!isSupabaseConfigured) return <>{children}</>

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
          <p className="font-medium">No se pudo iniciar una sesión</p>
          <p className="text-sm text-muted-foreground">
            Activa el inicio de sesión anónimo en este proyecto de Supabase (Authentication → Providers → Anonymous) y recarga la página.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
