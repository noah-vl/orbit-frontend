// Type definitions for Chrome extension bridge

interface SolonExtensionBridge {
  getAuthData: () => Promise<{
    success: boolean
    data: {
      access_token: string | null
      refresh_token: string | null
      user: { id: string } | null
      teamId: string | null
      profile: any | null
    } | null
  }>
}

declare global {
  interface Window {
    solonExtensionBridge?: SolonExtensionBridge
  }
}

export {}


