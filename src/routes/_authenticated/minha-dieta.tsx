import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoVazio, TituloPagina } from "@/components/app-shell";
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
      <TituloPagina titulo="Minha Dieta" descricao="Seu plano alimentar atual, refeição por refeição." />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !data ? (
        <EstadoVazio
          titulo="Nenhuma dieta publicada"
          texto="Seu plano alimentar aparecerá aqui logo após a consulta com a Amanda."
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">{data.dieta.titulo}</CardTitle>
            </CardHeader>
            {data.dieta.descricao ? (
              <CardContent className="text-sm text-muted-foreground">
                {data.dieta.descricao}
              </CardContent>
            ) : null}
          </Card>

          {data.refeicoes.length === 0 ? (
            <EstadoVazio
              titulo="Refeições em preparação"
              texto="As refeições deste plano serão adicionadas em breve."
            />
          ) : (
            data.refeicoes.map((refeicao) => (
              <Card key={refeicao.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-baseline gap-2 font-display text-base">
                    <span>{refeicao.nome}</span>
                    {refeicao.horario ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        {String(refeicao.horario).slice(0, 5)}
                      </span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="whitespace-pre-line text-foreground">{refeicao.alimentos}</p>
                  {refeicao.observacoes ? (
                    <p className="text-muted-foreground">{refeicao.observacoes}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </>
  );
}
