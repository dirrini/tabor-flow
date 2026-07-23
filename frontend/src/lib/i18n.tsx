import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type Locale = "pt-BR" | "en";

const messages = {
  "pt-BR": {
    login: "Entrar",
    signup: "Criar conta",
    language: "Idioma",
    heroEyebrow: "Gestão de projetos, sem ruído",
    heroTitle: "Projetos claros. Equipes no ritmo.",
    heroBody: "Planeje, acompanhe e entregue com uma visão única do trabalho — do primeiro briefing ao último marco.",
    start: "Começar agora",
    demo: "Ver como funciona",
    trusted: "Seu ambiente, seus dados",
    feature1: "Visão em tempo real",
    feature1Body: "Progresso, prazos e responsáveis em uma tela que todos entendem.",
    feature2: "Times alinhados",
    feature2Body: "Distribua responsabilidades e elimine dúvidas sobre o próximo passo.",
    feature3: "Segurança por organização",
    feature3Body: "Cada workspace é isolado para que sua equipe veja apenas o que é seu.",
    dashboard: "Painel",
    projects: "Projetos",
    timeline: "Cronograma",
    team: "Equipe",
    progress: "Progresso geral",
    onTrack: "No prazo",
    activeProjects: "Projetos ativos",
    thisWeek: "Esta semana"
  },
  en: {
    login: "Log in",
    signup: "Create account",
    language: "Language",
    heroEyebrow: "Project management, without the noise",
    heroTitle: "Clear projects. Teams in flow.",
    heroBody: "Plan, track, and deliver with one shared view of the work — from the first brief to the final milestone.",
    start: "Get started",
    demo: "See how it works",
    trusted: "Your workspace, your data",
    feature1: "Real-time clarity",
    feature1Body: "Progress, deadlines, and owners in a view everyone can understand.",
    feature2: "Aligned teams",
    feature2Body: "Assign ownership and remove uncertainty about what comes next.",
    feature3: "Organization-level security",
    feature3Body: "Every workspace is isolated so your team only sees what belongs to them.",
    dashboard: "Dashboard",
    projects: "Projects",
    timeline: "Timeline",
    team: "Team",
    progress: "Overall progress",
    onTrack: "On track",
    activeProjects: "Active projects",
    thisWeek: "This week"
  }
} as const;

type Messages = { [K in keyof typeof messages["pt-BR"]]: string };
type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
  tr: (portuguese: string, english: string) => string;
};

const localeStorageKey = "taborflow.locale";
const legacyLocaleStorageKey = "projectpulse.locale";
const I18nContext = createContext<I18nValue | null>(null);

function getInitialLocale(): Locale {
  const storedLocale = localStorage.getItem(localeStorageKey) ??
    localStorage.getItem(legacyLocaleStorageKey);
  return storedLocale === "en" ? "en" : "pt-BR";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    localStorage.setItem(localeStorageKey, locale);
    localStorage.removeItem(legacyLocaleStorageKey);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale: setLocaleState,
    t: messages[locale],
    tr: (portuguese, english) => locale === "pt-BR" ? portuguese : english
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider missing");
  return value;
}
