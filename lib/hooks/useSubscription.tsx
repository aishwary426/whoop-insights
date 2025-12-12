'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUser } from '../auth'
import PricingModal from '../../components/monetization/PricingModal'

interface SubscriptionContextType {
    isPro: boolean
    isLoading: boolean
    showUpgradeModal: () => void
    checkAccess: (feature: string) => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const [isPro, setIsPro] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        checkSubscription()
    }, [])

    const checkSubscription = async () => {
        try {
            const user = await getCurrentUser()
            if (user) {
                // TODO: Replace with actual DB check
                // const { data } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).single()
                // setIsPro(data?.status === 'active')
                
                // For MVP/Demo: Check if user has a specific metadata flag or just default to false
                setIsPro(false) 
            }
        } catch (error) {
            console.error('Failed to check subscription', error)
        } finally {
            setIsLoading(false)
        }
    }

    const showUpgradeModal = () => setIsModalOpen(true)

    const checkAccess = (feature: string): boolean => {
        if (isPro) return true
        
        // List of free features
        const freeFeatures = ['dashboard', 'trends', 'journal']
        if (freeFeatures.includes(feature)) return true

        // If feature is locked and user is not pro, show modal
        showUpgradeModal()
        return false
    }

    return (
        <SubscriptionContext.Provider value={{ isPro, isLoading, showUpgradeModal, checkAccess }}>
            {children}
            <PricingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
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
