import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MapPin, Building2, Calendar, Link as LinkIcon, Twitter, Linkedin, Github } from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-serif tracking-tight">Profile</h1>
        <Button variant="outline">Edit Profile</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Sidebar / Main Profile Card */}
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="h-32 bg-linear-to-br from-muted to-accent/50"></div>
            <CardContent className="relative pt-0">
              <div className="-mt-16 mb-4 flex flex-col items-center">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src="/avatars/01.png" alt="@jdoe" />
                  <AvatarFallback className="text-4xl">JD</AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center">
                  <h2 className="text-2xl font-bold font-serif">Jane Doe</h2>
                  <p className="text-muted-foreground">@janedoe</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Engineering</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>jane@orbit.co</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined March 2023</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">Product Design</Badge>
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">Accessibility</Badge>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-center gap-4">
                <Button variant="ghost" size="icon">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Photography</Badge>
                <Badge variant="outline">Hiking</Badge>
                <Badge variant="outline">Sci-Fi</Badge>
                <Badge variant="outline">Coffee</Badge>
                <Badge variant="outline">Mechanical Keyboards</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Senior Product Designer with a passion for building accessible and inclusive digital experiences. 
                    Currently leading the design system team at Orbit. Previously worked at TechFlow and DesignCo.
                    Obsessed with typography, micro-interactions, and clean code.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Current Focus</CardTitle>
                  <CardDescription>What I'm working on this quarter</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 rounded-md border p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Design System Overhaul</h4>
                      <p className="text-sm text-muted-foreground">Standardizing components across the entire platform.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-md border p-4">
                    <div className="rounded-full bg-chart-1/10 p-2">
                      <LinkIcon className="h-4 w-4 text-chart-1" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Accessibility Audit</h4>
                      <p className="text-sm text-muted-foreground">Ensuring WCAG 2.1 AA compliance for all public facing pages.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Recent Activity</CardTitle>
                  <CardDescription>Latest contributions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="h-full w-[2px] bg-border relative ml-2">
                        <div className="absolute top-0 -left-[5px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      </div>
                      <div className="pb-8">
                        <p className="text-sm font-medium">Commented on <span className="text-primary">PR #432</span></p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          "Great work on this component! Let's just tweak the padding slightly."
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-full w-[2px] bg-border relative ml-2">
                        <div className="absolute top-0 -left-[5px] h-3 w-3 rounded-full bg-muted-foreground ring-4 ring-background" />
                      </div>
                      <div className="pb-8">
                        <p className="text-sm font-medium">Deployed <span className="text-primary">v2.4.0</span> to production</p>
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
                  <CardTitle className="font-serif">Profile Settings</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" defaultValue="Jane Doe" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" defaultValue="Senior Product Designer..." />
                  </div>
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
  )
}

