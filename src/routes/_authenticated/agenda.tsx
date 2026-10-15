import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, Video } from "lucide-react";

import { Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
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
import { usePacientesAtivos } from "@/lib/pacientes";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | Amanda Nutri" },
      { name: "description", content: "Consultas e retornos agendados." },
    ],
  }),
  component: Agenda,
});

const STATUS: Record<string, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  faltou: "Faltou",
};

function formatarDataHora(iso: string) {
  const d = new Date(iso);
  return {
    dia: new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(d),
    hora: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d),
  };
}

function Agenda() {
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacienteId, setPacienteId] = useState("");
  const [tipo, setTipo] = useState("presencial");
  const { data: pacientes } = usePacientesAtivos();
  const nomes = new Map((pacientes ?? []).map((p) => [p.id, p.nome]));

  const { data, isLoading } = useQuery({
    queryKey: ["consultas"],
    queryFn: async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - 14);
      const { data, error } = await supabase
        .from("consultas")
        .select("*")
        .gte("inicio", desde.toISOString())
        .order("inicio");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function atualizar() {
    await queryClient.invalidateQueries({ queryKey: ["consultas"] });
  }

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const quando = String(dados.get("quando") ?? "");
    const duracao = Number(dados.get("duracao") ?? 60) || 60;
    const link = String(dados.get("link") ?? "").trim();
    if (!pacienteId || !quando) {
      toast.error("Escolha o paciente e o horário.");
      return;
    }
    const inicio = new Date(quando);
    const fim = new Date(inicio.getTime() + duracao * 60_000);
    setSalvando(true);
    const { error } = await supabase.from("consultas").insert({
      paciente_id: pacienteId,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      tipo,
      ...(link ? { link_online: link } : {}),
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível agendar.");
      return;
    }
    setAberto(false);
    setPacienteId("");
    toast.success("Consulta agendada.");
    await atualizar();
  }

  async function mudarStatus(id: string, status: string) {
    const { error } = await supabase.from("consultas").update({ status }).eq("id", id);
    if (error) toast.error("Não foi possível atualizar.");
    else await atualizar();
  }

  async function remover(id: string) {
    const { error } = await supabase.from("consultas").delete().eq("id", id);
    if (error) toast.error("Não foi possível remover.");
    else await atualizar();
  }

  const agora = Date.now();
  const proximas = (data ?? []).filter((c) => new Date(c.inicio).getTime() >= agora - 3_600_000);
  const passadas = (data ?? []).filter((c) => new Date(c.inicio).getTime() < agora - 3_600_000);

  const lista = (itens: typeof proximas) => (
    <ul className="space-y-3">
      {itens.map((c) => {
        const { dia, hora } = formatarDataHora(c.inicio);
        return (
          <li key={c.id}>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                <div className="w-24 shrink-0">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {dia}
                  </p>
                  <p className="font-display text-xl font-semibold text-foreground">{hora}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/pacientes/$id"
                    params={{ id: c.paciente_id }}
                    className="block truncate font-semibold text-foreground hover:underline"
                  >
                    {nomes.get(c.paciente_id) || "Paciente"}
                  </Link>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {c.tipo === "online" ? <Video className="size-3.5" /> : null}
                    {c.tipo === "online" ? "Online" : "Presencial"}
                    {c.link_online ? (
                      <a
                        href={c.link_online}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        link
                      </a>
                    ) : null}
                  </p>
                </div>
                <Select value={c.status} onValueChange={(v) => void mudarStatus(c.id, v)}>
                  <SelectTrigger className="w-36" aria-label="Situação da consulta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS).map(([valor, rotulo]) => (
                      <SelectItem key={valor} value={valor}>
                        {rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover consulta"
                  onClick={() => void remover(c.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <TituloPagina
        sobretitulo="Consultório"
        titulo="Agenda"
        descricao="Consultas e retornos. A sincronização com o Google Agenda entra na próxima etapa."
        acao={
          <Button size="lg" onClick={() => setAberto(true)}>
            <Plus className="size-4" /> Nova consulta
          </Button>
        }
      />

      {isLoading ? (
        <Carregando />
      ) : (data ?? []).length === 0 ? (
        <EstadoVazio
          icone={CalendarDays}
          titulo="Agenda vazia"
          texto="Agende a primeira consulta para ver o dia a dia do consultório aqui."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">Próximas</h2>
            {proximas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta pela frente.</p>
            ) : (
              lista(proximas)
            )}
          </section>
          {passadas.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">Últimos 14 dias</h2>
              {lista([...passadas].reverse())}
            </section>
          ) : null}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={criar} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display">Nova consulta</DialogTitle>
              <DialogDescription>Escolha o paciente, o horário e o tipo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="ag-paciente">Paciente</Label>
              <Select value={pacienteId} onValueChange={setPacienteId}>
                <SelectTrigger id="ag-paciente">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
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
                <Label htmlFor="ag-quando">Data e hora</Label>
                <Input id="ag-quando" name="quando" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ag-duracao">Duração (min)</Label>
                <Input
                  id="ag-duracao"
                  name="duracao"
                  type="number"
                  min={10}
                  step={5}
                  defaultValue={60}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-tipo">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="ag-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tipo === "online" ? (
              <div className="space-y-2">
                <Label htmlFor="ag-link">Link da videochamada</Label>
                <Input id="ag-link" name="link" type="url" placeholder="https://" />
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                Agendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
