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
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    // Build context-aware system message
    let systemMessage = SYSTEM_PROMPT;
    if (context) {
      systemMessage += `\n\nCurrent user context:\n`;
      if (context.currentPath) systemMessage += `- Learning Path: ${context.currentPath}\n`;
      if (context.currentModule) systemMessage += `- Current Module: ${context.currentModule}\n`;
      if (context.currentLab) systemMessage += `- Current Lab: ${context.currentLab}\n`;
      if (context.userLevel) systemMessage += `- User Level: ${context.userLevel}\n`;
      if (context.userRank) systemMessage += `- User Rank: ${context.userRank}\n`;
    }

    // Build Gemini-format contents
    const geminiContents = [];

    // Add conversation messages
    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemMessage }],
          },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);

            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Convert to OpenAI-compatible SSE format
                const chunk = {
                  choices: [{ delta: { content: text } }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream transform error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
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
