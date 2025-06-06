// store/userStore.ts
import { create } from 'zustand'
import { Cat, User } from '@prisma/client'

// Extend the User type to include nested Cat data as fetched from API
// and the 'nextUnlockCat' which is also a Cat object.
export type UserProfile = User & {
    activeCat?: Cat | null // The cat currently displayed on the dashboard
    unlockedCats: Cat[] // Array of all cats the user has unlocked
    nextUnlockCat?: Cat | null // The next cat the user can unlock, based on progression
}

// Note: Prisma Client will automatically update the `Cat` type to have `videoUrl`
// instead of `imageUrl` once you run `npx prisma generate`.
// So, Cat.videoUrl will be correctly typed in user.activeCat.videoUrl etc.

interface UserState {
    user: UserProfile | null
    isLoading: boolean
    error: string | null

    fetchUser: () => Promise<void>
    setUser: (user: UserProfile | null) => void
    updateUserCalories: (calories: number) => void
    unlockNewCat: (newCat: Cat) => void
    setActiveCat: (catId: string) => void
}

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    isLoading: false,
    error: null,

    fetchUser: async () => {
        set({ isLoading: true, error: null })
        try {
            const res = await fetch('/api/user/profile')
            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || 'Failed to fetch user profile.')
            }
            const data = await res.json()
            set({
                user: {
                    ...data.user,
                    nextUnlockCat: data.nextUnlockCat,
                },
                isLoading: false,
            })
            console.log(
                '[Zustand Store] User profile fetched and updated:',
                data.user.name,
                'Next unlock:',
                data.nextUnlockCat?.name
            )
        } catch (err: any) {
            console.error('[Zustand Store] Error fetching user profile:', err)
            set({ error: err.message, isLoading: false })
        }
    },

    setUser: (user) => {
        set({ user, isLoading: false })
        console.log('[Zustand Store] User profile manually set:', user?.name)
    },

    updateUserCalories: (calories) => {
        set((state) => {
            if (!state.user) {
                console.warn('[Zustand Store] Attempted to update calories, but no user in store.')
                return state
            }
            const updatedUser: UserProfile = {
                ...state.user,
                currentCaloriesToday: state.user.currentCaloriesToday + calories,
                totalLifetimeCalories: state.user.totalLifetimeCalories + calories,
            }
            console.log(
                '[Zustand Store] Calories updated:',
                updatedUser.currentCaloriesToday,
                '/',
                updatedUser.totalLifetimeCalories
            )
            return { user: updatedUser }
        })
    },

    unlockNewCat: (newCat) => {
        set((state) => {
            if (!state.user) {
                console.warn('[Zustand Store] Attempted to unlock cat, but no user in store.')
                return state
            }
            if (state.user.unlockedCats.some((cat) => cat.id === newCat.id)) {
                console.log('[Zustand Store] Cat already unlocked:', newCat.name)
                return state
            }
            const updatedUser: UserProfile = {
                ...state.user,
                unlockedCats: [...state.user.unlockedCats, newCat],
            }
            console.log('[Zustand Store] New cat unlocked and added to collection:', newCat.name)
            return { user: updatedUser }
        })
    },

    setActiveCat: (catId) => {
        set((state) => {
            if (!state.user) {
                console.warn('[Zustand Store] Attempted to set active cat, but no user in store.')
                return state
            }
            const newActiveCat = state.user.unlockedCats.find((cat) => cat.id === catId)
            if (newActiveCat) {
                const updatedUser: UserProfile = {
                    ...state.user,
                    activeCatId: catId,
                    activeCat: newActiveCat,
                }
                console.log('[Zustand Store] Active cat set to:', newActiveCat.name)
                return { user: updatedUser }
            }
            console.warn(
                '[Zustand Store] Failed to set active cat: Cat not found in unlocked collection with ID:',
                catId
            )
            return state
        })
    },
}))
