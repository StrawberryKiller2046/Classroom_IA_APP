import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// No login screen: every visitor gets a Supabase anonymous session automatically,
// so RLS (auth.uid()-scoped rows) keeps working without asking anyone to sign in.
// Without Supabase configured, the app runs entirely on local demo data instead
// (see lib/mock-store.ts / lib/api.ts), so there's no session to create here.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    async function ensureSession() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        if (!cancelled) {
          setSession(data.session)
          setLoading(false)
        }
        return
      }

      const { data: signInData, error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error("Failed to start anonymous session:", error.message)
      }
      if (!cancelled) {
        setSession(signInData?.session ?? null)
        setLoading(false)
      }
    }

    ensureSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
