"use client"

import { useState } from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TiltedCard from "./tilted-card"
import { cn } from "@/lib/utils"

const ROLES_BY_DEPARTMENT: Record<string, string[]> = {
  Engineering: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "Engineering Manager"],
  Design: ["Product Designer", "UI/UX Designer", "Visual Designer", "Graphic Designer", "Design Lead"],
  Product: ["Product Manager", "Product Owner", "Project Manager", "Scrum Master", "Head of Product"],
  Marketing: ["Content Strategist", "Social Media Manager", "SEO Specialist", "Growth Marketer", "Marketing Director"],
  Sales: ["Sales Representative", "Account Executive", "Sales Manager", "Business Development", "Sales Director"],
  Other: ["Founder", "Executive", "HR Manager", "Finance Manager", "Legal Counsel"]
}

interface UserInfoStepProps extends HTMLMotionProps<"div"> {
  onNext: (data?: { name: string; email: string; password: string; department: string; role: string }) => void
}

export function UserInfoStep({ onNext, className, ...props }: UserInfoStepProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: ""
  })

  // Use a data URL for a 1x1 transparent pixel as the "image"
  const transparentBackground = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

  const availableRoles = formData.department ? ROLES_BY_DEPARTMENT[formData.department] || [] : []

  return (
    <motion.div
      className={cn("w-full max-w-3xl my-auto", className)}
      {...props}
    >
      <div className="grid md:grid-cols-[350px_1fr] gap-16 items-center">
        
        {/* Left Side - Tilted Card (Profile Card) */}
        <div className="flex flex-col items-center justify-center">
          <TiltedCard
            imageSrc={transparentBackground}
            altText="Profile Card"
            captionText="Orbit Member Card"
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
                    {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="space-y-0.5">
                      <h3 className="text-white font-bold text-2xl leading-tight tracking-tight">
                        {formData.name || "Your Name"}
                      </h3>
                      <p className="text-white/60 text-xs font-medium">
                        {formData.email || "email@example.com"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 mt-3 items-center">
                      <div className="inline-flex w-min items-center justify-center px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-white/70">
                         {formData.department || "Department"}
                      </div>
                      {formData.role && (
                        <div className="text-[10px] text-white/50 font-medium tracking-wide uppercase">
                          {formData.role}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            }
          />
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col space-y-6 text-left">
          <div className="space-y-2">
            <h2 className="text-3xl font-medium text-white">Let's get started</h2>
            <p className="text-white/70 text-lg">
              Tell us a bit about yourself to get started
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/90 text-base">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Enter your name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/40 h-12 text-lg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 text-base">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="name@company.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/40 h-12 text-lg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 text-base">Password</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="Create a password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/40 h-12 text-lg"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
              />
              <p className="text-xs text-white/50">Must be at least 6 characters</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-white/90 text-base">Department</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, department: value, role: "" })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30 focus:border-white/40 h-12 w-full">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/40 backdrop-blur-xl border-white/20 text-white">
                    {Object.keys(ROLES_BY_DEPARTMENT).map((dept) => (
                      <SelectItem key={dept} value={dept} className="focus:bg-white/20 focus:text-white">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-white/90 text-base">Role</Label>
                <Select 
                  disabled={!formData.department} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  value={formData.role}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30 focus:border-white/40 h-12 w-full disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue placeholder={formData.department ? "Select Role" : "Pick Dept"} />
                  </SelectTrigger>
                  <SelectContent className="bg-black/40 backdrop-blur-xl border-white/20 text-white">
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role} className="focus:bg-white/20 focus:text-white">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Button 
              onClick={() => {
                if (formData.name && formData.email && formData.password && formData.department && formData.role) {
                  onNext(formData)
                }
              }}
              disabled={!formData.name || !formData.email || !formData.password || !formData.department || !formData.role || formData.password.length < 6}
              className="w-full bg-white text-black hover:bg-white/90 h-12 text-lg font-medium transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}