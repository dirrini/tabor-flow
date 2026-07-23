import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";

import { Brand } from "../components/Brand";
import {
  ME_QUERY,
  RESEND_VERIFICATION_EMAIL_MUTATION,
  VERIFY_EMAIL_MUTATION
} from "../graphql/queries/auth";
import { clearAuthToken, getAuthToken } from "../lib/authStorage";
import { useI18n } from "../lib/i18n";

type MeData = {
  me: { email: string; emailVerified: boolean } | null;
};

export default function VerifyEmail() {
  const { locale } = useI18n();
  const pt = locale === "pt-BR";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const started = useRef(false);
  const [verified, setVerified] = useState(false);
  const [sent, setSent] = useState(false);
  const hasSession = Boolean(getAuthToken());
  const { data, loading, refetch } = useQuery<MeData>(ME_QUERY, {
    skip: !hasSession,
    fetchPolicy: "network-only"
  });
  const [verify, { loading: verifying, error: verifyError }] = useMutation(
    VERIFY_EMAIL_MUTATION
  );
  const [resend, { loading: resending, error: resendError }] = useMutation(
    RESEND_VERIFICATION_EMAIL_MUTATION
  );

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    void verify({ variables: { token } }).then(async () => {
      setVerified(true);
      if (hasSession) await refetch();
    });
  }, [hasSession, refetch, token, verify]);

  if (!token && hasSession && !loading && data?.me?.emailVerified) {
    return <Navigate to="/app" replace />;
  }

  const resendEmail = async () => {
    await resend();
    setSent(true);
  };

  const useAnotherAccount = () => {
    clearAuthToken();
    navigate("/login", { replace: true });
  };

  const busy = verifying || (hasSession && loading);
  const error = verifyError || resendError;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f2] p-6">
      <section className="w-full max-w-lg rounded-3xl border border-[#dfe3dc] bg-white p-8 shadow-sm sm:p-10">
        <Brand />
        <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f0eb] text-[#163c2d]">
          <MailCheck size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-.03em] text-[#15231d]">
          {verified
            ? (pt ? "E-mail verificado" : "Email verified")
            : (pt ? "Verifique seu e-mail" : "Verify your email")}
        </h1>
        <p className="mt-3 leading-7 text-[#66736c]">
          {verified
            ? (pt ? "Seu endereço foi confirmado. Você já pode acessar seu workspace." : "Your address is confirmed. You can now access your workspace.")
            : (pt ? `Enviamos um link de confirmação${data?.me?.email ? ` para ${data.me.email}` : ""}. Ele expira em 60 minutos.` : `We sent a confirmation link${data?.me?.email ? ` to ${data.me.email}` : ""}. It expires in 60 minutes.`)}
        </p>
        {busy && <p className="mt-6 text-sm font-semibold text-[#3c7057]">{pt ? "Confirmando..." : "Confirming..."}</p>}
        {sent && <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{pt ? "Um novo link foi enviado." : "A new link has been sent."}</p>}
        {error && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>}
        <div className="mt-8 space-y-3">
          {verified && hasSession && (
            <button onClick={() => navigate("/app", { replace: true })} className="w-full rounded-full bg-[#163c2d] px-5 py-3.5 font-bold text-white">
              {pt ? "Acessar workspace" : "Open workspace"}
            </button>
          )}
          {verified && !hasSession && (
            <Link to="/login" className="block w-full rounded-full bg-[#163c2d] px-5 py-3.5 text-center font-bold text-white">
              {pt ? "Entrar" : "Log in"}
            </Link>
          )}
          {!verified && hasSession && (
            <button disabled={resending || busy} onClick={resendEmail} className="w-full rounded-full bg-[#163c2d] px-5 py-3.5 font-bold text-white disabled:opacity-60">
              {resending ? (pt ? "Enviando..." : "Sending...") : (pt ? "Reenviar e-mail" : "Resend email")}
            </button>
          )}
          {hasSession && (
            <button onClick={useAnotherAccount} className="w-full px-5 py-3 text-sm font-bold text-[#526158] underline">
              {pt ? "Usar outra conta" : "Use another account"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
