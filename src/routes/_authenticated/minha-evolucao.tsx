import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

import { Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/minha-evolucao")({
  head: () => ({
    meta: [
      { title: "Minha Evolução | Amanda Nutri" },
      {
        name: "description",
        content: "Acompanhe peso, medidas e fotos comparativas ao longo do seu acompanhamento.",
      },
      { property: "og:title", content: "Minha Evolução | Amanda Nutri" },
      { property: "og:description", content: "Peso, medidas e fotos de evolução." },
    ],
  }),
  component: MinhaEvolucao,
});

function MinhaEvolucao() {
  const { data, isLoading } = useQuery({
    queryKey: ["minhas-avaliacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id, data, peso, altura, percentual_gordura, massa_magra, observacoes")
        .order("data", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const ultima = (data ?? [])[0];
  const primeira = (data ?? [])[(data ?? []).length - 1];
  const variacaoPeso =
    ultima && primeira && ultima.id !== primeira.id && ultima.peso != null && primeira.peso != null
      ? Number(ultima.peso) - Number(primeira.peso)
      : null;

  return (
    <>
      <TituloPagina
        sobretitulo="Resultados"
        titulo="Minha Evolução"
        descricao="Seus resultados registrados em cada avaliação."
      />

      {isLoading ? (
        <Carregando />
      ) : !ultima ? (
        <EstadoVazio
          icone={LineChart}
          titulo="Nenhuma avaliação ainda"
          texto="Depois da sua primeira avaliação física, os números e as fotos comparativas aparecem aqui."
        />
      ) : (
        <div className="space-y-6">
          <section aria-label="Última avaliação">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Última avaliação · {formatarData(ultima.data)}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Medida rotulo="Peso" valor={ultima.peso} unidade="kg" destaque />
              <Medida rotulo="Altura" valor={ultima.altura} unidade="cm" />
              <Medida rotulo="Gordura" valor={ultima.percentual_gordura} unidade="%" />
              <Medida rotulo="Massa magra" valor={ultima.massa_magra} unidade="kg" />
            </div>
            {variacaoPeso != null ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Variação de peso desde a primeira avaliação:{" "}
                <strong className="text-foreground">
                  {variacaoPeso > 0 ? "+" : ""}
                  {variacaoPeso.toFixed(1).replace(".", ",")} kg
                </strong>
              </p>
            ) : null}
          </section>

          <section aria-label="Histórico">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Histórico
            </p>
            <div className="space-y-3">
              {(data ?? []).map((avaliacao) => (
                <Card key={avaliacao.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Avaliação de {formatarData(avaliacao.data)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Linha rotulo="Peso" valor={avaliacao.peso} unidade="kg" />
                    <Linha rotulo="Altura" valor={avaliacao.altura} unidade="cm" />
                    <Linha rotulo="Gordura" valor={avaliacao.percentual_gordura} unidade="%" />
                    <Linha rotulo="Massa magra" valor={avaliacao.massa_magra} unidade="kg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function formatarValor(valor: number | null, unidade: string) {
  return valor != null ? `${String(valor).replace(".", ",")} ${unidade}` : "—";
}

function Medida({
  rotulo,
  valor,
  unidade,
  destaque,
}: {
  rotulo: string;
  valor: number | null;
  unidade: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border p-4 shadow-soft ${
        destaque
          ? "border-transparent bg-brand text-primary-foreground"
          : "border-border/70 bg-card"
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.12em] ${
          destaque ? "text-white/70" : "text-muted-foreground"
        }`}
      >
        {rotulo}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold">{formatarValor(valor, unidade)}</p>
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  unidade,
}: {
  rotulo: string;
  valor: number | null;
  unidade: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {rotulo}
      </p>
      <p className="font-semibold text-foreground">{formatarValor(valor, unidade)}</p>
    </div>
  );
}

function formatarData(valor: string) {
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}
