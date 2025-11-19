"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { WelcomeScreen } from "@/components/features/onboarding/welcome-screen"
import { UserInfoStep } from "@/components/features/onboarding/user-info-step"
import { QuestionsStep } from "@/components/features/onboarding/questions-step"
import { cn } from "@/lib/utils"

const SUPABASE_URL = "https://xltqabrlmfalosewvjby.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg"

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteToken = searchParams.get("token")
  
  const [started, setStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const totalSteps = 4

  // Check if user is already authenticated
  useEffect(() => {
    if (inviteToken) {
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
              // User is authenticated, we can join team after onboarding
            }
          } catch (err) {
            // Token invalid, clear it
            localStorage.removeItem("supabase.auth.token")
            sessionStorage.removeItem("supabase.auth.token")
          }
        }
      }
      checkAuth()
    }
  }, [inviteToken])

  const handleNext = () => {
    setDirection(1)
    setCurrentStep((prev) => {
      const nextStep = Math.min(prev + 1, totalSteps)
      // On the last step, handle completion
      if (nextStep === totalSteps) {
        handleComplete()
      }
      return nextStep
    })
  }

  const handleBack = () => {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleComplete = async () => {
    // If there's an invite token, join the team after onboarding
    if (inviteToken) {
      await handleJoinTeam()
    } else {
      // Otherwise, redirect to dashboard
      router.push("/")
    }
  }

  const handleJoinTeam = async () => {
    if (!inviteToken) return

    const authToken = localStorage.getItem("supabase.auth.token") || 
                     sessionStorage.getItem("supabase.auth.token")
    
    if (!authToken) {
      // User needs to authenticate first - for now, just redirect
      // In the future, you might want to show an auth form
      setError("Please sign in to join the team")
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
          "apikey": SUPABASE_ANON_KEY,
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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)"
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)"
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)"
    })
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Container with Blur effect */}
      <motion.div 
        className="absolute inset-0 -z-10"
        animate={{ filter: started ? "blur(8px)" : "blur(0px)" }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        {/* Final Background Image (Day - Shown initially, hidden when started) */}
        <motion.div 
          className="absolute inset-0"
          animate={{ opacity: started ? 0 : 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <Image
            src="/forum3.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </motion.div>
        
        {/* Initial Background Image (Night - Fades Out initially, Fades In when started) */}
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 1 }}
          animate={{ opacity: started ? 1 : 0 }}
          transition={{ 
            duration: started ? 1.5 : 2.5, 
            delay: started ? 0 : 2, 
            ease: "easeInOut" 
          }}
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
      </motion.div>
      
      <div className="flex min-h-screen flex-col items-center p-4 text-center relative z-10">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg bg-destructive/20 text-white max-w-md mx-auto"
          >
            {error}
          </motion.div>
        )}

        {hasJoined && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg bg-green-500/20 text-white max-w-md mx-auto"
          >
            Successfully joined the team! Redirecting...
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!started ? (
            <WelcomeScreen 
              onStart={() => setStarted(true)} 
              key="welcome"
            />
          ) : (
            <div className="flex flex-col flex-1 w-full h-full">
              <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto overflow-hidden relative">
                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                  {currentStep === 1 && (
                    <UserInfoStep
                      key="step1"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 200, damping: 30 },
                        opacity: { duration: 0.3 }
                      }}
                      onNext={handleNext}
                    />
                  )}
                  {currentStep === 2 && (
                    <QuestionsStep
                      key="step2"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 200, damping: 30 },
                        opacity: { duration: 0.3 }
                      }}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                </AnimatePresence>
              </div>
              
              {/* Step Indicators */}
              <motion.div 
                className="flex gap-3 mb-8 mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-300 ease-out",
                      currentStep === i + 1 
                        ? "w-8 bg-white" 
                        : "w-2.5 bg-white/20 hover:bg-white/40"
                    )}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
