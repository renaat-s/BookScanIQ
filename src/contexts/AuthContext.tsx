import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
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
      .from('user_credentials')
      .upsert(
        { user_id: userId, google_refresh_token: refreshToken },
        { onConflict: 'user_id' }
      );
    if (error) {
      console.error('Failed to store refresh token:', error.message);
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
  // Tracks whether the current sign-out was user-initiated. Used to ignore
  // spurious SIGNED_OUT events emitted when a background API/refresh fails
  // (e.g. a Xero/QuickBooks sync hiccup) so the user is not bounced to "/".
  const intentionalSignOutRef = useRef(false);

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
      (event, newSession) => {
        // Guard against unintentional sign-outs. Supabase emits SIGNED_OUT when
        // a token refresh fails (e.g. triggered indirectly by an unrelated
        // edge-function 401 such as a Xero/QuickBooks sync error). If the user
        // didn't click "Sign out", try to recover the session from storage
        // before clearing local auth state.
        if (event === 'SIGNED_OUT' && !intentionalSignOutRef.current) {
          supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
              // Stored session still valid — keep the user signed in.
              setSession(data.session);
              setUser(data.session.user);
              setLoading(false);
              return;
            }
            // No recoverable session — treat as a real sign-out.
            setSession(null);
            setUser(null);
            setLoading(false);
            setSubscription({ ...DEFAULT_SUB, loading: false });
          });
          return;
        }

        // Reset the intentional flag once the SIGNED_OUT it covered has fired.
        if (event === 'SIGNED_OUT') {
          intentionalSignOutRef.current = false;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.provider_token) {
          setProviderToken(newSession.provider_token);
        }
        if (newSession?.provider_refresh_token && newSession?.user) {
          setTimeout(() => {
            storeRefreshToken(newSession.user.id, newSession.provider_refresh_token!);
          }, 0);
        }
        setLoading(false);

        // Check subscription after auth state change
        if (newSession?.user) {
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
        scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.file',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Mark this sign-out as intentional so the SIGNED_OUT event handler clears
    // state instead of trying to recover the session.
    intentionalSignOutRef.current = true;
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
      intentionalSignOutRef.current = true;
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
