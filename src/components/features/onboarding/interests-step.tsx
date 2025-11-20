"use client"

import { useState } from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface InterestsStepProps extends HTMLMotionProps<"div"> {
  onNext: (data?: { interests: string[]; consumptionPreference: string }) => void
  onBack?: () => void
}

const GENERAL_INTERESTS = [
  "Artificial Intelligence",
  "Product Strategy",
  "User Experience",
  "Engineering Leadership",
  "Market Trends",
  "Startup Growth",
  "Data Science",
  "Remote Work Culture",
  "Digital Transformation",
  "Sustainability"
]

const CONSUMPTION_PREFERENCES = [
  { value: "summary", label: "Quick Summaries & Key Points", description: "I want the bottom line fast" },
  { value: "deep_dive", label: "Deep Dives & Long Form", description: "I prefer comprehensive analysis" },
  { value: "visual", label: "Visuals & Diagrams", description: "I learn best through charts and graphs" },
  { value: "discussion", label: "Discussions & Threads", description: "I value peer perspectives and debate" }
]

export function InterestsStep({ onNext, onBack, className, ...props }: InterestsStepProps) {
  const [interests, setInterests] = useState<string[]>([])
  const [consumptionPref, setConsumptionPref] = useState("")

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  return (
    <motion.div
      className={cn("w-full max-w-2xl my-auto", className)}
      {...props}
    >
      <div className="flex flex-col space-y-8 text-left">
        <div className="space-y-2 text-center mb-8 mt-4">
          <h2 className="text-3xl font-medium text-white">Personalize your feed</h2>
          <p className="text-white/60">Tell us what you care about and how you learn.</p>
        </div>

        <div className="space-y-8">
          {/* General Interests (Multi-select Chips) */}
          <div className="space-y-3">
            <Label className="text-white/90 text-base">What topics interest you?</Label>
            <div className="flex flex-wrap gap-2">
              {GENERAL_INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                    interests.includes(interest)
                      ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          
          {/* Consumption Preference (Radio) */}
          <div className="space-y-3">
            <Label className="text-white/90 text-base">How do you prefer to digest information?</Label>
            <RadioGroup value={consumptionPref} onValueChange={setConsumptionPref} className="grid gap-3">
              {CONSUMPTION_PREFERENCES.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setConsumptionPref(option.value)}>
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value} 
                    className="border-white/20 text-white data-[state=checked]:border-white data-[state=checked]:text-white mt-0.5" 
                  />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="text-white font-medium cursor-pointer block mb-0.5">
                      {option.label}
                    </Label>
                    <span className="text-white/50 text-sm block">
                      {option.description}
                    </span>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={() => onNext({ interests, consumptionPreference: consumptionPref })}
            className="w-full bg-white text-black hover:bg-white/90 h-12 text-lg font-medium transition-transform active:scale-95"
          >
            Continue
          </Button>
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="w-full mt-4 text-white/60 hover:text-white hover:bg-white/10"
            >
              Back
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

