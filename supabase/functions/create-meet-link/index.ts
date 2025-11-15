// Supabase Edge Function to create Google Meet links
// This runs server-side, avoiding CORS issues

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

    // Create Supabase client
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

    // Parse request body to get provider token
    const requestBody = await req.json().catch(() => ({}));
    const accessToken = requestBody.providerToken;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "No Google access token provided. User needs to re-authenticate." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a unique conference ID
    const conferenceId = `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create Meet link using Google Meet API
    // Note: The actual API endpoint and format may vary - this is a placeholder
    const requestBody = {
      conferenceId: conferenceId,
      conferenceSolutionKey: {
        type: "hangoutsMeet"
      },
      status: {
        statusCode: "success"
      }
    };

    const meetResponse = await fetch(
      `https://meet.googleapis.com/v1/conferences`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!meetResponse.ok) {
      const errorData = await meetResponse.json().catch(() => ({}));
      console.error("Google Meet API error:", errorData);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to create Meet link",
          details: errorData 
        }),
        { status: meetResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meetData = await meetResponse.json();
    
    // Extract meeting URI from response
    let meetLink: string | null = null;
    if (meetData.entryPoints && meetData.entryPoints.length > 0) {
      const videoEntryPoint = meetData.entryPoints.find((ep: any) => ep.entryPointType === "video");
      if (videoEntryPoint?.uri) {
        meetLink = videoEntryPoint.uri;
      } else if (meetData.entryPoints[0]?.uri) {
        meetLink = meetData.entryPoints[0].uri;
      }
    }
    
    if (meetData.meetingCode) {
      meetLink = `https://meet.google.com/${meetData.meetingCode}`;
    }

    if (!meetLink) {
      return new Response(
        JSON.stringify({ error: "Could not extract Meet link from API response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ meetLink }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-meet-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

