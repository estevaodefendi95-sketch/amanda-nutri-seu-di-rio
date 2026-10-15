import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Salad } from "lucide-react";

import { Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { usePerfilAtual } from "@/lib/auth";
import { fmt, somarTotais, totaisDoItem, type Alimento } from "@/lib/nutricao";

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
  const { data: perfilAtual } = usePerfilAtual();
  const veCalorias = perfilAtual?.perfil?.paciente_ve_calorias === true;
  const { data, isLoading } = useQuery({
    queryKey: ["minha-dieta"],
    queryFn: async () => {
      const { data: dieta, error } = await supabase
        .from("dietas")
        .select("id, titulo, descricao")
        .eq("status", "publicada")
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

      const lista = refeicoes ?? [];
      const { data: itens, error: itensError } =
        lista.length === 0
          ? { data: [], error: null }
          : await supabase
              .from("itens_refeicao")
              .select("*, alimentos(*)")
              .in(
                "refeicao_id",
                lista.map((r) => r.id),
              )
              .order("ordem");
      if (itensError) throw itensError;

      return {
        dieta,
        refeicoes: lista,
        itens: (itens ?? []) as (Database["public"]["Tables"]["itens_refeicao"]["Row"] & {
          alimentos: Alimento | null;
        })[],
      };
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
              {data.refeicoes.map((refeicao) => {
                const itensDaRefeicao = data.itens.filter((i) => i.refeicao_id === refeicao.id);
                const totais = somarTotais(
                  itensDaRefeicao.map((i) => totaisDoItem(i, i.alimentos)),
                );
                return (
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
                        {itensDaRefeicao.length > 0 ? (
                          <ul className="space-y-2">
                            {itensDaRefeicao.map((item) => (
                              <li key={item.id} className="rounded-xl bg-secondary/60 p-3">
                                <p className="font-semibold text-foreground">
                                  {item.alimentos?.nome ?? item.descricao}
                                </p>
                                <p className="text-muted-foreground">
                                  {[
                                    item.medida_caseira,
                                    item.quantidade_g != null
                                      ? `${fmt(Number(item.quantidade_g))} g`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                                {item.substituicoes ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Pode trocar por: {item.substituicoes}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="whitespace-pre-line text-foreground">
                            {refeicao.alimentos}
                          </p>
                        )}
                        {veCalorias && totais.kcal > 0 ? (
                          <p className="text-xs font-semibold text-muted-foreground">
                            {fmt(totais.kcal)} kcal · P {fmt(totais.proteina)} g · C{" "}
                            {fmt(totais.carbo)} g · G {fmt(totais.gordura)} g
                          </p>
                        ) : null}
                        {refeicao.observacoes ? (
                          <p className="rounded-xl bg-accent/50 p-3 text-accent-foreground">
                            {refeicao.observacoes}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </>
  );
}
