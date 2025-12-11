"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardStats } from "@/components/dashboard/stats"
import { DashboardTrustScore } from "@/components/dashboard/trust-score"
import { DashboardRecentActivity } from "@/components/dashboard/recent-activity"
import { DashboardQuickActions } from "@/components/dashboard/quick-actions"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("[v0] No user found, redirecting to login")
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="space-y-8">
      <DashboardHeader />
      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardRecentActivity />
        </div>
        <div className="space-y-6">
          <DashboardTrustScore />
          <DashboardQuickActions />
        </div>
      </div>
    </div>
  )
}
