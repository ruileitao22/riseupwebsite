import { createHmac, randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { renderPasswordRecoveryEmail } from "@/lib/password-recovery-email";

const emailAddress = z.string().trim().toLowerCase().max(254).pipe(z.email());
const recoveryRequest = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), email: emailAddress }),
  z.object({
    action: z.literal("reset"),
    email: emailAddress,
    code: z.string().regex(/^\d{6}$/),
    password: z.string().min(10).max(72).refine((value) => Buffer.byteLength(value) <= 72 && !value.includes("\0"))
  })
]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return errorResponse("Pedido inválido.", 415);
  }

  const input = recoveryRequest.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return errorResponse("Verifica os campos. Usa um email válido, um código de 6 dígitos e uma palavra-passe válida.", 400);
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!url || !key || (input.data.action === "request" && !resendKey)) {
    console.error("Backoffice password recovery configuration is incomplete");
    return errorResponse("A recuperação está temporariamente indisponível.", 503);
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { email } = input.data;
  const code = input.data.action === "request" ? String(randomInt(1_000_000)).padStart(6, "0") : input.data.code;
  const codeHash = createHmac("sha256", key).update(`backoffice-password-recovery\0${email}\0${code}`).digest("hex");

  if (input.data.action === "request") {
    after(async () => {
      try {
        const { data: issued, error } = await admin.rpc("issue_backoffice_recovery", { account_email: email, proposed_hash: codeHash });
        if (error) {
          console.error("Backoffice recovery code could not be issued", error.code);
          return;
        }
        if (!issued) return;

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "Rise Up · BackOffice <tarefas@updates.riseupmaia.pt>",
            to: [email],
            ...renderPasswordRecoveryEmail(code)
          }),
          signal: AbortSignal.timeout(10_000)
        });
        if (!response.ok) console.error("Backoffice recovery email was rejected by Resend", response.status);
      } catch {
        console.error("Backoffice recovery email could not be sent");
      }
    });

    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const { data: userId, error: consumeError } = await admin.rpc("consume_backoffice_recovery", {
    account_email: email,
    supplied_hash: codeHash
  });
  if (consumeError) {
    console.error("Backoffice recovery code could not be verified", consumeError.code);
    return errorResponse("A recuperação está temporariamente indisponível.", 503);
  }
  if (!userId) return errorResponse("Código inválido ou expirado. Confirma o código ou pede um novo.", 400);

  const { error: passwordError } = await admin.auth.admin.updateUserById(userId, { password: input.data.password });
  if (passwordError) {
    console.error("Backoffice password could not be reset", passwordError.code);
    return errorResponse("Não foi possível guardar a palavra-passe. Pede um novo código e escolhe outra palavra-passe.", 409);
  }

  return NextResponse.json({ ok: true });
}
