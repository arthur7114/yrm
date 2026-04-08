# YRM Product + n8n Report

## Goal
Consolidar o entendimento do produto YRM, avaliar o fluxo atual do n8n e listar o que falta para fechar a operação ponta a ponta.

## Scope analyzed
- App Next.js do repositório
- Contrato da integração n8n no app
- Migration de suporte à integração
- Workflow acessível no n8n: `My workflow` (`uSyQG0p1lSp-T5-4HUI-C`)

Observação:
Havia outros workflows listados no n8n, mas apenas `My workflow` estava disponível no MCP para inspeção detalhada. Se o fluxo principal for outro, este report precisa ser ajustado.

## Product understanding

### What the product is
O YRM é uma operação de atendimento e qualificação de leads, com foco em entrada por WhatsApp, classificação por temperatura, contexto comercial e handoff para humano.

### Primary user
- Operação comercial
- Founder ou gestor acompanhando volume e qualidade dos leads
- Time de atendimento que precisa assumir o lead no momento certo

### Core value
- Centralizar leads recebidos
- Transformar conversa em contexto comercial estruturado
- Priorizar quem está quente, morno ou frio
- Dar visibilidade do histórico e do próximo passo
- Reduzir tempo manual até o handoff

### Main product surfaces
- Dashboard com métricas, lista de leads e notificações
- Tela de detalhe do lead com timeline, qualificação, histórico de reclassificação e handoff
- Tela de configurações com contexto do negócio e perguntas de qualificação
- Tela de simulação para testar entrada de lead

### Desired end-to-end flow
1. Lead entra via WhatsApp
2. n8n recebe e normaliza texto, áudio ou imagem
3. IA qualifica o lead e gera resposta inicial
4. Eventos são enviados para o app
5. App persiste lead, mensagens, classificação e notificações
6. Operação acompanha métricas e histórico
7. Lead é encaminhado para humano quando necessário

## Current product state

### What is already implemented in the app
- Dashboard de leads com métricas e notificações
- Persistência de leads, mensagens e notifications para integração
- Endpoint dedicado para ingestão de eventos do n8n
- Detalhe do lead com timeline e resumo
- Handoff para humano com contexto consolidado
- Configuração do contexto do negócio e perguntas de qualificação
- Fluxos locais de IA no próprio app para qualificar, reclassificar e responder

### What this means
O app já funciona como console operacional. O problema principal não está na interface: está na definição de quem orquestra a inteligência e na finalização do contrato com o n8n.

## n8n workflow assessment

### Workflow found
- Nome: `My workflow`
- ID: `uSyQG0p1lSp-T5-4HUI-C`
- Status: inativo
- Webhook atual: `POST /webhook/agente-ia`

### What this workflow already does
- Recebe webhook externo
- Normaliza payload de mensagens
- Trata texto, áudio e imagem
- Usa IA para gerar classificação e resposta
- Tenta agrupar mensagens com Redis
- Tenta enviar resposta para WhatsApp
- Possui nodes para notificar o app sobre:
  - `lead.created`
  - `message.created` inbound
  - `lead.classified`
  - `message.created` outbound

### What is not finished
- Os nodes de sincronização com o app estão desabilitados
- Esses nodes ainda usam placeholder de domínio e auth
- O workflow está inativo
- A memória da conversa está configurada com sessão fixa
- O envio outbound está com destino hardcoded

## Gaps and risks

### P0

#### 1. Workflow principal está inativo
Sem isso, o fluxo real não roda em produção pelo webhook principal.

#### 2. O app e o workflow atual não falam a mesma língua
O app dispara para `NEXT_PUBLIC_N8N_WEBHOOK_URL` ou `http://localhost:5678/webhook/simulated-lead-message`, enviando apenas:
- `lead_id`
- `message_id`
- `user_id`

O workflow acessível no n8n espera outro contrato, vindo de um payload rico de WhatsApp no webhook `/webhook/agente-ia`.

Resultado:
o gatilho do app não aciona corretamente o workflow analisado.

#### 3. Os nodes que sincronizam o n8n com o app estão desabilitados
Sem `lead.created`, `message.created`, `lead.classified` e `message.created` outbound ativos, o app não recebe o estado operacional correto.

Impacto:
- timeline incompleta
- notificações vazias
- classificação não refletida pelo n8n
- dashboard não representa a conversa real

#### 4. A memória do agente está com sessão fixa
O node `Postgres Chat Memory` usa chave fixa (`1`), o que mistura contexto entre leads.

Impacto:
- vazamento de contexto entre conversas
- classificação contaminada
- resposta errada para leads diferentes

#### 5. O envio de WhatsApp está hardcoded
O node de envio outbound usa número fixo e chave embutida no workflow.

Impacto:
- resposta pode ir para o número errado
- risco operacional alto
- segredo exposto em configuração

