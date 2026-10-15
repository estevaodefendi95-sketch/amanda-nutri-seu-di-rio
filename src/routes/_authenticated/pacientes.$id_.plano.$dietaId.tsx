import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Loader2, Megaphone, Plus, Salad, Trash2 } from "lucide-react";

import { Carregando, EstadoVazio } from "@/components/app-shell";
import { AlimentoPicker } from "@/components/ficha/alimento-picker";
import { CalculadoraGET } from "@/components/ficha/calculadora-get";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  distribuicaoCalorica,
  fmt,
  idadeEmAnos,
  paraNumero,
  somarTotais,
  totaisDoItem,
  type Alimento,
  type Totais,
} from "@/lib/nutricao";

export const Route = createFileRoute("/_authenticated/pacientes/$id_/plano/$dietaId")({
  head: () => ({
    meta: [
      { title: "Editor de plano alimentar | Amanda Nutri" },
      {
        name: "description",
        content:
          "Monte o plano alimentar com refeições, alimentos, quantidades e totais calculados.",
      },
    ],
  }),
  component: EditorPlano,
});

type Dieta = Database["public"]["Tables"]["dietas"]["Row"];
type Refeicao = Database["public"]["Tables"]["refeicoes_dieta"]["Row"];
type ItemComAlimento = Database["public"]["Tables"]["itens_refeicao"]["Row"] & {
  alimentos: Alimento | null;
};

const STATUS: Record<string, { rotulo: string; classe: string }> = {
  rascunho: { rotulo: "Rascunho", classe: "bg-accent text-accent-foreground" },
  publicada: { rotulo: "Publicada", classe: "bg-primary-soft text-primary-soft-foreground" },
  encerrada: { rotulo: "Encerrada", classe: "bg-muted text-muted-foreground" },
};

