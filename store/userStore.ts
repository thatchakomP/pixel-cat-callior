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

interface UserState {
    user: UserProfile | null
    isLoading: boolean // Indicates if user profile data is currently being fetched
    error: string | null // Stores any error messages related to fetching user data

    // Action to fetch the user profile from the backend
    fetchUser: () => Promise<void>
    // Action to manually set the user profile (e.g., after onboarding or updates)
    setUser: (user: UserProfile | null) => void
    // Action to update calorie counts in the store
    updateUserCalories: (calories: number) => void
    // Action to add a newly unlocked cat to the user's collection in the store
    unlockNewCat: (newCat: Cat) => void
    // Action to set a specific cat as the user's active/displayed cat
    setActiveCat: (catId: string) => void
}

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    isLoading: false, // Initial state: false. `fetchUser` will set it to true.
    error: null,

    // --- fetchUser Action ---
    // Fetches the user's profile and related data from the backend API.
    fetchUser: async () => {
        set({ isLoading: true, error: null }) // Set loading state to true while fetching
        try {
            const res = await fetch('/api/user/profile') // Calls app/api/user/profile/route.ts
            if (!res.ok) {
                // If API response is not OK (e.g., 401, 404, 500)
                const errorData = await res.json()
                throw new Error(errorData.message || 'Failed to fetch user profile.')
            }
            const data = await res.json()
            // The API now returns { user: UserData, nextUnlockCat: CatData }.
            // Combine them into the single 'user' object for the store's state.
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
            set({ error: err.message, isLoading: false }) // Set error and stop loading
        }
    },

    // --- setUser Action ---
    // Directly sets the user object in the store. Useful after login, onboarding, or direct updates.
    setUser: (user) => {
        set({ user, isLoading: false })
        console.log('[Zustand Store] User profile manually set:', user?.name)
    },

    // --- updateUserCalories Action ---
    // Updates the current and total calorie counts in the store.
    updateUserCalories: (calories) => {
        set((state) => {
            if (!state.user) {
                console.warn('[Zustand Store] Attempted to update calories, but no user in store.')
                return state // If no user, do nothing
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

    // --- unlockNewCat Action ---
    // Adds a newly unlocked cat to the user's collection in the store.
    unlockNewCat: (newCat) => {
        set((state) => {
            if (!state.user) {
                console.warn('[Zustand Store] Attempted to unlock cat, but no user in store.')
                return state
            }
            // Prevent adding duplicate cats to the unlocked collection
            if (state.user.unlockedCats.some((cat) => cat.id === newCat.id)) {
                console.log('[Zustand Store] Cat already unlocked:', newCat.name)
                return state
            }
            const updatedUser: UserProfile = {
                ...state.user,
                unlockedCats: [...state.user.unlockedCats, newCat], // Add the new cat to the array
            }
            console.log('[Zustand Store] New cat unlocked and added to collection:', newCat.name)
            return { user: updatedUser }
        })
    },

    // --- setActiveCat Action ---
    // Sets a specific cat as the user's active cat in the store.
    setActiveCat: (catId) => {
        set((state) => {
            if (!state.user) {
                console.warn('[Zustand Store] Attempted to set active cat, but no user in store.')
                return state
            }
            // Find the cat by ID from the user's unlocked collection
            const newActiveCat = state.user.unlockedCats.find((cat) => cat.id === catId)
            if (newActiveCat) {
                const updatedUser: UserProfile = {
                    ...state.user,
                    activeCatId: catId, // Update the ID reference
                    activeCat: newActiveCat, // Update the nested activeCat object
                }
                console.log('[Zustand Store] Active cat set to:', newActiveCat.name)
                return { user: updatedUser }
            }
            console.warn(
                '[Zustand Store] Failed to set active cat: Cat not found in unlocked collection with ID:',
                catId
            )
            return state // Cat not found in unlocked list
        })
    },
}))
