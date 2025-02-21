"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider } from "@/app/services/auth/AuthContext"

type ThemeProviderProps = Parameters<typeof NextThemesProvider>[0]

export function Providers({ children, ...props }: ThemeProviderProps) {
  // Use suppressHydrationWarning on the wrapper div
  return (
    <div suppressHydrationWarning>
      <NextThemesProvider {...props}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </NextThemesProvider>
    </div>
  )
}
