import { useQuery } from "@apollo/client/react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../Brand";

import { ME_QUERY }
  from "../../graphql/queries/auth";
import { useI18n } from "../../lib/i18n";

type MeQueryData = {
  me: {
    role: string;
  } | null;
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  onClose
}: SidebarProps) {
  const { tr } = useI18n();
  const { data } =
    useQuery<MeQueryData>(ME_QUERY);
  const canManageUsers =
    data?.me?.role === "ADMIN" ||
    data?.me?.role === "PROJECT_MANAGER";
  const canViewTimeline = canManageUsers;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label={tr("Fechar navegação", "Close navigation")}
          onClick={onClose}
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/40
            lg:hidden
          "
        />
      )}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-64
          bg-slate-900
          text-white
          flex
          flex-col
          transform
          transition-transform
          duration-200
          lg:static
          lg:translate-x-0
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
      <div
        className="
          px-6
          py-5
          border-b
          border-slate-800
        "
      >
        <Brand inverse to="/app" />

        <button
          type="button"
          onClick={onClose}
          className="
            mt-4
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            border
            border-slate-700
            text-slate-300
            hover:bg-slate-800
            lg:hidden
          "
          aria-label={tr("Fechar navegação", "Close navigation")}
        >
          <X size={18} />
        </button>
      </div>

      <nav
        className="
          flex-1
          p-4
        "
      >
        <ul className="space-y-2">
          <li>
            <Link
              to="/app"
              onClick={onClose}
              className="
                block
                px-4
                py-2
                rounded-lg
                hover:bg-slate-800
              "
            >
              {tr("Painel", "Dashboard")}
            </Link>
          </li>

          <li>
            <Link
              to="/app/projects"
              onClick={onClose}
              className="
                block
                px-4
                py-2
                rounded-lg
                hover:bg-slate-800
              "
            >
              {tr("Projetos", "Projects")}
            </Link>
          </li>

          {canViewTimeline && (
            <li>
              <Link
                to="/app/timeline"
                onClick={onClose}
                className="
                  block
                  px-4
                  py-2
                  rounded-lg
                  hover:bg-slate-800
                "
              >
                {tr("Cronograma", "Timeline")}
              </Link>
            </li>
          )}

          {canManageUsers && (
            <li>
              <Link
                to="/app/users"
                onClick={onClose}
                className="
                  block
                  px-4
                  py-2
                  rounded-lg
                  hover:bg-slate-800
                "
              >
                {tr("Usuários", "Users")}
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
    </>
  );
}
