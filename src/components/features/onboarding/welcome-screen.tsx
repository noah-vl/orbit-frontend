"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface WelcomeScreenProps {
  onStart: () => void
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)", transition: { duration: 0.8 } }}
      className="flex flex-col items-center mt-[33vh]"
    >
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
          onClick={onStart}
          className="bg-white/50 backdrop-blur-md hover:bg-white/60 text-gray-900 border-white/40 border shadow-sm transition-all duration-300"
        >
          Get Started
        </Button>
      </motion.div>
    </motion.div>
  )
}

