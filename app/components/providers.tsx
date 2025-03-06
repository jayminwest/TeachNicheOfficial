"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider } from "@/app/services/auth/AuthContext"
import { ErrorBoundary } from "./ui/error-boundary"

type ThemeProviderProps = Parameters<typeof NextThemesProvider>[0]

export function Providers({ children, ...props }: ThemeProviderProps) {
  // Use suppressHydrationWarning on the wrapper div
  return (
    <div suppressHydrationWarning>
      <NextThemesProvider {...props}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </NextThemesProvider>
    </div>
  )
}
