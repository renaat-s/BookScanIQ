import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeadersFor } from "../_shared/cors.ts";
Deno.serve(async (req) => {
  
  const corsHeaders = corsHeadersFor(req);
if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the user's JWT
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to delete the user (cascades to profiles via RLS/triggers)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete all user data before removing the auth user.
    // Every public table with a user_id column must be listed here: some lack an
    // ON DELETE CASCADE to auth.users (ledger_entries orphaned 59 rows in Q17).
    // Children first; failures are logged but don't block the account deletion.
    const wipe = async (table: string) => {
      const { error } = await adminClient.from(table).delete().eq('user_id', user.id);
      if (error) console.error(`Failed to delete ${table} rows:`, error.message);
    };
    await wipe('ledger_entries');
    await wipe('invoices');
    await wipe('audit_events');
    await wipe('scan_schedules');
    await wipe('scan_jobs');
    await wipe('user_credentials');
    await wipe('profiles');

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Failed to delete user:', deleteError.message);
      return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
