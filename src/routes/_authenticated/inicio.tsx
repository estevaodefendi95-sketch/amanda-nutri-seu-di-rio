import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, LineChart, Salad } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoVazio, TituloPagina } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { usePerfilAtual } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início | Amanda Nutri – Área do Paciente" },
      {
        name: "description",
        content: "Sua dieta ativa em resumo, atalhos para o diário alimentar e para sua evolução.",
      },
      { property: "og:title", content: "Início | Amanda Nutri – Área do Paciente" },
      { property: "og:description", content: "Resumo da sua dieta ativa e atalhos do dia." },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { data: perfil } = usePerfilAtual();
  const primeiroNome = (perfil?.perfil?.nome || "").split(" ")[0];

  const { data: dieta } = useQuery({
    queryKey: ["dieta-ativa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dietas")
        .select("id, titulo, descricao, data_inicio, data_fim")
        .eq("ativa", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <TituloPagina
        titulo={primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!"}
        descricao="Que bom ter você por aqui. Vamos cuidar de você com carinho."
      />

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Salad className="size-5 shrink-0 text-primary" />
          <CardTitle className="font-display text-lg">Minha dieta ativa</CardTitle>
        </CardHeader>
        <CardContent>
          {dieta ? (
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{dieta.titulo}</p>
              {dieta.descricao ? (
                <p className="text-sm text-muted-foreground">{dieta.descricao}</p>
              ) : null}
              <Button asChild variant="secondary" size="sm">
                <Link to="/minha-dieta">Ver plano completo</Link>
              </Button>
            </div>
          ) : (
            <EstadoVazio
              titulo="Sua dieta está sendo preparada"
              texto="Assim que a Amanda publicar seu plano alimentar, ele aparecerá aqui."
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Atalho
          para="/diario"
          titulo="Registrar refeição"
          texto="Envie uma foto e conte o que você comeu."
          icone={BookOpen}
        />
        <Atalho
          para="/minha-evolucao"
          titulo="Minha evolução"
          texto="Acompanhe medidas, peso e fotos."
          icone={LineChart}
        />
      </div>
    </>
  );
}

function Atalho({
  para,
  titulo,
  texto,
  icone: Icone,
}: {
  para: "/diario" | "/minha-evolucao";
  titulo: string;
  texto: string;
  icone: typeof BookOpen;
}) {
  return (
    <Link
      to={para}
      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary"
    >
      <Icone className="mt-0.5 size-5 shrink-0 text-primary" />
      <span className="min-w-0">
        <span className="block font-semibold text-foreground">{titulo}</span>
        <span className="block text-sm text-muted-foreground">{texto}</span>
      </span>
    </Link>
  );
}
