import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, Plus, Target, Trash2 } from "lucide-react";

import { EstadoVazio } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, paraNumero } from "@/lib/nutricao";

export function AbaMetas({ pacienteId }: { pacienteId: string }) {
  const queryClient = useQueryClient();
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["metas-paciente", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function atualizar() {
    await queryClient.invalidateQueries({ queryKey: ["metas-paciente", pacienteId] });
  }

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const descricao = String(dados.get("descricao") ?? "").trim();
    if (!descricao) return;
    const alvo = paraNumero(String(dados.get("valor_alvo") ?? ""));
    const unidade = String(dados.get("unidade") ?? "").trim();
    const prazo = String(dados.get("prazo") ?? "");
    setSalvando(true);
    const { error } = await supabase.from("metas").insert({
      paciente_id: pacienteId,
      descricao,
      ...(alvo != null ? { valor_alvo: alvo } : {}),
      ...(unidade ? { unidade } : {}),
      ...(prazo ? { prazo } : {}),
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar a meta.");
      return;
    }
    form.reset();
    await atualizar();
  }

  async function mudar(id: string, status: string) {
    const { error } = await supabase.from("metas").update({ status }).eq("id", id);
    if (error) toast.error("Não foi possível atualizar.");
    else await atualizar();
  }

  async function remover(id: string) {
    const { error } = await supabase.from("metas").delete().eq("id", id);
    if (error) toast.error("Não foi possível remover.");
    else await atualizar();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-5">
          <form
            onSubmit={criar}
            className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="meta-desc">Nova meta</Label>
              <Input id="meta-desc" name="descricao" required placeholder="Ex.: Beber mais água" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-valor">Valor</Label>
              <Input id="meta-valor" name="valor_alvo" inputMode="decimal" placeholder="2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-un">Unidade</Label>
              <Input id="meta-un" name="unidade" placeholder="L por dia" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-prazo">Prazo</Label>
              <Input id="meta-prazo" name="prazo" type="date" />
            </div>
            <Button type="submit" disabled={salvando}>
              <Plus className="size-4" /> Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? null : (data ?? []).length === 0 ? (
        <EstadoVazio
          icone={Target}
          titulo="Sem metas"
          texto="Defina metas de hábito, água, treino ou peso. O paciente vê todas na tela inicial."
        />
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((m) => (
            <li key={m.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-semibold ${m.status === "em_andamento" ? "text-foreground" : "text-muted-foreground line-through"}`}
                    >
                      {m.descricao}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        m.valor_alvo != null
                          ? `${m.valor_alvo} ${m.unidade ?? ""}`.trim()
                          : m.unidade,
                        m.prazo ? `até ${formatarData(m.prazo)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void mudar(m.id, m.status === "concluida" ? "em_andamento" : "concluida")
                    }
                  >
                    <Check className="size-4" /> {m.status === "concluida" ? "Reabrir" : "Concluir"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover meta"
                    onClick={() => void remover(m.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
