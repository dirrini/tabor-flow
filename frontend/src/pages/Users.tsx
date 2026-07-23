import {
  useMemo,
  useState
} from "react";
import {
  useMutation,
  useQuery
} from "@apollo/client/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown
} from "lucide-react";

import CreateUserDialog, {
  type CreateUserFormValues
} from "../components/users/CreateUserDialog";
import EditUserDialog, {
  type EditUserFormValues
} from "../components/users/EditUserDialog";
import {
  CREATE_USER_MUTATION,
  ME_QUERY,
  UPDATE_USER_MUTATION,
  USERS_QUERY
} from "../graphql/queries/auth";

import type { User } from "../types/User";
import { useI18n } from "../lib/i18n";

type UsersQueryData = {
  users: User[];
};

type MeQueryData = {
  me: {
    role: string;
  } | null;
};

type SortKey =
  | "name"
  | "email"
  | "role";

type SortDirection =
  | "asc"
  | "desc";

function formatRole(role: string) {
  return role
    .replace("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

export default function Users() {
  const { tr } = useI18n();
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);
  const [sortKey, setSortKey] =
    useState<SortKey>("role");
  const [
    sortDirection,
    setSortDirection
  ] =
    useState<SortDirection>("asc");
  const [
    editingUser,
    setEditingUser
  ] = useState<User | null>(null);
  const { data: meData } =
    useQuery<MeQueryData>(ME_QUERY);
  const canManageUsers =
    meData?.me?.role === "ADMIN" ||
    meData?.me?.role ===
      "PROJECT_MANAGER";
  const {
    data,
    loading,
    error
  } = useQuery<UsersQueryData>(
    USERS_QUERY,
    {
      fetchPolicy: "cache-and-network"
    }
  );
  const [
    createUser,
    {
      loading: creating,
      error: createError
    }
  ] = useMutation(
    CREATE_USER_MUTATION,
    {
      refetchQueries: [
        { query: USERS_QUERY }
      ]
    }
  );
  const [
    updateUser,
    {
      loading: updating,
      error: updateError
    }
  ] = useMutation(
    UPDATE_USER_MUTATION,
    {
      refetchQueries: [
        { query: USERS_QUERY }
      ]
    }
  );

  const handleCreateUser = async (
    values: CreateUserFormValues
  ) => {
    await createUser({
      variables: {
        input: values
      }
    });

    setIsCreateOpen(false);
  };

  const handleUpdateUser = async (
    values: EditUserFormValues
  ) => {
    if (!editingUser)
      return;

    await updateUser({
      variables: {
        id: editingUser.id,
        input: values
      }
    });

    setEditingUser(null);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc"
          ? "desc"
          : "asc"
      );
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const users = data?.users ?? [];
  const rolePriority = {
    PROJECT_MANAGER: 0,
    MEMBER: 1,
    ADMIN: -1
  };
  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        let sortValue = 0;

        if (sortKey === "role") {
          sortValue =
            (rolePriority[a.role] ?? 99) -
            (rolePriority[b.role] ?? 99);
        } else {
          sortValue =
            a[sortKey].localeCompare(
              b[sortKey]
            );
        }

        if (sortValue === 0) {
          sortValue =
            a.name.localeCompare(b.name);
        }

        return sortDirection === "asc"
          ? sortValue
          : -sortValue;
      }),
    [
      users,
      sortKey,
      sortDirection
    ]
  );

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return (
        <ArrowUpDown
          aria-hidden="true"
          className="h-4 w-4"
        />
      );
    }

    return sortDirection === "asc" ? (
      <ArrowUp
        aria-hidden="true"
        className="h-4 w-4"
      />
    ) : (
      <ArrowDown
        aria-hidden="true"
        className="h-4 w-4"
      />
    );
  };

  return (
    <div>
      <div
        className="
          mb-6
          flex
          items-center
          justify-between
        "
      >
        <div>
          <p
            className="
              mt-2
              text-slate-500
            "
          >
            {tr("Gerencie quem pode acessar o TaborFlow.", "Manage who can access TaborFlow.")}
          </p>
        </div>

        {canManageUsers && (
          <button
            type="button"
            onClick={() =>
              setIsCreateOpen(true)
            }
            className="
              rounded-lg
              bg-slate-900
              px-4
              py-2
              text-sm
              font-medium
              text-white
              transition
              hover:bg-slate-700
            "
          >
            {tr("Convidar usuário", "Invite user")}
          </button>
        )}
      </div>

      {loading && (
        <p>{tr("Carregando usuários...", "Loading users...")}</p>
      )}

      {error && (
        <div
          className="
            rounded-xl
            border
            bg-white
            p-10
            text-center
            text-slate-500
          "
        >
          {error.message}
        </div>
      )}

      {!loading && !error && (
        <div
          className="
            overflow-hidden
            rounded-xl
            border
            bg-white
            shadow-sm
          "
        >
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th
                  className="
                    px-5
                    py-3
                    text-left
                    text-sm
                    font-semibold
                    text-slate-600
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleSort("name")
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-md
                      transition
                      hover:text-slate-900
                      focus:outline-none
                      focus:ring-2
                      focus:ring-slate-300
                    "
                    aria-label={tr("Ordenar usuários por nome", "Sort users by name")}
                  >
                    <span>{tr("Nome", "Name")}</span>
                    {getSortIcon("name")}
                  </button>
                </th>
                <th
                  className="
                    px-5
                    py-3
                    text-left
                    text-sm
                    font-semibold
                    text-slate-600
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleSort("email")
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-md
                      transition
                      hover:text-slate-900
                      focus:outline-none
                      focus:ring-2
                      focus:ring-slate-300
                    "
                    aria-label={tr("Ordenar usuários por e-mail", "Sort users by email")}
                  >
                    <span>Email</span>
                    {getSortIcon("email")}
                  </button>
                </th>
                <th
                  className="
                    px-5
                    py-3
                    text-left
                    text-sm
                    font-semibold
                    text-slate-600
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleSort("role")
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-md
                      transition
                      hover:text-slate-900
                      focus:outline-none
                      focus:ring-2
                      focus:ring-slate-300
                    "
                    aria-label={tr("Ordenar usuários por função", "Sort users by role")}
                  >
                    <span>{tr("Função", "Role")}</span>
                    {getSortIcon("role")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() =>
                    setEditingUser(user)
                  }
                  className="
                    cursor-pointer
                    border-t
                    transition
                    hover:bg-slate-50
                  "
                >
                  <td
                    className="
                      px-5
                      py-4
                      text-sm
                      font-medium
                      text-slate-900
                    "
                  >
                    {user.name}
                  </td>
                  <td
                    className="
                      px-5
                      py-4
                      text-sm
                      text-slate-600
                    "
                  >
                    {user.email}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="
                        rounded-full
                        bg-slate-100
                        px-3
                        py-1
                        text-xs
                        font-medium
                        text-slate-700
                      "
                    >
                      {{
                        PROJECT_MANAGER: tr("Gerente de projetos", "Project Manager"),
                        MEMBER: tr("Membro", "Member"),
                        ADMIN: tr("Administrador", "Administrator")
                      }[user.role] ?? formatRole(user.role)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div
              className="
                border-t
                p-10
                text-center
                text-slate-500
              "
            >
              {tr("Nenhum usuário encontrado.", "No users found.")}
            </div>
          )}
        </div>
      )}

      {isCreateOpen && canManageUsers && (
        <CreateUserDialog
          creating={creating}
          errorMessage={
            createError
              ? createError.message
              : undefined
          }
          onClose={() =>
            setIsCreateOpen(false)
          }
          onCreate={handleCreateUser}
        />
      )}

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          saving={updating}
          errorMessage={
            updateError
              ? updateError.message
              : undefined
          }
          onClose={() =>
            setEditingUser(null)
          }
          onSave={handleUpdateUser}
        />
      )}
    </div>
  );
}
