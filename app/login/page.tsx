"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { userService } from "@/lib/user-service"

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

const initialForm: LoginForm = {
  email: "",
  password: "",
  rememberMe: false,
}

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginForm>(initialForm)
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  // Memoized validation function
  const validateForm = useMemo(() => {
    return (data: LoginForm): Partial<LoginForm> => {
      const newErrors: Partial<LoginForm> = {}

      if (!data.email.trim()) {
        newErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        newErrors.email = "Please enter a valid email address"
      }

      if (!data.password) {
        newErrors.password = "Password is required"
      }

      return newErrors
    }
  }, [])

  // Optimized input change handler
  const handleInputChange = useCallback(
    (field: keyof LoginForm, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formErrors = validateForm(formData)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const result = await userService.login({
        email: formData.email,
        password: formData.password,
      })

      if (result.success) {
        setSuccess(true)

        // Save login preference
        if (formData.rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email)
        } else {
          localStorage.removeItem("rememberedEmail")
        }

        setTimeout(() => {
          // Check if admin
          if (formData.email === "admin@mxtminvestment.com") {
            router.push("/admin/dashboard")
          } else {
            router.push("/dashboard")
          }
        }, 1500)
      } else {
        setErrors({ email: result.message || "Login failed" })
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrors({ email: "Login failed. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  // Load remembered email on component mount
  useState(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail, rememberMe: true }))
    }
  })

  if (success) {
    return (
      <div className="min-h-screen bg-[#050e24] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#0a1735] border-[#253256] text-white">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Successful!</h2>
            <p className="text-gray-400 text-center mb-4">Welcome back! Redirecting to your dashboard...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f9a826]"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050e24] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6">
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <Image src="/logo.png" alt="MXTM Investment" fill className="object-cover" />
            </div>
            <span className="ml-2 text-white font-medium text-lg">MXTM INVESTMENT</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your investment account</p>
        </div>

        <Card className="bg-[#0a1735] border-[#253256] text-white">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription className="text-gray-400">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-[#162040] border-[#253256] text-white placeholder:text-gray-500"
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-[#f9a826] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="bg-[#162040] border-[#253256] text-white placeholder:text-gray-500 pr-10"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                  disabled={loading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#f9a826] hover:bg-[#f9a826]/90 text-black font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link href="/register" className="text-[#f9a826] hover:underline">
                  Create one
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <p className="text-blue-400 text-sm font-medium mb-2">Demo Credentials:</p>
              <div className="text-xs text-gray-300 space-y-1">
                <p>
                  <strong>User:</strong> any email + any password
                </p>
                <p>
                  <strong>Admin:</strong> admin@mxtminvestment.com + any password
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
