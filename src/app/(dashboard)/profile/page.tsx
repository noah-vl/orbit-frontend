"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MapPin, Building2, Calendar, Link as LinkIcon, Twitter, Linkedin, Github, User, Briefcase, Target, Eye } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useMemo } from "react"

export default function ProfilePage() {
  const { profile, user } = useAuth()
  
  // Parse interests JSON
  const interestsData = useMemo(() => {
    if (!profile?.interests) return null
    try {
      return typeof profile.interests === 'string' 
        ? JSON.parse(profile.interests) 
        : profile.interests
    } catch (e) {
      console.error('Error parsing interests:', e)
      return null
    }
  }, [profile?.interests])

  // Get initials for avatar - always use full_name if available
  const initials = useMemo(() => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(/\s+/)
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return profile.full_name.substring(0, 2).toUpperCase()
    }
    return 'U'
  }, [profile?.full_name])

  // Get display name - always use full_name, no email fallback
  const displayName = profile?.full_name || 'User'
  const email = user?.email || 'No email'
  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        {/* <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6 md:px-12 md:py-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/onboarding">Start Onboarding</Link>
            </Button>
            <Button variant="outline">Edit Profile</Button>
          </div>
        </div> */}
      </div>

      <div className="flex flex-col gap-6 p-6 md:p-12 max-w-5xl mx-auto w-full">
        <div className="grid gap-6 md:grid-cols-[300px_1fr] md:items-stretch">
        {/* Sidebar / Main Profile Card */}
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden h-full flex flex-col">
            <CardContent className="pt-6 flex-1 flex flex-col">
              <div className="mb-4 flex flex-col items-center">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={`/avatars/${user?.id?.substring(0, 2)}.png`} alt={displayName} />
                  <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center">
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  {profile?.role && (
                    <p className="text-muted-foreground">{profile.role}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mb-6">
                {interestsData?.department && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{interestsData.department}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{email}</span>
                </div>
                {user?.created_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {interestsData?.topics && interestsData.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {interestsData.topics.map((topic: string) => (
                    <Badge key={topic} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6 h-full">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 flex-1">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-4">
                    {profile?.role && (
                      <div className="flex items-start gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-sm font-medium">Role</Label>
                          <p className="text-sm text-muted-foreground">{profile.role}</p>
                        </div>
                      </div>
                    )}
                    {interestsData?.department && (
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-sm font-medium">Department</Label>
                          <p className="text-sm text-muted-foreground">{interestsData.department}</p>
                        </div>
                      </div>
                    )}
                    {interestsData?.responsibilities && interestsData.responsibilities.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-sm font-medium">Responsibilities</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {interestsData.responsibilities.map((resp: string) => (
                              <Badge key={resp} variant="outline">{resp}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {interestsData?.decisionInvolvement && (
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-sm font-medium">Decision Involvement</Label>
                          <p className="text-sm text-muted-foreground capitalize">{interestsData.decisionInvolvement}</p>
                        </div>
                      </div>
                    )}
                    {interestsData?.updateTypes && interestsData.updateTypes.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <Label className="text-sm font-medium">Update Preferences</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {interestsData.updateTypes.map((type: string) => (
                              <Badge key={type} variant="outline">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Preferences</Label>
                      {interestsData?.topics && interestsData.topics.length > 0 && (
                        <div className="mb-4">
                          <Label className="text-xs text-muted-foreground mb-2 block">Topics</Label>
                          <div className="flex flex-wrap gap-2">
                            {interestsData.topics.map((topic: string) => (
                              <Badge key={topic} variant="outline">{topic}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {interestsData?.consumptionPreference && (
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Consumption Style</Label>
                          <Badge variant="secondary">
                            {interestsData.consumptionPreference === 'summary' && 'Quick Summaries & Key Points'}
                            {interestsData.consumptionPreference === 'deep_dive' && 'Deep Dives & Long Form'}
                            {interestsData.consumptionPreference === 'visual' && 'Visuals & Diagrams'}
                            {interestsData.consumptionPreference === 'discussion' && 'Discussions & Threads'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest contributions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="h-full w-[2px] bg-border relative ml-2">
                        <div className="absolute top-0 -left-[5px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      </div>
                      <div className="pb-8">
                        <p className="text-sm font-medium">Commented on <span className="text-primary">Article: The future of AI and Marketing</span></p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          "This is a great point, lets talk about at the next standup".
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-full w-[2px] bg-border relative ml-2">
                        <div className="absolute top-0 -left-[5px] h-3 w-3 rounded-full bg-muted-foreground ring-4 ring-background" />
                      </div>
                      <div className="pb-8">
                        <p className="text-sm font-medium">Added an article: OpenAI prepping for IPO?</p>
                        <p className="text-xs text-muted-foreground">Yesterday at 4:30 PM</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
               <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={profile?.full_name || ""} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={email} disabled />
                  </div>
                  {profile?.role && (
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" defaultValue={profile.role} />
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
    </div>
  )
}


