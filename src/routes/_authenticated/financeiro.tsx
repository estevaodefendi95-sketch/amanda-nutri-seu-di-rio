import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, Plus, Trash2, Wallet } from "lucide-react";

import { CartaoNumero, Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, hojeISO, paraNumero } from "@/lib/nutricao";
import { usePacientesAtivos } from "@/lib/pacientes";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro | Amanda Nutri" },
      { name: "description", content: "Cobranças, recebimentos e valores em aberto." },
    ],
  }),
  component: Financeiro,
});

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FORMAS = ["Pix", "Cartão", "Dinheiro", "Transferência"];

function Financeiro() {
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacienteId, setPacienteId] = useState("nenhum");
  const { data: pacientes } = usePacientesAtivos();
  const nomes = new Map((pacientes ?? []).map((p) => [p.id, p.nome]));

  const { data, isLoading } = useQuery({
    queryKey: ["lancamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .order("vencimento", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function atualizar() {
    await queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
  }

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const descricao = String(dados.get("descricao") ?? "").trim();
    const valor = paraNumero(String(dados.get("valor") ?? ""));
    const vencimento = String(dados.get("vencimento") ?? "") || hojeISO();
    const forma = String(dados.get("forma") ?? "").trim();
    if (!descricao || valor == null) {
      toast.error("Informe a descrição e o valor.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("lancamentos").insert({
      descricao,
      valor,
      vencimento,
      ...(forma ? { forma } : {}),
      ...(pacienteId !== "nenhum" ? { paciente_id: pacienteId } : {}),
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    setAberto(false);
    setPacienteId("nenhum");
    await atualizar();
  }

  async function marcarPago(id: string, pago: boolean) {
    const { error } = await supabase
      .from("lancamentos")
      .update({ pago_em: pago ? hojeISO() : null })
      .eq("id", id);
    if (error) toast.error("Não foi possível atualizar.");
    else await atualizar();
  }

  async function remover(id: string) {
    const { error } = await supabase.from("lancamentos").delete().eq("id", id);
    if (error) toast.error("Não foi possível remover.");
    else await atualizar();
  }

  const hoje = hojeISO();
  const mes = hoje.slice(0, 7);
  const lista = data ?? [];
  const recebidoMes = lista
    .filter((l) => l.pago_em && l.pago_em.slice(0, 7) === mes)
    .reduce((s, l) => s + Number(l.valor), 0);
  const aReceber = lista
    .filter((l) => !l.pago_em && l.vencimento >= hoje)
    .reduce((s, l) => s + Number(l.valor), 0);
  const atrasado = lista
    .filter((l) => !l.pago_em && l.vencimento < hoje)
    .reduce((s, l) => s + Number(l.valor), 0);

  return (
    <>
      <TituloPagina
        sobretitulo="Consultório"
        titulo="Financeiro"
        descricao="Cobranças por paciente, o que já entrou e o que está em aberto."
        acao={
          <Button size="lg" onClick={() => setAberto(true)}>
            <Plus className="size-4" /> Nova cobrança
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <CartaoNumero
          titulo="Recebido no mês"
          valor={isLoading ? "—" : moeda(recebidoMes)}
          icone={Wallet}
          detalhe="Pagamentos deste mês"
        />
        <CartaoNumero
          titulo="A receber"
          valor={isLoading ? "—" : moeda(aReceber)}
          icone={Wallet}
          detalhe="Dentro do prazo"
        />
        <CartaoNumero
          titulo="Em atraso"
          valor={isLoading ? "—" : moeda(atrasado)}
          icone={Wallet}
          detalhe="Vencidas e não pagas"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <EstadoVazio
            icone={Wallet}
            titulo="Nenhuma cobrança ainda"
            texto="Registre a primeira cobrança de consulta ou pacote."
          />
        ) : (
          <ul className="space-y-3">
            {lista.map((l) => {
              const atrasada = !l.pago_em && l.vencimento < hoje;
              return (
                <li key={l.id}>
                  <Card>
                    <CardContent className="flex flex-wrap items-center gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{l.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {l.paciente_id
                            ? (nomes.get(l.paciente_id) ?? "Paciente")
                            : "Sem paciente"}
                          {" · vence "}
                          {formatarData(l.vencimento)}
                          {l.forma ? ` · ${l.forma}` : ""}
                        </p>
                      </div>
                      <span className="font-display text-lg font-semibold">
                        {moeda(Number(l.valor))}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${
                          l.pago_em
                            ? "bg-primary-soft text-primary-soft-foreground"
                            : atrasada
                              ? "bg-destructive/10 text-destructive"
                              : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {l.pago_em
                          ? `Pago ${formatarData(l.pago_em)}`
                          : atrasada
                            ? "Atrasada"
                            : "Em aberto"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void marcarPago(l.id, !l.pago_em)}
                      >
                        <Check className="size-4" /> {l.pago_em ? "Desfazer" : "Marcar pago"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remover cobrança"
                        onClick={() => void remover(l.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={criar} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display">Nova cobrança</DialogTitle>
              <DialogDescription>
                Uma consulta, um pacote ou outro valor a receber.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="fi-desc">Descrição</Label>
              <Input
                id="fi-desc"
                name="descricao"
                required
                placeholder="Ex.: Consulta de retorno"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fi-paciente">Paciente</Label>
              <Select value={pacienteId} onValueChange={setPacienteId}>
                <SelectTrigger id="fi-paciente">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Sem paciente</SelectItem>
                  {(pacientes ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fi-valor">Valor (R$)</Label>
                <Input id="fi-valor" name="valor" inputMode="decimal" required placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fi-venc">Vencimento</Label>
                <Input id="fi-venc" name="vencimento" type="date" defaultValue={hojeISO()} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fi-forma">Forma de pagamento</Label>
              <Input id="fi-forma" name="forma" list="formas-pagamento" placeholder="Opcional" />
              <datalist id="formas-pagamento">
                {FORMAS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
