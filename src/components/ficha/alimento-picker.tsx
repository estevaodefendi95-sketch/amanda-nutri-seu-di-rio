import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { fmt, type Alimento } from "@/lib/nutricao";

/** Busca alimentos na tabela do banco e devolve o escolhido (ou um item livre). */
export function AlimentoPicker({
  onEscolher,
  onItemLivre,
}: {
  onEscolher: (alimento: Alimento) => void;
  onItemLivre: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const busca = termo.trim();

  const { data, isFetching } = useQuery({
    queryKey: ["alimentos-busca", busca],
    enabled: aberto,
    queryFn: async () => {
      let consulta = supabase.from("alimentos").select("*").order("nome").limit(25);
      if (busca) consulta = consulta.ilike("nome", `%${busca.replace(/[%_]/g, "")}%`);
      const { data, error } = await consulta;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm">
          <Plus className="size-4" /> Adicionar alimento
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,26rem)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar alimento..." value={termo} onValueChange={setTermo} />
          <CommandList>
            <CommandEmpty>
              {isFetching
                ? "Buscando..."
                : "Nenhum alimento encontrado. Cadastre em Alimentos ou use um item livre."}
            </CommandEmpty>
            <CommandGroup>
              {(data ?? []).map((a) => (
                <CommandItem
                  key={a.id}
                  value={a.id}
                  onSelect={() => {
                    onEscolher(a);
                    setAberto(false);
                    setTermo("");
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{a.nome}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmt(Number(a.kcal))} kcal/100 g
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                value="__livre__"
                onSelect={() => {
                  onItemLivre();
                  setAberto(false);
                  setTermo("");
                }}
              >
                Adicionar item livre (sem cálculo)
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
