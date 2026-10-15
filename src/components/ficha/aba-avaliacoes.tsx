import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Ruler, Trash2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Carregando, EstadoVazio } from "@/components/app-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { fmt, formatarData, hojeISO, paraNumero } from "@/lib/nutricao";

const CIRCUNFERENCIAS = [
  { chave: "cintura", rotulo: "Cintura" },
  { chave: "abdomen", rotulo: "Abdômen" },
  { chave: "quadril", rotulo: "Quadril" },
  { chave: "braco", rotulo: "Braço" },
  { chave: "coxa", rotulo: "Coxa" },
];

const DOBRAS = [
  { chave: "tricipital", rotulo: "Tricipital" },
  { chave: "subescapular", rotulo: "Subescapular" },
  { chave: "suprailiaca", rotulo: "Supra-ilíaca" },
  { chave: "abdominal", rotulo: "Abdominal" },
  { chave: "coxa", rotulo: "Coxa" },
];

function lerMedidas(origem: Json | undefined) {
  return (origem && typeof origem === "object" && !Array.isArray(origem) ? origem : {}) as {
    [chave: string]: Json | undefined;
  };
}

function coletarMedidas(f: FormData, prefixo: string, lista: { chave: string }[]) {
  const saida: { [chave: string]: number } = {};
  for (const item of lista) {
    const n = paraNumero(String(f.get(`${prefixo}-${item.chave}`) ?? ""));
    if (n != null) saida[item.chave] = n;
  }
  return saida;
}

