import { NextResponse, type NextRequest } from "next/server";
import { submissionSchema, submissionTables } from "@/lib/submissions";

const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados pedidos. Tenta novamente mais tarde." }, { status: 429 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_000) {
    return NextResponse.json({ error: "Pedido demasiado grande." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Verifica os dados do formulário." }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Supabase environment variables are missing.");
    return NextResponse.json({ error: "Serviço temporariamente indisponível." }, { status: 503 });
  }

  const table = submissionTables[parsed.data.type];
  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(parsed.data.payload),
    cache: "no-store"
  });

  if (!response.ok) {
    console.error("Supabase submission failed:", response.status, await response.text());
    return NextResponse.json({ error: "Não foi possível enviar. Tenta novamente." }, { status: 502 });
  }

  return new NextResponse(null, { status: 204 });
}
