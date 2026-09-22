import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstadoVazio, TituloPagina } from "@/components/app-shell";
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
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link to="/pacientes">
          <ArrowLeft className="size-4" /> Pacientes
        </Link>
      </Button>

      <TituloPagina
        titulo={paciente?.nome || "Paciente"}
        descricao={paciente?.objetivo || "Objetivo ainda não definido"}
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <Dado rotulo="Telefone" valor={paciente?.telefone} />
          <Dado rotulo="Nascimento" valor={formatarData(paciente?.data_nascimento)} />
          <Dado rotulo="Sexo" valor={paciente?.sexo} />
        </CardContent>
      </Card>

      <Tabs defaultValue="dieta">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="dieta">Dieta</TabsTrigger>
          <TabsTrigger value="diario">Diário</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="dieta" className="mt-4">
          <EstadoVazio
            titulo="Nenhuma dieta cadastrada"
            texto="A montagem do plano alimentar com refeições e horários entra na próxima etapa."
          />
        </TabsContent>
        <TabsContent value="diario" className="mt-4">
          <EstadoVazio
            titulo="Sem registros no diário"
            texto="Quando o paciente enviar fotos das refeições, elas aparecerão aqui para você comentar."
          />
        </TabsContent>
        <TabsContent value="evolucao" className="mt-4">
          <EstadoVazio
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

function Dado({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="truncate font-semibold text-foreground">{valor || "—"}</p>
    </div>
  );
}
