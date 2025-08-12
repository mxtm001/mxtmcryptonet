"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { userService } from "@/lib/user-service"

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData & { terms: string; general: string }>>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await userService.getCurrentUser()
        if (currentUser) {
          router.push("/dashboard")
        }
      } catch (error) {
        console.log("No current user")
      }
    }
    checkUser()
  }, [router])

  // Validation function
  const validateForm = useMemo(() => {
    return (data: FormData, terms: boolean): Partial<FormData & { terms: string }> => {
      const newErrors: Partial<FormData & { terms: string }> = {}

      if (!data.firstName.trim()) newErrors.firstName = "First name is required"
      if (!data.lastName.trim()) newErrors.lastName = "Last name is required"

      if (!data.email.trim()) {
        newErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        newErrors.email = "Please enter a valid email address"
      }

      if (!data.phone.trim()) newErrors.phone = "Phone number is required"

      if (!data.password) {
        newErrors.password = "Password is required"
      } else if (data.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long"
      }

      if (!data.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (data.password !== data.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }

      if (!terms) {
        newErrors.terms = "You must agree to the terms and conditions"
      }

      return newErrors
    }
  }, [])

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors],
  )

  // Handle terms checkbox
  const handleTermsChange = useCallback(
    (checked: boolean) => {
      setAgreeToTerms(checked)
      if (errors.terms) {
        setErrors((prev) => ({ ...prev, terms: undefined }))
      }
    },
    [errors.terms],
  )

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formErrors = validateForm(formData, agreeToTerms)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const result = await userService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: "BR", // Default to Brazil since it's a Brazilian investment platform
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setErrors({ general: result.message || "Registration failed" })
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setErrors({ general: error.message || "Registration failed. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050e24] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#0a1735] border-[#253256] text-white">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-gray-400 text-center mb-4">
              Welcome to MXTM Investment Platform. Redirecting to your dashboard...
            </p>
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
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-4 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image src="/logo.png" alt="MXTM Investment" fill className="object-cover" />
            </div>
            <span className="ml-2 font-medium text-white">MXTM INVESTMENT</span>
          </Link>
        </div>

        <Card className="bg-[#0a1735] border-[#253256] text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Join MXTM Investment and start your journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="bg-[#162040] border-[#253256] text-white placeholder:text-gray-400"
                    disabled={loading}
                  />
                  {errors.firstName && <p className="text-red-400 text-sm">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="bg-[#162040] border-[#253256] text-white placeholder:text-gray-400"
                    disabled={loading}
                  />
                  {errors.lastName && <p className="text-red-400 text-sm">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-[#162040] border-[#253256] text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="bg-[#162040] border-[#253256] text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                {errors.phone && <p className="text-red-400 text-sm">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="bg-[#162040] border-[#253256] text-white placeholder:text-gray-400 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="bg-[#162040] border-[#253256] text-white placeholder:text-gray-400 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={handleTermsChange}
                  className="mt-1 border-[#253256] data-[state=checked]:bg-[#f9a826] data-[state=checked]:border-[#f9a826]"
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{" "}
                    <Link href="/terms" className="text-[#f9a826] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#f9a826] hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                  {errors.terms && <p className="text-red-400 text-sm">{errors.terms}</p>}
                </div>
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-[#f9a826] hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
