"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const SUPABASE_URL = "https://xltqabrlmfalosewvjby.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg"

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteToken = searchParams.get("token")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("supabase.auth.token") || 
                          sessionStorage.getItem("supabase.auth.token")
      if (storedToken) {
        // Verify token is still valid
        try {
          const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              "Authorization": `Bearer ${storedToken}`,
              "apikey": SUPABASE_ANON_KEY,
            },
          })
          if (response.ok) {
            setIsAuthenticated(true)
            // If we have an invite token and user is authenticated, show join button
            // Don't auto-join, let user click the button
          }
        } catch (err) {
          // Token invalid, clear it
          localStorage.removeItem("supabase.auth.token")
          sessionStorage.removeItem("supabase.auth.token")
        }
      } else if (inviteToken) {
        // User needs to authenticate first
        setShowAuth(true)
      }
    }
    checkAuth()
  }, [inviteToken])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // For signup, we need to check if email confirmation is required
      // If email confirmation is enabled, signup won't return a session
      const url = isSignUp 
        ? `${SUPABASE_URL}/auth/v1/signup`
        : `${SUPABASE_URL}/auth/v1/token?grant_type=password`

      const body: any = {
        email,
        password,
      }

      if (isSignUp) {
        body.data = { full_name: fullName }
        // Add this to skip email confirmation if you want immediate access (for testing)
        // In production, you might want to require email confirmation
        body.auto_confirm = true
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        throw new Error(errorData.error_description || errorData.message || errorData.error || "Authentication failed")
      }

      const data = await response.json()
      
      // Supabase Auth returns different structures for signup vs login
      // Signup: { user: {...}, session: { access_token, ... } } or just { user: {...} } if email confirmation required
      // Login: { access_token, refresh_token, ... } or { session: { access_token, ... } }
      let accessToken = data.access_token || 
                       data.session?.access_token

      // If signup didn't return a session (email confirmation required), try to sign in
      if (!accessToken && isSignUp && data.user) {
        // Auto-sign in after signup
        const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email,
            password,
          }),
        })
        
        if (signInResponse.ok) {
          const signInData = await signInResponse.json()
          accessToken = signInData.access_token || signInData.session?.access_token
          // Update data with sign-in response for refresh token
          if (signInData.refresh_token || signInData.session?.refresh_token) {
            data.refresh_token = signInData.refresh_token || signInData.session?.refresh_token
          }
        }
      }

      if (!accessToken) {
        console.error("Auth response:", data)
        // If we have a user but no session, email confirmation might be required
        if (data.user && !data.session) {
          throw new Error("Please check your email to confirm your account before signing in.")
        }
        throw new Error("Failed to get access token. Please check the console for details.")
      }

      // Store token
      localStorage.setItem("supabase.auth.token", accessToken)
      if (data.refresh_token || data.session?.refresh_token) {
        localStorage.setItem("supabase.refresh.token", data.refresh_token || data.session?.refresh_token)
      }

      setIsAuthenticated(true)
      setShowAuth(false)

      // If we have an invite token, join the team
      if (inviteToken) {
        await handleJoinTeam(accessToken)
      } else {
        router.push("/")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  const handleJoinTeam = async (token?: string) => {
    if (!inviteToken) return

    const authToken = token || localStorage.getItem("supabase.auth.token") || 
                     sessionStorage.getItem("supabase.auth.token")
    
    if (!authToken) {
      setShowAuth(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/join_team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          invite_token: inviteToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to join team")
      }

      const data = await response.json()
      setHasJoined(true)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  const handleGetStarted = async () => {
    if (inviteToken) {
      await handleJoinTeam()
    } else {
      router.push("/")
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {/* Final Background Image */}
        <Image
          src="/forum3.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        
        {/* Initial Background Image (Fades Out) */}
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.5, delay: 2, ease: "easeInOut" }}
        >
          <Image
            src="/forum-night.png"
            alt="Night Background"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        <div className="absolute inset-0 bg-black/05" />
      </div>
      
      <div className="flex min-h-screen flex-col items-center justify-start pt-[33vh] p-4 text-center">
        <motion.h1 
          className="font-serif text-5xl tracking-tight text-white md:text-7xl lg:text-8xl mb-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { 
              transition: { 
                staggerChildren: 0.3,
                delayChildren: 4.5
              } 
            }
          }}
        >
          {["Welcome", "to", "Solon"].map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.25em] last:mr-0"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  transition: { 
                    duration: 0.8, 
                    ease: "easeOut" 
                  } 
                }
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="text-2xl text-white/90 md:text-xl font-sans max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 5.5, ease: "easeOut" }}
        >
          {inviteToken 
            ? "You've been invited to join a team" 
            : "The external knowledge brain for your team"}
        </motion.p>

        {/* Auth Form */}
        {showAuth && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto mb-8"
          >
            <Card className="bg-white/95 backdrop-blur-md">
              <CardHeader>
                <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
                <CardDescription>
                  {inviteToken 
                    ? "Sign in to join the team" 
                    : "Sign in to get started"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={isSignUp}
                        disabled={loading}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {error}
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                  </Button>
                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp)
                        setError(null)
                      }}
                      className="text-primary hover:underline"
                    >
                      {isSignUp 
                        ? "Already have an account? Sign in" 
                        : "Don't have an account? Sign up"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {error && !showAuth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg bg-destructive/20 text-white max-w-md"
          >
            {error}
          </motion.div>
        )}

        {hasJoined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg bg-green-500/20 text-white max-w-md"
          >
            Successfully joined the team! Redirecting...
          </motion.div>
        )}

        {!showAuth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 6.5, ease: "easeOut" }}
          >
            {inviteToken && isAuthenticated && !hasJoined && (
              <Button 
                size="lg"
                onClick={handleGetStarted}
                disabled={loading || hasJoined}
                className="bg-white/50 backdrop-blur-md hover:bg-white/60 text-gray-900 border-white/40 border shadow-sm transition-all duration-300"
              >
                {loading ? "Joining..." : "Join Team"}
              </Button>
            )}
            {!inviteToken && (
              <Button 
                size="lg"
                onClick={() => router.push("/")}
                className="bg-white/50 backdrop-blur-md hover:bg-white/60 text-gray-900 border-white/40 border shadow-sm transition-all duration-300"
              >
                Get Started
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}

