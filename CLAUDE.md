@AGENTS.md

# Amanda Nutri: Seu Diário

Sistema de acompanhamento nutricional (inspirado no WebDiet) para a nutricionista
Amanda e seus pacientes. Interface 100% em português do Brasil, mobile-first.

## Stack
TanStack Start (React 19, file-based routing em `src/routes`) + Tailwind v4 + shadcn/ui
+ Supabase (Auth, Postgres com RLS, Storage). Gerado e sincronizado com o Lovable.

## Comandos (PowerShell)
```powershell
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm run lint
```
Verifique com `npx tsc --noEmit` antes de finalizar (tsconfig estrito:
`exactOptionalPropertyTypes` e `noUncheckedIndexedAccess`).

## Convenções
- Textos de interface em pt-BR; nomes de tabelas e colunas também em português.
- Cores só por tokens semânticos (`bg-primary`, `bg-primary-soft`, `text-muted-foreground`...)
  definidos em `src/styles.css` (oklch). Não usar cores fixas.
- Fontes: Fraunces (títulos, `font-display`) e Nunito Sans (texto).
- Blocos reutilizáveis de página em `src/components/app-shell.tsx`
  (`TituloPagina`, `EstadoVazio`, `CartaoNumero`, `Avatar`, `Carregando`) e
  `src/components/auth-layout.tsx`.
- Não editar `src/routeTree.gen.ts` nem `src/integrations/supabase/{client,client.server,types}.ts`
  (gerados).

## Banco de dados
- Toda mudança de schema vira **nova migration** em `supabase/migrations/`.
  Nunca alterar só pelo painel do Supabase.
- Deve continuar portátil para outro projeto Supabase: nada de URL/chave fixa no código.
  Guia completo em `docs/BANCO-DE-DADOS.md`.
- Papéis ficam em `user_roles` (nunca em `profiles`); RLS em todas as tabelas.
- Buckets de storage são privados (dados de saúde, LGPD); acesso por signed URL.

## Git
Não reescrever histórico já publicado (força push, rebase, amend): o repositório é
sincronizado com o Lovable.
