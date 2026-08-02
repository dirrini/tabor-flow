import {
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  useLazyQuery,
  useMutation,
  useQuery
} from "@apollo/client/react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FolderKanban,
  LockKeyhole,
  QrCode,
  Sparkles,
  Users
} from "lucide-react";
import {
  Navigate,
  useSearchParams
} from "react-router-dom";

import {
  CREATE_PREMIUM_CHECKOUT_MUTATION,
  CREATE_PREMIUM_PIX_PAYMENT_MUTATION,
  ME_QUERY,
  PREMIUM_PAYMENT_STATUS_QUERY
} from "../graphql/queries/auth";
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
      subscriptionStatus: string;
      premiumExpiresAt: string | null;
      usage: {
        users: number;
        userLimit: number | null;
        activeProjects: number;
        activeProjectLimit: number | null;
        consolidatedTimeline: boolean;
      };
    };
  } | null;
};

type BillingCycle = "MONTHLY" | "YEARLY";
type PaymentMethod = "PIX" | "CARD";

type CheckoutMutationData = {
  createPremiumCheckout: {
    id: string;
    url: string;
  };
};

type PixPayment = {
  id: string;
  encodedImage: string;
  payload: string;
  expirationDate: string | null;
  status: string;
};

type PixPaymentMutationData = {
  createPremiumPixPayment: PixPayment;
};

type PaymentStatusData = {
  premiumPaymentStatus: {
    id: string;
    status: string;
    paid: boolean;
  };
};

