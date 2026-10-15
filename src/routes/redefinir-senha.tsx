import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Criar nova senha | Amanda Nutri" },
      {
        name: "description",
        content: "Defina uma nova senha para acessar sua área de acompanhamento nutricional.",
      },
      { property: "og:title", content: "Criar nova senha | Amanda Nutri" },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
    ],
  }),
  component: RedefinirSenha,
});

function RedefinirSenha() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setPronto(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (session) setPronto(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) {
      toast.error("Use pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      toast.error("As senhas não são iguais.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);

    if (error) {
      toast.error("Não foi possível salvar a nova senha. Peça um novo link.");
      return;
    }
    toast.success("Senha atualizada!");
    navigate({ to: "/", replace: true });
  }

  return (
    <AuthLayout
      titulo="Criar nova senha"
      descricao={pronto ? "Escolha uma senha com pelo menos 8 caracteres." : undefined}
    >
      {pronto ? (
        <form onSubmit={salvar} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="senha">Nova senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacao">Confirmar senha</Label>
            <Input
              id="confirmacao"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={carregando}>
            {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar senha
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Abra esta página pelo link que enviamos no seu e-mail para definir a nova senha.
        </p>
      )}
    </AuthLayout>
  );
}
