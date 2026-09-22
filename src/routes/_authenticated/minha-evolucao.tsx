import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoVazio, TituloPagina } from "@/components/app-shell";
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

  return (
    <>
      <TituloPagina
        titulo="Minha Evolução"
        descricao="Seus resultados registrados em cada avaliação."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (data ?? []).length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma avaliação ainda"
          texto="Depois da sua primeira avaliação física, os números e as fotos comparativas aparecem aqui."
        />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((avaliacao) => (
            <Card key={avaliacao.id}>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base">
                  Avaliação de {formatarData(avaliacao.data)}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Medida rotulo="Peso" valor={avaliacao.peso} unidade="kg" />
                <Medida rotulo="Altura" valor={avaliacao.altura} unidade="cm" />
                <Medida rotulo="Gordura" valor={avaliacao.percentual_gordura} unidade="%" />
                <Medida rotulo="Massa magra" valor={avaliacao.massa_magra} unidade="kg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Medida({
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
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="font-semibold text-foreground">{valor != null ? `${valor} ${unidade}` : "—"}</p>
    </div>
  );
}

function formatarData(valor: string) {
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}
