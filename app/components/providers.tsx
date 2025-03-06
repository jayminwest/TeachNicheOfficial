"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider } from "@/app/services/auth/AuthContext"
import { ErrorBoundary } from "./ui/error-boundary"
import { useToast } from "./ui/use-toast"
import { ToastDisplay } from "./ui/toast-display"

type ThemeProviderProps = Parameters<typeof NextThemesProvider>[0]

// Create a ToastProvider component to initialize the toast system
function ToastProvider({ children }: { children: React.ReactNode }) {
  // Just by using useToast, we initialize the global toast function
  const { toasts, dismiss } = useToast();
  return (
    <>
      {children}
      <ToastDisplay toasts={toasts} dismiss={dismiss} />
    </>
  );
}

export function Providers({ children, ...props }: ThemeProviderProps) {
  // Use suppressHydrationWarning on the wrapper div
  return (
    <div suppressHydrationWarning>
      <NextThemesProvider {...props}>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </NextThemesProvider>
    </div>
  )
}
