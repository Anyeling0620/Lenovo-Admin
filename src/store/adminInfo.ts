import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminProfileResponse } from '../services/api-type';

interface AdminProfileStore {
  profile: AdminProfileResponse | null;
  setProfile: (profile: AdminProfileResponse) => void;
  updateProfile: (profile: Partial<AdminProfileResponse>) => void;
  clearProfile: () => void;
  getIdentityCodes: () => string[];
  getCategoryIds: () => string[];
  getPermissionIds: () => string[];
}

const useAdminProfileStore = create<AdminProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (profile) =>
        set((state) =>
          state.profile ? { profile: { ...state.profile, ...profile } } : state
        ),
      clearProfile: () => set({ profile: null }),
      getIdentityCodes: () =>
        (get().profile?.identities ?? []).map((item) => item.identity_code),
      getCategoryIds: () =>
        (get().profile?.categories ?? []).map((item) => item.category_id),
      getPermissionIds: () =>
        (get().profile?.permissions ?? []).map((item) => item.permission_id),
    }),
    {
      name: 'admin-profile-store',
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);

export default useAdminProfileStore;
