import { useState, type FormEvent } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";

import { Brand } from "../components/Brand";
import { ACCEPT_INVITATION_MUTATION } from "../graphql/queries/auth";
import { setAuthToken } from "../lib/authStorage";
import { useI18n } from "../lib/i18n";

type AcceptInvitationData = {
  acceptInvitation: { token: string };
};

export default function AcceptInvitation() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const client = useApolloClient();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [acceptInvitation, { loading, error }] = useMutation<AcceptInvitationData>(ACCEPT_INVITATION_MUTATION);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (password !== confirmation) {
      setLocalError(tr("As senhas não coincidem.", "Passwords do not match."));
      return;
    }
    const result = await acceptInvitation({ variables: { token, password } });
    const authToken = result.data?.acceptInvitation.token;
    if (!authToken) return;
    setAuthToken(authToken);
    await client.resetStore();
    navigate("/app", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f2] p-6">
      <section className="w-full max-w-lg rounded-3xl border border-[#dfe3dc] bg-white p-8 shadow-sm sm:p-10">
        <Brand />
        <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f0eb] text-[#163c2d]">
          <KeyRound size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-.03em] text-[#15231d]">
          {tr("Aceite seu convite", "Accept your invitation")}
        </h1>
        <p className="mt-3 leading-7 text-[#66736c]">
          {tr("Defina uma senha para confirmar sua conta e acessar o workspace.", "Set a password to confirm your account and access the workspace.")}
        </p>

        {!token ? (
          <div className="mt-6">
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{tr("O link do convite é inválido.", "The invitation link is invalid.")}</p>
            <Link to="/login" className="mt-5 block text-center font-bold text-[#163c2d] underline">{tr("Ir para o login", "Go to login")}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#33423a]">{tr("Senha", "Password")}</span>
              <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#d7dcd4] px-4 py-3 outline-none focus:border-[#3c7057]" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#33423a]">{tr("Confirmar senha", "Confirm password")}</span>
              <input required minLength={8} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-[#d7dcd4] px-4 py-3 outline-none focus:border-[#3c7057]" />
            </label>
            {(localError || error) && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{localError ?? error?.message}</p>}
            <button disabled={loading || password.length < 8 || confirmation.length < 8} className="w-full rounded-full bg-[#163c2d] px-5 py-3.5 font-bold text-white disabled:opacity-60">
              {loading ? tr("Confirmando...", "Confirming...") : tr("Aceitar convite", "Accept invitation")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
