import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";

import { Avatar, Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { usePerfilAtual } from "@/lib/auth";
import { usePacientesAtivos } from "@/lib/pacientes";

export const Route = createFileRoute("/_authenticated/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens | Amanda Nutri" },
      { name: "description", content: "Recados entre a nutricionista e o paciente." },
    ],
  }),
  component: Mensagens,
});

function Mensagens() {
  const { data: perfil, isLoading } = usePerfilAtual();
  const { data: pacientes } = usePacientesAtivos();
  const [escolhido, setEscolhido] = useState<string | null>(null);

  if (isLoading || !perfil) return <Carregando />;

  if (perfil.papel === "paciente") {
    return (
      <>
        <TituloPagina
          sobretitulo="Conversa"
          titulo="Mensagens"
          descricao="Um canal direto com a Amanda para dúvidas rápidas."
        />
        <Conversa pacienteId={perfil.user.id} meuId={perfil.user.id} />
      </>
    );
  }

  return (
    <>
      <TituloPagina
        sobretitulo="Conversa"
        titulo="Mensagens"
        descricao="Recados curtos por paciente. Para o que for urgente, use o seu canal habitual."
      />
      <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="Pacientes" className="space-y-1">
          {(pacientes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum paciente ainda.</p>
          ) : (
            (pacientes ?? []).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setEscolhido(p.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-secondary/60 ${
                  escolhido === p.id ? "bg-secondary" : ""
                }`}
              >
                <Avatar nome={p.nome} />
                <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                  {p.nome || "Sem nome"}
                </span>
              </button>
            ))
          )}
        </nav>
        {escolhido ? (
          <Conversa key={escolhido} pacienteId={escolhido} meuId={perfil.user.id} />
        ) : (
          <EstadoVazio
            icone={MessageCircle}
            titulo="Escolha um paciente"
            texto="Selecione alguém na lista para ver e responder os recados."
          />
        )}
      </div>
    </>
  );
}

function Conversa({ pacienteId, meuId }: { pacienteId: string; meuId: string }) {
  const queryClient = useQueryClient();
  const [enviando, setEnviando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["mensagens", pacienteId],
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at")
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const naoLidas = (data ?? []).filter((m) => m.autor_id !== meuId && !m.lida_em).length;

  useEffect(() => {
    if (naoLidas === 0) return;
    void supabase
      .from("mensagens")
      .update({ lida_em: new Date().toISOString() })
      .eq("paciente_id", pacienteId)
      .neq("autor_id", meuId)
      .is("lida_em", null)
      .then(() => queryClient.invalidateQueries({ queryKey: ["mensagens-nao-lidas"] }));
  }, [naoLidas, pacienteId, meuId, queryClient]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [data?.length]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const texto = String(new FormData(form).get("texto") ?? "").trim();
    if (!texto) return;
    setEnviando(true);
    const { error } = await supabase
      .from("mensagens")
      .insert({ paciente_id: pacienteId, autor_id: meuId, texto });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível enviar.");
      return;
    }
    form.reset();
    await queryClient.invalidateQueries({ queryKey: ["mensagens", pacienteId] });
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="max-h-[28rem] min-h-40 space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            <Carregando />
          ) : (data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
          ) : (
            (data ?? []).map((m) => {
              const minha = m.autor_id === meuId;
              return (
                <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${
                      minha
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {m.texto}
                  </p>
                </div>
              );
            })
          )}
          <div ref={fim} />
        </div>
        <form onSubmit={enviar} className="flex items-end gap-2">
          <Textarea
            name="texto"
            rows={2}
            maxLength={2000}
            required
            aria-label="Mensagem"
            placeholder="Escreva um recado"
            className="flex-1"
          />
          <Button type="submit" disabled={enviando} aria-label="Enviar mensagem">
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
