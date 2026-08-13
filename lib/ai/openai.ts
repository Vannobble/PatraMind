import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!client) {
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

export const AI_MODEL = "gpt-4o-mini";

export async function chatCompletion(opts: {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const openai = getOpenAI();
  if (!openai) throw new Error("OPENAI_API_KEY tidak tersedia");

  const res = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: opts.temperature ?? 0.4,
    response_format: opts.json ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("AI tidak mengembalikan jawaban");
  return content;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  if (!openai) throw new Error("OPENAI_API_KEY tidak tersedia");
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " ").slice(0, 8000),
  });
  return res.data[0].embedding;
}
