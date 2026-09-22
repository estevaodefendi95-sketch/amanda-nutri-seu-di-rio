import { Link, useRouterState } from "@tanstack/react-router";
import {
  Apple,
  BookOpen,
  Home,
  LayoutDashboard,
  LineChart,
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

export function AppShell({ children }: { children: ReactNode }) {
  const { data } = usePerfilAtual();
  const sair = useSair();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const papel: Papel = data?.papel ?? "paciente";
  const itens = MENU[papel];
  const nome = data?.perfil?.nome || data?.user.email || "";

  const ativo = (url: string) => pathname === url || pathname.startsWith(`${url}/`);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Apple className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg leading-tight text-sidebar-foreground">
              Amanda Nutri
            </span>
            <span className="block text-xs text-muted-foreground">Área do Paciente</span>
          </span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {itens.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                ativo(item.url)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icone className="size-4 shrink-0" />
              <span className="truncate">{item.titulo}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-4 border-t border-sidebar-border pt-4">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{nome}</p>
          <p className="text-xs capitalize text-muted-foreground">{papel}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={sair}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Apple className="size-4" />
            </span>
            <span className="truncate font-display text-base">Amanda Nutri</span>
          </div>
          <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
            <LogOut className="size-4" />
          </Button>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card md:hidden">
        {itens.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
              ativo(item.url) ? "text-primary" : "text-muted-foreground",
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
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">{titulo}</h1>
        {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {acao}
    </header>
  );
}

export function EstadoVazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
      <p className="font-display text-lg text-foreground">{titulo}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{texto}</p>
    </div>
  );
}
