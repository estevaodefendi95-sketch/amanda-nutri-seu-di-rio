import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, LineChart, Salad } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoVazio } from "@/components/app-shell";
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

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Inicio() {
  const { data: perfil } = usePerfilAtual();
  const primeiroNome = (perfil?.perfil?.nome || "").split(" ")[0];

  const { data: dieta } = useQuery({
    queryKey: ["dieta-ativa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dietas")
        .select("id, titulo, descricao, data_inicio, data_fim")
        .eq("status", "publicada")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: refeicoes } = useQuery({
    queryKey: ["dieta-ativa-refeicoes", dieta?.id],
    enabled: Boolean(dieta?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refeicoes_dieta")
        .select("id, nome, horario")
        .eq("dieta_id", dieta!.id)
        .order("ordem")
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <section className="mb-8 overflow-hidden rounded-3xl bg-brand p-6 text-primary-foreground shadow-lift sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{saudacao()}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
          {primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/80 sm:text-base">
          Que bom ter você por aqui. Vamos cuidar de você com carinho.
        </p>
        <Button
          asChild
          variant="secondary"
          className="mt-5 bg-white text-primary hover:bg-white/90"
        >
          <Link to="/diario">
            <BookOpen className="size-4" /> Registrar refeição
          </Link>
        </Button>
      </section>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <Salad className="size-5" />
          </span>
          <CardTitle>Minha dieta ativa</CardTitle>
        </CardHeader>
        <CardContent>
          {dieta ? (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground">{dieta.titulo}</p>
                {dieta.descricao ? (
                  <p className="mt-1 text-sm text-muted-foreground">{dieta.descricao}</p>
                ) : null}
              </div>

              {(refeicoes ?? []).length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {(refeicoes ?? []).map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3 text-sm"
                    >
                      <span className="truncate font-semibold text-secondary-foreground">
                        {r.nome}
                      </span>
                      {r.horario ? (
                        <span className="shrink-0 text-muted-foreground">
                          {String(r.horario).slice(0, 5)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              <Button asChild variant="secondary" size="sm">
                <Link to="/minha-dieta">
                  Ver plano completo <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <EstadoVazio
              icone={Salad}
              titulo="Sua dieta está sendo preparada"
              texto="Assim que a Amanda publicar seu plano alimentar, ele aparecerá aqui."
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Atalho
          para="/diario"
          titulo="Diário alimentar"
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
      className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">
        <Icone className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{titulo}</span>
        <span className="block text-sm text-muted-foreground">{texto}</span>
      </span>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
