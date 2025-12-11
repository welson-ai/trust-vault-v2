import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  if (typeof window === "undefined") {
    // During SSR/build, return a mock client
    return null as any
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("[v0] Supabase environment variables missing:", { url: !!url, key: !!key })
    // Return a placeholder that won't crash but will log errors
    return createBrowserClient(url || "http://localhost", key || "placeholder")
  }

  return createBrowserClient(url, key)
}
