"use client";

import * as supabase from "@supabase/supabase-js";
import * as PDFLib from "pdf-lib";
import { useEffect, useLayoutEffect } from "react";

type LegacyPageProps = {
  body: string;
  bodyPage: string;
  kind?: "public" | "backoffice";
  withData?: boolean;
};

declare global {
  interface Window {
    RISEUP_SUPABASE?: {
      url: string;
      publicKey: string;
      tables: Record<string, string>;
      storage: Record<string, string>;
    };
    supabase?: typeof supabase;
    PDFLib?: typeof PDFLib;
  }
}

const tables = {
  contact: "contact_submissions",
  application: "join_applications",
  userProfiles: "user_profiles",
  teamMembers: "team_members",
  projects: "projects",
  projectMembers: "project_members",
  interviewEvaluations: "interview_evaluations",
  auditLogs: "audit_logs"
};

function loadScript(source: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.async = false;
    script.dataset.riseupRuntime = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(`Não foi possível carregar ${source}.`)), { once: true });
    document.body.appendChild(script);
  });
}

export function LegacyPage({ body, bodyPage, kind = "public", withData = false }: LegacyPageProps) {
  useLayoutEffect(() => {
    document.body.dataset.page = bodyPage;
    return () => {
      delete document.body.dataset.page;
      document.body.classList.remove("ready", "nav-open", "is-member");
    };
  }, [bodyPage]);

  useEffect(() => {
    window.RISEUP_SUPABASE = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      publicKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      tables,
      storage: { teamPhotos: "team-photos", projectImages: "project-images" }
    };
    window.supabase = supabase;
    window.PDFLib = PDFLib;

    let cancelled = false;
    const boot = async () => {
      try {
        if (kind === "backoffice") {
          await loadScript("/legacy/backoffice.js");
          if (!cancelled) await loadScript("/legacy/backoffice-workspace.js");
          if (!cancelled) await loadScript("/legacy/backoffice-selects.js");
        } else {
          await loadScript("/legacy/script.js");
          if (withData && !cancelled) await loadScript("/legacy/riseup-data.js");
        }
      } catch (error) {
        console.error("Rise Up runtime failed:", error);
      }
    };
    void boot();

    return () => {
      cancelled = true;
      document.querySelectorAll("script[data-riseup-runtime]").forEach((element) => element.remove());
    };
  }, [kind, withData]);

  return (
    <>
      <link rel="stylesheet" href={kind === "backoffice" ? "/legacy/backoffice.css" : "/legacy/style.css"} />
      <div style={{ display: "contents" }} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
}
