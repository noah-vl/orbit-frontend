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
  const totalSteps = 2 // Only 2 steps for now

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
      }
      // On the last step (step 2), handle completion
      if (nextStep > totalSteps) {
        handleComplete(data)
      }
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
      // Step 1: Create user account
      const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: userInfo.email,
          password: userInfo.password,
          data: {
            full_name: userInfo.name,
          },
        }),
      })

      if (!signupResponse.ok) {
        const errorText = await signupResponse.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        throw new Error(errorData.error_description || errorData.message || "Failed to create account")
      }

      const signupData = await signupResponse.json()
      console.log("Signup response:", signupData)
      
      // Try to get access token from signup response
      let accessToken = signupData.access_token || 
                       signupData.session?.access_token

      // Always try to sign in after signup (in case email confirmation is required)
      // This ensures we get a valid session
      console.log("Attempting sign in after signup...")
      const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: userInfo.email,
          password: userInfo.password,
        }),
      })
      
      if (signInResponse.ok) {
        const signInData = await signInResponse.json()
        console.log("Sign in response:", signInData)
        // Prefer sign-in token over signup token
        const signInToken = signInData.access_token || 
                           signInData.session?.access_token
        if (signInToken) {
          accessToken = signInToken
        }
      } else {
        const errorText = await signInResponse.text()
        console.error("Sign in error:", signInResponse.status, errorText)
        // If sign-in fails but we have a token from signup, continue with that
        if (!accessToken) {
          throw new Error(`Failed to sign in: ${errorText}`)
        }
      }

      if (!accessToken) {
        console.error("Final signup data:", signupData)
        throw new Error("Failed to get access token. Please check the browser console for details.")
      }

      // Store token
      localStorage.setItem("supabase.auth.token", accessToken)

      // Step 2: Update profile with additional info
      // We'll do this after joining the team since the profile is created by join_team

      // Step 3: Join the team
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

      if (!joinResponse.ok) {
        const errorData = await joinResponse.text()
        throw new Error(errorData || "Failed to join team")
      }

      // Step 4: Update profile with role and interests
      // Get user ID from the token or from signup response
      let userId = signupData.user?.id || signupData.session?.user?.id
      
      // If we don't have userId, try to get it from the token
      if (!userId && accessToken) {
        try {
          const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "apikey": SUPABASE_ANON_KEY,
            },
          })
          if (userResponse.ok) {
            const userData = await userResponse.json()
            userId = userData.id
          }
        } catch (err) {
          console.error("Error fetching user:", err)
        }
      }
      
      if (userId) {
        const profileUpdateResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "apikey": SUPABASE_ANON_KEY,
        },
          body: JSON.stringify({
            role: userInfo.role,
            interests: JSON.stringify({
              department: userInfo.department,
              responsibilities: questionsData?.responsibilities || [],
              decisionInvolvement: questionsData?.decisionInvolvement || "",
              updateTypes: questionsData?.updateTypes || [],
            }),
          }),
        })

        // Don't fail if profile update fails
        if (!profileUpdateResponse.ok) {
          console.error("Failed to update profile with additional info")
        }
      }

      setHasJoined(true)
      
      // Use exit transition before redirecting
      setIsExiting(true)
      setTimeout(() => {
        router.push("/")
      }, 800)
    } catch (err) {
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
                      onNext={(data) => handleComplete(data)}
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
                      onFinish={handleFinish}
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
              
              {/* Loading indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 text-white/80"
                >
                  Creating your account...
                </motion.div>
              )}
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
