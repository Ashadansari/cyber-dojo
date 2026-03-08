import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CyberBot, an expert cybersecurity AI tutor built into a hacking training platform similar to TryHackMe. Your role:

1. **Teaching**: Explain cybersecurity concepts clearly with examples. Cover topics like networking, web security, cryptography, reverse engineering, cloud security, Active Directory, and bug bounty hunting.

2. **Lab Assistance**: Help users understand and complete hands-on labs. Guide them through challenges step-by-step without giving away flags directly. Use the Socratic method — ask guiding questions.

3. **Learning Path Guidance**: Help users choose the right learning path based on their skill level and interests. Explain what each path covers and prerequisites.

4. **Tool Usage**: Explain how to use security tools like Nmap, Burp Suite, Metasploit, Wireshark, Hashcat, BloodHound, Ghidra, etc.

5. **Best Practices**: Always emphasize ethical hacking principles, responsible disclosure, and legal boundaries.

Style guidelines:
- Use markdown formatting with code blocks for commands and scripts
- Be encouraging but honest about difficulty
- Use cybersecurity terminology but explain jargon
- Keep responses concise unless the user asks for detail
- Use bullet points and numbered steps for procedures
- Include relevant tool commands when applicable

If the user provides context about what module or lab they're on, tailor your response to that specific content.

IMPORTANT: Never provide actual CTF flags, passwords, or direct solutions. Guide users to find answers themselves.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system message
    let systemMessage = SYSTEM_PROMPT;
    if (context) {
      systemMessage += `\n\nCurrent user context:\n`;
      if (context.currentPath) {
        systemMessage += `- Learning Path: ${context.currentPath}\n`;
      }
      if (context.currentModule) {
        systemMessage += `- Current Module: ${context.currentModule}\n`;
      }
      if (context.currentLab) {
        systemMessage += `- Current Lab: ${context.currentLab}\n`;
      }
      if (context.userLevel) {
        systemMessage += `- User Level: ${context.userLevel}\n`;
      }
      if (context.userRank) {
        systemMessage += `- User Rank: ${context.userRank}\n`;
      }
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemMessage },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("cyber-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
