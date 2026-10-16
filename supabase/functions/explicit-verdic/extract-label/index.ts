// Supabase Edge Function: extract-label
// Deno runtime — Gemini Vision OCR proxy returning structured JSON
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimits = new Map<string, number[]>();

function checkRateLimit(userId: string, maxPerHour = 20): boolean {
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

    const { imageBase64, mimeType, userId } = await req.json();

    if (!checkRateLimit(userId || 'anon')) {
      return new Response(
        JSON.stringify({ error: 'OCR rate limit exceeded (max 20 scans/hour).' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY secret not configured in Supabase.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a specialized food nutrition label reader.
Extract the nutrition facts and ingredient list from this packaged food photo.
You MUST output valid, raw JSON matching this schema exactly:
{
  "productName": "string or empty if unreadable",
  "servingSize": "string e.g. 30g or 250ml",
  "servingUnit": "per100g" or "per100ml",
  "nutrients": {
    "energy_kcal": number or null,
    "sugar_g": number or null,
    "added_sugar_g": number or null,
    "saturated_fat_g": number or null,
    "total_fat_g": number or null,
    "trans_fat_g": number or null,
    "sodium_mg": number or null (ALWAYS in milligrams),
    "carbs_g": number or null,
    "fiber_g": number or null,
    "protein_g": number or null,
    "caffeine_mg": number or null
  },
  "ingredients": ["array", "of", "individual", "ingredients"],
  "ingredientsRaw": "full raw text string of ingredients",
  "allergenStatement": "string e.g. Contains Milk, Soy. May contain Peanuts.",
  "confidence": number between 0.1 and 1.0
}
Do NOT include markdown formatting or backticks. Return JSON only.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawJson);

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Error processing label image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
