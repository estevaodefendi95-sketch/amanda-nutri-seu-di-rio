# Banco de dados (Supabase) e como mudar de projeto

Hoje o banco roda no projeto Supabase `hqzcussbeimmeuthluqo` (conta Conta Azul).
O app foi estruturado para que **trocar de projeto exija só trocar variáveis de
ambiente e rodar as migrations**. Nada no código aponta para um projeto fixo.

## O que define o banco

| Peça | Onde está | Muda ao trocar de projeto? |
| --- | --- | --- |
| Tabelas, RLS, função `has_role`, policies de storage, buckets | `supabase/migrations/*.sql` | Não. É reaplicado no novo projeto |
| URL e chaves | `.env.local` (modelo em `.env.example`) | **Sim** |
| ID do projeto para o CLI | `supabase/config.toml` (`project_id`) | **Sim** |
| Tipos TypeScript | `src/integrations/supabase/types.ts` | Só se o schema mudar |

Regra de ouro: **toda mudança de banco vira uma migration nova** em
`supabase/migrations/`. Nunca altere tabela só pelo painel, senão o schema do
repositório e o do projeto divergem e a migração quebra.

## Rodar localmente (PowerShell)

```powershell
git clone https://github.com/estevaodefendi95-sketch/amanda-nutri-seu-di-rio.git
cd amanda-nutri-seu-di-rio
npm install
Copy-Item .env.example .env.local   # preencha com as chaves do projeto
npm run dev
```

A `SUPABASE_SERVICE_ROLE_KEY` só é necessária para cadastrar pacientes (envia o
convite). Se a server function reclamar de variável ausente, defina na sessão:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "cole_aqui"
npm run dev
```

## Migrar para outro projeto Supabase

Opção rápida: `scripts\trocar-projeto-supabase.ps1` faz os passos 2 a 4.

1. **Crie o projeto novo** no Supabase e anote o *project ref*, a URL e as chaves.
2. **Aponte o app**: atualize `.env.local` (URL, publishable key, project id) e o
   `project_id` em `supabase/config.toml`.
3. **Vincule o CLI**: `npx supabase login` e depois
   `npx supabase link --project-ref NOVO_REF`.
4. **Aplique o schema**: `npx supabase db push`. Isso cria tabelas, RLS, função
   `has_role`, policies e os buckets privados.
5. **Auth** (painel do novo projeto): em *Authentication > URL Configuration*,
   defina *Site URL* e *Redirect URLs* (precisa incluir `/redefinir-senha`).
   Configure também o SMTP e os templates de e-mail de convite, se usar os seus.
6. **Dados** (só se já houver pacientes reais), na ordem:
   - Usuários de login: exportar/importar `auth.users` e `auth.identities`
     (dump data-only do schema `auth`). `db push` **não** leva usuários.
   - Tabelas do schema `public`:
     `npx supabase db dump --linked --data-only -f dados.sql` no projeto antigo e
     restaurar no novo com `psql`.
   - Arquivos do Storage (`diario-alimentar`, `fotos-evolucao`): copiar os objetos
     com `npx supabase storage cp -r ...` ou um script com a API de Storage.
     O banco guarda só o caminho do arquivo, então os caminhos precisam ser
     iguais nos dois projetos.
7. **Teste**: login de nutricionista e de paciente, convite de novo paciente,
   upload de foto e uma consulta que dependa de RLS.

> Os passos 6 (dados e usuários) não foram testados neste repositório. Ensaie em
> um projeto descartável antes de mexer em dados reais de saúde (LGPD).

## Atenção: quem vira nutricionista

`reivindicarNutricionista` (em `src/lib/pacientes.functions.ts`) dá o papel de
nutricionista ao **primeiro usuário que logar** quando ainda não existe nenhuma
nutricionista. Num projeto novo e vazio, **faça o primeiro login com a conta da
Amanda antes de convidar qualquer pessoa**, para que ninguém mais assuma o papel.

## Segurança das chaves

- `SUPABASE_SERVICE_ROLE_KEY` ignora o RLS: nunca commitar, nunca expor ao navegador.
- O `.env` versionado contém só chaves públicas (URL e publishable key). Mantenha
  segredos em `.env.local`, já coberto pelo `.gitignore` (`*.local`).
