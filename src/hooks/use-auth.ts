import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  tipo: 'professor' | 'admin'
  nome: string
}

export const isAdmin = (profile: UserProfile | null) => profile?.tipo === 'admin'
export const isProfessor = (profile: UserProfile | null) => profile?.tipo === 'professor'
export const canManageTurmas = (profile: UserProfile | null) => profile?.tipo === 'admin' || profile?.tipo === 'professor'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile(session.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function getProfile(user: User) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  async function signUp(email: string, password: string, nome: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nome,
        },
      },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
