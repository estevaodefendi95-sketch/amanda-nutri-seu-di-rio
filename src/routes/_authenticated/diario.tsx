import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, MessageCircleHeart } from "lucide-react";

import { Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
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
        sobretitulo="Diário"
        titulo="Diário Alimentar"
        descricao="Aqui ficam suas refeições registradas e os retornos da Amanda."
      />

      {isLoading ? (
        <Carregando />
      ) : (data ?? []).length === 0 ? (
        <EstadoVazio
          icone={BookOpen}
          titulo="Seu diário está vazio"
          texto="Em breve você poderá enviar fotos e descrições das suas refeições por aqui."
        />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((registro) => (
            <Card key={registro.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <CardTitle className="text-base">{registro.refeicao}</CardTitle>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  {formatarData(registro.data)}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {registro.descricao ? (
                  <p className="text-foreground">{registro.descricao}</p>
                ) : null}
                {registro.comentario_nutricionista ? (
                  <p className="flex gap-3 rounded-xl bg-primary-soft p-3.5 text-primary-soft-foreground">
                    <MessageCircleHeart className="mt-0.5 size-4 shrink-0" />
                    <span>
                      <strong className="font-semibold">Amanda: </strong>
                      {registro.comentario_nutricionista}
                    </span>
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
