import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoVazio, TituloPagina } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/diario")({
  head: () => ({
    meta: [
      { title: "Diário Alimentar | Amanda Nutri" },
      {
        name: "description",
        content: "Registre suas refeições do dia e receba os comentários da nutricionista.",
      },
      { property: "og:title", content: "Diário Alimentar | Amanda Nutri" },
      { property: "og:description", content: "Registros das suas refeições e comentários." },
    ],
  }),
  component: Diario,
});

function Diario() {
  const { data, isLoading } = useQuery({
    queryKey: ["diario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diario_alimentar")
        .select("id, data, refeicao, descricao, comentario_nutricionista")
        .order("data", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <TituloPagina
        titulo="Diário Alimentar"
        descricao="Aqui ficam suas refeições registradas e os retornos da Amanda."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (data ?? []).length === 0 ? (
        <EstadoVazio
          titulo="Seu diário está vazio"
          texto="Em breve você poderá enviar fotos e descrições das suas refeições por aqui."
        />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((registro) => (
            <Card key={registro.id}>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base">
                  {registro.refeicao} · {formatarData(registro.data)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {registro.descricao ? (
                  <p className="text-foreground">{registro.descricao}</p>
                ) : null}
                {registro.comentario_nutricionista ? (
                  <p className="rounded-xl bg-secondary p-3 text-secondary-foreground">
                    <strong>Amanda: </strong>
                    {registro.comentario_nutricionista}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function formatarData(valor: string) {
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}
