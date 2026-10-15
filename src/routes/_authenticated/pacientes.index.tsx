import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, Carregando, EstadoVazio, TituloPagina } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/pacientes/")({
  head: () => ({
    meta: [
      { title: "Pacientes | Amanda Nutri" },
      {
        name: "description",
        content:
          "Lista de pacientes em acompanhamento, com busca por nome e acesso à ficha completa.",
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
        .neq("status", "arquivado")
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
        sobretitulo={
          data ? `${data.length} ${data.length === 1 ? "paciente" : "pacientes"}` : undefined
        }
        titulo="Pacientes"
        descricao="Acompanhe quem está com você e abra a ficha de cada pessoa."
        acao={
          <Button asChild size="lg">
            <Link to="/pacientes/novo">
              <UserPlus className="size-4" /> Novo paciente
            </Link>
          </Button>
        }
      />

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome"
          aria-label="Buscar paciente por nome"
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <Carregando />
      ) : filtrados.length === 0 ? (
        <EstadoVazio
          titulo={busca ? "Ninguém encontrado" : "Nenhum paciente por aqui"}
          texto={
            busca
              ? "Confira a grafia do nome ou limpe a busca."
              : "Cadastre o primeiro paciente para começar o acompanhamento."
          }
          icone={Users}
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtrados.map((paciente) => (
            <li key={paciente.id}>
              <Link
                to="/pacientes/$id"
                params={{ id: paciente.id }}
                className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <Avatar nome={paciente.nome} className="size-12 text-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">
                    {paciente.nome || "Sem nome"}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {paciente.objetivo || paciente.telefone || "Sem objetivo definido"}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
