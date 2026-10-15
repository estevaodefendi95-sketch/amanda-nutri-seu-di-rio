import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Salad } from "lucide-react";

import { Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/minha-dieta")({
  head: () => ({
    meta: [
      { title: "Minha Dieta | Amanda Nutri" },
      {
        name: "description",
        content: "Seu plano alimentar com refeições, horários e orientações da nutricionista.",
      },
      { property: "og:title", content: "Minha Dieta | Amanda Nutri" },
      { property: "og:description", content: "Plano alimentar com refeições e horários." },
    ],
  }),
  component: MinhaDieta,
});

function MinhaDieta() {
  const { data, isLoading } = useQuery({
    queryKey: ["minha-dieta"],
    queryFn: async () => {
      const { data: dieta, error } = await supabase
        .from("dietas")
        .select("id, titulo, descricao")
        .eq("ativa", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!dieta) return null;

      const { data: refeicoes, error: refeicoesError } = await supabase
        .from("refeicoes_dieta")
        .select("id, nome, horario, alimentos, observacoes")
        .eq("dieta_id", dieta.id)
        .order("ordem");
      if (refeicoesError) throw refeicoesError;

      return { dieta, refeicoes: refeicoes ?? [] };
    },
  });

  return (
    <>
      <TituloPagina
        sobretitulo="Plano alimentar"
        titulo="Minha Dieta"
        descricao="Seu plano atual, refeição por refeição."
      />

      {isLoading ? (
        <Carregando />
      ) : !data ? (
        <EstadoVazio
          icone={Salad}
          titulo="Nenhuma dieta publicada"
          texto="Seu plano alimentar aparecerá aqui logo após a consulta com a Amanda."
        />
      ) : (
        <div className="space-y-6">
          <Card className="bg-primary-soft/60">
            <CardHeader>
              <CardTitle>{data.dieta.titulo}</CardTitle>
            </CardHeader>
            {data.dieta.descricao ? (
              <CardContent className="text-sm text-foreground/75">
                {data.dieta.descricao}
              </CardContent>
            ) : null}
          </Card>

          {data.refeicoes.length === 0 ? (
            <EstadoVazio
              icone={Salad}
              titulo="Refeições em preparação"
              texto="As refeições deste plano serão adicionadas em breve."
            />
          ) : (
            <ol className="relative space-y-4 border-l-2 border-primary-soft pl-6 sm:pl-8">
              {data.refeicoes.map((refeicao) => (
                <li key={refeicao.id} className="relative">
                  <span className="absolute -left-[33px] top-5 size-4 rounded-full border-4 border-background bg-primary sm:-left-[41px]" />
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                        <span>{refeicao.nome}</span>
                        {refeicao.horario ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-sans text-xs font-bold text-secondary-foreground">
                            <Clock className="size-3.5" />
                            {String(refeicao.horario).slice(0, 5)}
                          </span>
                        ) : null}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="whitespace-pre-line text-foreground">{refeicao.alimentos}</p>
                      {refeicao.observacoes ? (
                        <p className="rounded-xl bg-accent/50 p-3 text-accent-foreground">
                          {refeicao.observacoes}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </>
  );
}
