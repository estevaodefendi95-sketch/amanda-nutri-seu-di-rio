import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TituloPagina } from "@/components/app-shell";
import { criarPaciente } from "@/lib/pacientes.functions";

export const Route = createFileRoute("/_authenticated/pacientes/novo")({
  head: () => ({
    meta: [
      { title: "Cadastrar paciente | Amanda Nutri" },
      {
        name: "description",
        content:
          "Cadastre um novo paciente e envie automaticamente o convite de acesso por e-mail.",
      },
      { property: "og:title", content: "Cadastrar paciente | Amanda Nutri" },
      { property: "og:description", content: "Cadastro de paciente com convite por e-mail." },
    ],
  }),
  component: NovoPaciente,
});

function NovoPaciente() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const enviar = useServerFn(criarPaciente);
  const [salvando, setSalvando] = useState(false);
  const [sexo, setSexo] = useState("");

  async function submeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSalvando(true);
    try {
      const resultado = await enviar({
        data: {
          email: String(form.get("email") ?? "").trim(),
          nome: String(form.get("nome") ?? "").trim(),
          telefone: String(form.get("telefone") ?? ""),
          data_nascimento: String(form.get("data_nascimento") ?? ""),
          sexo,
          objetivo: String(form.get("objetivo") ?? ""),
          observacoes: String(form.get("observacoes") ?? ""),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      toast.success("Paciente cadastrado! Enviamos o convite de acesso por e-mail.");
      navigate({ to: "/pacientes/$id", params: { id: resultado.id } });
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Não foi possível cadastrar agora. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <TituloPagina
        sobretitulo="Cadastro"
        titulo="Novo paciente"
        descricao="O paciente recebe um convite por e-mail para criar a própria senha."
      />

      <form onSubmit={submeter} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" name="nome" required placeholder="Maria Souza" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail (recebe o convite)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="maria@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  inputMode="tel"
                  placeholder="(11) 90000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de nascimento</Label>
                <Input id="data_nascimento" name="data_nascimento" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Select value={sexo} onValueChange={setSexo}>
                  <SelectTrigger id="sexo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acompanhamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Input
                id="objetivo"
                name="objetivo"
                placeholder="Emagrecimento, saúde, performance..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                rows={4}
                placeholder="Histórico, restrições alimentares, preferências..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg" disabled={salvando}>
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
            Cadastrar e convidar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => navigate({ to: "/pacientes" })}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
