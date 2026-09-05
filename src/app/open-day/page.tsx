import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { OpenDayForm } from "./registration-form";
import { openDayClosed } from "@/lib/open-day";
import "./open-day.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inscrição — Open Day Rise Up", description: "Conhece a Rise Up no dia 18 de setembro, das 9h30 às 18h. Inscrições até 16 de setembro.", alternates: { canonical: "/open-day" } };
export default function OpenDayPage() {
  return <div className="od-page"><header className="od-header"><Link className="od-back" href="/">← Voltar ao site</Link><Link className="od-logo" href="/" aria-label="Rise Up — página inicial"><Image src="/img/riseup-logo.png" alt="Rise Up" width={200} height={200} priority /></Link></header>
    <main className="od-layout"><section className="od-intro"><span className="od-eyebrow">PORTAS ABERTAS. NOVAS POSSIBILIDADES.</span><h1>O próximo passo<br />começa <em>aqui.</em></h1><h2>Open Day Rise Up</h2><div className="od-details"><span>18 setembro 2026</span><span>09h30 — 18h00</span><span>Sala da Rise Up</span><span>Aberto a toda a gente</span></div><p>Queremos dar-te a conhecer a nossa associação, as atividades que desenvolvemos e aquilo que significa fazer parte deste projeto.</p><p>Vem conhecer a equipa, esclarecer dúvidas e descobrir como podes integrar a Rise Up.</p><div className="od-lunch"><strong>Almoço: 3 € por pessoa.</strong></div><p className="od-deadline">Inscrições até <strong>16 de setembro, às 23h59</strong> (Portugal continental).</p></section><section className="od-card" aria-labelledby="od-form-title"><span className="od-eyebrow">CONTAMOS CONTIGO</span><h2 id="od-form-title">Inscrição — Open Day</h2><p>Confirma a tua presença. Esperamos por ti! 💙</p><OpenDayForm initiallyClosed={openDayClosed()} /></section></main><footer className="od-footer">Rise Up · Conhecimento que se transforma em experiência.</footer></div>;
}
