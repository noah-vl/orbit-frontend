'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error.message || 'Failed to sign in')
        setLoading(false)
        return
      }

      // Wait a moment for AuthContext to update
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Verify session exists before redirecting
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session was not created. Please try again.')
        setLoading(false)
        return
      }

      // Use full page reload to ensure AuthContext picks up the session
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Container */}
      <div className="absolute inset-0 -z-10">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/forum-night.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-black/05" />
      </div>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-8 space-y-6">
            <div className="text-center space-y-4 mb-6">
              <motion.h1 
                className="font-serif text-5xl tracking-tight text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Orbit
              </motion.h1>
              <motion.p 
                className="text-white/70 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Sign in to your account
              </motion.p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-md bg-red-500/20 border border-red-500/50 text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/40 h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90 text-base">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/40 h-12 text-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black hover:bg-white/90 h-12 text-lg font-medium transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


