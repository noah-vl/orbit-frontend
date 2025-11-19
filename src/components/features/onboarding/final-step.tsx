"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import TiltedCard from "./tilted-card"
import { useRouter } from "next/navigation"

interface FinalStepProps extends HTMLMotionProps<"div"> {
  onBack?: () => void
}

export function FinalStep({ onBack, className, ...props }: FinalStepProps) {
  const router = useRouter()

  const handleFinish = () => {
    router.push("/")
  }

  // Use a data URL for a 1x1 transparent pixel as the "image"
  const transparentBackground = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

  return (
    <motion.div
      className={cn("w-full max-w-2xl my-auto", className)}
      {...props}
    >
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <div className="space-y-2 mb-12">
          <h2 className="text-6xl font-serif text-white tracking-wide">Welcome to Orbit</h2>
        </div>

        <div className="w-full flex items-center justify-center">
           <TiltedCard
            imageSrc={transparentBackground}
            altText="Profile Card"
            captionText="Solon Member Card"
            containerHeight="400px"
            containerWidth="280px"
            imageHeight="400px"
            imageWidth="280px"
            rotateAmplitude={10}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={true}
            overlayContent={
              <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center p-6 rounded-[15px] bg-black/40 backdrop-blur-md">
                
                {/* Profile Content */}
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                    N
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="space-y-0.5">
                      <h3 className="text-white font-bold text-2xl leading-tight tracking-tight">
                        Noah Van Lienden
                      </h3>
                      <p className="text-white/60 text-xs font-medium">
                        noah@orbit.com
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 mt-3 items-center">
                      <div className="inline-flex w-min items-center justify-center px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-white/70">
                         Engineering
                      </div>
                      <div className="text-[10px] text-white/50 font-medium tracking-wide uppercase">
                        Full Stack Developer
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            }
          />
        </div>

        <div className="pt-8 w-full max-w-[400px] space-y-4">
          <Button 
            onClick={handleFinish}
            className="w-full bg-white text-black hover:bg-white/90 h-12 text-lg font-medium transition-transform active:scale-95"
          >
            Enter Dashboard
          </Button>
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="w-full text-white/60 hover:text-white hover:bg-white/10"
            >
              Back
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
