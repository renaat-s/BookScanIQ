import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SetupStatus = 'loading' | 'not_authenticated' | 'needs_setup' | 'initializing' | 'polling' | 'ready';

interface DirectoryGuardState {
  status: SetupStatus;
  spreadsheetId: string | null;
  rootFolderId: string | null;
  triggerSetup: () => Promise<void>;
}

export function useDirectoryGuard({ autoTrigger = false } = {}): DirectoryGuardState {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SetupStatus>('loading');
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);

  // Check if credentials are complete
  const checkCredentials = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase
      .from('user_credentials')
      .select('folder_mapping, user_spreadsheet_id, root_folder_id')
      .eq('user_id', user.id)
      .single();

    if (data?.folder_mapping && data?.user_spreadsheet_id && data?.root_folder_id) {
      setSpreadsheetId(data.user_spreadsheet_id);
      setRootFolderId(data.root_folder_id);
      setStatus('ready');
      return true;
    }
    return false;
  }, [user]);

  // Trigger the install-directory edge function
  const triggerSetup = useCallback(async () => {
    if (!user) return;
    setStatus('initializing');
    try {
      const { data, error } = await supabase.functions.invoke('install-directory');
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Setup failed');

      // If edge function wrote credentials directly (synchronous n8n response)
      if (data.mode === 'direct') {
        setSpreadsheetId(data.user_spreadsheet_id);
        setRootFolderId(data.root_folder_id);
        setStatus('ready');
        toast.success('Your workspace is synced and ready!');
        return;
      }

      // Already installed case
      if (data.message === 'Already installed') {
        await checkCredentials();
        return;
      }

      // Fallback: n8n didn't return IDs synchronously — poll
      setStatus('polling');
    } catch (err: unknown) {
      console.error('Directory setup error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to initialize your file directory. Please try again.');
      setStatus('needs_setup');
    }
  }, [user, checkCredentials]);

  // Initial check on mount / user change
  useEffect(() => {
    if (authLoading) {
      setStatus('loading');
      return;
    }
    if (!user) {
      setStatus('not_authenticated');
      return;
    }

    (async () => {
      const isReady = await checkCredentials();
      if (!isReady) {
        if (autoTrigger) {
          await triggerSetup();
        } else {
          setStatus('needs_setup');
        }
      }
    })();
  }, [user, authLoading, checkCredentials, autoTrigger, triggerSetup]);

  // Poll every 3s while status is 'polling' (fallback only)
  useEffect(() => {
    if (status !== 'polling') return;

    const interval = setInterval(async () => {
      const isReady = await checkCredentials();
      if (isReady) {
        clearInterval(interval);
        toast.success('Your file directory is ready!');
      }
    }, 3000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (status === 'polling') {
        setStatus('needs_setup');
        toast.error('Setup is taking longer than expected. Please try again.');
      }
    }, 120_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, checkCredentials]);

  return { status, spreadsheetId, rootFolderId, triggerSetup };
}
