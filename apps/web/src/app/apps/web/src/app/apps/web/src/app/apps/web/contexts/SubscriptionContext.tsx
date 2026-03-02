'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type Plan = 'free' | 'pro' | 'team' | 'enterprise'

interface Features {
  maxNodes: number
  can3D: boolean
  canExport: boolean
  teamSize: number
}

interface SubscriptionContextType {
  plan: Plan
  setPlan: (plan: Plan) => void
  features: Features
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

const featuresByPlan: Record<Plan, Features> = {
  free: {
    maxNodes: 100,
    can3D: false,
    canExport: false,
    teamSize: 1,
  },
  pro: {
    maxNodes: 10000,
    can3D: true,
    canExport: true,
    teamSize: 1,
  },
  team: {
    maxNodes: 100000,
    can3D: true,
    canExport: true,
    teamSize: 5,
  },
  enterprise: {
    maxNodes: Infinity,
    can3D: true,
    canExport: true,
    teamSize: Infinity,
  },
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>('free') // по умолчанию free

  const features = featuresByPlan[plan]

  return (
    <SubscriptionContext.Provider value={{ plan, setPlan, features }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
