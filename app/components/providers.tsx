"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider } from "@/auth/AuthContext"

type ThemeProviderProps = Parameters<typeof NextThemesProvider>[0]

export function Providers({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <NextThemesProvider {...props}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextThemesProvider>
  )
}