#### 6. Variáveis críticas da integração não estão completas no ambiente local
No `.env.local`, existem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, mas faltam:
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_LEAD_OWNER_USER_ID`

Impacto:
- `processLeadEvent()` falha sem `N8N_LEAD_OWNER_USER_ID`
- o app não consegue vincular eventos ao dono correto do funil
- usar anon key como fallback no admin client é frágil

### P1

#### 7. Vocabulário de status está desalinhado
O fluxo do n8n trabalha com `aguardando_contato_humano`, enquanto partes importantes do app usam `encaminhado_humano`.

Impacto:
- regras de handoff quebradas
- tela pode não reconhecer lead como transferido
- automações pós-handoff podem seguir caminho errado

#### 8. O debounce de mensagens não está confiável
O desenho com Redis + Wait sugere bufferização, mas o node `Wait` está desabilitado.

Impacto:
- classificação pode disparar cedo demais
- múltiplas mensagens curtas podem ser tratadas como entradas isoladas

#### 9. Fronteira de responsabilidade está confusa
Hoje existem dois cérebros:
- IA no app
- IA no n8n

Impacto:
- lógica duplicada
- risco de divergência entre classificação do app e do n8n
- manutenção mais cara

#### 10. Segurança ainda está provisória
- endpoint do app está público
- webhook do n8n está público
- credencial sensível está embutida em node

Impacto:
- risco de uso indevido
- risco de spam ou injeção de eventos

### P2

#### 11. O recurso de notificações depende de evento que hoje não chega
O painel de notificações depende principalmente de `lead.created`, mas esse node está desabilitado.

#### 12. Falta observabilidade operacional
Ainda não existe um plano claro de:
- retries
- deduplicação por evento
- auditoria de falhas
- acompanhamento de execuções no n8n

## Product decision I recommend

### Recommended operating model
- n8n como orquestrador da automação conversacional
- app como console operacional, CRM leve e interface humana

### Why
O workflow já está desenhado para:
- receber mídia
- usar memória
- classificar
- responder

Empurrar essa inteligência também para o app cria duplicidade. O app deve receber o resultado, não competir com o n8n.

### Practical implication
Os fluxos locais de IA no app devem virar:
- fallback manual
ou
- ferramentas internas de simulação

Mas não o motor principal de produção.

## Execution plan

## Goal
Fechar o loop WhatsApp -> n8n -> app -> operação humana sem duplicidade de lógica.

## Tasks
- [ ] Definir o contrato canônico da integração -> Verificar: um documento único com payload, eventos aceitos, estados e origem de verdade
- [ ] Escolher o webhook oficial de produção e o webhook opcional de simulação -> Verificar: app e n8n apontando para o mesmo desenho de entrada
- [ ] Ativar e corrigir os 4 nodes de sync com o app (`lead.created`, `message.created` inbound, `lead.classified`, `message.created` outbound) -> Verificar: eventos chegando com 200 no endpoint `/api/integrations/n8n/lead-events`
- [ ] Remover placeholders e segredos hardcoded do workflow -> Verificar: uso de credenciais no n8n e URLs reais configuradas
- [ ] Corrigir o session key da memória para usar `external_session_id` ou identificador equivalente do lead -> Verificar: duas conversas simultâneas não compartilham contexto
- [ ] Corrigir o envio outbound para usar número dinâmico do lead -> Verificar: resposta enviada para o contato que originou a conversa
- [ ] Unificar a máquina de estados do produto (`encaminhado_humano` vs `aguardando_contato_humano`) -> Verificar: UI, API e n8n usando o mesmo conjunto de status
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY` e `N8N_LEAD_OWNER_USER_ID` no ambiente certo -> Verificar: evento `message.created` cria ou atualiza lead sem erro 500
- [ ] Decidir o destino dos fluxos de IA locais do app -> Verificar: ou removidos da produção ou explicitamente marcados como fallback/manual
- [ ] Executar teste E2E com texto, áudio, imagem, classificação, resposta e handoff -> Verificar: lead aparece no dashboard, timeline fecha e status final fica consistente

## Done when
- [ ] Um lead novo entra por WhatsApp e aparece no dashboard automaticamente
- [ ] A timeline mostra inbound e outbound reais
- [ ] A classificação feita no n8n chega ao app corretamente
- [ ] O handoff humano usa o mesmo status em todos os pontos do sistema
- [ ] Não existe contexto compartilhado entre leads diferentes
- [ ] Não existem segredos hardcoded no workflow

## Recommended sequence for the next work session
1. Fechar o contrato canônico de eventos e status
2. Corrigir o workflow do n8n
3. Ajustar o app para o contrato final
4. Rodar teste ponta a ponta

## Key references
- `app/api/integrations/n8n/lead-events/route.ts`
- `lib/lead-events.ts`
- `app/leads/[id]/actions.ts`
- `app/leads/[id]/ai-actions.ts`
- `app/page.tsx`
- `app/settings/actions.ts`
- `supabase/migrations/20260326180000_n8n_lead_integration_support.sql`
- `.env.local`
