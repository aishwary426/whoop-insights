'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUser } from '../auth'
import { User } from '@supabase/supabase-js'

import { supabase } from '../supabase-client'

interface UserContextType {
    user: User | null
    isLoading: boolean
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const refreshUser = async () => {
        try {
            const currentUser = await getCurrentUser()
            setUser(currentUser)
        } catch (error) {
            console.error('Failed to fetch user', error)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Initial fetch
        refreshUser()

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user)
            } else {
                setUser(null)
            }
            setIsLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return (
        <UserContext.Provider value={{ user, isLoading, refreshUser }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