export default function Workspace() {
  const { locale, tr } = useI18n();
  const [searchParams] =
    useSearchParams();
  const checkoutResult =
    searchParams.get("checkout");
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("MONTHLY");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("PIX");
  const [cpfCnpj, setCpfCnpj] =
    useState("");
  const [pixPayment, setPixPayment] =
    useState<PixPayment | null>(null);
  const [pixCopied, setPixCopied] =
    useState(false);
  const [
    paymentConfirmed,
    setPaymentConfirmed
  ] = useState(false);
  const [
    waitingForCard,
    setWaitingForCard
  ] = useState(false);
  const [
    popupBlocked,
    setPopupBlocked
  ] = useState(false);
  const checkoutWindowRef =
    useRef<Window | null>(null);
  const cardExpirationAtStartRef =
    useRef<string | null>(null);
  const { data, loading, refetch } =
    useQuery<WorkspaceQueryData>(ME_QUERY, {
      fetchPolicy: "cache-and-network",
      pollInterval:
        checkoutResult === "success" ||
        waitingForCard ||
        Boolean(pixPayment)
          ? 3000
          : 0
    });
  const [
    createCheckout,
    {
      loading: creatingCheckout,
      error: checkoutError
    }
  ] = useMutation<CheckoutMutationData>(
    CREATE_PREMIUM_CHECKOUT_MUTATION
  );
  const [
    createPixPayment,
    {
      loading: creatingPix,
      error: pixError
    }
  ] =
    useMutation<PixPaymentMutationData>(
      CREATE_PREMIUM_PIX_PAYMENT_MUTATION
    );
  const [checkPaymentStatus] =
    useLazyQuery<PaymentStatusData>(
      PREMIUM_PAYMENT_STATUS_QUERY,
      {
        fetchPolicy: "no-cache"
      }
    );

  useEffect(() => {
    if (!waitingForCard) return;

    const monitor = window.setInterval(
      () => {
        if (
          !checkoutWindowRef.current ||
          checkoutWindowRef.current.closed
        ) {
          window.clearInterval(monitor);
          checkoutWindowRef.current = null;
          setWaitingForCard(false);
        }
      },
      500
    );

    return () => {
      window.clearInterval(monitor);
    };
  }, [waitingForCard]);

  useEffect(() => {
    if (!pixPayment) return;
    let checking = false;

    const check = async () => {
      if (checking) return;
      checking = true;

      try {
        const result =
          await checkPaymentStatus({
            variables: {
              paymentId: pixPayment.id
            }
          });

        if (
          result.data
            ?.premiumPaymentStatus.paid
        ) {
          setPixPayment(null);
          await refetch();
          setPaymentConfirmed(true);
          const scrollContainer =
            document.querySelector<HTMLElement>(
              "[data-app-scroll-container]"
            );

          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          } else {
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          }
        }
      } finally {
        checking = false;
      }
    };

    const timer = window.setInterval(
      check,
      3000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [
    checkPaymentStatus,
    pixPayment,
    refetch
  ]);

  useEffect(() => {
    if (!paymentConfirmed) return;

    const timer = window.setTimeout(
      () => {
        setPaymentConfirmed(false);
      },
      7000
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [paymentConfirmed]);

  useEffect(() => {
    if (!waitingForCard) return;
    const currentExpiration =
      data?.me?.tenant
        .premiumExpiresAt ?? null;

    if (
      currentExpiration &&
      currentExpiration !==
        cardExpirationAtStartRef.current
    ) {
      checkoutWindowRef.current?.close();
      checkoutWindowRef.current = null;
      setWaitingForCard(false);
    }
  }, [
    data?.me?.tenant.premiumExpiresAt,
    waitingForCard
  ]);

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
  const premiumExpirationDate =
    workspace.premiumExpiresAt
      ? new Date(
          workspace.premiumExpiresAt
        )
      : null;
  const premiumExpiration =
    premiumExpirationDate &&
    !Number.isNaN(
      premiumExpirationDate.getTime()
    )
      ? new Intl.DateTimeFormat(
          locale === "pt-BR"
            ? "pt-BR"
            : "en-US",
          {
            dateStyle: "long",
            timeZone: "UTC"
          }
        ).format(premiumExpirationDate)
      : null;

  const handleCardCheckout = async () => {
    setPopupBlocked(false);
    const checkoutWindow = window.open(
      "about:blank",
      "taborflow-asaas-checkout",
      "popup,width=540,height=760"
    );

    if (!checkoutWindow) {
      setPopupBlocked(true);
      return;
    }

    checkoutWindowRef.current =
      checkoutWindow;
    cardExpirationAtStartRef.current =
      data?.me?.tenant
        .premiumExpiresAt ?? null;
    setWaitingForCard(true);
    checkoutWindow.document.title =
      "TaborFlow - Asaas";

    try {
      const result =
        await createCheckout({
          variables: {
            billingCycle
          }
        });
      const checkoutUrl =
        result.data
          ?.createPremiumCheckout.url;

      if (checkoutUrl) {
        checkoutWindow.location.href =
          checkoutUrl;
      } else {
        checkoutWindow.close();
        setWaitingForCard(false);
      }
    } catch {
      checkoutWindow.close();
      setWaitingForCard(false);
    }
  };

  const handlePixPayment = async () => {
    const result =
      await createPixPayment({
        variables: {
          billingCycle,
          cpfCnpj
        }
      });
    const payment =
      result.data
        ?.createPremiumPixPayment;

    if (payment) {
      setPixCopied(false);
      setPixPayment(payment);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === "PIX") {
      void handlePixPayment();
      return;
    }

    void handleCardCheckout();
  };

  const copyPixCode = async () => {
    if (!pixPayment) return;
    await navigator.clipboard.writeText(
      pixPayment.payload
    );
    setPixCopied(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {paymentConfirmed && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-5 z-50 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-700 px-5 py-4 text-white shadow-xl"
        >
          <CheckCircle2
            size={22}
            className="mt-0.5 shrink-0"
          />
          <div>
            <p className="font-bold">
              {tr(
                "Pagamento Pix confirmado!",
                "Pix payment confirmed!"
              )}
            </p>
            <p className="mt-1 text-sm text-emerald-50">
              {tr(
                "A validade Premium do workspace foi atualizada com sucesso.",
                "The workspace Premium validity was successfully updated."
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPaymentConfirmed(false);
            }}
            className="ml-auto shrink-0 text-lg leading-none text-emerald-100 hover:text-white"
            aria-label={tr(
              "Fechar aviso",
              "Close notification"
            )}
          >
            ×
          </button>
        </div>
      )}
      {checkoutResult === "success" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {tr(
              "Pagamento enviado. Estamos aguardando a confirmação do Asaas para ativar o Premium.",
              "Payment submitted. We are waiting for Asaas confirmation to activate Premium."
            )}
          </div>
        )}
      {checkoutResult === "cancel" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {tr(
            "O checkout foi cancelado e nenhuma cobrança foi realizada.",
            "Checkout was canceled and no charge was made."
          )}
        </div>
      )}
      {checkoutResult === "expired" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {tr(
            "O checkout expirou. Você pode iniciar uma nova tentativa.",
            "Checkout expired. You can start a new attempt."
          )}
        </div>
      )}
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
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-white/45">
                {tr("Identificador", "Identifier")}
              </p>
              <p className="mt-1 font-mono text-sm text-white/80">
                {workspace.slug}
              </p>
            </div>
            {isPremium && (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-5 py-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200">
                  <CalendarDays size={15} />
                  {tr("Premium válido até", "Premium valid until")}
                </p>
                <p className="mt-1 font-semibold text-white">
                  {premiumExpiration ??
                    tr(
                      "Aguardando atualização",
                      "Awaiting update"
                    )}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-4 border-t border-white/10 bg-white/[.03] p-7 sm:grid-cols-2 sm:p-9">
          <UsageMeter
            icon={<Users size={18} />}
            label={tr("Usuários", "Users")}
            current={workspace.usage.users}
            limit={workspace.usage.userLimit}
            unlimitedLabel={tr("Sem limite funcional", "No functional limit")}
          />
          <UsageMeter
            icon={<FolderKanban size={18} />}
            label={tr("Projetos ativos", "Active projects")}
            current={workspace.usage.activeProjects}
            limit={workspace.usage.activeProjectLimit}
            unlimitedLabel={tr("Sem limite funcional", "No functional limit")}
          />
        </div>
      </section>

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

                <div className="mt-7 border-t border-orange-200 pt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {tr(
                      "Forma de pagamento",
                      "Payment method"
                    )}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/70 p-1.5">
                    {(["PIX", "CARD"] as const).map(
                      (method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method);
                            setPopupBlocked(false);
                          }}
                          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                            paymentMethod ===
                            method
                              ? "bg-slate-950 text-white shadow-sm"
                              : "text-slate-600 hover:bg-white"
                          }`}
                        >
                          {method === "PIX" ? (
                            <QrCode size={17} />
                          ) : (
                            <CreditCard
                              size={17}
                            />
                          )}
                          {method === "PIX"
                            ? "Pix"
                            : tr(
                                "Cartão",
                                "Card"
                              )}
                        </button>
                      )
                    )}
                  </div>

                  {paymentMethod === "PIX" &&
                    !pixPayment && (
                      <label className="mt-4 block">
                        <span className="mb-1 block text-xs font-semibold text-slate-700">
                          {tr(
                            "CPF ou CNPJ do pagador",
                            "Payer CPF or CNPJ"
                          )}
                        </span>
                        <input
                          value={cpfCnpj}
                          onChange={(event) => {
                            setCpfCnpj(
                              event.target.value
                            );
                          }}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="000.000.000-00"
                          className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                        <span className="mt-1 block text-xs text-slate-500">
                          {tr(
                            "Enviado diretamente ao Asaas e não armazenado pelo TaborFlow.",
                            "Sent directly to Asaas and not stored by TaborFlow."
                          )}
                        </span>
                      </label>
                    )}

                  {paymentMethod === "PIX" &&
                  pixPayment ? (
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-5">
                      <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
                        <img
                          src={`data:image/png;base64,${pixPayment.encodedImage}`}
                          alt={tr(
                            "QR Code Pix",
                            "Pix QR Code"
                          )}
                          className="mx-auto h-44 w-44 rounded-lg"
                        />
                        <div>
                          <h4 className="font-semibold text-slate-950">
                            {tr(
                              "Pix gerado",
                              "Pix created"
                            )}
                          </h4>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            {tr(
                              "Escaneie o QR Code ou copie o código. A validade Premium será atualizada após a confirmação.",
                              "Scan the QR Code or copy the code. Premium validity will update after confirmation."
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              void copyPixCode();
                            }}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white"
                          >
                            <Copy size={15} />
                            {pixCopied
                              ? tr(
                                  "Código copiado",
                                  "Code copied"
                                )
                              : tr(
                                  "Copiar Pix",
                                  "Copy Pix"
                                )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPixPayment(null);
                            }}
                            className="ml-3 text-xs font-semibold text-slate-500"
                          >
                            {tr(
                              "Cancelar",
                              "Cancel"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePayment}
                      disabled={
                        creatingCheckout ||
                        creatingPix ||
                        selectedPrice === null ||
                        waitingForCard ||
                        (paymentMethod ===
                          "PIX" &&
                          ![11, 14].includes(
                            cpfCnpj.replace(
                              /\D/g,
                              ""
                            ).length
                          ))
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {creatingCheckout ||
                      creatingPix
                        ? tr(
                            "Preparando pagamento...",
                            "Preparing payment..."
                          )
                        : paymentMethod ===
                            "PIX"
                          ? tr(
                              "Gerar Pix",
                              "Create Pix"
                            )
                          : isPremium
                            ? tr(
                                "Estender com cartão",
                                "Extend with card"
                              )
                            : tr(
                                "Pagar com cartão",
                                "Pay with card"
                              )}
                      <ArrowRight size={17} />
                    </button>
                  )}
                </div>

                {waitingForCard && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                    {tr(
                      "Aguardando pagamento na aba segura do Asaas. Se você fechar a aba, este aviso será removido.",
                      "Waiting for payment in the secure Asaas tab. This notice will disappear if you close it."
                    )}
                  </div>
                )}

                {popupBlocked && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {tr(
                      "O navegador bloqueou a nova aba. Permita pop-ups para este site e tente novamente.",
                      "Your browser blocked the new tab. Allow pop-ups for this site and try again."
                    )}
                  </div>
                )}

                {(checkoutError || pixError) && (
                  <div className="mt-4 flex gap-3 rounded-xl border border-orange-200 bg-white/70 p-4 text-sm text-slate-700">
                    <CreditCard size={19} className="mt-0.5 shrink-0 text-orange-600" />
                    <p>
                      {tr(
                        "Não foi possível abrir o checkout do Asaas. Confira a configuração de homologação.",
                        "Could not open the Asaas checkout. Check the sandbox configuration."
                      )}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex gap-3 border-t border-orange-200 pt-5 text-xs leading-5 text-slate-600">
                  <LockKeyhole
                    size={18}
                    className="mt-0.5 shrink-0 text-orange-600"
                  />
                  <p>
                    {tr(
                      "O pagamento é processado com segurança pela plataforma Asaas. O TaborFlow não armazena dados pessoais de cobrança nem informações do seu cartão de crédito.",
                      "Payment is securely processed by Asaas. TaborFlow does not store billing personal data or credit card information."
                    )}
                  </p>
                </div>
              </div>
            </article>
          </div>
      </section>

    </div>
  );
}

function UsageMeter({
  icon,
  label,
  current,
  limit,
  unlimitedLabel
}: {
  icon: ReactNode;
  label: string;
  current: number;
  limit: number | null;
  unlimitedLabel: string;
}) {
  const percentage =
    limit === null
      ? 100
      : Math.min(100, (current / limit) * 100);
  const atLimit = limit !== null && current >= limit;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
          {icon}
          {label}
        </p>
        <p className={`text-sm font-bold ${atLimit ? "text-orange-300" : "text-white"}`}>
          {limit === null
            ? `${current} — ${unlimitedLabel}`
            : `${current} / ${limit}`}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${atLimit ? "bg-orange-400" : "bg-emerald-400"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
