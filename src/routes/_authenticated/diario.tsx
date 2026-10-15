import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, MessageCircleHeart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePerfilAtual } from "@/lib/auth";
import { hojeISO } from "@/lib/nutricao";
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
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfilAtual();
  const [salvando, setSalvando] = useState(false);

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const refeicao = String(dados.get("refeicao") ?? "").trim();
    const descricao = String(dados.get("descricao") ?? "").trim();
    const userId = perfil?.user.id;
    if (!refeicao || !descricao || !userId) return;
    setSalvando(true);
    const { error } = await supabase.from("diario_alimentar").insert({
      paciente_id: userId,
      data: hojeISO(),
      refeicao,
      descricao,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível registrar. Tente novamente.");
      return;
    }
    form.reset();
    toast.success("Refeição registrada.");
    await queryClient.invalidateQueries({ queryKey: ["diario"] });
  }

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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Registrar refeição</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={registrar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="di-refeicao">Refeição</Label>
              <Input id="di-refeicao" name="refeicao" required placeholder="Ex.: Almoço" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="di-desc">O que você comeu?</Label>
              <Textarea
                id="di-desc"
                name="descricao"
                required
                rows={3}
                placeholder="Alimentos, quantidades e como se sentiu"
              />
            </div>
            <Button type="submit" disabled={salvando}>
              Registrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <Carregando />
      ) : (data ?? []).length === 0 ? (
        <EstadoVazio
          icone={BookOpen}
          titulo="Seu diário está vazio"
          texto="Registre sua primeira refeição acima e a Amanda comenta por aqui."
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
