import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { FlaskConical, Plus, Trash2 } from "lucide-react";

import { EstadoVazio } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, hojeISO } from "@/lib/nutricao";

export function AbaExames({ pacienteId }: { pacienteId: string }) {
  const queryClient = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const [liberado, setLiberado] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["exames-paciente", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exames")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("data", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function atualizar() {
    await queryClient.invalidateQueries({ queryKey: ["exames-paciente", pacienteId] });
  }

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const nome = String(dados.get("nome") ?? "").trim();
    if (!nome) return;
    const valor = String(dados.get("valor") ?? "").trim();
    const unidade = String(dados.get("unidade") ?? "").trim();
    setSalvando(true);
    const { error } = await supabase.from("exames").insert({
      paciente_id: pacienteId,
      nome,
      data: String(dados.get("data") ?? "") || hojeISO(),
      liberado,
      ...(valor ? { valor } : {}),
      ...(unidade ? { unidade } : {}),
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar o exame.");
      return;
    }
    form.reset();
    setLiberado(false);
    await atualizar();
  }

  async function alternarLiberado(id: string, valor: boolean) {
    const { error } = await supabase.from("exames").update({ liberado: valor }).eq("id", id);
    if (error) toast.error("Não foi possível atualizar.");
    else await atualizar();
  }

  async function remover(id: string) {
    const { error } = await supabase.from("exames").delete().eq("id", id);
    if (error) toast.error("Não foi possível remover.");
    else await atualizar();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-5">
          <form onSubmit={criar} className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="ex-nome">Exame</Label>
              <Input id="ex-nome" name="nome" required placeholder="Ex.: Glicemia de jejum" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-valor">Resultado</Label>
              <Input id="ex-valor" name="valor" placeholder="92" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-un">Unidade</Label>
              <Input id="ex-un" name="unidade" placeholder="mg/dL" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-data">Data</Label>
              <Input id="ex-data" name="data" type="date" defaultValue={hojeISO()} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-3">
              <Checkbox checked={liberado} onCheckedChange={(v) => setLiberado(v === true)} />
              Liberar para o paciente ver
            </label>
            <Button type="submit" disabled={salvando}>
              <Plus className="size-4" /> Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? null : (data ?? []).length === 0 ? (
        <EstadoVazio
          icone={FlaskConical}
          titulo="Sem exames"
          texto="Registre resultados laboratoriais para acompanhar junto com as avaliações."
        />
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((x) => (
            <li key={x.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{x.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatarData(x.data)}
                      {x.valor ? ` · ${x.valor} ${x.unidade ?? ""}` : ""}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={x.liberado}
                      onCheckedChange={(v) => void alternarLiberado(x.id, v === true)}
                    />
                    Liberado
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover exame"
                    onClick={() => void remover(x.id)}
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
