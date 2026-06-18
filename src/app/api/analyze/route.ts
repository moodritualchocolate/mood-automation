import { analyzeLocally, buildSupplierProfile, type AnalysisResult } from "@/lib/analyze";
import type { DataState, Supplier } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Analyze a supplier. Uses the Claude API when ANTHROPIC_API_KEY is set;
// otherwise falls back to the deterministic local heuristic.
export async function POST(req: Request) {
  let body: { supplier: Supplier; data: DataState; lang?: "he" | "en" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { supplier, data, lang = "he" } = body;
  if (!supplier?.id) {
    return NextResponse.json({ error: "missing supplier" }, { status: 400 });
  }

  const local = analyzeLocally(supplier, data, lang);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json(local);

  try {
    const profile = buildSupplierProfile(supplier, data);
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
    const langName = lang === "he" ? "Hebrew" : "English";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system:
          `You are a procurement analyst for MOOD Ritual Chocolate. Analyze a supplier ` +
          `from the structured data and reply ONLY with a JSON object with keys: ` +
          `pros (string[]), cons (string[]), risks (string[]), comparison (string), ` +
          `recommendation (string). Write all values in ${langName}. Be concise and concrete.`,
        messages: [
          {
            role: "user",
            content:
              `Supplier and related procurement data:\n` +
              JSON.stringify(profile) +
              `\n\nRespond with JSON only.`,
          },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json(local);
    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json(local);
    const parsed = JSON.parse(match[0]);
    const result: AnalysisResult = {
      pros: parsed.pros ?? local.pros,
      cons: parsed.cons ?? local.cons,
      risks: parsed.risks ?? local.risks,
      comparison: parsed.comparison ?? local.comparison,
      recommendation: parsed.recommendation ?? local.recommendation,
      source: "ai",
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(local);
  }
}
