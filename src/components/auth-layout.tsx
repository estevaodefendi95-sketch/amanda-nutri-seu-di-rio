import { HeartHandshake, Leaf, NotebookPen, Salad } from "lucide-react";
import type { ReactNode } from "react";

const DESTAQUES = [
  { icone: Salad, titulo: "Seu plano alimentar", texto: "Refeições e horários sempre à mão." },
  {
    icone: NotebookPen,
    titulo: "Diário sem culpa",
    texto: "Registre o que comeu e receba retorno.",
  },
  { icone: HeartHandshake, titulo: "Acompanhamento próximo", texto: "Sua evolução, no seu ritmo." },
];

/** Layout compartilhado de login, recuperação e redefinição de senha. */
export function AuthLayout({
  titulo,
  descricao,
  children,
  rodape,
}: {
  titulo: string;
  descricao?: string | undefined;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold">Amanda Nutri</span>
        </div>

        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            Área do paciente
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight">
            Cuidar de você, sem culpa e sem proibições.
          </h2>
          <ul className="mt-10 space-y-5">
            {DESTAQUES.map((d) => (
              <li key={d.titulo} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <d.icone className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{d.titulo}</span>
                  <span className="block text-sm text-white/75">{d.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/60">Seus dados de saúde são privados e protegidos.</p>
      </aside>

      <main className="flex flex-col items-center justify-center bg-page px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 text-center lg:text-left">
            <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-brand text-primary-foreground shadow-soft lg:hidden">
              <Leaf className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold text-foreground lg:mt-0 sm:text-4xl">
              {titulo}
            </h1>
            {descricao ? (
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">{descricao}</p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-lift sm:p-8">
            {children}
          </div>

          {rodape ? (
            <div className="mt-6 text-center text-xs text-muted-foreground lg:text-left">
              {rodape}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
