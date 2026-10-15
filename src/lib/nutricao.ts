import type { Database } from "@/integrations/supabase/types";

export type Alimento = Database["public"]["Tables"]["alimentos"]["Row"];
export type ItemRefeicao = Database["public"]["Tables"]["itens_refeicao"]["Row"];

export type Totais = {
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
  fibra: number;
};

export const TOTAIS_ZERO: Totais = { kcal: 0, proteina: 0, carbo: 0, gordura: 0, fibra: 0 };

/** Valores do alimento (por 100 g) proporcionais à quantidade em gramas. */
export function totaisDoItem(
  item: Pick<ItemRefeicao, "quantidade_g">,
  alimento: Alimento | null | undefined,
): Totais {
  if (!alimento || item.quantidade_g == null) return TOTAIS_ZERO;
  const fator = Number(item.quantidade_g) / 100;
  return {
    kcal: Number(alimento.kcal) * fator,
    proteina: Number(alimento.proteina) * fator,
    carbo: Number(alimento.carbo) * fator,
    gordura: Number(alimento.gordura) * fator,
    fibra: Number(alimento.fibra) * fator,
  };
}

export function somarTotais(lista: Totais[]): Totais {
  return lista.reduce(
    (acc, t) => ({
      kcal: acc.kcal + t.kcal,
      proteina: acc.proteina + t.proteina,
      carbo: acc.carbo + t.carbo,
      gordura: acc.gordura + t.gordura,
      fibra: acc.fibra + t.fibra,
    }),
    TOTAIS_ZERO,
  );
}

/** Formata número em pt-BR (vírgula decimal). */
export function fmt(valor: number | null | undefined, casas = 0) {
  if (valor == null || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Converte texto digitado ("70,5") em número; vazio vira null. */
export function paraNumero(texto: string | null | undefined): number | null {
  const limpo = (texto ?? "").trim().replace(/\./g, "").replace(",", ".");
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

export function idadeEmAnos(dataNascimento: string | null | undefined, hoje = new Date()) {
  if (!dataNascimento) return null;
  const [ano, mes, dia] = dataNascimento.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  let idade = hoje.getFullYear() - ano;
  const aindaNaoFez =
    hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia);
  if (aindaNaoFez) idade -= 1;
  return idade;
}

export type Equacao = "mifflin" | "harris-benedict";

export const EQUACOES: { valor: Equacao; rotulo: string }[] = [
  { valor: "mifflin", rotulo: "Mifflin-St Jeor" },
  { valor: "harris-benedict", rotulo: "Harris-Benedict (revisada)" },
];

/** Fatores de atividade usuais. A nutricionista confirma quais usar. */
export const FATORES_ATIVIDADE: { valor: string; rotulo: string; fator: number }[] = [
  { valor: "sedentario", rotulo: "Sedentário", fator: 1.2 },
  { valor: "leve", rotulo: "Leve", fator: 1.375 },
  { valor: "moderado", rotulo: "Moderado", fator: 1.55 },
  { valor: "alto", rotulo: "Alto", fator: 1.725 },
  { valor: "muito-alto", rotulo: "Muito alto", fator: 1.9 },
];

/**
 * Taxa metabólica basal em kcal/dia. Peso em kg, altura em cm, idade em anos.
 * Retorna null quando o sexo não é feminino/masculino ou falta algum dado.
 */
export function calcularTMB(params: {
  equacao: Equacao;
  sexo: string | null | undefined;
  pesoKg: number | null | undefined;
  alturaCm: number | null | undefined;
  idade: number | null | undefined;
}): number | null {
  const { equacao, sexo, pesoKg, alturaCm, idade } = params;
  if (pesoKg == null || alturaCm == null || idade == null) return null;
  if (sexo !== "feminino" && sexo !== "masculino") return null;
  const homem = sexo === "masculino";

  if (equacao === "mifflin") {
    return 10 * pesoKg + 6.25 * alturaCm - 5 * idade + (homem ? 5 : -161);
  }
  return homem
    ? 88.362 + 13.397 * pesoKg + 4.799 * alturaCm - 5.677 * idade
    : 447.593 + 9.247 * pesoKg + 3.098 * alturaCm - 4.33 * idade;
}

/** Percentual das calorias vindo de cada macro (4/4/9 kcal por grama). */
export function distribuicaoCalorica(t: Totais) {
  const p = t.proteina * 4;
  const c = t.carbo * 4;
  const g = t.gordura * 9;
  const total = p + c + g;
  if (total === 0) return { proteina: 0, carbo: 0, gordura: 0 };
  return { proteina: (p / total) * 100, carbo: (c / total) * 100, gordura: (g / total) * 100 };
}

export function formatarData(valor: string | null | undefined) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