export function AbaAvaliacoes({
  pacienteId,
  alturaPadrao,
}: {
  pacienteId: string;
  alturaPadrao: number | null;
}) {
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["avaliacoes", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("data", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSalvando(true);
    const { error } = await supabase.from("avaliacoes").insert({
      paciente_id: pacienteId,
      data: String(f.get("data") || hojeISO()),
      peso: paraNumero(String(f.get("peso") ?? "")),
      altura: paraNumero(String(f.get("altura") ?? "")),
      percentual_gordura: paraNumero(String(f.get("gordura") ?? "")),
      massa_magra: paraNumero(String(f.get("massa_magra") ?? "")),
      circunferencias: coletarMedidas(f, "circ", CIRCUNFERENCIAS),
      dobras: coletarMedidas(f, "dobra", DOBRAS),
      observacoes: String(f.get("observacoes") ?? "").trim() || null,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar a avaliação.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["avaliacoes", pacienteId] });
    toast.success("Avaliação registrada.");
    setAberto(false);
  }

  async function remover(id: string) {
    const { error } = await supabase.from("avaliacoes").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["avaliacoes", pacienteId] });
    toast.success("Avaliação excluída.");
  }

  const avaliacoes = data ?? [];
  const serie = [...avaliacoes]
    .filter((a) => a.peso != null)
    .reverse()
    .map((a) => ({ data: formatarData(a.data).slice(0, 5), peso: Number(a.peso) }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setAberto(true)}>
          <Plus className="size-4" /> Nova avaliação
        </Button>
      </div>

      {isLoading ? (
        <Carregando />
      ) : avaliacoes.length === 0 ? (
        <EstadoVazio
          icone={Ruler}
          titulo="Nenhuma avaliação registrada"
          texto="Lance a primeira avaliação para começar a acompanhar peso, medidas e composição corporal."
        />
      ) : (
        <>
          {serie.length >= 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>Peso ao longo do tempo (kg)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="data" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      domain={["dataMin - 2", "dataMax + 2"]}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(v) => [`${fmt(Number(v), 1)} kg`, "Peso"]}
                      contentStyle={{ borderRadius: 12, borderColor: "var(--color-border)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "var(--color-primary)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-3">
            {avaliacoes.map((a, i) => {
              const anterior = avaliacoes[i + 1];
              const variacao =
                a.peso != null && anterior?.peso != null
                  ? Number(a.peso) - Number(anterior.peso)
                  : null;
              const circ = lerMedidas(a.circunferencias);
              const dobras = lerMedidas(a.dobras);
              return (
                <Card key={a.id}>
                  <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                    <CardTitle className="text-base">Avaliação de {formatarData(a.data)}</CardTitle>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Excluir avaliação">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir esta avaliação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Os dados desta avaliação serão removidos e a ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remover(a.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Medida
                        rotulo="Peso"
                        valor={a.peso != null ? `${fmt(Number(a.peso), 1)} kg` : "—"}
                        extra={
                          variacao != null
                            ? `${variacao > 0 ? "+" : ""}${fmt(variacao, 1)} kg`
                            : undefined
                        }
                      />
                      <Medida
                        rotulo="Altura"
                        valor={a.altura != null ? `${fmt(Number(a.altura), 0)} cm` : "—"}
                      />
                      <Medida
                        rotulo="Gordura"
                        valor={
                          a.percentual_gordura != null
                            ? `${fmt(Number(a.percentual_gordura), 1)} %`
                            : "—"
                        }
                      />
                      <Medida
                        rotulo="Massa magra"
                        valor={a.massa_magra != null ? `${fmt(Number(a.massa_magra), 1)} kg` : "—"}
                      />
                    </div>

                    <ListaMedidas
                      titulo="Circunferências (cm)"
                      lista={CIRCUNFERENCIAS}
                      valores={circ}
                    />
                    <ListaMedidas titulo="Dobras cutâneas (mm)" lista={DOBRAS} valores={dobras} />

                    {a.observacoes ? (
                      <p className="rounded-xl bg-secondary p-3 text-secondary-foreground">
                        {a.observacoes}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Nova avaliação</DialogTitle>
            <DialogDescription>
              Preencha só o que foi medido; o resto pode ficar em branco.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={salvar} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo id="av-data" nome="data" rotulo="Data" tipo="date" padrao={hojeISO()} />
              <Campo id="av-peso" nome="peso" rotulo="Peso (kg)" />
              <Campo
                id="av-altura"
                nome="altura"
                rotulo="Altura (cm)"
                padrao={alturaPadrao != null ? String(alturaPadrao) : ""}
              />
              <Campo id="av-gordura" nome="gordura" rotulo="% de gordura" />
              <Campo id="av-massa" nome="massa_magra" rotulo="Massa magra (kg)" />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">
                Circunferências (cm)
              </legend>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {CIRCUNFERENCIAS.map((c) => (
                  <Campo
                    key={c.chave}
                    id={`av-circ-${c.chave}`}
                    nome={`circ-${c.chave}`}
                    rotulo={c.rotulo}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">
                Dobras cutâneas (mm)
              </legend>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {DOBRAS.map((d) => (
                  <Campo
                    key={d.chave}
                    id={`av-dobra-${d.chave}`}
                    nome={`dobra-${d.chave}`}
                    rotulo={d.rotulo}
                  />
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="av-obs">Observações</Label>
              <Textarea id="av-obs" name="observacoes" rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
                Salvar avaliação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Campo({
  id,
  nome,
  rotulo,
  tipo = "text",
  padrao = "",
}: {
  id: string;
  nome: string;
  rotulo: string;
  tipo?: string;
  padrao?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        name={nome}
        type={tipo}
        inputMode={tipo === "date" ? undefined : "decimal"}
        defaultValue={padrao}
      />
    </div>
  );
}

function Medida({
  rotulo,
  valor,
  extra,
}: {
  rotulo: string;
  valor: string;
  extra?: string | undefined;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {rotulo}
      </p>
      <p className="font-semibold text-foreground">{valor}</p>
      {extra ? <p className="text-xs text-muted-foreground">{extra} desde a anterior</p> : null}
    </div>
  );
}

function ListaMedidas({
  titulo,
  lista,
  valores,
}: {
  titulo: string;
  lista: { chave: string; rotulo: string }[];
  valores: { [chave: string]: Json | undefined };
}) {
  const preenchidas = lista.filter((i) => typeof valores[i.chave] === "number");
  if (preenchidas.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {titulo}
      </p>
      <div className="flex flex-wrap gap-2">
        {preenchidas.map((i) => (
          <span
            key={i.chave}
            className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
          >
            {i.rotulo}: {fmt(Number(valores[i.chave]), 1)}
          </span>
        ))}
      </div>
    </div>
  );
}
