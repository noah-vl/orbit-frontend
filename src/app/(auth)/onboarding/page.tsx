"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function OnboardingPage() {
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
          The external knowledge brain for your team
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 6.5, ease: "easeOut" }}
        >
          <Button 
            size="lg"
            className="bg-white/50 backdrop-blur-md hover:bg-white/60 text-gray-900 border-white/40 border shadow-sm transition-all duration-300"
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
