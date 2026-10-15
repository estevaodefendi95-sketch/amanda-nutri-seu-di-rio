import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Pacientes ativos (id e nome), para seletores e para mostrar nomes em listas. */
export function usePacientesAtivos() {
  return useQuery({
    queryKey: ["pacientes-ativos"],
    queryFn: async () => {
      const { data: papeis, error: papeisError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "paciente");
      if (papeisError) throw papeisError;
      const ids = (papeis ?? []).map((p) => p.user_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome")
        .in("id", ids)
        .neq("status", "arquivado")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}
