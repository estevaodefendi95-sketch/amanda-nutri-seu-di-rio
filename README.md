# Amanda Nutri: Seu Diário

Crie um sistema web de acompanhamento nutricional chamado "Amanda Nutri – Área do Paciente", 

integrado ao site institucional https://amandanutricionista.lovable.app (manter identidade 

visual semelhante: cores, tipografia e tom acolhedor/profissional).

Stack: React + TypeScript + Tailwind + shadcn/ui, com Supabase (Auth, Database, Storage).

Interface 100% em português do Brasil, responsiva e mobile-first (pacientes usarão pelo celular).

## Perfis de acesso

- Nutricionista (admin): gerencia pacientes, dietas e avaliações.

- Paciente: acessa apenas os próprios dados.

Os papéis devem ficar em uma tabela separada `user_roles` (enum: 'nutricionista', 'paciente'), 

com função `has_role()` security definer para uso nas políticas RLS. Não guardar papel na tabela de perfis.

Paciente não se cadastra sozinho: a nutricionista cria/convida o paciente pelo e-mail.

## Banco de dados (com RLS em todas as tabelas)

- profiles: id (ref auth.users), nome, telefone, data_nascimento, sexo, objetivo, observacoes, created_at

- dietas: id, paciente_id, titulo, descricao, data_inicio, data_fim, ativa (bool), created_at

- refeicoes_dieta: id, dieta_id, nome (ex.: Café da manhã), horario, alimentos (texto), observacoes, ordem

- diario_alimentar: id, paciente_id, data, refeicao, foto_url, descricao, comentario_nutricionista, created_at

- avaliacoes: id, paciente_id, data, peso, altura, percentual_gordura, massa_magra, 

  circunferencias (jsonb: cintura, quadril, braço, coxa, abdômen), observacoes

- fotos_evolucao: id, avaliacao_id, paciente_id, tipo ('frente','lado','costas'), foto_url

Regras RLS: paciente lê apenas registros com seu próprio id e pode inserir/editar só no 

diario_alimentar; nutricionista tem acesso total.

## Storage

Buckets PRIVADOS "diario-alimentar" e "fotos-evolucao", organizados por pasta do id do paciente, 

acessados via signed URLs. São dados de saúde (LGPD), nada público.

## Telas desta primeira etapa

1. Login (e-mail/senha) e recuperação de senha.

2. Layout com menu lateral (desktop) e barra inferior (mobile), diferente por perfil.

3. Nutricionista: Dashboard (total de pacientes, diários enviados hoje), Lista de Pacientes 

   com busca, cadastro de paciente e página do paciente com abas vazias: Dieta, Diário, Evolução.

4. Paciente: Início (dieta ativa resumida), Minha Dieta, Diário Alimentar, Minha Evolução 

   (telas com estrutura e estados vazios por enquanto).

Nesta etapa foque em autenticação, papéis, banco, RLS e navegação. As funcionalidades de 

upload, montagem de dieta e gráficos comparativos serão implementadas nos próximos prompts.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a5c17327-6b8f-4727-ad08-375f9dfd20e3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
