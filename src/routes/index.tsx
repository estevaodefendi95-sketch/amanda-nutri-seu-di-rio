import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AuthLayout } from "@/components/auth-layout";
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
    <AuthLayout
      titulo="Bem-vinda(o) de volta"
      descricao="Entre para ver seu plano, registrar suas refeições e acompanhar sua evolução."
      rodape="O acesso é criado pela nutricionista. Se ainda não recebeu seu convite por e-mail, fale com a Amanda."
    >
      <form onSubmit={entrar} className="space-y-5">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            <Link
              to="/recuperar-senha"
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
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

        <Button type="submit" size="lg" className="w-full" disabled={carregando}>
          {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
