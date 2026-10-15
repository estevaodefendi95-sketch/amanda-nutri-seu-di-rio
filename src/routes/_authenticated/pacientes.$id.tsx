import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Cake, LineChart, Phone, Salad, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, EstadoVazio } from "@/components/app-shell";
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
              </h1>
              <p className="text-sm text-muted-foreground">
                {paciente?.objetivo || "Objetivo ainda não definido"}
              </p>
            </div>
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

      <Tabs defaultValue="dieta">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="dieta">Dieta</TabsTrigger>
          <TabsTrigger value="diario">Diário</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="dieta" className="mt-5">
          <EstadoVazio
            icone={Salad}
            titulo="Nenhuma dieta cadastrada"
            texto="A montagem do plano alimentar com refeições e horários entra na próxima etapa."
          />
        </TabsContent>
        <TabsContent value="diario" className="mt-5">
          <EstadoVazio
            icone={BookOpen}
            titulo="Sem registros no diário"
            texto="Quando o paciente enviar fotos das refeições, elas aparecerão aqui para você comentar."
          />
        </TabsContent>
        <TabsContent value="evolucao" className="mt-5">
          <EstadoVazio
            icone={LineChart}
            titulo="Sem avaliações registradas"
            texto="As medidas, o percentual de gordura e as fotos comparativas chegam na próxima etapa."
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

function formatarData(valor?: string | null) {
  if (!valor) return null;
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
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