function EditorPlano() {
  const { id, dietaId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ocupado, setOcupado] = useState(false);

  const { data: dieta, isLoading } = useQuery({
    queryKey: ["dieta", dietaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dietas")
        .select("*")
        .eq("id", dietaId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: paciente } = useQuery({
    queryKey: ["paciente", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: ultimaAvaliacao } = useQuery({
    queryKey: ["avaliacao-ultima", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("peso, altura")
        .eq("paciente_id", id)
        .order("data", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: plano } = useQuery({
    queryKey: ["plano", dietaId],
    queryFn: async () => {
      const { data: refeicoes, error } = await supabase
        .from("refeicoes_dieta")
        .select("*")
        .eq("dieta_id", dietaId)
        .order("ordem");
      if (error) throw error;
      const lista = refeicoes ?? [];
      if (lista.length === 0) return { refeicoes: lista, itens: [] as ItemComAlimento[] };

      const { data: itens, error: itensError } = await supabase
        .from("itens_refeicao")
        .select("*, alimentos(*)")
        .in(
          "refeicao_id",
          lista.map((r) => r.id),
        )
        .order("ordem");
      if (itensError) throw itensError;
      return { refeicoes: lista, itens: (itens ?? []) as ItemComAlimento[] };
    },
  });

  async function recarregar() {
    await queryClient.invalidateQueries({ queryKey: ["plano", dietaId] });
    await queryClient.invalidateQueries({ queryKey: ["dieta", dietaId] });
    await queryClient.invalidateQueries({ queryKey: ["dietas-paciente", id] });
  }

  async function atualizarDieta(patch: Database["public"]["Tables"]["dietas"]["Update"]) {
    const { error } = await supabase.from("dietas").update(patch).eq("id", dietaId);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    await recarregar();
  }

  async function publicar() {
    setOcupado(true);
    await supabase
      .from("dietas")
      .update({ status: "encerrada", ativa: false })
      .eq("paciente_id", id)
      .eq("status", "publicada")
      .neq("id", dietaId);
    const { error } = await supabase
      .from("dietas")
      .update({ status: "publicada", ativa: true, publicada_em: new Date().toISOString() })
      .eq("id", dietaId);
    setOcupado(false);
    if (error) {
      toast.error("Não foi possível publicar.");
      return;
    }
    await recarregar();
    toast.success("Plano publicado. O paciente já pode vê-lo.");
  }

  async function encerrar() {
    setOcupado(true);
    const { error } = await supabase
      .from("dietas")
      .update({ status: "encerrada", ativa: false })
      .eq("id", dietaId);
    setOcupado(false);
    if (error) {
      toast.error("Não foi possível encerrar.");
      return;
    }
    await recarregar();
    toast.success("Plano encerrado.");
  }

  async function duplicar() {
    if (!dieta || !plano) return;
    setOcupado(true);
    try {
      const { data: nova, error } = await supabase
        .from("dietas")
        .insert({
          paciente_id: dieta.paciente_id,
          titulo: `${dieta.titulo} (cópia)`,
          descricao: dieta.descricao,
          status: "rascunho",
          ativa: false,
          meta_kcal: dieta.meta_kcal,
          meta_proteina_g: dieta.meta_proteina_g,
          meta_carbo_g: dieta.meta_carbo_g,
          meta_gordura_g: dieta.meta_gordura_g,
        })
        .select("id")
        .single();
      if (error || !nova) throw error ?? new Error("sem retorno");

      for (const refeicao of plano.refeicoes) {
        const { data: novaRef, error: refError } = await supabase
          .from("refeicoes_dieta")
          .insert({
            dieta_id: nova.id,
            nome: refeicao.nome,
            horario: refeicao.horario,
            observacoes: refeicao.observacoes,
            ordem: refeicao.ordem,
          })
          .select("id")
          .single();
        if (refError || !novaRef) throw refError ?? new Error("sem retorno");

        const itens = plano.itens
          .filter((i) => i.refeicao_id === refeicao.id)
          .map((i) => ({
            refeicao_id: novaRef.id,
            alimento_id: i.alimento_id,
            descricao: i.descricao,
            quantidade_g: i.quantidade_g,
            medida_caseira: i.medida_caseira,
            substituicoes: i.substituicoes,
            ordem: i.ordem,
          }));
        if (itens.length > 0) {
          const { error: itensError } = await supabase.from("itens_refeicao").insert(itens);
          if (itensError) throw itensError;
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["dietas-paciente", id] });
      toast.success("Cópia criada como rascunho.");
      navigate({ to: "/pacientes/$id/plano/$dietaId", params: { id, dietaId: nova.id } });
    } catch {
      toast.error("Não foi possível duplicar o plano.");
    } finally {
      setOcupado(false);
    }
  }

  async function adicionarRefeicao() {
    const ordem = plano?.refeicoes.length ?? 0;
    const { error } = await supabase
      .from("refeicoes_dieta")
      .insert({ dieta_id: dietaId, nome: `Refeição ${ordem + 1}`, ordem });
    if (error) {
      toast.error("Não foi possível adicionar a refeição.");
      return;
    }
    await recarregar();
  }

  if (isLoading) return <Carregando />;
  if (!dieta) {
    return (
      <EstadoVazio
        icone={Salad}
        titulo="Plano não encontrado"
        texto="Ele pode ter sido removido. Volte para a ficha do paciente."
        acao={
          <Button asChild variant="secondary">
            <Link to="/pacientes/$id" params={{ id }}>
              Voltar à ficha
            </Link>
          </Button>
        }
      />
    );
  }

  const refeicoes = plano?.refeicoes ?? [];
  const itens = plano?.itens ?? [];
  const totaisPorRefeicao = new Map<string, Totais>();
  for (const r of refeicoes) {
    totaisPorRefeicao.set(
      r.id,
      somarTotais(
        itens.filter((i) => i.refeicao_id === r.id).map((i) => totaisDoItem(i, i.alimentos)),
      ),
    );
  }
  const total = somarTotais(Array.from(totaisPorRefeicao.values()));
  const status = STATUS[dieta.status] ?? STATUS["rascunho"]!;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/pacientes/$id" params={{ id }}>
          <ArrowLeft className="size-4" /> {paciente?.nome || "Paciente"}
        </Link>
      </Button>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${status.classe}`}
          >
            {status.rotulo}
          </span>
          <Input
            key={`titulo-${dieta.titulo}`}
            aria-label="Título do plano"
            defaultValue={dieta.titulo}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== dieta.titulo) void atualizarDieta({ titulo: v });
            }}
            className="mt-2 h-auto border-0 bg-transparent px-0 font-display text-3xl font-semibold shadow-none focus-visible:ring-0 sm:text-4xl"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={ocupado} onClick={duplicar}>
            <Copy className="size-4" /> Duplicar
          </Button>
          {dieta.status === "publicada" ? (
            <Button variant="outline" disabled={ocupado} onClick={encerrar}>
              Encerrar plano
            </Button>
          ) : (
            <Button disabled={ocupado} onClick={publicar}>
              {ocupado ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Megaphone className="size-4" />
              )}
              {dieta.status === "encerrada" ? "Publicar novamente" : "Publicar para o paciente"}
            </Button>
          )}
        </div>
      </header>

      {dieta.status === "publicada" ? (
        <p className="mb-6 rounded-xl bg-primary-soft p-3 text-sm text-primary-soft-foreground">
          Este plano está publicado: as alterações aparecem para o paciente na hora. Para mexer com
          calma, use <strong>Duplicar</strong> e publique a cópia quando estiver pronta.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plano-desc">Orientações gerais</Label>
            <Textarea
              id="plano-desc"
              key={`desc-${dieta.descricao ?? ""}`}
              rows={2}
              defaultValue={dieta.descricao ?? ""}
              placeholder="Recado de abertura para o paciente, combinados da semana..."
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (dieta.descricao ?? "")) void atualizarDieta({ descricao: v || null });
              }}
            />
          </div>

          {refeicoes.length === 0 ? (
            <EstadoVazio
              icone={Salad}
              titulo="Comece pela primeira refeição"
              texto="Adicione café da manhã, almoço, lanches e jantar, e depois os alimentos de cada uma."
            />
          ) : (
            refeicoes.map((refeicao) => (
              <CartaoRefeicao
                key={refeicao.id}
                refeicao={refeicao}
                itens={itens.filter((i) => i.refeicao_id === refeicao.id)}
                totais={totaisPorRefeicao.get(refeicao.id)}
                onMudou={recarregar}
              />
            ))
          )}

          <Button variant="outline" onClick={adicionarRefeicao}>
            <Plus className="size-4" /> Adicionar refeição
          </Button>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <PainelTotais
            dieta={dieta}
            total={total}
            onMeta={(patch) => void atualizarDieta(patch)}
            calculadora={
              <CalculadoraGET
                key={`${ultimaAvaliacao?.peso ?? ""}-${paciente?.sexo ?? ""}`}
                sexo={paciente?.sexo}
                idade={idadeEmAnos(paciente?.data_nascimento)}
                pesoInicial={ultimaAvaliacao?.peso != null ? Number(ultimaAvaliacao.peso) : null}
                alturaInicial={
                  paciente?.altura_cm != null
                    ? Number(paciente.altura_cm)
                    : ultimaAvaliacao?.altura != null
                      ? Number(ultimaAvaliacao.altura)
                      : null
                }
                atividadeInicial={paciente?.nivel_atividade}
                onUsar={(kcal) => void atualizarDieta({ meta_kcal: kcal })}
              />
            }
          />
        </aside>
      </div>
    </>
  );
}

function PainelTotais({
  dieta,
  total,
  onMeta,
  calculadora,
}: {
  dieta: Dieta;
  total: Totais;
  onMeta: (patch: Database["public"]["Tables"]["dietas"]["Update"]) => void;
  calculadora: React.ReactNode;
}) {
  const dist = distribuicaoCalorica(total);
  const linhas = [
    {
      rotulo: "Calorias",
      unidade: "kcal",
      atual: total.kcal,
      meta: dieta.meta_kcal,
      campo: "meta_kcal" as const,
    },
    {
      rotulo: "Proteína",
      unidade: "g",
      atual: total.proteina,
      meta: dieta.meta_proteina_g,
      campo: "meta_proteina_g" as const,
      pct: dist.proteina,
    },
    {
      rotulo: "Carboidrato",
      unidade: "g",
      atual: total.carbo,
      meta: dieta.meta_carbo_g,
      campo: "meta_carbo_g" as const,
      pct: dist.carbo,
    },
    {
      rotulo: "Gordura",
      unidade: "g",
      atual: total.gordura,
      meta: dieta.meta_gordura_g,
      campo: "meta_gordura_g" as const,
      pct: dist.gordura,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Totais do plano</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {linhas.map((l) => {
          const meta = l.meta != null ? Number(l.meta) : null;
          const progresso = meta && meta > 0 ? Math.min((l.atual / meta) * 100, 100) : 0;
          const passou = meta != null && meta > 0 && l.atual > meta * 1.05;
          return (
            <div key={l.campo} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{l.rotulo}</span>
                <span
                  className={`text-sm ${passou ? "text-destructive" : "text-muted-foreground"}`}
                >
                  <strong className="font-semibold text-foreground">{fmt(l.atual)}</strong>
                  {meta != null ? ` / ${fmt(meta)}` : ""} {l.unidade}
                  {"pct" in l && l.pct != null && l.atual > 0 ? ` · ${fmt(l.pct)}%` : ""}
                </span>
              </div>
              <Progress value={progresso} aria-label={`${l.rotulo}: progresso em relação à meta`} />
              <Input
                key={`${l.campo}-${meta ?? ""}`}
                inputMode="decimal"
                aria-label={`Meta de ${l.rotulo.toLowerCase()} (${l.unidade})`}
                placeholder={`Meta (${l.unidade})`}
                defaultValue={meta != null ? String(meta) : ""}
                className="h-9"
                onBlur={(e) => {
                  const v = paraNumero(e.target.value);
                  if (v !== meta) onMeta({ [l.campo]: v });
                }}
              />
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          Fibra do plano: {fmt(total.fibra, 1)} g. Itens livres não entram na soma.
        </p>
        {calculadora}
      </CardContent>
    </Card>
  );
}

function CartaoRefeicao({
  refeicao,
  itens,
  totais,
  onMudou,
}: {
  refeicao: Refeicao;
  itens: ItemComAlimento[];
  totais: Totais | undefined;
  onMudou: () => Promise<void>;
}) {
  async function atualizar(patch: Database["public"]["Tables"]["refeicoes_dieta"]["Update"]) {
    const { error } = await supabase.from("refeicoes_dieta").update(patch).eq("id", refeicao.id);
    if (error) toast.error("Não foi possível salvar a refeição.");
    else await onMudou();
  }

  async function remover() {
    const { error } = await supabase.from("refeicoes_dieta").delete().eq("id", refeicao.id);
    if (error) toast.error("Não foi possível remover a refeição.");
    else await onMudou();
  }

  async function adicionarItem(alimento: Alimento | null) {
    const { error } = await supabase.from("itens_refeicao").insert({
      refeicao_id: refeicao.id,
      alimento_id: alimento?.id ?? null,
      descricao: alimento ? null : "Item livre",
      quantidade_g: alimento ? 100 : null,
      ordem: itens.length,
    });
    if (error) toast.error("Não foi possível adicionar o alimento.");
    else await onMudou();
  }

  return (
    <Card>
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            key={`nome-${refeicao.nome}`}
            aria-label="Nome da refeição"
            defaultValue={refeicao.nome}
            className="h-10 min-w-0 flex-1 font-display text-lg font-semibold"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== refeicao.nome) void atualizar({ nome: v });
            }}
          />
          <Input
            key={`hora-${refeicao.horario ?? ""}`}
            type="time"
            aria-label="Horário da refeição"
            defaultValue={refeicao.horario ? String(refeicao.horario).slice(0, 5) : ""}
            className="h-10 w-32"
            onBlur={(e) => {
              const v = e.target.value || null;
              if (v !== (refeicao.horario ? String(refeicao.horario).slice(0, 5) : null)) {
                void atualizar({ horario: v });
              }
            }}
          />
          <Button variant="ghost" size="icon" aria-label="Remover refeição" onClick={remover}>
            <Trash2 className="size-4" />
          </Button>
        </div>
        {totais && totais.kcal > 0 ? (
          <p className="text-xs text-muted-foreground">
            {fmt(totais.kcal)} kcal · P {fmt(totais.proteina)} g · C {fmt(totais.carbo)} g · G{" "}
            {fmt(totais.gordura)} g
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {itens.length === 0 ? (
          <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            Nenhum alimento nesta refeição ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {itens.map((item) => (
              <LinhaItem key={item.id} item={item} onMudou={onMudou} />
            ))}
          </ul>
        )}

        <AlimentoPicker
          onEscolher={(a) => void adicionarItem(a)}
          onItemLivre={() => void adicionarItem(null)}
        />

        <Textarea
          key={`obs-${refeicao.observacoes ?? ""}`}
          rows={2}
          aria-label="Observações da refeição"
          placeholder="Observações desta refeição (opcional)"
          defaultValue={refeicao.observacoes ?? ""}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (refeicao.observacoes ?? "")) void atualizar({ observacoes: v || null });
          }}
        />
      </CardContent>
    </Card>
  );
}

function LinhaItem({ item, onMudou }: { item: ItemComAlimento; onMudou: () => Promise<void> }) {
  const totais = totaisDoItem(item, item.alimentos);

  async function atualizar(patch: Database["public"]["Tables"]["itens_refeicao"]["Update"]) {
    const { error } = await supabase.from("itens_refeicao").update(patch).eq("id", item.id);
    if (error) toast.error("Não foi possível salvar o item.");
    else await onMudou();
  }

  async function remover() {
    const { error } = await supabase.from("itens_refeicao").delete().eq("id", item.id);
    if (error) toast.error("Não foi possível remover o item.");
    else await onMudou();
  }

  return (
    <li className="rounded-xl border border-border/70 bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        {item.alimentos ? (
          <p className="min-w-0 flex-1 basis-40 truncate text-sm font-semibold text-foreground">
            {item.alimentos.nome}
          </p>
        ) : (
          <Input
            key={`desc-${item.descricao ?? ""}`}
            aria-label="Descrição do item livre"
            defaultValue={item.descricao ?? ""}
            className="h-9 min-w-0 flex-1 basis-40"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== item.descricao) void atualizar({ descricao: v });
            }}
          />
        )}

        {item.alimentos ? (
          <div className="flex items-center gap-1">
            <Input
              key={`qtd-${item.quantidade_g ?? ""}`}
              inputMode="decimal"
              aria-label="Quantidade em gramas"
              defaultValue={item.quantidade_g != null ? String(item.quantidade_g) : ""}
              className="h-9 w-20 text-right"
              onBlur={(e) => {
                const v = paraNumero(e.target.value);
                if (v !== (item.quantidade_g != null ? Number(item.quantidade_g) : null)) {
                  void atualizar({ quantidade_g: v });
                }
              }}
            />
            <span className="text-sm text-muted-foreground">g</span>
          </div>
        ) : null}

        <Input
          key={`med-${item.medida_caseira ?? ""}`}
          aria-label="Medida caseira"
          placeholder="Medida caseira (ex.: 2 colheres)"
          defaultValue={item.medida_caseira ?? ""}
          className="h-9 basis-48"
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (item.medida_caseira ?? "")) void atualizar({ medida_caseira: v || null });
          }}
        />

        <span className="w-16 text-right text-xs text-muted-foreground">
          {totais.kcal > 0 ? `${fmt(totais.kcal)} kcal` : ""}
        </span>
        <Button variant="ghost" size="icon" aria-label="Remover item" onClick={remover}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Input
        key={`sub-${item.substituicoes ?? ""}`}
        aria-label="Substituições"
        placeholder="Pode trocar por... (opcional)"
        defaultValue={item.substituicoes ?? ""}
        className="mt-2 h-9"
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== (item.substituicoes ?? "")) void atualizar({ substituicoes: v || null });
        }}
      />
    </li>
  );
}
