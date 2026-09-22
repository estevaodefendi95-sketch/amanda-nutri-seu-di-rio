import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Apple, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { rotaInicial } from "@/lib/auth";
import { reivindicarNutricionista } from "@/lib/pacientes.functions";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Amanda Nutri – Área do Paciente" },
      {
        name: "description",
        content:
          "Acesse sua área exclusiva de acompanhamento nutricional com a nutricionista Amanda: dieta, diário alimentar e evolução.",
      },
      { property: "og:title", content: "Amanda Nutri – Área do Paciente" },
      {
        property: "og:description",
        content: "Acompanhamento nutricional personalizado: dieta, diário alimentar e evolução.",
      },
    ],
  }),
  component: Entrar,
});

async function irParaAreaCorreta(navigate: ReturnType<typeof useNavigate>) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  let { data: papeis } = await supabase.from("user_roles").select("role").eq("user_id", user.id);

  if (!papeis || papeis.length === 0) {
    try {
      await reivindicarNutricionista();
      const novo = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      papeis = novo.data ?? [];
    } catch {
      papeis = [];
    }
  }

  const papel = (papeis ?? []).some((p) => p.role === "nutricionista")
    ? "nutricionista"
    : "paciente";
  navigate({ to: rotaInicial(papel), replace: true });
}

function Entrar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void irParaAreaCorreta(navigate);
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);

    if (error) {
      toast.error("Não foi possível entrar. Confira o e-mail e a senha.");
      return;
    }
    toast.success("Bem-vinda(o) de volta!");
    await irParaAreaCorreta(navigate);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-primary text-primary-foreground">
            <Apple className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-foreground">Amanda Nutri</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Área do Paciente — seu acompanhamento nutricional em um só lugar.
          </p>
        </div>

        <form
          onSubmit={entrar}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
            Entrar
          </Button>

          <div className="text-center">
            <Link to="/recuperar-senha" className="text-sm text-primary underline-offset-4 hover:underline">
              Esqueci minha senha
            </Link>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          O acesso é criado pela nutricionista. Se ainda não recebeu seu convite por e-mail, fale com
          a Amanda.
        </p>
      </div>
    </div>
  );
}
