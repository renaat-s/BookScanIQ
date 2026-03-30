import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isDeveloperEmail } from '@/lib/developer-access';

interface SubscriptionState {
  subscribed: boolean;
  tier: string | null;
  subscriptionEnd: string | null;
  productId: string | null;
  isDeveloper: boolean;
  loading: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  providerToken: string | null;
  subscription: SubscriptionState;
  checkSubscription: () => Promise<void>;
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

const DEFAULT_SUB: SubscriptionState = {
  subscribed: false,
  tier: null,
  subscriptionEnd: null,
  productId: null,
  isDeveloper: false,
  loading: true,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(DEFAULT_SUB);

  const checkSubscription = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      setSubscription({ ...DEFAULT_SUB, loading: false });
      return;
    }

    // Quick client-side developer check for instant UI feedback
    const email = currentSession.user?.email;
    if (isDeveloperEmail(email)) {
      setSubscription({
        subscribed: true,
        tier: 'enterprise',
        subscriptionEnd: null,
        productId: 'developer_bypass',
        isDeveloper: true,
        loading: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription({
        subscribed: data.subscribed ?? false,
        tier: data.tier ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        productId: data.product_id ?? null,
        isDeveloper: data.is_developer ?? false,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setSubscription({ ...DEFAULT_SUB, loading: false });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.provider_token) {
          setProviderToken(session.provider_token);
        }
        if (session?.provider_refresh_token && session?.user) {
          setTimeout(() => {
            storeRefreshToken(session.user.id, session.provider_refresh_token!);
          }, 0);
        }
        setLoading(false);

        // Check subscription after auth state change
        if (session?.user) {
          setTimeout(() => checkSubscription(), 0);
        } else {
          setSubscription({ ...DEFAULT_SUB, loading: false });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkSubscription();
      } else {
        setSubscription({ ...DEFAULT_SUB, loading: false });
      }
    });

    // Auto-refresh subscription every 60 seconds
    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) checkSubscription();
      });
    }, 60_000);

    return () => {
      authSub.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSubscription]);

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
    // Reset directory_installed for developer accounts during development
    if (user && isDeveloperEmail(user.email)) {
      await supabase
        .from('profiles')
        .update({ directory_installed: false })
        .eq('user_id', user.id);
    }
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
    <AuthContext.Provider value={{ user, session, loading, providerToken, subscription, checkSubscription, signInWithGoogle, signOut, deleteAccount }}>
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
