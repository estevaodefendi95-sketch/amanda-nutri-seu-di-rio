import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TituloPagina } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel da nutricionista | Amanda Nutri" },
      {
        name: "description",
        content: "Resumo do acompanhamento: total de pacientes e diários alimentares enviados hoje.",
      },
      { property: "og:title", content: "Painel da nutricionista | Amanda Nutri" },
      { property: "og:description", content: "Resumo de pacientes e diários do dia." },
    ],
  }),
  component: Painel,
});

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function Painel() {
  const { data, isLoading } = useQuery({
    queryKey: ["painel-resumo"],
    queryFn: async () => {
      const [pacientes, diarios] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "paciente"),
        supabase
          .from("diario_alimentar")
          .select("id", { count: "exact", head: true })
          .eq("data", hojeISO()),
      ]);
      return {
        totalPacientes: pacientes.count ?? 0,
        diariosHoje: diarios.count ?? 0,
      };
    },
  });

  const cards = [
    { titulo: "Pacientes ativos", valor: data?.totalPacientes, icone: Users },
    { titulo: "Diários enviados hoje", valor: data?.diariosHoje, icone: BookOpen },
  ];

  return (
    <>
      <TituloPagina
        titulo="Painel"
        descricao="Visão geral do seu acompanhamento nutricional."
        acao={
          <Button asChild>
            <Link to="/pacientes/novo">
              <UserPlus className="size-4" /> Novo paciente
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.titulo}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {card.titulo}
              </CardTitle>
              <card.icone className="size-5 shrink-0 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl text-foreground">
                {isLoading ? "—" : card.valor}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-lg">Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Cadastre seus pacientes e envie o convite de acesso por e-mail.</p>
          <p>• Em seguida habilitaremos a montagem de dietas, as fotos do diário e os gráficos de evolução.</p>
        </CardContent>
      </Card>
    </>
  );
}
