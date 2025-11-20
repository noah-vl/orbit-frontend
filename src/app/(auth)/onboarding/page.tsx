"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { WelcomeScreen } from "@/components/features/onboarding/welcome-screen"
import { UserInfoStep } from "@/components/features/onboarding/user-info-step"
import { QuestionsStep } from "@/components/features/onboarding/questions-step"
import { InterestsStep } from "@/components/features/onboarding/interests-step"
import { FinalStep } from "@/components/features/onboarding/final-step"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const SUPABASE_URL = "https://xltqabrlmfalosewvjby.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg"

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteToken = searchParams.get("token")
  
  const [started, setStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    name: string
    email: string
    password: string
    department: string
    role: string
  } | null>(null)
  const [questionsData, setQuestionsData] = useState<{
    responsibilities: string[]
    decisionInvolvement: string
    updateTypes: string[]
  } | null>(null)
  const [interestsData, setInterestsData] = useState<{
    interests: string[]
    consumptionPreference: string
  } | null>(null)
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

  const handleNext = (data?: any) => {
    setDirection(1)
    setCurrentStep((prev) => {
      const nextStep = Math.min(prev + 1, totalSteps)
      // Store step data
      if (prev === 1 && data) {
        setUserInfo(data)
      } else if (prev === 2 && data) {
        setQuestionsData(data)
      } else if (prev === 3 && data) {
        setInterestsData(data)
      }
      // Step 4 (FinalStep) will call handleComplete via onFinish
      return nextStep
    })
  }

  const handleBack = () => {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleFinish = () => {
    setIsExiting(true)
    setTimeout(() => {
      router.push("/")
    }, 800)
  }

  const handleComplete = async (questionsData?: any) => {
    if (questionsData) {
      setQuestionsData(questionsData)
    }

    setLoading(true)
    setError(null)

    try {
      // If there's an invite token, create account and join team
      if (inviteToken && userInfo) {
        await createAccountAndJoinTeam()
      } else {
        // Otherwise, use exit transition and redirect
        setIsExiting(true)
        setTimeout(() => {
          router.push("/")
        }, 800)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  const createAccountAndJoinTeam = async () => {
    if (!inviteToken || !userInfo) {
      throw new Error("Missing invite token or user info")
    }

    try {
      console.log("Step 1: Creating user account...", { email: userInfo.email, hasPassword: !!userInfo.password })
      // Step 1: Create user account using Supabase client
      let signupData: any = null
      
      console.log("Calling supabase.auth.signUp...")
      const { data: signupResponse, error: signupError } = await supabase.auth.signUp({
        email: userInfo.email,
        password: userInfo.password,
        options: {
          data: {
            full_name: userInfo.name,
          },
        },
      })
      
      console.log("Signup response received:", { hasData: !!signupResponse, hasError: !!signupError, error: signupError })

      if (signupError) {
        console.error("Signup error:", signupError)
        // If user already exists, try to sign in instead
        if (signupError.message?.includes("already registered") || 
            signupError.message?.includes("already exists") ||
            signupError.message?.includes("User already registered")) {
          console.log("User already exists, attempting sign in...")
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: userInfo.email,
            password: userInfo.password,
          })
          
          console.log("Sign in response:", { hasData: !!signInData, hasError: !!signInError, hasSession: !!signInData?.session })
          
          if (signInError) {
            console.error("Sign in error:", signInError)
            throw new Error("Account exists but password is incorrect")
          }
          
          if (!signInData?.session) {
            console.error("Sign in succeeded but no session returned")
            throw new Error("Sign in succeeded but no session was returned")
          }
          
          signupData = signInData
          console.log("Sign in successful, proceeding with signupData:", { hasSession: !!signupData.session, userId: signupData.user?.id })
        } else {
          throw signupError
        }
      } else {
        signupData = signupResponse
      }
      
      // Get session from signup/signin response
      if (!signupData?.session) {
        // If no session (email confirmation required), try to sign in
        console.log("Step 1.5: No session from signup, attempting sign in...")
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userInfo.email,
          password: userInfo.password,
        })
        
        console.log("Step 1.5 sign in response:", { hasData: !!signInData, hasError: !!signInError, hasSession: !!signInData?.session })
        
        if (signInError) {
          console.error("Sign in error:", signInError)
          throw new Error("Account created but unable to sign in. Please check your email for confirmation.")
        }
        
        if (signInData?.session) {
          signupData = signInData
          console.log("Step 1.5: Sign in successful, session obtained")
        } else {
          console.error("Step 1.5: Sign in succeeded but no session")
          throw new Error("Sign in succeeded but no session was returned")
        }
      }
      
      if (!signupData?.session) {
        console.error("No session available after all attempts")
        throw new Error("Failed to get session. Please check your email for confirmation.")
      }
      
      const accessToken = signupData.session.access_token
      console.log("Step 1 complete: Session obtained, accessToken:", !!accessToken)

      // Ensure session is set in Supabase client (should already be set, but double-check)
      if (signupData.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: signupData.session.access_token,
          refresh_token: signupData.session.refresh_token,
        })
        if (sessionError) {
          console.error("Error setting session:", sessionError)
        } else {
          console.log("Session explicitly set in Supabase client")
        }
      }

      // Step 3: Join the team
      console.log("Step 3: Joining team...")
      const joinResponse = await fetch(`${SUPABASE_URL}/functions/v1/join_team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          invite_token: inviteToken,
        }),
      })
      
      console.log("Join team response status:", joinResponse.status)
      
      if (!joinResponse.ok) {
        const errorData = await joinResponse.text()
        console.error("Join team error:", errorData)
        throw new Error(errorData || "Failed to join team")
      }
      
      const joinResult = await joinResponse.json()
      console.log("Step 3 complete: Team joined successfully", joinResult)

      // Step 4: Update profile with full_name, role, and interests (non-blocking)
      // Get user ID from the signup response
      const userId = signupData.user?.id
      
      // Update profile in background - don't wait for it
      if (userId) {
        console.log("Step 4: Updating profile (non-blocking)...")
        fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            full_name: userInfo.name,
            role: userInfo.role,
            interests: JSON.stringify({
              department: userInfo.department,
              responsibilities: questionsData?.responsibilities || [],
              decisionInvolvement: questionsData?.decisionInvolvement || "",
              updateTypes: questionsData?.updateTypes || [],
              topics: interestsData?.interests || [],
              consumptionPreference: interestsData?.consumptionPreference || "",
            }),
          }),
        })
        .then((response) => {
          if (!response.ok) {
            console.error("Failed to update profile with additional info")
          } else {
            console.log("Step 4 complete: Profile updated")
          }
        })
        .catch((err) => {
          console.error("Error updating profile:", err)
        })
      }

      setHasJoined(true)
      setLoading(false)
      
      // Wait for session to be fully persisted and AuthContext to pick it up
      // Check session multiple times to ensure it's stable
      let sessionVerified = false
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 200))
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.access_token) {
          sessionVerified = true
          console.log(`Session verified (attempt ${i + 1})`)
          break
        }
      }
      
      if (!sessionVerified) {
        console.error("Session not verified after multiple attempts")
        throw new Error("Session was not properly set. Please try logging in.")
      }
      
      console.log("Session verified, redirecting to dashboard")
      
      // Use exit transition before redirecting
      setIsExiting(true)
      setTimeout(() => {
        // Use window.location for a full page reload to ensure AuthContext reinitializes
        window.location.href = "/"
      }, 800)
    } catch (err) {
      console.error("Error in createAccountAndJoinTeam:", err)
      setLoading(false)
      throw err
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction === 0 ? 0 : (direction > 0 ? "100%" : "-100%"),
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

  const handleStepClick = (step: number) => {
    if (step === currentStep) return
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Exit Transition Overlay */}
      <AnimatePresence>
        {isExiting && (
          <motion.div
            className="fixed inset-0 z-50 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* Background Container with Blur effect */}
      <motion.div 
        className="absolute inset-0 -z-10"
        animate={{ 
          filter: started ? "blur(8px)" : "blur(0px)",
          scale: isExiting ? 1.1 : 1,
        }}
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
            <motion.div 
              key="onboarding-content"
              className="flex flex-col flex-1 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0.95 : 1 }}
              transition={{ duration: 0.5 }}
            >
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
                      onNext={(data) => handleNext(data)}
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
                  {currentStep === 3 && (
                    <InterestsStep
                      key="step3"
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
                  {currentStep === 4 && (
                    <FinalStep
                      key="step4"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 200, damping: 30 },
                        opacity: { duration: 0.3 }
                      }}
                      onBack={handleBack}
                      onFinish={() => {
                        // On final step, complete the onboarding
                        handleComplete()
                      }}
                      userInfo={userInfo}
                      loading={loading}
                    />
                  )}
                </AnimatePresence>
              </div>
              
              {/* Step Indicators */}
              <motion.div 
                className="flex gap-3 mb-8 mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isExiting ? 0 : 1,
                  y: isExiting ? 20 : 0 
                }}
                transition={{ duration: 0.5 }}
              >
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleStepClick(i + 1)}
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-300 ease-out",
                      currentStep === i + 1 
                        ? "w-8 bg-white cursor-default" 
                        : "w-2.5 bg-white/20 hover:bg-white/40 cursor-pointer"
                    )}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </motion.div>
            </motion.div>
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
