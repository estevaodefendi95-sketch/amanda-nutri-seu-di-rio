import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Home,
  LayoutDashboard,
  LineChart,
  Leaf,
  LogOut,
  Salad,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePerfilAtual, useSair, type Papel } from "@/lib/auth";

type ItemMenu = { titulo: string; url: string; icone: typeof Home };

const MENU: Record<Papel, ItemMenu[]> = {
  nutricionista: [
    { titulo: "Painel", url: "/painel", icone: LayoutDashboard },
    { titulo: "Pacientes", url: "/pacientes", icone: Users },
  ],
  paciente: [
    { titulo: "Início", url: "/inicio", icone: Home },
    { titulo: "Minha Dieta", url: "/minha-dieta", icone: Salad },
    { titulo: "Diário", url: "/diario", icone: BookOpen },
    { titulo: "Evolução", url: "/minha-evolucao", icone: LineChart },
  ],
};

const ROTULO_PAPEL: Record<Papel, string> = {
  nutricionista: "Nutricionista",
  paciente: "Paciente",
};

function iniciais(nome?: string | null) {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0];
  const ultima = partes[partes.length - 1];
  if (!primeira || !ultima) return "?";
  if (partes.length === 1) return primeira.charAt(0).toUpperCase();
  return (primeira.charAt(0) + ultima.charAt(0)).toUpperCase();
}

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-soft">
        <Leaf className="size-5" />
      </span>
      {compacta ? null : (
        <span className="min-w-0">
          <span className="block font-display text-lg font-semibold leading-tight text-sidebar-foreground">
            Amanda Nutri
          </span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Seu diário
          </span>
        </span>
      )}
    </span>
  );
}

export function Avatar({
  nome,
  className,
}: {
  nome?: string | null | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-base font-semibold text-primary-soft-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data } = usePerfilAtual();
  const sair = useSair();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const papel: Papel = data?.papel ?? "paciente";
  const itens = MENU[papel];
  const nome = data?.perfil?.nome || data?.user.email || "";

  const ativo = (url: string) => pathname === url || pathname.startsWith(`${url}/`);

  return (
    <div className="min-h-screen bg-background bg-page">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <Link to="/" className="px-2" aria-label="Amanda Nutri — início">
          <Marca />
        </Link>

        <nav className="mt-10 flex flex-1 flex-col gap-1" aria-label="Menu principal">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Menu
          </p>
          {itens.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              aria-current={ativo(item.url) ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                ativo(item.url)
                  ? "bg-primary-soft text-primary-soft-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              {ativo(item.url) ? (
                <span className="absolute inset-y-2 -left-4 w-1 rounded-r-full bg-primary" />
              ) : null}
              <item.icone className="size-[18px] shrink-0" />
              <span className="truncate">{item.titulo}</span>
            </Link>
          ))}
        </nav>

        <div className="rounded-2xl border border-sidebar-border bg-card p-3 shadow-soft">
          <div className="flex items-center gap-3">
            <Avatar nome={nome} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{nome}</p>
              <p className="text-xs text-muted-foreground">{ROTULO_PAPEL[papel]}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={sair}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/85 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/" aria-label="Amanda Nutri — início">
            <Marca />
          </Link>
          <div className="flex items-center gap-1">
            <Avatar nome={nome} className="size-9 text-sm" />
            <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl animate-rise px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-10">
          {children}
        </main>
      </div>

      <nav
        aria-label="Menu principal"
        className="fixed inset-x-3 bottom-3 z-30 flex rounded-2xl border border-border bg-card/95 p-1.5 shadow-lift backdrop-blur md:hidden"
      >
        {itens.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            aria-current={ativo(item.url) ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors",
              ativo(item.url)
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-muted-foreground",
            )}
          >
            <item.icone className="size-5" />
            <span className="truncate px-1">{item.titulo}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function TituloPagina({
  titulo,
  descricao,
  acao,
  sobretitulo,
}: {
  titulo: string;
  descricao?: string | undefined;
  acao?: ReactNode;
  sobretitulo?: string | undefined;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {sobretitulo ? (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {sobretitulo}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          {titulo}
        </h1>
        {descricao ? (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{descricao}</p>
        ) : null}
      </div>
      {acao}
    </header>
  );
}

export function EstadoVazio({
  titulo,
  texto,
  icone: Icone = Leaf,
  acao,
}: {
  titulo: string;
  texto: string;
  icone?: typeof Leaf;
  acao?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
        <Icone className="size-6" />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-foreground">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{texto}</p>
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}

export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
      <span className="sr-only">{texto}</span>
    </div>
  );
}

export function CartaoNumero({
  titulo,
  valor,
  icone: Icone,
  detalhe,
}: {
  titulo: string;
  valor: ReactNode;
  icone: typeof Home;
  detalhe?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{titulo}</p>
        <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">
          <Icone className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold text-foreground">{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}
