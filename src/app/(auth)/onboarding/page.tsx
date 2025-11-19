"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { WelcomeScreen } from "@/components/features/onboarding/welcome-screen"
import { UserInfoStep } from "@/components/features/onboarding/user-info-step"
import { QuestionsStep } from "@/components/features/onboarding/questions-step"
import { cn } from "@/lib/utils"

export default function OnboardingPage() {
  const [started, setStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const totalSteps = 4

  const handleNext = () => {
    setDirection(1)
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const handleBack = () => {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
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
        <AnimatePresence mode="wait">
          {!started ? (
            <WelcomeScreen onStart={() => setStarted(true)} />
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
