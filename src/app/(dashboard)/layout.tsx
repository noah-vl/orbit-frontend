import { Sidebar } from "@/components/shared/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-background">
      <Sidebar className="hidden md:block border-r" />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

