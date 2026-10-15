import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";

import { Carregando, EstadoVazio } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatarData } from "@/lib/nutricao";

export function AbaDiario({ pacienteId }: { pacienteId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["diario-paciente", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diario_alimentar")
        .select("id, data, refeicao, descricao, comentario_nutricionista, revisado_em")
        .eq("paciente_id", pacienteId)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Carregando />;
  if (!data || data.length === 0) {
    return (
      <EstadoVazio
        icone={BookOpen}
        titulo="Sem registros no diário"
        texto="Quando o paciente registrar as refeições, elas aparecem aqui para você comentar."
      />
    );
  }

  const pendentes = data.filter((r) => !r.revisado_em).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {pendentes > 0
          ? `${pendentes} ${pendentes === 1 ? "registro aguarda" : "registros aguardam"} seu comentário.`
          : "Todos os registros já foram revisados."}
      </p>
      {data.map((registro) => (
        <RegistroDiario key={registro.id} registro={registro} pacienteId={pacienteId} />
      ))}
    </div>
  );
}

type Registro = {
  id: string;
  data: string;
  refeicao: string;
  descricao: string | null;
  comentario_nutricionista: string | null;
  revisado_em: string | null;
};

function RegistroDiario({ registro, pacienteId }: { registro: Registro; pacienteId: string }) {
  const queryClient = useQueryClient();
  const [comentario, setComentario] = useState(registro.comentario_nutricionista ?? "");
  const [salvando, setSalvando] = useState(false);
  const mudou = comentario.trim() !== (registro.comentario_nutricionista ?? "");

  async function salvar(marcarRevisado: boolean) {
    setSalvando(true);
    const { error } = await supabase
      .from("diario_alimentar")
      .update({
        comentario_nutricionista: comentario.trim() || null,
        revisado_em: marcarRevisado || comentario.trim() ? new Date().toISOString() : null,
      })
      .eq("id", registro.id);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar o comentário.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["diario-paciente", pacienteId] });
    await queryClient.invalidateQueries({ queryKey: ["painel-resumo"] });
    toast.success(comentario.trim() ? "Comentário enviado." : "Registro marcado como revisado.");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-base">{registro.refeicao}</CardTitle>
        <div className="flex items-center gap-2">
          {registro.revisado_em ? (
            <CheckCircle2 className="size-4 text-primary" aria-label="Revisado" />
          ) : null}
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
            {formatarData(registro.data)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {registro.descricao ? <p className="text-foreground">{registro.descricao}</p> : null}
        <Textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={2}
          placeholder="Escreva um retorno acolhedor para este registro..."
          aria-label="Comentário da nutricionista"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={salvando || !mudou} onClick={() => salvar(false)}>
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
            Enviar comentário
          </Button>
          {!registro.revisado_em && !mudou ? (
            <Button size="sm" variant="secondary" disabled={salvando} onClick={() => salvar(true)}>
              Marcar como revisado
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
