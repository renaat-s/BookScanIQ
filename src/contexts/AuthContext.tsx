import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  providerToken: string | null;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Store the Google refresh token in the user_credentials table (upsert). */
const storeRefreshToken = async (userId: string, refreshToken: string) => {
  try {
    const { error } = await supabase
      .from('user_credentials' as any)
      .upsert(
        { user_id: userId, google_refresh_token: refreshToken } as any,
        { onConflict: 'user_id' }
      );
    if (error) {
      console.error('Failed to store refresh token:', error.message);
    } else {
      console.log('Google refresh token stored successfully');
    }
  } catch (err) {
    console.error('Error storing refresh token:', err);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerToken, setProviderToken] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Capture the provider token (Google access token) on sign-in
        if (session?.provider_token) {
          setProviderToken(session.provider_token);
        }
        // Store the Google refresh token when available (only on initial sign-in)
        if (session?.provider_refresh_token && session?.user) {
          // Use setTimeout to avoid potential Supabase deadlock during auth callback
          setTimeout(() => {
            storeRefreshToken(session.user.id, session.provider_refresh_token!);
          }, 0);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/detect-invoices`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    const { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });
    if (!error) {
      await supabase.auth.signOut();
    }
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, providerToken, signInWithGoogle, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
