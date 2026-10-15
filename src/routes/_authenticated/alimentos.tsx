import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Apple, Search, Trash2, Upload } from "lucide-react";

import { Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fmt, paraNumero } from "@/lib/nutricao";

export const Route = createFileRoute("/_authenticated/alimentos")({
  head: () => ({
    meta: [
      { title: "Alimentos | Amanda Nutri" },
      {
        name: "description",
        content: "Tabela de alimentos usada para calcular calorias e macros dos planos.",
      },
    ],
  }),
  component: Alimentos,
});

const CAMPOS = [
  { id: "kcal", rotulo: "Calorias (kcal)" },
  { id: "proteina", rotulo: "Proteína (g)" },
  { id: "carbo", rotulo: "Carboidrato (g)" },
  { id: "gordura", rotulo: "Gordura (g)" },
  { id: "fibra", rotulo: "Fibra (g)" },
] as const;

function Alimentos() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const termo = busca.trim().replace(/[%_]/g, "");

  const { data, isLoading } = useQuery({
    queryKey: ["alimentos-lista", termo],
    queryFn: async () => {
      let consulta = supabase.from("alimentos").select("*").order("nome").limit(100);
      if (termo) consulta = consulta.ilike("nome", `%${termo}%`);
      const { data, error } = await consulta;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: total } = useQuery({
    queryKey: ["alimentos-total"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("alimentos")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  async function atualizar() {
    await queryClient.invalidateQueries({ queryKey: ["alimentos-lista"] });
    await queryClient.invalidateQueries({ queryKey: ["alimentos-total"] });
    await queryClient.invalidateQueries({ queryKey: ["alimentos-busca"] });
  }

  async function adicionar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const nome = String(dados.get("nome") ?? "").trim();
    if (!nome) return;
    const num = (campo: string) => paraNumero(String(dados.get(campo) ?? "")) ?? 0;
    setSalvando(true);
    const { error } = await supabase.from("alimentos").insert({
      nome,
      fonte: "propria",
      kcal: num("kcal"),
      proteina: num("proteina"),
      carbo: num("carbo"),
      gordura: num("gordura"),
      fibra: num("fibra"),
    });
    setSalvando(false);
    if (error) {
      toast.error(error.code === "23505" ? "Esse alimento já existe." : "Não foi possível salvar.");
      return;
    }
    form.reset();
    toast.success("Alimento cadastrado.");
    await atualizar();
  }

  async function remover(id: string) {
    const { error } = await supabase.from("alimentos").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível remover. Ele pode estar em uso em algum plano.");
      return;
    }
    await atualizar();
  }

  async function importar(file: File) {
    const texto = (await file.text()).replace(/^\uFEFF/, "");
    const linhas = texto.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (linhas.length === 0) return;
    const sep = (linhas[0] ?? "").includes(";") ? ";" : ",";
    const registros: {
      nome: string;
      fonte: string;
      kcal: number;
      proteina: number;
      carbo: number;
      gordura: number;
      fibra: number;
    }[] = [];
    for (const [i, linha] of linhas.entries()) {
      const col = linha.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
      const nome = col[0] ?? "";
      const kcal = paraNumero(col[1]);
      if (!nome || (i === 0 && kcal == null)) continue; // cabeçalho
      registros.push({
        nome,
        fonte: "importada",
        kcal: kcal ?? 0,
        proteina: paraNumero(col[2]) ?? 0,
        carbo: paraNumero(col[3]) ?? 0,
        gordura: paraNumero(col[4]) ?? 0,
        fibra: paraNumero(col[5]) ?? 0,
      });
    }
    if (registros.length === 0) {
      toast.error("Nenhuma linha válida encontrada no arquivo.");
      return;
    }
    const { error } = await supabase
      .from("alimentos")
      .upsert(registros, { onConflict: "nome,fonte" });
    if (error) {
      toast.error("Não foi possível importar o arquivo.");
      return;
    }
    toast.success(`${registros.length} alimentos importados.`);
    await atualizar();
  }

  return (
    <>
      <TituloPagina
        sobretitulo={total != null ? `${total} cadastrados` : undefined}
        titulo="Alimentos"
        descricao="Valores por 100 g. É a base do cálculo de calorias e macros dos planos."
        acao={
          <>
            <input
              ref={arquivo}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importar(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="lg" onClick={() => arquivo.current?.click()}>
              <Upload className="size-4" /> Importar CSV
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Novo alimento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionar} className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2 sm:col-span-3 lg:col-span-6">
              <Label htmlFor="al-nome">Nome</Label>
              <Input id="al-nome" name="nome" required placeholder="Ex.: Arroz integral cozido" />
            </div>
            {CAMPOS.map((c) => (
              <div key={c.id} className="space-y-2">
                <Label htmlFor={`al-${c.id}`}>{c.rotulo}</Label>
                <Input id={`al-${c.id}`} name={c.id} inputMode="decimal" placeholder="0" />
              </div>
            ))}
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={salvando}>
                Cadastrar
              </Button>
            </div>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            CSV: colunas nome; kcal; proteína; carboidrato; gordura; fibra (por 100 g). Aceita ponto
            e vírgula ou vírgula e decimal com vírgula.
          </p>
        </CardContent>
      </Card>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar alimento..."
          className="h-11 pl-10"
          aria-label="Buscar alimento"
        />
      </div>

      {isLoading ? (
        <Carregando />
      ) : (data ?? []).length === 0 ? (
        <EstadoVazio
          icone={Apple}
          titulo={termo ? "Nada encontrado" : "Tabela de alimentos vazia"}
          texto={
            termo
              ? "Tente outro nome ou cadastre o alimento acima."
              : "Importe a tabela TACO em CSV ou cadastre os alimentos que você mais usa."
          }
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-4 py-3 font-bold">Alimento</th>
                  <th className="px-3 py-3 text-right font-bold">kcal</th>
                  <th className="px-3 py-3 text-right font-bold">Prot.</th>
                  <th className="px-3 py-3 text-right font-bold">Carb.</th>
                  <th className="px-3 py-3 text-right font-bold">Gord.</th>
                  <th className="px-3 py-3 text-right font-bold">Fibra</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-foreground">{a.nome}</td>
                    <td className="px-3 text-right">{fmt(Number(a.kcal), 0)}</td>
                    <td className="px-3 text-right">{fmt(Number(a.proteina), 1)}</td>
                    <td className="px-3 text-right">{fmt(Number(a.carbo), 1)}</td>
                    <td className="px-3 text-right">{fmt(Number(a.gordura), 1)}</td>
                    <td className="px-3 text-right">{fmt(Number(a.fibra), 1)}</td>
                    <td className="px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover ${a.nome}`}
                        onClick={() => void remover(a.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
