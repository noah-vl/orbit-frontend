"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const SUPABASE_URL = "https://xltqabrlmfalosewvjby.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg"

export default function CreateTeamPage() {
  const router = useRouter()
  const [teamName, setTeamName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // No auth required - this is for platform creators
      // But Supabase Edge Functions require the apikey header
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create_team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          name: teamName,
        }),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.text()
        } catch {
          errorData = `HTTP ${response.status}: ${response.statusText}`
        }
        console.error("Error response:", errorData)
        throw new Error(errorData || `Failed to create team (${response.status})`)
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        throw new Error("Invalid response from server")
      }

      if (!data || !data.team || !data.team.id) {
        console.error("Invalid response data:", data)
        throw new Error("Invalid response format")
      }
      
      // Redirect to team settings
      router.push(`/team/settings?teamId=${data.team.id}`)
    } catch (err) {
      console.error("Create team error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6 md:px-12 md:py-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Create Team</h1>
            <p className="text-muted-foreground text-base">
              Start a new team workspace
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 md:px-12 py-6 md:py-8">
        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
            <CardDescription>
              Create a new team workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  type="text"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading || !teamName.trim()}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Team"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

