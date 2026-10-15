import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

// Keep the context outside the refreshable provider module so live edits cannot
// leave mounted consumers holding a different context from their provider.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);