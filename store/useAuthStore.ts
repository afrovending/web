import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/interfaces/user";

interface AuthStore {
  token: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,

      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => {
        // Clear Zustand
        set({ token: null, user: null });

        // Clear cookies
        document.cookie.split(";").forEach((cookie) => {
          const name = cookie.split("=")[0].trim();
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          sessionStorage.clear();
        }
      },

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      updateUser: (userUpdate: Partial<User>) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...userUpdate }
            : ({ ...userUpdate } as User),
        })),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) =>
        ({
          token: state.token,
          user: state.user,
        } as AuthStore),
    }
  )
);
