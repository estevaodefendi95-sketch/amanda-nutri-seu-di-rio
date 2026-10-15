import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Eye, Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { FATORES_ATIVIDADE, paraNumero } from "@/lib/nutricao";

export type PerfilPaciente = Database["public"]["Tables"]["profiles"]["Row"];

/** Botão "Editar" + diálogo com todos os dados do paciente. */
export function EditarPaciente({ paciente }: { paciente: PerfilPaciente }) {
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sexo, setSexo] = useState(paciente.sexo ?? "");
  const [atividade, setAtividade] = useState(paciente.nivel_atividade ?? "");

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const texto = (nome: string) => String(f.get(nome) ?? "").trim();
    setSalvando(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nome: texto("nome"),
        telefone: texto("telefone") || null,
        data_nascimento: texto("data_nascimento") || null,
        sexo: sexo || null,
        altura_cm: paraNumero(texto("altura_cm")),
        nivel_atividade: atividade || null,
        objetivo: texto("objetivo") || null,
        observacoes: texto("observacoes") || null,
      })
      .eq("id", paciente.id);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["paciente", paciente.id] });
    await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    toast.success("Dados atualizados.");
    setAberto(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        <Pencil className="size-4" /> Editar dados
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Dados do paciente</DialogTitle>
            <DialogDescription>
              O e-mail de acesso não é alterado aqui. Para trocar, convide novamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={salvar} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ed-nome">Nome completo</Label>
                <Input id="ed-nome" name="nome" required defaultValue={paciente.nome} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-telefone">Telefone</Label>
                <Input
                  id="ed-telefone"
                  name="telefone"
                  inputMode="tel"
                  defaultValue={paciente.telefone ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-nasc">Data de nascimento</Label>
                <Input
                  id="ed-nasc"
                  name="data_nascimento"
                  type="date"
                  defaultValue={paciente.data_nascimento ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-sexo">Sexo</Label>
                <Select value={sexo} onValueChange={setSexo}>
                  <SelectTrigger id="ed-sexo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-altura">Altura (cm)</Label>
                <Input
                  id="ed-altura"
                  name="altura_cm"
                  inputMode="decimal"
                  defaultValue={paciente.altura_cm ?? ""}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ed-atividade">Nível de atividade física</Label>
                <Select value={atividade} onValueChange={setAtividade}>
                  <SelectTrigger id="ed-atividade">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {FATORES_ATIVIDADE.map((f) => (
                      <SelectItem key={f.valor} value={f.valor}>
                        {f.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ed-objetivo">Objetivo</Label>
                <Input id="ed-objetivo" name="objetivo" defaultValue={paciente.objetivo ?? ""} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ed-obs">Observações</Label>
                <Textarea
                  id="ed-obs"
                  name="observacoes"
                  rows={3}
                  defaultValue={paciente.observacoes ?? ""}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Configurações que só a nutricionista altera: visão do paciente e arquivamento. */
export function ConfiguracoesPaciente({ paciente }: { paciente: PerfilPaciente }) {
  const queryClient = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const arquivado = paciente.status === "arquivado";

  async function atualizar(
    patch: Database["public"]["Tables"]["profiles"]["Update"],
    mensagem: string,
  ) {
    setSalvando(true);
    const { error } = await supabase.from("profiles").update(patch).eq("id", paciente.id);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["paciente", paciente.id] });
    await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    toast.success(mensagem);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <Eye className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Mostrar calorias e macros ao paciente</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Desligado, o paciente vê só refeições, porções e substituições, sem contagem. Você
              sempre vê os totais.
            </p>
          </div>
        </div>
        <Switch
          checked={paciente.paciente_ve_calorias}
          disabled={salvando}
          aria-label="Mostrar calorias e macros ao paciente"
          onCheckedChange={(v) =>
            atualizar(
              { paciente_ve_calorias: v },
              v ? "O paciente passa a ver calorias e macros." : "O paciente verá só porções.",
            )
          }
        />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            {arquivado ? <ArchiveRestore className="size-5" /> : <Archive className="size-5" />}
          </span>
          <div>
            <p className="font-semibold text-foreground">
              {arquivado ? "Paciente arquivado" : "Arquivar paciente"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {arquivado
                ? "Ele não aparece na lista de ativos, mas todo o histórico é mantido."
                : "Tira da lista de ativos sem apagar nada do histórico."}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={salvando}
          onClick={() =>
            atualizar(
              { status: arquivado ? "ativo" : "arquivado" },
              arquivado ? "Paciente reativado." : "Paciente arquivado.",
            )
          }
        >
          {arquivado ? "Reativar" : "Arquivar"}
        </Button>
      </div>
    </div>
  );
}
