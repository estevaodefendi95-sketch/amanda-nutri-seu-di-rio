import { useState } from "react";
import { Calculator } from "lucide-react";

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
import {
  calcularTMB,
  EQUACOES,
  FATORES_ATIVIDADE,
  fmt,
  paraNumero,
  type Equacao,
} from "@/lib/nutricao";

/** Calcula TMB e gasto energético total e devolve a meta de calorias sugerida. */
export function CalculadoraGET({
  sexo,
  idade,
  pesoInicial,
  alturaInicial,
  atividadeInicial,
  onUsar,
}: {
  sexo: string | null | undefined;
  idade: number | null;
  pesoInicial: number | null;
  alturaInicial: number | null;
  atividadeInicial: string | null | undefined;
  onUsar: (kcal: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [equacao, setEquacao] = useState<Equacao>("mifflin");
  const [atividade, setAtividade] = useState(atividadeInicial || "leve");
  const [peso, setPeso] = useState(pesoInicial != null ? String(pesoInicial) : "");
  const [altura, setAltura] = useState(alturaInicial != null ? String(alturaInicial) : "");
  const [ajuste, setAjuste] = useState("0");

  const tmb = calcularTMB({
    equacao,
    sexo,
    pesoKg: paraNumero(peso),
    alturaCm: paraNumero(altura),
    idade,
  });
  const fator = FATORES_ATIVIDADE.find((f) => f.valor === atividade)?.fator ?? 1.2;
  const get = tmb != null ? tmb * fator : null;
  const meta = get != null ? get + (paraNumero(ajuste) ?? 0) : null;

  const faltaDado =
    sexo !== "feminino" && sexo !== "masculino"
      ? "Informe o sexo (feminino ou masculino) na ficha do paciente."
      : idade == null
        ? "Informe a data de nascimento na ficha do paciente."
        : tmb == null
          ? "Preencha peso e altura."
          : null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setAberto(true)}>
        <Calculator className="size-4" /> Calcular gasto energético
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Gasto energético</DialogTitle>
            <DialogDescription>
              Escolha a equação e o fator de atividade. O resultado é uma sugestão para a meta.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="get-eq">Equação</Label>
              <Select value={equacao} onValueChange={(v) => setEquacao(v as Equacao)}>
                <SelectTrigger id="get-eq">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUACOES.map((e) => (
                    <SelectItem key={e.valor} value={e.valor}>
                      {e.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="get-peso">Peso (kg)</Label>
              <Input
                id="get-peso"
                inputMode="decimal"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="get-altura">Altura (cm)</Label>
              <Input
                id="get-altura"
                inputMode="decimal"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="get-ativ">Atividade</Label>
              <Select value={atividade} onValueChange={setAtividade}>
                <SelectTrigger id="get-ativ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FATORES_ATIVIDADE.map((f) => (
                    <SelectItem key={f.valor} value={f.valor}>
                      {f.rotulo} (×{fmt(f.fator, 3)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="get-ajuste">Ajuste (kcal)</Label>
              <Input
                id="get-ajuste"
                inputMode="decimal"
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value)}
                placeholder="-300, 0, +300"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-primary-soft p-4 text-primary-soft-foreground">
            {faltaDado ? (
              <p className="text-sm">{faltaDado}</p>
            ) : (
              <dl className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em]">TMB</dt>
                  <dd className="font-display text-xl font-semibold">{fmt(tmb)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em]">GET</dt>
                  <dd className="font-display text-xl font-semibold">{fmt(get)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em]">Meta</dt>
                  <dd className="font-display text-xl font-semibold">{fmt(meta)}</dd>
                </div>
              </dl>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
              Fechar
            </Button>
            <Button
              type="button"
              disabled={meta == null}
              onClick={() => {
                if (meta != null) onUsar(Math.round(meta));
                setAberto(false);
              }}
            >
              Usar como meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
