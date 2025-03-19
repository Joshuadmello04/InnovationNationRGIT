"use client"

import { useState } from "react"
import AuthForm from "@/components/auth/AuthForm"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Login failed")
      }

      // In a real app, you would set up client-side authentication state here
      const userData = await response.json()

      // For now, we'll just simulate successful login
      return userData
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      throw error
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <AuthForm mode="login" onSubmit={handleLogin} />
        </div>
      </div>
    </div>
  )
}

