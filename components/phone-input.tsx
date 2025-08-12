"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Country codes mapping
const countryCodes: Record<string, string> = {
  US: "+1",
  BR: "+55",
  CA: "+1",
  GB: "+44",
  DE: "+49",
  FR: "+33",
  IT: "+39",
  ES: "+34",
  PT: "+351",
  NL: "+31",
  BE: "+32",
  CH: "+41",
  AT: "+43",
  SE: "+46",
  NO: "+47",
  DK: "+45",
  FI: "+358",
  PL: "+48",
  CZ: "+420",
  HU: "+36",
  RO: "+40",
  BG: "+359",
  HR: "+385",
  SI: "+386",
  SK: "+421",
  LT: "+370",
  LV: "+371",
  EE: "+372",
  IE: "+353",
  LU: "+352",
  MT: "+356",
  CY: "+357",
  GR: "+30",
  JP: "+81",
  KR: "+82",
  CN: "+86",
  IN: "+91",
  AU: "+61",
  NZ: "+64",
  SG: "+65",
  HK: "+852",
  TW: "+886",
  MY: "+60",
  TH: "+66",
  ID: "+62",
  PH: "+63",
  VN: "+84",
  MX: "+52",
  AR: "+54",
  CL: "+56",
  CO: "+57",
  PE: "+51",
  UY: "+598",
  PY: "+595",
  BO: "+591",
  EC: "+593",
  VE: "+58",
  ZA: "+27",
  NG: "+234",
  KE: "+254",
  GH: "+233",
  EG: "+20",
  MA: "+212",
  TN: "+216",
  DZ: "+213",
  AE: "+971",
  SA: "+966",
  QA: "+974",
  KW: "+965",
  BH: "+973",
  OM: "+968",
  JO: "+962",
  LB: "+961",
  IL: "+972",
  TR: "+90",
  RU: "+7",
  UA: "+380",
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  country?: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function PhoneInput({
  value,
  onChange,
  country = "",
  disabled = false,
  placeholder = "Enter phone number",
  className,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value)

  // Get country code based on selected country
  const countryCode = useMemo(() => {
    return country ? countryCodes[country] || "" : ""
  }, [country])

  // Update display value when country changes
  useEffect(() => {
    if (countryCode && !value.startsWith(countryCode)) {
      const newValue = countryCode + " "
      setDisplayValue(newValue)
      onChange(newValue)
    } else if (!countryCode && value) {
      // If no country selected, keep the current value
      setDisplayValue(value)
    }
  }, [countryCode, value, onChange])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // If there's a country code, ensure it stays at the beginning
    if (countryCode) {
      if (!inputValue.startsWith(countryCode)) {
        inputValue = countryCode + " " + inputValue.replace(countryCode, "").trim()
      }
    }

    // Remove any non-numeric characters except + and spaces
    inputValue = inputValue.replace(/[^\d+\s]/g, "")

    setDisplayValue(inputValue)
    onChange(inputValue)
  }

  // Handle focus to position cursor after country code
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (countryCode && displayValue.startsWith(countryCode)) {
      const cursorPosition = countryCode.length + 1
      setTimeout(() => {
        e.target.setSelectionRange(cursorPosition, cursorPosition)
      }, 0)
    }
  }

  return (
    <div className="relative">
      <Input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={countryCode ? `${countryCode} ${placeholder}` : placeholder}
        disabled={disabled}
        className={cn(
          "bg-[#162040] border-[#253256] text-white placeholder:text-gray-400",
          countryCode && "pl-16",
          className,
        )}
      />
      {countryCode && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm font-medium pointer-events-none">
          {countryCode}
        </div>
      )}
    </div>
  )
}
