"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const SUPABASE_URL = "https://xltqabrlmfalosewvjby.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg"

interface Invite {
  id: string
  token: string
  invite_url: string
  expires_at: string | null
  max_uses: number | null
  uses_count: number
  created_at: string
}

function TeamSettingsContent() {
  const searchParams = useSearchParams()
  const teamId = searchParams.get("teamId")
  
  const [teamName, setTeamName] = useState("")
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresInDays, setExpiresInDays] = useState("7")
  const [maxUses, setMaxUses] = useState("")

  useEffect(() => {
    if (teamId) {
      // Fetch team details and existing invites
      fetchTeamDetails()
      fetchInvites()
    }
  }, [teamId])

  const fetchTeamDetails = async () => {
    if (!teamId) return
    
    try {
      const token = localStorage.getItem("supabase.auth.token") || 
                    sessionStorage.getItem("supabase.auth.token")
      
      // Fetch team details (you might want to create a get_team endpoint)
      // For now, we'll just use the teamId
    } catch (err) {
      console.error("Error fetching team details:", err)
    }
  }

  const fetchInvites = async () => {
    if (!teamId) return
    
    try {
      const token = localStorage.getItem("supabase.auth.token") || 
                    sessionStorage.getItem("supabase.auth.token")
      
      // Fetch existing invites for this team
      // You might want to create a get_invites endpoint
      // For now, we'll just show the create invite form
    } catch (err) {
      console.error("Error fetching invites:", err)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!teamId) {
        throw new Error("Team ID is required")
      }

      // No auth required - this is for platform creators
      // But Supabase Edge Functions require the apikey header
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create_invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          team_id: teamId,
          expires_in_days: expiresInDays ? parseInt(expiresInDays) : null,
          max_uses: maxUses ? parseInt(maxUses) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to create invite")
      }

      const data = await response.json()
      
      // Add new invite to list
      setInvites([...invites, data.invite])
      
      // Reset form
      setExpiresInDays("7")
      setMaxUses("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6 md:px-12 md:py-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Team Settings</h1>
            <p className="text-muted-foreground text-base">
              Manage your team and invite members
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-6 md:py-8 space-y-6">
        {/* Create Invite Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create Invite Link</CardTitle>
            <CardDescription>
              Generate a link to invite new members to your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiresInDays">Expires In (days)</Label>
                  <Input
                    id="expiresInDays"
                    type="number"
                    placeholder="7"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    min="1"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no expiration
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Unlimited"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    min="1"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Generate Invite Link"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Invites Section */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Invite Links</CardTitle>
              <CardDescription>
                Share these links with people you want to invite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-4 rounded-lg border bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {invite.uses_count} / {invite.max_uses || "∞"} uses
                        </Badge>
                        {invite.expires_at && (
                          <Badge variant="outline">
                            Expires: {new Date(invite.expires_at).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(invite.invite_url)}
                      >
                        Copy Link
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={invite.invite_url}
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function TeamSettingsPage() {
  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    }>
      <TeamSettingsContent />
    </Suspense>
  )
}

