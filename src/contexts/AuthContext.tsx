'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  team_id: string
  full_name: string | null
  role: string | null
  interests: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  teamId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile with team_id
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, team_id, full_name, role, interests')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  // Check Chrome extension for auth data
  const checkExtensionAuth = async (): Promise<{ session: Session | null; profile: Profile | null } | null> => {
    try {
      // Check if we're in a browser environment and extension bridge exists
      if (typeof window !== 'undefined' && (window as any).solonExtensionBridge) {
        console.log('AuthContext: Checking extension for auth data...');
        const response = await (window as any).solonExtensionBridge.getAuthData()
        console.log('AuthContext: Extension response:', response);
        if (response?.success && response.data?.access_token) {
          // Create a session-like object from extension data
          const extData = response.data
          console.log('AuthContext: Extension data:', extData);
          console.log('AuthContext: Extension teamId:', extData.teamId);
          
          const session: Session = {
            access_token: extData.access_token,
            refresh_token: extData.refresh_token || '',
            expires_in: 3600,
            expires_at: Date.now() / 1000 + 3600,
            token_type: 'bearer',
            user: extData.user ? {
              id: extData.user.id,
              aud: 'authenticated',
              role: 'authenticated',
              email: '',
              email_confirmed_at: '',
              phone: '',
              confirmed_at: '',
              last_sign_in_at: '',
              app_metadata: {},
              user_metadata: {},
              identities: [],
              created_at: '',
              updated_at: '',
            } : null,
          } as Session

          const profile: Profile | null = extData.profile ? {
            id: extData.profile.id || extData.user.id,
            team_id: extData.teamId || extData.profile.team_id,
            full_name: extData.profile.full_name,
            role: extData.profile.role,
            interests: extData.profile.interests,
          } : (extData.teamId ? {
            id: extData.user.id,
            team_id: extData.teamId,
            full_name: null,
            role: null,
            interests: null,
          } : null)

          console.log('AuthContext: Created profile with team_id:', profile?.team_id);
          return { session, profile }
        } else {
          console.log('AuthContext: Extension auth not available or invalid');
        }
      } else {
        console.log('AuthContext: Extension bridge not found');
      }
    } catch (error) {
      console.error('AuthContext: Error checking extension auth:', error)
    }
    return null
  }

  useEffect(() => {
    // First check Chrome extension, then fall back to Supabase session
    const initializeAuth = async () => {
      const extAuth = await checkExtensionAuth()
      
      if (extAuth) {
        // Use extension auth data
        setSession(extAuth.session)
        setUser(extAuth.session?.user ?? null)
        setProfile(extAuth.profile)
        setLoading(false)
      } else {
        // Fall back to Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            fetchProfile(session.user.id).finally(() => setLoading(false))
          } else {
            setLoading(false)
          }
        })
      }
    }

    initializeAuth()

    // Listen for auth changes (only if not using extension)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Only update if we're not using extension auth
      const extAuth = await checkExtensionAuth()
      if (!extAuth) {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data.user) {
      await fetchProfile(data.user.id)
    }

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const value = {
    user,
    session,
    profile,
    teamId: profile?.team_id || null,
    loading,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

