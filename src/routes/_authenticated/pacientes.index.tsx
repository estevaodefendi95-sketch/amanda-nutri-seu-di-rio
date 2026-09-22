import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Search, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EstadoVazio, TituloPagina } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/pacientes/")({
  head: () => ({
    meta: [
      { title: "Pacientes | Amanda Nutri" },
      {
        name: "description",
        content: "Lista de pacientes em acompanhamento, com busca por nome e acesso à ficha completa.",
      },
      { property: "og:title", content: "Pacientes | Amanda Nutri" },
      { property: "og:description", content: "Lista de pacientes em acompanhamento." },
    ],
  }),
  component: Pacientes,
});

function Pacientes() {
  const [busca, setBusca] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pacientes"],
    queryFn: async () => {
      const { data: papeis, error: papeisError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "paciente");
      if (papeisError) throw papeisError;

      const ids = (papeis ?? []).map((p) => p.user_id);
      if (ids.length === 0) return [];

      const { data: perfis, error } = await supabase
        .from("profiles")
        .select("id, nome, telefone, objetivo")
        .in("id", ids)
        .order("nome");
      if (error) throw error;
      return perfis ?? [];
    },
  });

  const filtrados = (data ?? []).filter((p) =>
    (p.nome ?? "").toLowerCase().includes(busca.trim().toLowerCase()),
  );

  return (
    <>
      <TituloPagina
        titulo="Pacientes"
        descricao="Acompanhe quem está com você e abra a ficha de cada pessoa."
        acao={
          <Button asChild>
            <Link to="/pacientes/novo">
              <UserPlus className="size-4" /> Novo paciente
            </Link>
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum paciente por aqui"
          texto="Cadastre o primeiro paciente para começar o acompanhamento."
        />
      ) : (
        <ul className="space-y-2">
          {filtrados.map((paciente) => (
            <li key={paciente.id}>
              <Link
                to="/pacientes/$id"
                params={{ id: paciente.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg text-secondary-foreground">
                  {(paciente.nome || "?").charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">
                    {paciente.nome || "Sem nome"}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {paciente.objetivo || paciente.telefone || "Sem objetivo definido"}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
