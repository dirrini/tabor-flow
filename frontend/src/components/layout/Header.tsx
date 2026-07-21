import {
  useMemo,
  useState,
  type FormEvent
} from "react";
import {
  useApolloClient,
  useMutation,
  useQuery
} from "@apollo/client/react";
import {
  ChevronDown,
  Menu
} from "lucide-react";
import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  ME_QUERY,
  UPDATE_MY_PASSWORD_MUTATION
} from "../../graphql/queries/auth";
import { clearAuthToken }
  from "../../lib/authStorage";

type MeQueryData = {
  me: {
    name: string;
    email: string;
    role: string;
  } | null;
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({
  onMenuClick
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const apolloClient = useApolloClient();
  const [
    isProfileOpen,
    setIsProfileOpen
  ] = useState(false);
  const [
    isPasswordOpen,
    setIsPasswordOpen
  ] = useState(false);
  const [
    currentPassword,
    setCurrentPassword
  ] = useState("");
  const [
    newPassword,
    setNewPassword
  ] = useState("");
  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");
  const [
    passwordMessage,
    setPasswordMessage
  ] = useState<string | null>(null);
  const { data } =
    useQuery<MeQueryData>(ME_QUERY);
  const [
    updateMyPassword,
    {
      loading: updatingPassword,
      error: passwordError
    }
  ] = useMutation(
    UPDATE_MY_PASSWORD_MUTATION
  );
  const currentUser = data?.me;
  const userInitials = useMemo(() => {
    if (!currentUser?.name) {
      return "U";
    }

    return currentUser.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [currentUser?.name]);
  const pageTitle = useMemo(() => {
    const pathname =
      location.pathname;

    if (pathname === "/app") {
      return "Dashboard";
    }

    if (pathname === "/app/projects") {
      return "Projects";
    }

    if (
      pathname.startsWith("/app/projects/")
    ) {
      return "Project details";
    }

    if (pathname === "/app/timeline") {
      return "Timeline";
    }

    if (pathname === "/app/users") {
      return "Users";
    }

    return "ProjectPulse";
  }, [location.pathname]);

  const handleLogout = async () => {
    clearAuthToken();
    await apolloClient.clearStore();
    navigate("/login", {
      replace: true
    });
  };

  const handleProfileToggle = () => {
    setIsProfileOpen(
      (isOpen) => !isOpen
    );
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage(null);
  };

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "New passwords do not match."
      );
      return;
    }

    try {
      await updateMyPassword({
        variables: {
          input: {
            currentPassword,
            newPassword
          }
        }
      });
    } catch {
      return;
    }

    resetPasswordForm();
    setIsPasswordOpen(false);
    setPasswordMessage(
      "Password updated."
    );
  };

  return (
    <header
      className="
        h-16
        bg-white
        border-b
        px-6
        flex
        items-center
        justify-between
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >
        <button
          type="button"
          onClick={onMenuClick}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            border
            transition
            hover:bg-slate-100
            lg:hidden
          "
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <h2
          className="
            truncate
            text-xl
            font-semibold
            text-slate-900
          "
        >
          {pageTitle}
        </h2>
      </div>

      <div
        className="
          relative
          flex
          items-center
          gap-3
        "
      >
        <button
          type="button"
          onClick={handleProfileToggle}
          className="
            flex
            items-center
            gap-2
            justify-center
            rounded-lg
            border
            px-2
            py-1.5
            transition
            hover:bg-slate-100
          "
          aria-label="Open profile menu"
        >
          <span
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-slate-900
              text-xs
              font-semibold
              text-white
            "
          >
            {userInitials}
          </span>

          <span
            className="
              hidden
              max-w-32
              truncate
              text-sm
              font-medium
              text-slate-700
              sm:block
            "
          >
            {currentUser?.name ?? "User"}
          </span>

          <ChevronDown
            size={16}
            className="text-slate-500"
          />
        </button>

        {isProfileOpen && (
          <div
            className="
              absolute
              right-0
              top-12
              z-50
              w-72
              rounded-xl
              border
              bg-white
              p-4
              shadow-lg
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
                border-b
                pb-4
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-900
                  text-sm
                  font-semibold
                  text-white
                "
              >
                {userInitials}
              </div>

              <div className="min-w-0">
                <p
                  className="
                    truncate
                    font-semibold
                    text-slate-900
                  "
                >
                  {currentUser?.name ?? "User"}
                </p>

                <p
                  className="
                    truncate
                    text-sm
                    text-slate-500
                  "
                >
                  {currentUser?.email}
                </p>
              </div>
            </div>

            <div
              className="
                mt-3
                flex
                items-center
                justify-between
                text-sm
              "
            >
              <span className="text-slate-500">
                Role
              </span>
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
                {currentUser?.role ?? "USER"}
              </span>
            </div>

            <div
              className="
                mt-4
                border-t
                pt-4
              "
            >
              <button
                type="button"
                onClick={() => {
                  setIsPasswordOpen(
                    (isOpen) => !isOpen
                  );
                  setPasswordMessage(null);
                }}
                className="
                  w-full
                  rounded-lg
                  border
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-100
                "
              >
                Change password
              </button>

              {isPasswordOpen && (
                <form
                  onSubmit={handlePasswordSubmit}
                  className="mt-3 space-y-3"
                >
                  <input
                    required
                    type="password"
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    placeholder="Current password"
                    className="
                      w-full
                      rounded-lg
                      border
                      border-slate-300
                      px-3
                      py-2
                      text-sm
                      outline-none
                      focus:border-slate-900
                    "
                  />

                  <input
                    required
                    minLength={6}
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="New password"
                    className="
                      w-full
                      rounded-lg
                      border
                      border-slate-300
                      px-3
                      py-2
                      text-sm
                      outline-none
                      focus:border-slate-900
                    "
                  />

                  <input
                    required
                    minLength={6}
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    className="
                      w-full
                      rounded-lg
                      border
                      border-slate-300
                      px-3
                      py-2
                      text-sm
                      outline-none
                      focus:border-slate-900
                    "
                  />

                  {(passwordMessage ||
                    passwordError) && (
                    <p
                      className={`
                        text-sm
                        ${
                          passwordError
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      `}
                    >
                      {passwordError
                        ? "Could not update password."
                        : passwordMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      updatingPassword ||
                      !currentPassword ||
                      newPassword.length < 6 ||
                      confirmPassword.length < 6
                    }
                    className="
                      w-full
                      rounded-lg
                      bg-slate-900
                      px-4
                      py-2
                      text-sm
                      font-medium
                      text-white
                      transition
                      hover:bg-slate-700
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {updatingPassword
                      ? "Saving..."
                      : "Save password"}
                  </button>
                </form>
              )}
            </div>

            {!isPasswordOpen &&
              passwordMessage && (
                <p
                  className="
                    mt-3
                    text-sm
                    text-green-600
                  "
                >
                  {passwordMessage}
                </p>
              )}

            <button
              type="button"
              onClick={handleLogout}
              className="
                mt-4
                w-full
                rounded-lg
                border
                px-4
                py-2
                text-sm
                font-medium
                text-slate-700
                transition
                hover:bg-slate-100
              "
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
