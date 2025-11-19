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
  "Setting direction / strategy",
  "Shipping product features",
  "User research & discovery",
  "Running experiments",
  "Hitting growth targets",
  "Closing deals / managing accounts",
  "Keeping systems reliable",
  "Making sense of data / reporting",
  "Hiring & org design"
]

const DECISION_INVOLVEMENT = [
  { value: "consumer", label: "I mainly consume insights to do my job" },
  { value: "contributor", label: "I actively contribute and refine knowledge" },
  { value: "curator", label: "I manage and structure the team's knowledge base" }
]

const UPDATE_TYPES = [
  "Engineering: Tech dependencies & architecture",
  "Product: User value & roadmap impact",
  "Leadership: Strategy, risks & outcomes",
  "Market: Competitor analysis & trends",
  "Research: Key findings & academic papers"
]

export function QuestionsStep({ onNext, onBack, className, ...props }: QuestionsStepProps) {
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [decisionInvolvement, setDecisionInvolvement] = useState("")
  const [updateTypes, setUpdateTypes] = useState<string[]>([])

  const toggleResponsibility = (responsibility: string) => {
    setResponsibilities(prev => 
      prev.includes(responsibility)
        ? prev.filter(r => r !== responsibility)
        : [...prev, responsibility]
    )
  }

  const toggleUpdateType = (type: string) => {
    setUpdateTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  return (
    <motion.div
      className={cn("w-full max-w-2xl my-auto", className)}
      {...props}
    >
      <div className="flex flex-col space-y-8 text-left">
        <div className="space-y-2 text-center mb-4">
          <h2 className="text-3xl font-medium text-white">A few more questions</h2>
          <p className="text-white/70 text-lg">
            Help us customize your experience
          </p>
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
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value} 
                    className="border-white/20 text-white data-[state=checked]:border-white data-[state=checked]:text-white" 
                  />
                  <Label htmlFor={option.value} className="text-white/80 font-normal cursor-pointer hover:text-white transition-colors">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Q4: Update Types (Multi-select Chips) */}
          <div className="space-y-3">
            <Label className="text-white/90 text-base">Which perspectives matter most to you?</Label>
            <div className="flex flex-wrap gap-2">
              {UPDATE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleUpdateType(type)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                    updateTypes.includes(type)
                      ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
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

