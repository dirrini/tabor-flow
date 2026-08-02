import { ArrowRight, BarChart3, Check, ChevronRight, CircleUserRound, Globe2, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { Brand } from "../components/Brand";
import { useI18n } from "../lib/i18n";
import {
  formatPlanPrice,
  premiumAnnualPrice,
  premiumMonthlyPrice
} from "../lib/plans";

const copy = {
  "pt-BR": { navFeatures:"Recursos",navTimeline:"Timeline",navSecurity:"Segurança",login:"Entrar",signup:"Começar grátis",eyebrow:"Projetos complexos, fluxo simples",title:"Transforme planos em entregas — no ritmo certo.",body:"Centralize projetos, pessoas, tarefas e prazos. O TaborFlow dá à sua equipe uma visão clara do que está acontecendo agora e do que vem depois.",cta:"Criar meu workspace",see:"Explorar a Timeline",proof:"Um ambiente isolado e seguro para cada organização",overview:"Tudo que importa, sem perder o contexto.",overviewBody:"Do portfólio executivo ao detalhe de cada tarefa, todos trabalham com a mesma fonte de verdade.",dashboard:"Dashboard executivo",dashboardBody:"Acompanhe projetos, tarefas concluídas, capacidade do time e riscos em tempo real.",projects:"Projetos organizados",projectsBody:"Reúna progresso, responsáveis, produtos, integrações e decisões em um só lugar.",people:"Responsabilidade clara",peopleBody:"Distribua o trabalho por pessoa, datas e status — sem planilhas paralelas.",timelineTag:"O coração do TaborFlow",timelineTitle:"Uma Timeline que mostra o trabalho como ele realmente acontece.",timelineBody:"Visualize dependências, sobreposições e capacidade por pessoa. Ajuste períodos, identifique atrasos e veja cada entrega em contexto.",timelineCta:"Planeje visualmente",today:"Hoje",todo:"A fazer",doing:"Em andamento",done:"Concluído",why:"Da estratégia à execução",whyTitle:"Menos status meeting. Mais fluxo.",whyBody:"O TaborFlow conecta a visão de liderança ao dia a dia da equipe, mantendo cada projeto rastreável e cada responsável alinhado.",security:"Seus dados pertencem ao seu time.",securityBody:"Cada organização opera em um workspace isolado. Usuários autenticados acessam somente o ambiente e os projetos do próprio tenant.",finalTitle:"Dê visibilidade ao trabalho. Libere o fluxo.",finalBody:"Crie seu workspace e organize o próximo projeto em minutos.",footer:"Gestão de projetos com clareza e ritmo."},
  en: { navFeatures:"Features",navTimeline:"Timeline",navSecurity:"Security",login:"Log in",signup:"Start free",eyebrow:"Complex projects, simple flow",title:"Turn plans into delivery — at the right pace.",body:"Bring projects, people, tasks, and deadlines together. TaborFlow gives your team a clear view of what is happening now and what comes next.",cta:"Create my workspace",see:"Explore the Timeline",proof:"A secure, isolated workspace for every organization",overview:"Everything that matters, without losing context.",overviewBody:"From the executive portfolio to each task, everyone works from the same source of truth.",dashboard:"Executive dashboard",dashboardBody:"Track projects, completed work, team capacity, and risk in real time.",projects:"Organized projects",projectsBody:"Keep progress, owners, products, integrations, and decisions in one place.",people:"Clear ownership",peopleBody:"Assign work by person, dates, and status — without parallel spreadsheets.",timelineTag:"The heart of TaborFlow",timelineTitle:"A Timeline that shows work as it really happens.",timelineBody:"See dependencies, overlaps, and capacity by person. Adjust timeframes, spot delays, and understand every delivery in context.",timelineCta:"Plan visually",today:"Today",todo:"To do",doing:"In progress",done:"Done",why:"From strategy to execution",whyTitle:"Fewer status meetings. More flow.",whyBody:"TaborFlow connects leadership visibility to the team's daily work, keeping every project traceable and every owner aligned.",security:"Your data belongs to your team.",securityBody:"Every organization operates in an isolated workspace. Authenticated users only access their own tenant and projects.",finalTitle:"Make work visible. Unlock the flow.",finalBody:"Create your workspace and organize your next project in minutes.",footer:"Project management with clarity and rhythm."}
} as const;

const pricingCopy = {
  "pt-BR": {
    nav: "Planos",
    eyebrow: "Planos simples",
    title: "Comece grátis. Cresça sem perder o ritmo.",
    body: "Use os recursos essenciais sem custo e escolha o Premium quando sua equipe precisar de mais projetos, pessoas e visão consolidada.",
    freeBody: "Para equipes pequenas organizarem o trabalho com clareza.",
    premiumBody: "Para operações que precisam escalar projetos e decisões.",
    monthly: "Mensal",
    yearly: "Anual",
    perMonth: "por mês",
    perYear: "por ano",
    start: "Começar grátis",
    choose: "Quero ser Premium",
    freeFeatures: [
      "Até 5 usuários",
      "Até 3 projetos ativos",
      "Tarefas ilimitadas",
      "Dashboard básico",
      "Relatório de saúde de um projeto",
      "Timeline de um projeto por vez"
    ],
    premiumFeatures: [
      "Usuários e projetos sem limite funcional",
      "Timeline consolidada de todos os projetos",
      "Filtros avançados",
      "Integrações externas por API",
      "Exportações e relatórios avançados",
      "Suporte prioritário"
    ]
  },
  en: {
    nav: "Pricing",
    eyebrow: "Simple pricing",
    title: "Start free. Grow without losing momentum.",
    body: "Use the essentials at no cost and choose Premium when your team needs more projects, people, and consolidated visibility.",
    freeBody: "For small teams organizing work with clarity.",
    premiumBody: "For operations that need to scale projects and decisions.",
    monthly: "Monthly",
    yearly: "Yearly",
    perMonth: "per month",
    perYear: "per year",
    start: "Start free",
    choose: "Go Premium",
    freeFeatures: [
      "Up to 5 users",
      "Up to 3 active projects",
      "Unlimited tasks",
      "Basic dashboard",
      "Single-project health report",
      "One project at a time in Timeline"
    ],
    premiumFeatures: [
      "No functional user or project limits",
      "Consolidated Timeline across projects",
      "Advanced filters",
      "External API integrations",
      "Exports and advanced reports",
      "Priority support"
    ]
  }
} as const;

export default function Landing() {
  const { locale, setLocale } = useI18n(); const t=copy[locale]; const pricing=pricingCopy[locale];
  return <main className="min-h-screen overflow-hidden bg-[#f7f8f4] text-[#13243a]">
    <nav className="sticky top-0 z-50 border-b border-[#13243a]/8 bg-[#f7f8f4]/90 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8"><Brand/><div className="hidden items-center gap-8 text-sm font-semibold md:flex"><a href="#recursos" className="hover:text-[#e87937]">{t.navFeatures}</a><a href="#timeline" className="hover:text-[#e87937]">{t.navTimeline}</a><a href="#planos" className="hover:text-[#e87937]">{pricing.nav}</a></div><div className="flex items-center gap-2"><label className="relative hidden sm:block"><Globe2 className="pointer-events-none absolute left-3 top-2.5" size={15}/><select aria-label="Language" value={locale} onChange={e=>setLocale(e.target.value as "pt-BR"|"en")} className="rounded-full border border-[#d8ddd8] bg-white py-2 pl-9 pr-3 text-sm font-semibold"><option value="pt-BR">PT-BR</option><option value="en">EN</option></select></label><Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold hover:bg-white">{t.login}</Link><Link to="/register" className="rounded-full bg-[#13243a] px-4 py-2 text-sm font-bold text-white hover:bg-[#203958]">{t.signup}</Link></div></div></nav>

    <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pb-32 lg:pt-24"><div className="relative z-10 flex flex-col justify-center"><span className="mb-6 w-fit rounded-full border border-[#e87937]/25 bg-[#fff3ea] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.15em] text-[#c65f24]">{t.eyebrow}</span><h1 className="max-w-2xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-[4.65rem]">{t.title}</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#5b6876]">{t.body}</p><div className="mt-9 flex flex-wrap gap-3"><Link to="/register" className="flex items-center gap-2 rounded-full bg-[#e87937] px-6 py-3.5 font-extrabold text-white shadow-[0_14px_35px_rgba(232,121,55,.25)] hover:bg-[#d96b2d]">{t.cta}<ArrowRight size={18}/></Link><a href="#timeline" className="flex items-center gap-2 rounded-full border border-[#cfd6d2] bg-white px-6 py-3.5 font-extrabold hover:border-[#9ba8a1]">{t.see}<ChevronRight size={17}/></a></div><p className="mt-6 flex items-center gap-2 text-sm text-[#66736f]"><ShieldCheck size={17} className="text-[#2f7254]"/>{t.proof}</p></div><DashboardPreview/></section>

    <section id="recursos" className="border-y border-[#13243a]/8 bg-white py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-extrabold uppercase tracking-[.18em] text-[#e87937]">TaborFlow</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{t.overview}</h2><p className="mt-5 text-lg leading-8 text-[#63707d]">{t.overviewBody}</p></div><div className="mt-14 grid gap-5 md:grid-cols-3"><Feature icon={<LayoutDashboard/>} title={t.dashboard} body={t.dashboardBody}/><Feature icon={<BarChart3/>} title={t.projects} body={t.projectsBody}/><Feature icon={<Users/>} title={t.people} body={t.peopleBody}/></div></div></section>

    <section id="timeline" className="relative bg-[#13243a] py-24 text-white"><div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#e87937]/15 blur-3xl"/><div className="relative mx-auto max-w-7xl px-5 lg:px-8"><div className="grid items-end gap-8 lg:grid-cols-[1fr_.7fr]"><div><p className="text-sm font-extrabold uppercase tracking-[.18em] text-[#f2a16f]">{t.timelineTag}</p><h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-6xl">{t.timelineTitle}</h2></div><div><p className="text-lg leading-8 text-white/65">{t.timelineBody}</p><Link to="/register" className="mt-6 inline-flex items-center gap-2 font-extrabold text-[#f2a16f]">{t.timelineCta}<ArrowRight size={17}/></Link></div></div><TimelinePreview labels={{today:t.today,todo:t.todo,doing:t.doing,done:t.done}} locale={locale}/></div></section>

    <section className="bg-[#eef2ed] py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-4xl rounded-[2rem] bg-white p-8 shadow-sm sm:p-10"><p className="text-sm font-extrabold uppercase tracking-[.18em] text-[#e87937]">{t.why}</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em]">{t.whyTitle}</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-[#65727f]">{t.whyBody}</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{[t.dashboard,t.projects,t.people].map(x=><p key={x} className="flex items-center gap-3 font-bold"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e7f4ec] text-[#2d7452]"><Check size={15}/></span>{x}</p>)}</div></div></div></section>

    <PricingSection locale={locale} copy={pricing}/>

    <section className="bg-[#e87937] px-5 py-20 text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center"><div><h2 className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{t.finalTitle}</h2><p className="mt-4 text-lg text-white/80">{t.finalBody}</p></div><Link to="/register" className="flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-4 font-extrabold text-[#13243a]">{t.signup}<ArrowRight size={18}/></Link></div></section>
    <footer className="bg-[#0d1a2a] px-5 py-10 text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><Brand inverse/><p className="text-sm text-white/50">{t.footer}</p></div></footer>
  </main>
}

function PricingSection({locale,copy}:{locale:"pt-BR"|"en";copy:(typeof pricingCopy)["pt-BR"]|(typeof pricingCopy)["en"]}) {
  const [yearly,setYearly]=useState(false);
  const premiumPrice=yearly?premiumAnnualPrice:premiumMonthlyPrice;
  return <section id="planos" className="bg-white py-24"><div className="mx-auto max-w-6xl px-5 lg:px-8"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-extrabold uppercase tracking-[.18em] text-[#e87937]">{copy.eyebrow}</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{copy.title}</h2><p className="mt-5 text-lg leading-8 text-[#63707d]">{copy.body}</p></div><div className="mx-auto mt-8 flex w-fit rounded-full bg-[#eef2ed] p-1"><button type="button" onClick={()=>setYearly(false)} className={`rounded-full px-5 py-2 text-sm font-bold ${!yearly?"bg-white shadow-sm":"text-[#68757f]"}`}>{copy.monthly}</button><button type="button" onClick={()=>setYearly(true)} className={`rounded-full px-5 py-2 text-sm font-bold ${yearly?"bg-white shadow-sm":"text-[#68757f]"}`}>{copy.yearly}</button></div><div className="mt-10 grid gap-6 lg:grid-cols-2"><PlanCard name="Free" description={copy.freeBody} price={locale==="pt-BR"?"Grátis":"Free"} features={copy.freeFeatures} cta={copy.start}/><PlanCard premium name="Premium" description={copy.premiumBody} price={formatPlanPrice(premiumPrice,locale)} suffix={premiumPrice!==null?(yearly?copy.perYear:copy.perMonth):undefined} features={copy.premiumFeatures} cta={copy.choose}/></div></div></section>
}

function PlanCard({name,description,price,suffix,features,cta,premium=false}:{name:string;description:string;price:string;suffix?:string;features:readonly string[];cta:string;premium?:boolean}){return <article className={`relative overflow-hidden rounded-[1.75rem] border p-7 sm:p-9 ${premium?"border-[#e87937]/35 bg-[#fff7f0]":"border-[#dce1dd] bg-[#fafbf8]"}`}>{premium&&<span className="absolute right-5 top-5 rounded-full bg-[#e87937] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">Premium</span>}<h3 className="text-2xl font-extrabold">{name}</h3><p className="mt-2 min-h-12 text-[#68757f]">{description}</p><div className="mt-6"><strong className="text-3xl tracking-tight">{price}</strong>{suffix&&<span className="ml-2 text-sm text-[#68757f]">{suffix}</span>}</div><ul className="mt-7 space-y-3">{features.map(feature=><li key={feature} className="flex gap-3 text-sm font-semibold"><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${premium?"bg-[#e87937] text-white":"bg-[#dceee3] text-[#26704e]"}`}><Check size={13}/></span>{feature}</li>)}</ul><Link to="/register" className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-extrabold ${premium?"bg-[#13243a] text-white":"border border-[#cfd6d2] bg-white"}`}>{cta}<ArrowRight size={17}/></Link></article>}

function Feature({icon,title,body}:{icon:ReactNode;title:string;body:string}){return <article className="rounded-[1.6rem] border border-[#dce1dd] bg-[#fafbf8] p-7"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#13243a] text-white">{icon}</span><h3 className="mt-7 text-xl font-extrabold">{title}</h3><p className="mt-3 leading-7 text-[#68757f]">{body}</p></article>}

function DashboardPreview(){return <div className="relative min-w-0"><div className="absolute -inset-8 rounded-full bg-[#dce8dd] blur-3xl"/><div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-[0_35px_90px_rgba(25,43,58,.17)]"><div className="flex min-h-[480px] rounded-[1.35rem] bg-[#edf2f5]"><div className="hidden w-36 shrink-0 rounded-l-[1.35rem] bg-[#101c30] p-4 text-white sm:block"><Brand inverse compact/><div className="mt-12 space-y-5 text-[11px] text-white/60"><p className="text-white">Dashboard</p><p>Projects</p><p>Timeline</p><p>Users</p></div></div><div className="min-w-0 flex-1"><div className="flex h-14 items-center justify-between border-b bg-white px-5"><b>Dashboard</b><CircleUserRound size={25}/></div><div className="p-4"><div className="grid grid-cols-2 gap-3">{[["Projects","12"],["Tasks","46"],["Completed","31"],["Team","8"]].map(([a,b])=><div key={a} className="rounded-xl bg-white p-4"><span className="text-[10px] text-[#758292]">{a}</span><p className="mt-1 text-xl font-extrabold">{b}</p></div>)}</div><p className="mb-3 mt-5 text-sm font-bold">Recent projects</p>{[["Cloud Infrastructure Migration",72,"#3f9f67"],["SAP Sync",42,"#ed9c24"]].map(([a,b,c])=><div key={a as string} className="mb-3 rounded-xl bg-white p-4"><div className="flex justify-between gap-3 text-xs font-bold"><span>{a}</span><span>{b}%</span></div><div className="mt-3 h-1.5 rounded-full bg-[#e8edf0]"><div className="h-full rounded-full" style={{width:`${b}%`,background:c as string}}/></div></div>)}</div></div></div></div></div>}

function TimelinePreview({labels,locale}:{labels:{today:string;todo:string;doing:string;done:string};locale:"pt-BR"|"en"}){const pt=locale==="pt-BR";const days=["14","15","16","17","18","19","20","21","22","23","24","25","26","27"];return <div className="mt-14 overflow-hidden rounded-[1.6rem] border border-white/15 bg-white text-[#13243a] shadow-2xl"><div className="flex flex-wrap items-center justify-between gap-4 border-b p-5"><div><div className="flex items-center gap-3"><b className="text-lg">{pt?"Portal do Cliente":"Customer Portal"}</b><span className="rounded-full bg-[#e4f5e9] px-3 py-1 text-xs font-bold text-[#27704b]">{pt?"No prazo":"On track"}</span></div><p className="mt-1 text-xs text-[#708092]">{pt?"Nova experiência digital para atendimento e autoatendimento de clientes.":"A new digital experience for customer support and self-service."}</p></div><div className="flex gap-2 text-[11px]"><span className="rounded-lg bg-[#f4f7f9] px-3 py-2">3 {pt?"Pessoas":"People"}</span><span className="rounded-lg bg-[#f4f7f9] px-3 py-2">4 {pt?"Tarefas":"Tasks"}</span></div></div><div className="flex items-center justify-between bg-[#f7f9fa] px-5 py-3 text-xs"><span className="flex gap-4"><i className="not-italic text-[#8c9db0]">● {labels.todo}</i><i className="not-italic text-[#ee980e]">● {labels.doing}</i><i className="not-italic text-[#3d7ee8]">● {labels.done}</i></span><span className="rounded-lg border bg-white px-3 py-2 font-bold">{pt?"Junho de 2026":"June 2026"}</span></div><div className="overflow-x-auto"><div className="min-w-[980px]"><div className="ml-32 grid grid-cols-14 border-b text-center text-[11px] text-[#6c7885]">{days.map(d=><span key={d} className="border-l py-3">{d}</span>)}</div><TimelineRow name="Marina" initial="M"><Bar left="10%" width="62%" color="blue" title={pt?"Desenhar jornada de autoatendimento":"Design self-service journey"} description={pt?"Mapear os principais fluxos e pontos de contato.":"Map key flows and customer touchpoints."}/></TimelineRow><TimelineRow name="Rafael" initial="R"><Bar left="0%" width="30%" color="amber" title={pt?"Construir área autenticada":"Build authenticated area"} description={pt?"Implementar acesso seguro e perfil do cliente.":"Implement secure access and customer profiles."}/><Bar left="38%" width="39%" color="slate" title={pt?"Integrar central de ajuda":"Connect help center"} description={pt?"Exibir artigos relevantes dentro do portal.":"Surface relevant articles inside the portal."}/></TimelineRow><TimelineRow name="Camila" initial="C"><Bar left="22%" width="48%" color="amber" title={pt?"Validar experiência mobile":"Validate mobile experience"} description={pt?"Testar os fluxos críticos em diferentes dispositivos.":"Test critical flows across different devices."}/></TimelineRow></div></div></div>}
function TimelineRow({name,initial,children}:{name:string;initial:string;children:ReactNode}){return <div className="flex h-20 border-b last:border-0"><div className="flex w-32 shrink-0 items-center gap-2 border-r px-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#101c30] text-xs font-bold text-white">{initial}</span><span className="text-xs font-bold">{name}</span></div><div className="relative flex-1 bg-[linear-gradient(to_right,#e4e7ea_1px,transparent_1px)] bg-[length:7.142%_100%]">{children}</div></div>}
function Bar({left,width,color,title,description}:{left:string;width:string;color:"blue"|"amber"|"slate";title:string;description:string}){const styles={blue:"border-[#3d7ee8] bg-[#d7e5fb] text-[#1455b9]",amber:"border-[#ee980e] bg-[#fff0bd] text-[#985406]",slate:"border-[#8fa6c2] bg-[#e5edf6] text-[#294c72]"};return <span className={`absolute top-3 overflow-hidden rounded-sm border px-3 py-2 ${styles[color]}`} style={{left,width}}><strong className="block truncate text-xs">{title}</strong><small className="mt-0.5 block truncate text-[10px] font-medium opacity-75">{description}</small></span>}


