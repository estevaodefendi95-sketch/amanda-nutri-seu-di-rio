import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Salad } from "lucide-react";

import { EstadoVazio } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fmt, formatarData } from "@/lib/nutricao";

const STATUS: Record<string, { rotulo: string; classe: string }> = {
  rascunho: { rotulo: "Rascunho", classe: "bg-accent text-accent-foreground" },
  publicada: { rotulo: "Publicada", classe: "bg-primary-soft text-primary-soft-foreground" },
  encerrada: { rotulo: "Encerrada", classe: "bg-muted text-muted-foreground" },
};

export function AbaPlano({ pacienteId }: { pacienteId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [criando, setCriando] = useState(false);

  const { data: dietas, isLoading } = useQuery({
    queryKey: ["dietas-paciente", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dietas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function novoPlano() {
    setCriando(true);
    const { data, error } = await supabase
      .from("dietas")
      .insert({
        paciente_id: pacienteId,
        titulo: "Novo plano alimentar",
        status: "rascunho",
        ativa: false,
      })
      .select("id")
      .single();
    setCriando(false);
    if (error || !data) {
      toast.error("Não foi possível criar o plano.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["dietas-paciente", pacienteId] });
    navigate({ to: "/pacientes/$id/plano/$dietaId", params: { id: pacienteId, dietaId: data.id } });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={novoPlano} disabled={criando}>
          {criando ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Novo
          plano
        </Button>
      </div>

      {isLoading ? null : !dietas || dietas.length === 0 ? (
        <EstadoVazio
          icone={Salad}
          titulo="Nenhum plano alimentar"
          texto="Crie um plano, monte as refeições com os alimentos e publique quando estiver pronto."
        />
      ) : (
        <ul className="space-y-3">
          {dietas.map((d) => {
            const s = STATUS[d.status] ?? STATUS["rascunho"]!;
            return (
              <li key={d.id}>
                <Link to="/pacientes/$id/plano/$dietaId" params={{ id: pacienteId, dietaId: d.id }}>
                  <Card className="transition-colors hover:bg-secondary/60">
                    <CardContent className="flex flex-wrap items-center gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg font-semibold text-foreground">
                          {d.titulo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Criado em {formatarData(d.created_at)}
                          {d.meta_kcal != null ? ` · meta ${fmt(Number(d.meta_kcal))} kcal` : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${s.classe}`}
                      >
                        {s.rotulo}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
