"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createOpenDayPayload } from "./form-payload";
export function OpenDayForm({ initiallyClosed }: { initiallyClosed: boolean }) {
  const [participantType, setParticipantType] = useState("");
  const [lunch, setLunch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [closed, setClosed] = useState(initiallyClosed);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/open-day", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createOpenDayPayload(form, participantType, lunch)) });
      const result = await response.json();
      if (response.status === 410) setClosed(true);
      if (!response.ok) throw new Error(result.error);
      setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar. Tenta novamente."); }
    finally { setBusy(false); }
  }
  if (success) return <div className="od-success" role="status"><span>✓</span><h3>Estás inscrito!</h3><p>A tua presença no Open Day Rise Up está confirmada. Esperamos por ti no dia 18 de setembro, das 9h30 às 18h.</p>{lunch === "yes" && <p>Almoço: 3 € por pessoa.</p>}<Link href="/">Voltar à página inicial →</Link></div>;
  if (closed) return <div className="od-success" role="status"><h3>Inscrições encerradas</h3><p>O prazo de inscrição terminou a 17 de setembro, às 15h00.</p></div>;
  return <form className="od-form" onSubmit={submit}><p className="od-hint">Os campos com * são obrigatórios.</p><label>Nome completo *<input name="name" autoComplete="name" required minLength={2} maxLength={160} /></label><fieldset><legend>Como participas no Open Day? *</legend><div className="od-options od-profile-options"><label><input type="radio" name="participant_type" value="student" required checked={participantType === "student"} onChange={() => setParticipantType("student")} /> Estudante</label><label><input type="radio" name="participant_type" value="legend" required checked={participantType === "legend"} onChange={() => setParticipantType("legend")} /> Rise Up Legend</label><label><input type="radio" name="participant_type" value="external" required checked={participantType === "external"} onChange={() => setParticipantType("external")} /> Participante externo/a</label></div></fieldset>{participantType === "student" && <div className="od-row"><label>Número de aluno <small>(opcional)</small><input name="student_number" maxLength={40} /></label><label>Curso *<input name="course" required maxLength={160} /></label></div>}{participantType === "external" && <label>Organização ou empresa <small>(opcional)</small><input name="organization" maxLength={160} /></label>}<label>Email *<input name="email" type="email" autoComplete="email" required maxLength={254} /></label><label>N.º de telemóvel *<input name="phone" type="tel" autoComplete="tel" required pattern="\+?[0-9][0-9\s().\-]{6,24}" maxLength={26} /></label><fieldset><legend>Vais estar presente no almoço da Rise Up? *</legend><div className="od-options"><label><input type="radio" name="lunch" value="yes" required checked={lunch === "yes"} onChange={() => setLunch("yes")} /> Sim, vou almoçar</label><label><input type="radio" name="lunch" value="no" required checked={lunch === "no"} onChange={() => setLunch("no")} /> Não</label></div><p className="od-hint">Almoço: 3 € por pessoa.</p></fieldset>{lunch === "yes" && <label>Restrições alimentares <small>(opcional)</small><textarea name="dietary_requirements" rows={3} maxLength={500} placeholder="Ex.: opção vegetariana ou alergias alimentares" /><small>Indica apenas o que precisamos de saber para organizar o teu almoço.</small></label>}<p className="od-privacy">Os dados destinam-se à gestão da tua inscrição e do evento. Consulta a <a href="/politica-protecao-dados" target="_blank" rel="noreferrer">Política de Proteção de Dados</a>.</p>{error && <p className="od-error" role="alert">{error}</p>}<button disabled={busy} type="submit">{busy ? "A confirmar…" : "Confirmar inscrição →"}</button></form>;
}
