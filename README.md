# Imune

O Imune ajuda a organizar os dados dos pets, compartilhar o acompanhamento com cotitulares e manter o histórico de vacinação.

## Começar

Requisitos: Node.js, npm e acesso a um projeto Supabase.

```bash
git clone <URL_DO_REPOSITORIO>
cd imune-projeto
npm install
```

Crie um arquivo `.env` na raiz com as credenciais do Supabase:

```env
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

Obtenha os valores nas configurações do projeto Supabase. A `SUPABASE_SERVICE_ROLE_KEY` é secreta: não a compartilhe nem a exponha com prefixo `VITE_`. O arquivo `.env` já é ignorado pelo Git.

## Banco de dados

Aplique as migrations pendentes ao projeto Supabase conectado:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

Confira o resultado do `--dry-run` antes de aplicar. O `db push` aplica todas as migrations locais que ainda não foram executadas no projeto remoto.

## Executar

```bash
npm run dev
```

Abra no navegador o endereço informado pelo Vite.
