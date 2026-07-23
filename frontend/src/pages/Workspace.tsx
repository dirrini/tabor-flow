import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  ArrowRight,
  Check,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { Navigate } from "react-router-dom";

import { ME_QUERY } from "../graphql/queries/auth";
import { useI18n } from "../lib/i18n";
import {
  formatPlanPrice,
  premiumAnnualPrice,
  premiumMonthlyPrice
} from "../lib/plans";

type WorkspaceQueryData = {
  me: {
    role: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
      plan: "FREE" | "PREMIUM";
    };
  } | null;
};

type BillingCycle = "MONTHLY" | "YEARLY";

export default function Workspace() {
  const { locale, tr } = useI18n();
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("MONTHLY");
  const [showUpgradeMessage, setShowUpgradeMessage] =
    useState(false);
  const { data, loading } =
    useQuery<WorkspaceQueryData>(ME_QUERY);

  if (loading && !data) {
    return (
      <p className="text-slate-500">
        {tr("Carregando workspace...", "Loading workspace...")}
      </p>
    );
  }

  if (!data?.me || data.me.role !== "ADMIN") {
    return <Navigate to="/app" replace />;
  }

  const workspace = data.me.tenant;
  const isPremium = workspace.plan === "PREMIUM";
  const selectedPrice =
    billingCycle === "MONTHLY"
      ? premiumMonthlyPrice
      : premiumAnnualPrice;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">
        <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">
                Workspace
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isPremium
                    ? "bg-amber-300 text-amber-950"
                    : "bg-emerald-200 text-emerald-950"
                }`}
              >
                {isPremium ? "Premium" : "Free"}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {workspace.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              {tr(
                "Aqui você acompanha o plano e as condições de uso do ambiente da sua equipe.",
                "Manage your team's workspace plan and usage conditions here."
              )}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-white/45">
              {tr("Identificador", "Identifier")}
            </p>
            <p className="mt-1 font-mono text-sm text-white/80">
              {workspace.slug}
            </p>
          </div>
        </div>
      </section>

      {!isPremium && (
        <section>
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.16em] text-orange-600">
                Premium
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {tr(
                  "Mais espaço para sua operação crescer",
                  "More room for your operation to grow"
                )}
              </h2>
            </div>
            <div className="flex w-fit rounded-xl bg-slate-100 p-1">
              {(["MONTHLY", "YEARLY"] as const).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => {
                    setBillingCycle(cycle);
                    setShowUpgradeMessage(false);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    billingCycle === cycle
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {cycle === "MONTHLY"
                    ? tr("Mensal", "Monthly")
                    : tr("Anual", "Yearly")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
            <article className="rounded-2xl border bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <Users size={20} />
                </span>
                <div>
                  <h3 className="font-semibold">Free</h3>
                  <p className="text-sm text-slate-500">
                    {tr("Para começar com clareza", "For getting started clearly")}
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {[
                  tr("Até 5 usuários", "Up to 5 users"),
                  tr("Até 3 projetos ativos", "Up to 3 active projects"),
                  tr("Tarefas ilimitadas", "Unlimited tasks"),
                  tr("Timeline de um projeto por vez", "One project at a time in Timeline")
                ].map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-orange-200 bg-orange-50 p-6">
              <Sparkles className="absolute -right-5 -top-5 h-28 w-28 text-orange-100" />
              <div className="relative">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">
                      TaborFlow Premium
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {tr(
                        "Timeline completa, escala e integrações.",
                        "Full Timeline, scale, and integrations."
                      )}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-2xl font-bold text-slate-950">
                      {formatPlanPrice(selectedPrice, locale)}
                    </p>
                    {selectedPrice !== null && (
                      <p className="text-xs text-slate-500">
                        {billingCycle === "MONTHLY"
                          ? tr("por mês", "per month")
                          : tr("por ano", "per year")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  {[
                    tr("Usuários e projetos sem limite funcional", "No functional user or project limits"),
                    tr("Timeline consolidada de todos os projetos", "Consolidated Timeline across projects"),
                    tr("Integrações externas por API", "External API integrations"),
                    tr("Exportações e relatórios avançados", "Exports and advanced reports")
                  ].map((feature) => (
                    <p key={feature} className="flex gap-2">
                      <Check size={17} className="mt-0.5 shrink-0 text-orange-600" />
                      {feature}
                    </p>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowUpgradeMessage(true)}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  {tr("Fazer upgrade", "Upgrade workspace")}
                  <ArrowRight size={17} />
                </button>

                {showUpgradeMessage && (
                  <div className="mt-4 flex gap-3 rounded-xl border border-orange-200 bg-white/70 p-4 text-sm text-slate-700">
                    <CreditCard size={19} className="mt-0.5 shrink-0 text-orange-600" />
                    <p>
                      {tr(
                        "A contratação segura pelo Asaas está sendo preparada. Nenhuma cobrança foi realizada.",
                        "Secure checkout through Asaas is being prepared. No charge has been made."
                      )}
                    </p>
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>
      )}

      {isPremium && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7">
          <div className="flex gap-4">
            <ShieldCheck className="shrink-0 text-emerald-700" />
            <div>
              <h2 className="font-semibold text-emerald-950">
                {tr("Seu workspace é Premium", "Your workspace is Premium")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                {tr(
                  "Todos os usuários deste ambiente têm acesso aos recursos Premium.",
                  "Every user in this workspace has access to Premium features."
                )}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
