# YRM Lead System

## Setup

Crie um arquivo `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
N8N_LEAD_OWNER_USER_ID=
```

`SUPABASE_SERVICE_ROLE_KEY` é a chave recomendada para a rota de integração do n8n. Se ela não estiver definida, o app usa a chave pública como fallback.

## Rodando localmente

```bash
npm install
npm run dev
```

## Deploy no Railway / Nixpacks

Use os comandos abaixo na tela de deploy:

- Instalação: `npm install`
- Build: `npm run build`
- Início: `npm start`

O script `npm start` já sobe o Next em `0.0.0.0`, compatível com o container do Railway.

Para builders baseados em Nixpacks, o repositório também fixa Node 20 via:

- `.nvmrc`
- `nixpacks.toml` com `NIXPACKS_NODE_VERSION="20"`

Isso evita o fallback para Node 18, que falha com Next.js 16.

Defina também as variáveis de ambiente no serviço:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_LEAD_OWNER_USER_ID`

## Migração do banco

A migração necessária para suportar integração com n8n está em:

`supabase/migrations/20260326180000_n8n_lead_integration_support.sql`

Ela adiciona:

- campos de qualificação e última interação em `leads`
- metadados e direção da mensagem em `messages`
- tabela `notifications`

## Endpoint do n8n

Endpoint completo atual:

`https://elephant-app-leads.zituks.easypanel.host/api/integrations/n8n/lead-events`

Status atual:

- rota pública temporariamente
- sem `Authorization`
- sem `x-api-key`
- o corpo da requisição continua sendo validado

Observação operacional:

- isso só deve permanecer assim enquanto o endpoint não estiver amplamente exposto
- mantenha o volume controlado
- reative a autenticação antes de abrir a integração para produção mais ampla

Payload base:

```json
{
  "event": "message.created",
  "external_session_id": "558592607356@s.whatsapp.net",
  "phone_number": "558592607356",
  "lead_name": "Arthur Brito",
  "message_direction": "inbound",
  "message_content": "Olá, quero entender a solução.",
  "message_id": "wamid-123",
  "content_type": "text",
  "classification": "quente",
  "lead_tier": "A",
  "score": 23,
  "status": "classificado",
  "qualification_summary": "Lead com urgência e perfil decisor.",
  "occurred_at": "2026-03-26T16:47:24.214Z",
  "metadata": {
    "source": "n8n",
    "conversation_id": "123",
    "sender_id": "456"
  }
}
```

Eventos aceitos:

- `lead.created`
- `lead.classified`
- `message.created`
