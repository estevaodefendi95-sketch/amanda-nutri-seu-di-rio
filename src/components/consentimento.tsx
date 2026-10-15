import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Carregando } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { usePerfilAtual } from "@/lib/auth";

/** Troque a versão quando o texto mudar: todos os pacientes precisarão aceitar de novo. */
export const VERSAO_TERMO = "2026-10";

/** Exige o aceite dos termos (LGPD) antes de o paciente usar o sistema. */
export function PortaoConsentimento({ children }: { children: ReactNode }) {
  const { data: perfil } = usePerfilAtual();
  const queryClient = useQueryClient();
  const [aceito, setAceito] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const userId = perfil?.user.id;
  const ehPaciente = perfil?.papel === "paciente";

  const { data: ja, isLoading } = useQuery({
    queryKey: ["consentimento", userId, VERSAO_TERMO],
    enabled: Boolean(userId) && ehPaciente,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consentimentos")
        .select("id")
        .eq("user_id", userId!)
        .eq("versao", VERSAO_TERMO)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  if (!ehPaciente) return <>{children}</>;
  if (isLoading || ja === undefined) return <Carregando />;
  if (ja) return <>{children}</>;

  async function aceitar() {
    if (!userId) return;
    setSalvando(true);
    const { error } = await supabase
      .from("consentimentos")
      .insert({ user_id: userId, versao: VERSAO_TERMO });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível registrar o aceite. Tente novamente.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["consentimento", userId, VERSAO_TERMO] });
  }

  return (
    <div className="mx-auto max-w-xl py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">
              <ShieldCheck className="size-5" />
            </span>
            Seus dados, com cuidado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-foreground/80">
          <p>
            Para acompanhar sua saúde, a nutricionista Amanda registra aqui dados pessoais e de
            saúde: medidas, histórico, fotos e o diário alimentar. Eles são tratados conforme a Lei
            Geral de Proteção de Dados (LGPD).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Só você e a nutricionista têm acesso às suas informações.</li>
            <li>Usamos os dados apenas para o seu acompanhamento nutricional.</li>
            <li>Você pode pedir a correção ou a exclusão dos seus dados a qualquer momento.</li>
          </ul>
          <label className="flex items-start gap-3 rounded-xl bg-secondary p-3">
            <Checkbox
              checked={aceito}
              onCheckedChange={(v) => setAceito(v === true)}
              className="mt-0.5"
            />
            <span>
              Li e concordo com o tratamento dos meus dados para o acompanhamento nutricional.
            </span>
          </label>
          <Button className="w-full" disabled={!aceito || salvando} onClick={aceitar}>
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
