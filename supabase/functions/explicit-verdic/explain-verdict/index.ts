// Supabase Edge Function: explain-verdict
// Deno runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting map: userId -> timestamps[]
const rateLimits = new Map<string, number[]>();

function checkRateLimit(userId: string, maxPerHour = 30): boolean {
  const now = Date.now();
  const windowMs = 3600 * 1000;
  const history = (rateLimits.get(userId) || []).filter((t) => now - t < windowMs);

  if (history.length >= maxPerHour) {
    return false;
  }
  history.push(now);
  rateLimits.set(userId, history);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { product, verdict, profileSummary } = await req.json();

    const userId = profileSummary?.userId || 'anonymous-user';
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait a moment before requesting another explanation.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      // Graceful fallback message if secret is not set yet
      return new Response(
        JSON.stringify({
          explanation: null,
          error: 'GEMINI_API_KEY secret not configured in Supabase.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are SHE Scan, an empathetic and supportive nutritional assistant specifically helping women with specific health conditions (such as PCOS, pregnancy, diabetes, lactose intolerance, and allergies).
A deterministic rule engine has ALREADY calculated the official verdict: ${verdict.overall.toUpperCase()}.
Your ONLY job is to explain WHY in 2-3 friendly, warm, plain-language sentences.
Do NOT give medical diagnosis or prescribe treatments.
Never invent specific branded alternatives; if the verdict is red, mention wholesome whole-food options in general terms.

Product: ${product.name} (Brand: ${product.brand || 'N/A'})
Health Conditions: ${JSON.stringify(profileSummary.conditions || [])}
Allergies: ${JSON.stringify(profileSummary.allergies || [])}
Allergen Matches: ${JSON.stringify(verdict.allergenMatches || [])}
Rule Results: ${JSON.stringify(verdict.ruleResults || [])}
Avoid Ingredients: ${JSON.stringify(verdict.avoidIngredients || [])}

Respond directly with the explanation text only.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.4 },
        }),
      }
    );

    const data = await response.json();
    const explanationText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      'Unable to generate dynamic explanation at this time.';

    return new Response(JSON.stringify({ explanation: explanationText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        explanation: null,
        error: err.message || 'Internal Edge Function Error',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
