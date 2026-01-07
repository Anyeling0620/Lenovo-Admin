import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface AuthState {
    readonly isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            login: () => set({ isAuthenticated: true }),
            logout: () => set({ isAuthenticated: false }),
        }),
        {
            name: 'auth',
            partialize :(state) =>({
                isAuthenticated: state.isAuthenticated,
            })
        }
    )
)

export default useAuthStore;