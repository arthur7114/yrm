# YRM Lead System

## Setup

Crie um arquivo `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
N8N_LEAD_OWNER_USER_ID=
N8N_INTEGRATION_BEARER_TOKEN=
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
- `N8N_INTEGRATION_BEARER_TOKEN`

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

- rota autenticada com `Authorization: Bearer <N8N_INTEGRATION_BEARER_TOKEN>`
- sem `x-api-key`
- aceita apenas envelope canônico v1
- deduplica por `event_id` e, em `message.created`, também por `payload.external_message_id`

Payload base:

```json
{
  "event_id": "execution-1:message.inbound:wamid-123",
  "event_type": "message.created",
  "event_version": 1,
  "source": "n8n",
  "occurred_at": "2026-03-26T16:47:24.214Z",
  "lead": {
    "external_session_id": "558592607356@s.whatsapp.net",
    "phone_number": "558592607356",
    "lead_name": "Arthur Brito"
  },
  "payload": {
    "direction": "inbound",
    "sender_type": "lead",
    "external_message_id": "wamid-123",
    "content_type": "text",
    "message_content": "Olá, quero entender a solução."
  },
  "metadata": {
    "provider": "whatsapp",
    "conversation_id": "123",
    "sender_id": "456",
    "workflow_id": "uSyQG0p1lSp-T5-4HUI-C"
  }
}
```

Eventos aceitos:

- `message.created` com `payload.direction=inbound`
- `lead.classified`
- `message.created` com `payload.direction=outbound`

Payload de `lead.classified`:

```json
{
  "event_id": "execution-1:lead.classified:558592607356@s.whatsapp.net",
  "event_type": "lead.classified",
  "event_version": 1,
  "source": "n8n",
  "occurred_at": "2026-03-26T16:47:24.214Z",
  "lead": {
    "external_session_id": "558592607356@s.whatsapp.net",
    "phone_number": "558592607356",
    "lead_name": "Arthur Brito"
  },
  "payload": {
    "temperatura": "quente",
    "score": 23,
    "tier": "A",
    "qualification_summary": "Lead com urgência e perfil decisor.",
    "target_status": "aguardando_humano"
  },
  "metadata": {
    "provider": "whatsapp",
    "conversation_id": "123",
    "sender_id": "456",
    "workflow_id": "uSyQG0p1lSp-T5-4HUI-C"
  }
}
```
