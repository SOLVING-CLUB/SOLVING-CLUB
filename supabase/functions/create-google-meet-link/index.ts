// Supabase Edge Function to create Google Meet links
// This function runs server-side and can access provider tokens

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key for server-side access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user token from Authorization header
    const token = authHeader.replace("Bearer ", "");
    
    // Verify the user's session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user's OAuth provider token from Supabase Auth
    // We need to query the auth.users table to get the provider token
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve user auth data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get provider token from user's identities
    const googleIdentity = authUser.user.identities?.find(
      (identity: any) => identity.provider === "google"
    );

    if (!googleIdentity) {
      return new Response(
        JSON.stringify({ error: "User is not authenticated with Google" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { title, startTime, endTime, description } = await req.json();

    if (!title || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, startTime, endTime" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token from Supabase (this might require a different approach)
    // For now, we'll need to use the refresh token to get a new access token
    // But Supabase might not expose this either...
    
    // Alternative: Use Google's OAuth2 token endpoint with refresh token
    // However, we need the refresh token which Supabase also might not expose
    
    // For now, let's try to get the token from the user's session metadata
    // This is a workaround - ideally Supabase would expose provider_token
    
    // Actually, the best approach is to use Supabase's RPC function or
    // store the token in a secure way after OAuth
    
    // Since we can't easily get the provider_token server-side either,
    // let's create a workaround: store the token in a user table after OAuth
    
    return new Response(
      JSON.stringify({ 
        error: "Provider token not accessible. Please implement token storage after OAuth callback." 
      }),
      { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

