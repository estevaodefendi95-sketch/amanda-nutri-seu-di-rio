import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "nutricionista" | "paciente";

export function usePerfilAtual() {
  return useQuery({
    queryKey: ["perfil-atual"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const [{ data: papeis }, { data: perfil }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      const papel: Papel = (papeis ?? []).some((p) => p.role === "nutricionista")
        ? "nutricionista"
        : "paciente";

      return { user, papel, perfil };
    },
    staleTime: 60_000,
  });
}

export function useSair() {
  const navigate = useNavigate();
  return async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}

export function rotaInicial(papel: Papel) {
  return papel === "nutricionista" ? "/painel" : "/inicio";
}
