import { createBrowserClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    throw new Error("Supabase environment variables are not configured")
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

export const supabase = {
  get auth() {
    return getSupabaseClient().auth
  },
  get from() {
    return getSupabaseClient().from.bind(getSupabaseClient())
  },
}

export interface Contract {
  id: string
  title: string
  description: string
  type: "freelance" | "chama" | "purchase"
  contract_type: "one-off" | "milestone"
  participants: Array<{ email: string; role: "freelancer" | "client" | "member" }>
  amount: string
  currency: string
  deadline: string
  milestones: Array<{ title: string; amount: string; dueDate: string }>
  status: "active" | "pending" | "completed" | "disputed"
  created_at: string
}

export async function getContracts(): Promise<Contract[]> {
  try {
    const { data, error } = await supabase.from("contracts").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching contracts:", error)
      return []
    }

    // Fetch participants for each contract
    const contractsWithParticipants = await Promise.all(
      (data || []).map(async (contract: any) => {
        const { data: participants, error: participantsError } = await supabase
          .from("participants")
          .select("email, role")
          .eq("contract_id", contract.id)

        return {
          ...contract,
          participants: participantsError ? [] : participants || [],
          amount: contract.amount.toString(),
          milestones: [],
        }
      }),
    )

    return contractsWithParticipants
  } catch (error) {
    console.error("[v0] Error in getContracts:", error instanceof Error ? error.message : error)
    return []
  }
}

export async function saveContract(contract: Omit<Contract, "id" | "created_at">): Promise<Contract | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] No authenticated user")
      return null
    }

    const { data, error } = await supabase
      .from("contracts")
      .insert([
        {
          title: contract.title,
          description: contract.description,
          type: contract.type,
          contract_type: contract.contract_type,
          amount: Number.parseFloat(contract.amount),
          currency: contract.currency,
          deadline: contract.deadline,
          status: "active",
          created_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving contract:", error)
      return null
    }

    const participantInserts = contract.participants.map((p) => ({
      contract_id: data.id,
      email: p.email,
      role: p.role,
    }))

    const { error: participantsError } = await supabase.from("participants").insert(participantInserts)

    if (participantsError) {
      console.error("[v0] Error saving participants:", participantsError)
    }

    // Save milestones
    if (contract.milestones.length > 0) {
      const milestoneInserts = contract.milestones.map((m) => ({
        contract_id: data.id,
        title: m.title,
        amount: Number.parseFloat(m.amount),
        due_date: m.dueDate,
      }))

      const { error: milestonesError } = await supabase.from("milestones").insert(milestoneInserts)

      if (milestonesError) {
        console.error("[v0] Error saving milestones:", milestonesError)
      }
    }

    console.log("[v0] Contract saved successfully:", data.id)
    return data
  } catch (error) {
    console.error("[v0] Error in saveContract:", error)
    return null
  }
}

export async function userExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).single()

    if (error) {
      return false
    }

    return !!data
  } catch {
    return false
  }
}

export function useContracts() {
  // This hook is now deprecate in favor of direct getContracts() calls
  // Use SWR or React Query for client-side state management
  return { contracts: [], loading: false }
}
