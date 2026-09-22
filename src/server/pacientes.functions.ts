import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type NovoPaciente = {
  email: string;
  nome: string;
  telefone?: string;
  data_nascimento?: string;
  sexo?: string;
  objetivo?: string;
  observacoes?: string;
};

/**
 * Garante que exista uma nutricionista no sistema. O primeiro usuário que
 * chamar esta função recebe o papel de nutricionista; depois disso ninguém mais.
 */
export const reivindicarNutricionista = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "nutricionista");
    if (countError) throw new Error(countError.message);

    if ((count ?? 0) > 0) {
      return { concedido: false as const };
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "nutricionista" });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: context.userId, nome: "Amanda" }, { onConflict: "id" });

    return { concedido: true as const };
  });

/** Cria (convida) um paciente. Apenas a nutricionista pode chamar. */
export const criarPaciente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((dados: NovoPaciente) => dados)
  .handler(async ({ data, context }) => {
    const { data: autorizado, error: papelError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "nutricionista",
    });
    if (papelError) throw new Error(papelError.message);
    if (!autorizado) throw new Error("Apenas a nutricionista pode cadastrar pacientes.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: convite, error: conviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
    );
    if (conviteError || !convite?.user) {
      throw new Error(conviteError?.message ?? "Não foi possível convidar este e-mail.");
    }

    const pacienteId = convite.user.id;

    const { error: perfilError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: pacienteId,
        nome: data.nome,
        telefone: data.telefone || null,
        data_nascimento: data.data_nascimento || null,
        sexo: data.sexo || null,
        objetivo: data.objetivo || null,
        observacoes: data.observacoes || null,
      },
      { onConflict: "id" },
    );
    if (perfilError) throw new Error(perfilError.message);

    const { error: papelInsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: pacienteId, role: "paciente" }, { onConflict: "user_id,role" });
    if (papelInsertError) throw new Error(papelInsertError.message);

    return { id: pacienteId };
  });
