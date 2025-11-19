"use client"

import { useState } from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface QuestionsStepProps extends HTMLMotionProps<"div"> {
  onNext: (data?: { responsibilities: string[]; decisionInvolvement: string; updateTypes: string[] }) => void
  onBack?: () => void
}

const RESPONSIBILITIES = [
  "Setting strategy & vision",
  "Driving execution & delivery",
  "Managing people & teams",
  "Optimizing operations & processes",
  "Analyzing data & trends",
  "Managing stakeholder relationships",
  "Ensuring quality & reliability",
  "Research & innovation",
  "Resource & budget management"
]

const DECISION_INVOLVEMENT = [
  { value: "consumer", label: "I mainly consume insights to do my job" },
  { value: "contributor", label: "I actively contribute and refine knowledge" },
  { value: "curator", label: "I manage and structure the team's knowledge base" }
]


export function QuestionsStep({ onNext, onBack, className, ...props }: QuestionsStepProps) {
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [decisionInvolvement, setDecisionInvolvement] = useState("")

  const toggleResponsibility = (responsibility: string) => {
    setResponsibilities(prev => 
      prev.includes(responsibility)
        ? prev.filter(r => r !== responsibility)
        : [...prev, responsibility]
    )
  }

  return (
    <motion.div
      className={cn("w-full max-w-2xl my-auto", className)}
      {...props}
    >
      <div className="flex flex-col space-y-8 text-left">
        <div className="space-y-2 text-center mb-8">
          <h2 className="text-3xl font-medium text-white">A few more questions</h2>
        </div>

        <div className="space-y-8">
          {/* Q2: Responsibilities (Multi-select Chips) */}
          <div className="space-y-3">
            <Label className="text-white/90 text-base">What are you mainly responsible for?</Label>
            <div className="flex flex-wrap gap-2">
              {RESPONSIBILITIES.map((resp) => (
                <button
                  key={resp}
                  onClick={() => toggleResponsibility(resp)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                    responsibilities.includes(resp)
                      ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                  )}
                >
                  {resp}
                </button>
              ))}
            </div>
          </div>
          
          {/* Q3: Decision Involvement (Radio / Scale) */}
          <div className="space-y-3">
            <Label className="text-white/90 text-base">What is your role in knowledge management?</Label>
            <RadioGroup value={decisionInvolvement} onValueChange={setDecisionInvolvement} className="grid gap-3">
              {DECISION_INVOLVEMENT.map((option) => (
                <div 
                  key={option.value} 
                  className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors cursor-pointer" 
                  onClick={() => setDecisionInvolvement(option.value)}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value} 
                    className="border-white/20 text-white data-[state=checked]:border-white data-[state=checked]:text-white mt-0.5" 
                  />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="text-white/90 font-medium cursor-pointer block mb-0.5">
                    {option.label}
                  </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={() => {
              onNext({
                responsibilities,
                decisionInvolvement,
                updateTypes,
              })
            }}
            disabled={!decisionInvolvement}
            className="w-full bg-white text-black hover:bg-white/90 h-12 text-lg font-medium transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete
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

