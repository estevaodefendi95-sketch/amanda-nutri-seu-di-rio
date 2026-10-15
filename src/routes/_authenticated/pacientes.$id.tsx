import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Cake, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/app-shell";
import { AbaExames } from "@/components/ficha/aba-exames";
import { AbaMetas } from "@/components/ficha/aba-metas";
import { AbaAnamnese } from "@/components/ficha/aba-anamnese";
import { AbaAvaliacoes } from "@/components/ficha/aba-avaliacoes";
import { AbaDiario } from "@/components/ficha/aba-diario";
import { AbaPlano } from "@/components/ficha/aba-plano";
import { ConfiguracoesPaciente, EditarPaciente } from "@/components/ficha/dados-paciente";
import { formatarData } from "@/lib/nutricao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/pacientes/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do paciente | Amanda Nutri" },
      {
        name: "description",
        content: "Ficha do paciente com dieta, diário alimentar e evolução em um só lugar.",
      },
      { property: "og:title", content: "Ficha do paciente | Amanda Nutri" },
      { property: "og:description", content: "Dieta, diário alimentar e evolução do paciente." },
    ],
  }),
  component: FichaPaciente,
});

function FichaPaciente() {
  const { id } = Route.useParams();

  const { data: paciente } = useQuery({
    queryKey: ["paciente", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/pacientes">
          <ArrowLeft className="size-4" /> Pacientes
        </Link>
      </Button>

      <Card className="mb-6 overflow-hidden">
        <div className="h-20 bg-brand" />
        <CardContent className="-mt-10 pb-6">
          <div className="flex flex-wrap items-end gap-4">
            <Avatar
              nome={paciente?.nome}
              className="size-20 border-4 border-card text-3xl shadow-soft"
            />
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {paciente?.nome || "Paciente"}
                {paciente?.status === "arquivado" ? (
                  <span className="ml-2 align-middle text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    arquivado
                  </span>
                ) : null}
              </h1>
              <p className="text-sm text-muted-foreground">
                {paciente?.objetivo || "Objetivo ainda não definido"}
              </p>
            </div>
            {paciente ? <EditarPaciente paciente={paciente} /> : null}
          </div>

          <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <Dado icone={Phone} rotulo="Telefone" valor={paciente?.telefone} />
            <Dado
              icone={Cake}
              rotulo="Nascimento"
              valor={formatarData(paciente?.data_nascimento)}
            />
            <Dado icone={User} rotulo="Sexo" valor={paciente?.sexo} capitalizar />
          </div>

          {paciente?.observacoes ? (
            <p className="mt-5 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
              <strong className="font-semibold">Observações: </strong>
              {paciente.observacoes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {paciente ? (
        <Tabs defaultValue="plano">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="plano">Plano alimentar</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            <TabsTrigger value="diario">Diário</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="exames">Exames</TabsTrigger>
            <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="plano" className="mt-5">
            <AbaPlano pacienteId={id} />
          </TabsContent>
          <TabsContent value="avaliacoes" className="mt-5">
            <AbaAvaliacoes
              pacienteId={id}
              alturaPadrao={paciente.altura_cm != null ? Number(paciente.altura_cm) : null}
            />
          </TabsContent>
          <TabsContent value="diario" className="mt-5">
            <AbaDiario pacienteId={id} />
          </TabsContent>
          <TabsContent value="metas" className="mt-5">
            <AbaMetas pacienteId={id} />
          </TabsContent>
          <TabsContent value="exames" className="mt-5">
            <AbaExames pacienteId={id} />
          </TabsContent>
          <TabsContent value="anamnese" className="mt-5">
            <AbaAnamnese pacienteId={id} />
          </TabsContent>
          <TabsContent value="config" className="mt-5">
            <ConfiguracoesPaciente paciente={paciente} />
          </TabsContent>
        </Tabs>
      ) : null}
    </>
  );
}

function Dado({
  rotulo,
  valor,
  icone: Icone,
  capitalizar,
}: {
  rotulo: string;
  valor: string | null | undefined;
  icone: typeof Phone;
  capitalizar?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">
        <Icone className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {rotulo}
        </p>
        <p className={`truncate font-semibold text-foreground ${capitalizar ? "capitalize" : ""}`}>
          {valor || "—"}
        </p>
      </div>
    </div>
  );
}
