import { createClient } from 'npm:@supabase/supabase-js@2.50.5';

type VerifyResponse = {
  allowed: boolean;
  roomId?: string;
  error?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildRoomId(email: string | null, userId: string) {
  const localPart = (email ?? '').split('@')[0] ?? '';
  const base = localPart.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'scorecast';

  // Match app-side deterministic numeric suffix format.
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 1000000;
  }
  const suffix = String(hash).padStart(6, '0');
  return `${base}-${suffix}`;
}

function jsonResponse(body: VerifyResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ allowed: false, error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return jsonResponse({ allowed: false, error: 'Missing bearer token' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ allowed: false, error: 'Function env not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return jsonResponse({ allowed: false, error: 'Invalid token' }, 401);
  }

  const roomId = buildRoomId(data.user.email ?? null, data.user.id);
  return jsonResponse({ allowed: true, roomId });
});
