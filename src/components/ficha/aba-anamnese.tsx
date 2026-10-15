import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Carregando } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type Campo = { chave: string; rotulo: string; dica: string };

/** Roteiro inicial da anamnese. Será trocado pelo modelo que a Amanda já usa. */
const GRUPOS: { titulo: string; campos: Campo[] }[] = [
  {
    titulo: "Motivo e objetivo",
    campos: [
      {
        chave: "queixa_principal",
        rotulo: "Queixa principal e expectativas",
        dica: "O que trouxe a pessoa até aqui e o que ela espera do acompanhamento.",
      },
    ],
  },
  {
    titulo: "Saúde",
    campos: [
      {
        chave: "historico_clinico",
        rotulo: "Histórico clínico",
        dica: "Condições, cirurgias, histórico familiar relevante.",
      },
      {
        chave: "medicamentos_suplementos",
        rotulo: "Medicamentos e suplementos",
        dica: "O que usa, dose e horário, se souber.",
      },
      {
        chave: "alergias_restricoes",
        rotulo: "Alergias, intolerâncias e restrições",
        dica: "Inclui restrições por escolha ou religião.",
      },
    ],
  },
  {
    titulo: "Rotina e hábitos",
    campos: [
      {
        chave: "rotina",
        rotulo: "Rotina, sono e trabalho",
        dica: "Horários, turnos, quem cozinha, onde faz as refeições.",
      },
      {
        chave: "atividade_fisica",
        rotulo: "Atividade física",
        dica: "Modalidade, frequência e intensidade.",
      },
      {
        chave: "intestino_hidratacao",
        rotulo: "Intestino e hidratação",
        dica: "Frequência, consistência, quanto líquido por dia.",
      },
    ],
  },
  {
    titulo: "Relação com a comida",
    campos: [
      {
        chave: "historico_alimentar",
        rotulo: "Histórico alimentar",
        dica: "Dietas anteriores, como foi a experiência, como se sente com a comida hoje.",
      },
      {
        chave: "preferencias",
        rotulo: "Preferências e aversões",
        dica: "O que gosta, o que não come, o que quer manter.",
      },
      {
        chave: "observacoes",
        rotulo: "Observações da consulta",
        dica: "Qualquer ponto que mereça voltar na próxima consulta.",
      },
    ],
  },
];

function comoTexto(valor: Json | undefined): string {
  return typeof valor === "string" ? valor : "";
}

export function AbaAnamnese({ pacienteId }: { pacienteId: string }) {
  const queryClient = useQueryClient();
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["anamnese", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anamneses")
        .select("respostas, atualizada_em")
        .eq("paciente_id", pacienteId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const respostas: { [chave: string]: string } = {};
    for (const grupo of GRUPOS) {
      for (const campo of grupo.campos) {
        const valor = String(f.get(campo.chave) ?? "").trim();
        if (valor) respostas[campo.chave] = valor;
      }
    }
    setSalvando(true);
    const { error } = await supabase.from("anamneses").upsert(
      {
        paciente_id: pacienteId,
        respostas,
        atualizada_em: new Date().toISOString(),
      },
      { onConflict: "paciente_id" },
    );
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar a anamnese.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["anamnese", pacienteId] });
    toast.success("Anamnese salva.");
  }

  if (isLoading) return <Carregando />;

  const respostas = (data?.respostas ?? {}) as { [chave: string]: Json | undefined };

  return (
    <form onSubmit={salvar} className="space-y-6" key={data?.atualizada_em ?? "novo"}>
      {GRUPOS.map((grupo) => (
        <Card key={grupo.titulo}>
          <CardHeader>
            <CardTitle>{grupo.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {grupo.campos.map((campo) => (
              <div key={campo.chave} className="space-y-2">
                <Label htmlFor={`an-${campo.chave}`}>{campo.rotulo}</Label>
                <Textarea
                  id={`an-${campo.chave}`}
                  name={campo.chave}
                  rows={3}
                  placeholder={campo.dica}
                  defaultValue={comoTexto(respostas[campo.chave])}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={salvando}>
          {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar anamnese
        </Button>
        {data?.atualizada_em ? (
          <p className="text-xs text-muted-foreground">
            Última atualização em {new Date(data.atualizada_em).toLocaleDateString("pt-BR")}
          </p>
        ) : null}
      </div>
    </form>
  );
}
