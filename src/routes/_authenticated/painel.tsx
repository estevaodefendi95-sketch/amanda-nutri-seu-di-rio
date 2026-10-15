import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Avatar,
  CartaoNumero,
  Carregando,
  EstadoVazio,
  TituloPagina,
} from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel da nutricionista | Amanda Nutri" },
      {
        name: "description",
        content:
          "Resumo do acompanhamento: total de pacientes e diários alimentares enviados hoje.",
      },
      { property: "og:title", content: "Painel da nutricionista | Amanda Nutri" },
      { property: "og:description", content: "Resumo de pacientes e diários do dia." },
    ],
  }),
  component: Painel,
});

function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function Painel() {
  const { data, isLoading } = useQuery({
    queryKey: ["painel-resumo"],
    queryFn: async () => {
      const [pacientes, diarios, recentes] = await Promise.all([
        supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "paciente"),
        supabase
          .from("diario_alimentar")
          .select("id", { count: "exact", head: true })
          .eq("data", hojeISO()),
        supabase
          .from("profiles")
          .select("id, nome, objetivo, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      return {
        totalPacientes: pacientes.count ?? 0,
        diariosHoje: diarios.count ?? 0,
        recentes: recentes.data ?? [],
      };
    },
  });

  const hoje = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <>
      <TituloPagina
        sobretitulo={hoje}
        titulo="Painel"
        descricao="Visão geral do seu acompanhamento nutricional."
        acao={
          <Button asChild size="lg">
            <Link to="/pacientes/novo">
              <UserPlus className="size-4" /> Novo paciente
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CartaoNumero
          titulo="Pacientes ativos"
          valor={isLoading ? "—" : data?.totalPacientes}
          icone={Users}
          detalhe="Pessoas em acompanhamento"
        />
        <CartaoNumero
          titulo="Diários enviados hoje"
          valor={isLoading ? "—" : data?.diariosHoje}
          icone={BookOpen}
          detalhe="Refeições registradas hoje"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Pacientes recentes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/pacientes">
                Ver todos <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Carregando />
            ) : (data?.recentes ?? []).length === 0 ? (
              <EstadoVazio
                titulo="Nenhum paciente ainda"
                texto="Cadastre o primeiro paciente e envie o convite de acesso por e-mail."
                icone={Users}
              />
            ) : (
              <ul className="divide-y divide-border">
                {(data?.recentes ?? []).map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/pacientes/$id"
                      params={{ id: p.id }}
                      className="flex items-center gap-3 rounded-xl py-3 transition-colors hover:bg-secondary/60 sm:px-2"
                    >
                      <Avatar nome={p.nome} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-foreground">
                          {p.nome || "Sem nome"}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {p.objetivo || "Objetivo não definido"}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary-soft/60">
          <CardHeader>
            <CardTitle>Próximos passos</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4 text-sm">
              {[
                "Cadastre seus pacientes e envie o convite de acesso por e-mail.",
                "Monte o plano alimentar com refeições e horários.",
                "Acompanhe fotos do diário, medidas e gráficos de evolução.",
              ].map((passo, i) => (
                <li key={passo} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground/80">{passo}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
