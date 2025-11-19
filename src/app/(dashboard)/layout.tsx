"use client"

import { Sidebar } from "@/components/shared/sidebar"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { motion } from "framer-motion"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex h-screen overflow-hidden flex-col md:flex-row bg-background"
      >
        <Sidebar className="hidden md:block border-r" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </motion.div>
    </ProtectedRoute>
  )
}
