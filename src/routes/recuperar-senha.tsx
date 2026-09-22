import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recuperar-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Recuperar senha | Amanda Nutri" },
      {
        name: "description",
        content: "Receba por e-mail um link para criar uma nova senha de acesso à Área do Paciente.",
      },
      { property: "og:title", content: "Recuperar senha | Amanda Nutri" },
      { property: "og:description", content: "Link por e-mail para criar uma nova senha." },
    ],
  }),
  component: RecuperarSenha,
});

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setCarregando(false);

    if (error) {
      toast.error("Não foi possível enviar o e-mail agora. Tente novamente.");
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-display text-2xl text-foreground">Recuperar senha</h1>

        {enviado ? (
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <MailCheck className="size-8 text-primary" />
            <p>
              Enviamos um link para <strong className="text-foreground">{email}</strong>. Abra o
              e-mail e escolha sua nova senha.
            </p>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/">Voltar para o login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
              Enviar link
            </Button>
            <div className="text-center">
              <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
