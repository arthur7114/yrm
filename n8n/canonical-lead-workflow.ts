import {
  ifElse,
  languageModel,
  memory,
  newCredential,
  node,
  outputParser,
  trigger,
  workflow,
} from '@n8n/workflow-sdk'

const inboundWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Inbound WhatsApp Webhook',
    position: [240, 360],
    parameters: {
      httpMethod: 'POST',
      path: 'agente-ia',
      responseMode: 'onReceived',
      options: {
        noResponseBody: false,
        responseData: 'Workflow got started.',
      },
    },
  },
  output: [
    {
      body: {
        id: 'wamid-123',
        content: 'Quero entender como funciona a solução.',
        content_type: 'text',
        conversation: {
          id: 'conversation-123',
          meta: {
            sender: {
              identifier: '558592607356@s.whatsapp.net',
              phone_number: '558592607356',
              name: 'Arthur Brito',
            },
          },
        },
      },
    },
  ],
})

const normalizeInbound = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Normalize Inbound Payload',
    position: [520, 360],
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          {
            id: 'session-id',
            name: 'sessionId',
            type: 'string',
            value: "={{ $json.body?.conversation?.meta?.sender?.identifier || $json.body?.conversation?.contact_inbox?.source_id || '' }}",
          },
          {
            id: 'phone-number',
            name: 'phoneNumber',
            type: 'string',
            value: "={{ $json.body?.conversation?.meta?.sender?.phone_number || (($json.body?.conversation?.meta?.sender?.identifier || '').split('@')[0]) || '' }}",
          },
          {
            id: 'lead-name',
            name: 'leadName',
            type: 'string',
            value: "={{ $json.body?.conversation?.meta?.sender?.name || $json.body?.sender?.name || 'Lead sem nome' }}",
          },
          {
            id: 'message-id',
            name: 'messageId',
            type: 'string',
            value: "={{ $json.body?.id || ('fallback-' + $execution.id) }}",
          },
          {
            id: 'conversation-id',
            name: 'conversationId',
            type: 'string',
            value: "={{ $json.body?.conversation?.id || '' }}",
          },
          {
            id: 'sender-id',
            name: 'senderId',
            type: 'string',
            value: "={{ $json.body?.conversation?.messages?.[0]?.sender?.id || '' }}",
          },
          {
            id: 'occurred-at',
            name: 'occurredAt',
            type: 'string',
            value: '={{ $now.toISO() }}',
          },
          {
            id: 'content-type',
            name: 'contentType',
            type: 'string',
            value: "={{ ($json.body?.attachments?.length ? ($json.body.attachments[0]?.file_type || 'attachment') : (($json.body?.content_type || 'text').toString().trim() || 'text')) }}",
          },
          {
            id: 'normalized-content',
            name: 'normalizedContent',
            type: 'string',
            value:
              "={{ $json.body?.content || $json.body?.attachments?.[0]?.caption || $json.body?.attachments?.[0]?.transcribed_text || ($json.body?.attachments?.length ? ('Attachment received of type ' + ($json.body.attachments[0]?.file_type || 'attachment')) : '') || '' }}",
          },
          {
            id: 'buffer-entry',
            name: 'bufferEntry',
            type: 'string',
            value:
              "={{ JSON.stringify({ messageId: $json.body?.id || ('fallback-' + $execution.id), chatInput: ($json.body?.content || $json.body?.attachments?.[0]?.caption || $json.body?.attachments?.[0]?.transcribed_text || ($json.body?.attachments?.length ? ('Attachment received of type ' + ($json.body.attachments[0]?.file_type || 'attachment')) : '') || ''), occurredAt: $now.toISO(), contentType: (($json.body?.attachments?.length ? ($json.body.attachments[0]?.file_type || 'attachment') : (($json.body?.content_type || 'text').toString().trim() || 'text'))) }) }}",
          },
        ],
      },
      includeOtherFields: false,
    },
  },
  output: [
    {
      sessionId: '558592607356@s.whatsapp.net',
      phoneNumber: '558592607356',
      leadName: 'Arthur Brito',
      messageId: 'wamid-123',
      conversationId: 'conversation-123',
      senderId: 'sender-123',
      occurredAt: '2026-04-08T15:00:00.000Z',
      contentType: 'text',
      normalizedContent: 'Quero entender como funciona a solução.',
      bufferEntry:
        '{"messageId":"wamid-123","chatInput":"Quero entender como funciona a solução.","occurredAt":"2026-04-08T15:00:00.000Z","contentType":"text"}',
    },
  ],
})

const pushDebounceBuffer = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  credentials: { redis: newCredential('Redis') },
  config: {
    name: 'Push Debounce Buffer',
    position: [800, 360],
    parameters: {
      operation: 'push',
      list: '={{ $json.sessionId + "_buffer" }}',
      messageData: '={{ $json.bufferEntry }}',
      tail: true,
    },
  },
  output: [{ sessionId: '558592607356@s.whatsapp.net' }],
})

const waitForDebounce = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Wait Debounce Window',
    position: [1080, 360],
    parameters: {
      resume: 'timeInterval',
      amount: 30,
      unit: 'seconds',
    },
  },
  output: [{ sessionId: '558592607356@s.whatsapp.net' }],
})

const loadDebounceBuffer = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  credentials: { redis: newCredential('Redis') },
  config: {
    name: 'Load Debounce Buffer',
    position: [1360, 360],
    parameters: {
      operation: 'get',
      propertyName: 'buffer',
      keyType: 'list',
      key: '={{ $json.sessionId + "_buffer" }}',
    },
  },
  output: [
    {
      sessionId: '558592607356@s.whatsapp.net',
      buffer: [
        '{"messageId":"wamid-122","chatInput":"Oi","occurredAt":"2026-04-08T14:59:00.000Z","contentType":"text"}',
        '{"messageId":"wamid-123","chatInput":"Quero entender como funciona a solução.","occurredAt":"2026-04-08T15:00:00.000Z","contentType":"text"}',
      ],
      bufferEntry:
        '{"messageId":"wamid-123","chatInput":"Quero entender como funciona a solução.","occurredAt":"2026-04-08T15:00:00.000Z","contentType":"text"}',
    },
  ],
})

const aggregateBufferedContent = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Aggregate Buffered Content',
    position: [1640, 360],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const item = $input.first().json;
const buffer = Array.isArray(item.buffer) ? item.buffer : [];
const parsed = buffer
  .map((entry) => {
    try {
      return JSON.parse(entry);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const lastEntry = parsed.at(-1);
const currentEntry = JSON.parse(item.bufferEntry);
const isLatest = !!lastEntry && lastEntry.messageId === currentEntry.messageId;
const aggregatedContent = parsed.map((entry) => entry.chatInput).filter(Boolean).join('\\n');
const aggregatedMessageId =
  parsed.length > 1
    ? \`agg:\${item.sessionId}:\${lastEntry?.messageId || currentEntry.messageId}\`
    : currentEntry.messageId;

return [
  {
    json: {
      ...item,
      shouldProcess: isLatest ? 'yes' : 'no',
      aggregatedContent,
      aggregatedMessageId,
      bufferSize: parsed.length,
      eventIds: {
        leadCreated: \`\${$execution.id}:lead.created:\${item.sessionId}\`,
        inbound: \`\${$execution.id}:message.inbound:\${aggregatedMessageId}\`,
        classified: \`\${$execution.id}:lead.classified:\${item.sessionId}\`,
        outbound: \`\${$execution.id}:message.outbound:\${item.sessionId}\`,
        statusChanged: \`\${$execution.id}:lead.status_changed:\${item.sessionId}\`,
        handoff: \`\${$execution.id}:lead.handoff_requested:\${item.sessionId}\`,
      },
    },
  },
];
      `,
    },
  },
  output: [
    {
      sessionId: '558592607356@s.whatsapp.net',
      phoneNumber: '558592607356',
      leadName: 'Arthur Brito',
      messageId: 'wamid-123',
      conversationId: 'conversation-123',
      senderId: 'sender-123',
      occurredAt: '2026-04-08T15:00:00.000Z',
      contentType: 'text',
      aggregatedContent: 'Oi\nQuero entender como funciona a solução.',
      aggregatedMessageId: 'agg:558592607356@s.whatsapp.net:wamid-123',
      shouldProcess: 'yes',
      bufferSize: 2,
      eventIds: {
        leadCreated: 'execution-1:lead.created:558592607356@s.whatsapp.net',
        inbound: 'execution-1:message.inbound:agg:558592607356@s.whatsapp.net:wamid-123',
        classified: 'execution-1:lead.classified:558592607356@s.whatsapp.net',
        outbound: 'execution-1:message.outbound:558592607356@s.whatsapp.net',
        statusChanged: 'execution-1:lead.status_changed:558592607356@s.whatsapp.net',
        handoff: 'execution-1:lead.handoff_requested:558592607356@s.whatsapp.net',
      },
    },
  ],
})

const shouldProcessLatestBatch = ifElse({
  version: 2.3,
  config: {
    name: 'Process Only Latest Batch',
    position: [1920, 360],
    parameters: {
      conditions: {
        conditions: [
          {
            leftValue: '={{ $json.shouldProcess }}',
            operator: { type: 'string', operation: 'equals' },
            rightValue: 'yes',
          },
        ],
      },
    },
  },
})

const clearDebounceBuffer = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  credentials: { redis: newCredential('Redis') },
  config: {
    name: 'Clear Debounce Buffer',
    position: [2200, 280],
    parameters: {
      operation: 'delete',
      key: '={{ $json.sessionId + "_buffer" }}',
    },
  },
  output: [{ sessionId: '558592607356@s.whatsapp.net' }],
})

const notifyLeadCreated = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Notify Lead Created',
    position: [2480, 280],
    parameters: {
      method: 'POST',
      url: '={{ $env.APP_BASE_URL + "/api/integrations/n8n/lead-events" }}',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={{
        ({
          event_id: $('Aggregate Buffered Content').item.json.eventIds.leadCreated,
          event_type: 'lead.created',
          event_version: 1,
          source: 'n8n',
          occurred_at: $('Aggregate Buffered Content').item.json.occurredAt,
          lead: {
            external_session_id: $('Aggregate Buffered Content').item.json.sessionId,
            phone_number: $('Aggregate Buffered Content').item.json.phoneNumber,
            lead_name: $('Aggregate Buffered Content').item.json.leadName,
          },
          payload: {
            status: 'novo',
          },
          metadata: {
            provider: 'whatsapp',
            workflow_id: $workflow.id,
            conversation_id: $('Aggregate Buffered Content').item.json.conversationId,
            sender_id: $('Aggregate Buffered Content').item.json.senderId,
            buffer_size: $('Aggregate Buffered Content').item.json.bufferSize,
          },
        })
      }}`,
    },
  },
  output: [{ statusCode: 200 }],
})

const notifyInboundMessage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Notify Inbound Message',
    position: [2760, 280],
    parameters: {
      method: 'POST',
      url: '={{ $env.APP_BASE_URL + "/api/integrations/n8n/lead-events" }}',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={{
        ({
          event_id: $('Aggregate Buffered Content').item.json.eventIds.inbound,
          event_type: 'message.created',
          event_version: 1,
          source: 'n8n',
          occurred_at: $('Aggregate Buffered Content').item.json.occurredAt,
          lead: {
            external_session_id: $('Aggregate Buffered Content').item.json.sessionId,
            phone_number: $('Aggregate Buffered Content').item.json.phoneNumber,
            lead_name: $('Aggregate Buffered Content').item.json.leadName,
          },
          payload: {
            direction: 'inbound',
            sender_type: 'lead',
            external_message_id: $('Aggregate Buffered Content').item.json.aggregatedMessageId,
            content_type: 'text',
            message_content: $('Aggregate Buffered Content').item.json.aggregatedContent,
          },
          metadata: {
            provider: 'whatsapp',
            workflow_id: $workflow.id,
            conversation_id: $('Aggregate Buffered Content').item.json.conversationId,
            sender_id: $('Aggregate Buffered Content').item.json.senderId,
            original_content_type: $('Aggregate Buffered Content').item.json.contentType,
          },
        })
      }}`,
    },
  },
  output: [{ statusCode: 200 }],
})

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  credentials: { openAiApi: newCredential('OpenAI') },
  config: {
    name: 'Lead Decision Model',
    position: [3040, 80],
    parameters: {
      model: { __rl: true, mode: 'list', value: 'gpt-5.4', cachedResultName: 'gpt-5.4' },
      options: {
        temperature: 0.1,
        reasoningEffort: 'medium',
      },
    },
  },
})

const memoryNode = memory({
  type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
  version: 1.3,
  credentials: { postgres: newCredential('Postgres Chat Memory') },
  config: {
    name: 'Lead Session Memory',
    position: [3040, 640],
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: '={{ $json.sessionId }}',
      tableName: 'yrm_lead_chat_memory',
      contextWindowLength: 10,
    },
  },
})

const structuredParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: {
    name: 'Lead Decision Parser',
    position: [3320, 80],
    parameters: {
      schemaType: 'fromJson',
      jsonSchemaExample: JSON.stringify({
        reply_text: 'Mensagem curta para o lead.',
        temperatura: 'morno',
        score: 18,
        tier: 'B',
        qualification_summary: 'Resumo curto da qualificação.',
        target_status: 'em_qualificacao',
        reason_code: 'ai_processing_started',
        handoff_summary: '',
        handoff_priority: 'normal',
      }),
      autoFix: true,
    },
    subnodes: {
      model: openAiModel,
    },
  },
})

const aiDecisionAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Lead Decision Agent',
    position: [3320, 360],
    parameters: {
      promptType: 'define',
      text: '={{ $(\"Aggregate Buffered Content\").item.json.aggregatedContent }}',
      hasOutputParser: true,
      options: {
        maxIterations: 6,
        systemMessage:
          '# YRM lead orchestration\n' +
          'You are the main operational brain for WhatsApp lead handling.\n' +
          'Classify the lead, choose the canonical temperature, and decide the next operational status.\n' +
          'Allowed target_status values: em_qualificacao or aguardando_humano.\n' +
          'Use aguardando_humano when the lead asks for pricing, proposal, negotiation, escalation, or needs a human specialist.\n' +
          'Always generate a reply_text in Brazilian Portuguese. If handoff is required, the reply_text must acknowledge the transfer and stop automation.\n' +
          'qualification_summary must be concise and factual.\n' +
          'reason_code must be ai_processing_started when target_status is em_qualificacao, and ai_handoff_required when target_status is aguardando_humano.\n' +
          'handoff_summary must contain the handoff context only when target_status is aguardando_humano.\n' +
          'handoff_priority must be normal or alta.\n',
      },
    },
    subnodes: {
      model: openAiModel,
      memory: memoryNode,
      outputParser: structuredParser,
    },
  },
  output: [
    {
      output: {
        reply_text: 'Perfeito. Me conta um pouco do cenário atual da operação de vocês?',
        temperatura: 'morno',
        score: 18,
        tier: 'B',
        qualification_summary: 'Lead com dor inicial clara e interesse real em avaliar a solução.',
        target_status: 'em_qualificacao',
        reason_code: 'ai_processing_started',
        handoff_summary: '',
        handoff_priority: 'normal',
      },
    },
  ],
})

const flattenDecision = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Flatten Decision Output',
    position: [3600, 360],
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          {
            id: 'reply-text',
            name: 'replyText',
            type: 'string',
            value: '={{ $json.output.reply_text }}',
          },
          {
            id: 'temperature',
            name: 'temperatura',
            type: 'string',
            value: '={{ $json.output.temperatura }}',
          },
          {
            id: 'score',
            name: 'score',
            type: 'number',
            value: '={{ $json.output.score }}',
          },
          {
            id: 'tier',
            name: 'tier',
            type: 'string',
            value: '={{ $json.output.tier }}',
          },
          {
            id: 'qualification-summary',
            name: 'qualificationSummary',
            type: 'string',
            value: '={{ $json.output.qualification_summary }}',
          },
          {
            id: 'target-status',
            name: 'targetStatus',
            type: 'string',
            value: '={{ $json.output.target_status }}',
          },
          {
            id: 'reason-code',
            name: 'reasonCode',
            type: 'string',
            value: '={{ $json.output.reason_code }}',
          },
          {
            id: 'handoff-summary',
            name: 'handoffSummary',
            type: 'string',
            value: '={{ $json.output.handoff_summary || "" }}',
          },
          {
            id: 'handoff-priority',
            name: 'handoffPriority',
            type: 'string',
            value: '={{ $json.output.handoff_priority || "normal" }}',
          },
        ],
      },
    },
  },
  output: [
    {
      sessionId: '558592607356@s.whatsapp.net',
      phoneNumber: '558592607356',
      leadName: 'Arthur Brito',
      conversationId: 'conversation-123',
      senderId: 'sender-123',
      occurredAt: '2026-04-08T15:00:00.000Z',
      aggregatedContent: 'Oi\nQuero entender como funciona a solução.',
      eventIds: {
        leadCreated: 'execution-1:lead.created:558592607356@s.whatsapp.net',
        inbound: 'execution-1:message.inbound:agg:558592607356@s.whatsapp.net:wamid-123',
        classified: 'execution-1:lead.classified:558592607356@s.whatsapp.net',
        outbound: 'execution-1:message.outbound:558592607356@s.whatsapp.net',
        statusChanged: 'execution-1:lead.status_changed:558592607356@s.whatsapp.net',
        handoff: 'execution-1:lead.handoff_requested:558592607356@s.whatsapp.net',
      },
      replyText: 'Perfeito. Me conta um pouco do cenário atual da operação de vocês?',
      temperatura: 'morno',
      score: 18,
      tier: 'B',
      qualificationSummary: 'Lead com dor inicial clara e interesse real em avaliar a solução.',
      targetStatus: 'em_qualificacao',
      reasonCode: 'ai_processing_started',
      handoffSummary: '',
      handoffPriority: 'normal',
    },
  ],
})

const notifyClassification = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Notify Lead Classified',
    position: [3880, 360],
    parameters: {
      method: 'POST',
      url: '={{ $env.APP_BASE_URL + "/api/integrations/n8n/lead-events" }}',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={{
        ({
          event_id: $('Flatten Decision Output').item.json.eventIds.classified,
          event_type: 'lead.classified',
          event_version: 1,
          source: 'n8n',
          occurred_at: $now.toISO(),
          lead: {
            external_session_id: $('Flatten Decision Output').item.json.sessionId,
            phone_number: $('Flatten Decision Output').item.json.phoneNumber,
            lead_name: $('Flatten Decision Output').item.json.leadName,
          },
          payload: {
            temperatura: $('Flatten Decision Output').item.json.temperatura,
            score: $('Flatten Decision Output').item.json.score,
            tier: $('Flatten Decision Output').item.json.tier,
            qualification_summary: $('Flatten Decision Output').item.json.qualificationSummary,
          },
          metadata: {
            provider: 'whatsapp',
            workflow_id: $workflow.id,
            conversation_id: $('Flatten Decision Output').item.json.conversationId,
            sender_id: $('Flatten Decision Output').item.json.senderId,
          },
        })
      }}`,
    },
  },
  output: [{ statusCode: 200 }],
})

const sendPresence = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Send Typing Presence',
    position: [4160, 360],
    parameters: {
      method: 'POST',
      url: '={{ $env.EVOLUTION_API_BASE_URL + "/chat/sendPresence/" + $env.EVOLUTION_API_INSTANCE }}',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: '={{ $env.EVOLUTION_API_KEY }}' },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={{
        ({
          number: $('Flatten Decision Output').item.json.sessionId,
          delay: 3000,
          presence: 'composing',
        })
      }}`,
    },
  },
  output: [{ success: true }],
})

const sendOutboundMessage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Send WhatsApp Reply',
    position: [4440, 360],
    parameters: {
      method: 'POST',
      url: '={{ $env.EVOLUTION_API_BASE_URL + "/message/sendText/" + $env.EVOLUTION_API_INSTANCE }}',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: '={{ $env.EVOLUTION_API_KEY }}' },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={{
        ({
          number: $('Flatten Decision Output').item.json.sessionId,
          text: $('Flatten Decision Output').item.json.replyText,
        })
      }}`,
    },
  },
  output: [{ key: { id: 'wamid-outbound-1' } }],
})

const notifyOutboundMessage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Notify Outbound Message',
    position: [4720, 360],
    parameters: {
      method: 'POST',
      url: '={{ $env.APP_BASE_URL + "/api/integrations/n8n/lead-events" }}',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={{
        ({
          event_id: $('Flatten Decision Output').item.json.eventIds.outbound,
          event_type: 'message.created',
          event_version: 1,
          source: 'n8n',
          occurred_at: $now.toISO(),
          lead: {
            external_session_id: $('Flatten Decision Output').item.json.sessionId,
            phone_number: $('Flatten Decision Output').item.json.phoneNumber,
            lead_name: $('Flatten Decision Output').item.json.leadName,
          },
          payload: {
            direction: 'outbound',
            sender_type: 'automacao',
            external_message_id: ($json.key?.id || ($execution.id + ':outbound')),
            content_type: 'text',
            message_content: $('Flatten Decision Output').item.json.replyText,
          },
          metadata: {
            provider: 'whatsapp',
            workflow_id: $workflow.id,
            conversation_id: $('Flatten Decision Output').item.json.conversationId,
            sender_id: $('Flatten Decision Output').item.json.senderId,
          },
        })
      }}`,
    },
  },
  output: [{ statusCode: 200 }],
})

const notifyStatusChanged = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Notify Status Changed',
    position: [5000, 360],
    parameters: {
      method: 'POST',
      url: '={{ $env.APP_BASE_URL + "/api/integrations/n8n/lead-events" }}',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={{
        ({
          event_id: $('Flatten Decision Output').item.json.eventIds.statusChanged,
          event_type: 'lead.status_changed',
          event_version: 1,
          source: 'n8n',
          occurred_at: $now.toISO(),
          lead: {
            external_session_id: $('Flatten Decision Output').item.json.sessionId,
            phone_number: $('Flatten Decision Output').item.json.phoneNumber,
            lead_name: $('Flatten Decision Output').item.json.leadName,
          },
          payload: {
            from_status: 'novo',
            to_status: $('Flatten Decision Output').item.json.targetStatus,
            reason_code: $('Flatten Decision Output').item.json.reasonCode,
            reason_text: $('Flatten Decision Output').item.json.qualificationSummary,
          },
          metadata: {
            provider: 'whatsapp',
            workflow_id: $workflow.id,
            conversation_id: $('Flatten Decision Output').item.json.conversationId,
            sender_id: $('Flatten Decision Output').item.json.senderId,
          },
        })
      }}`,
    },
  },
  output: [{ statusCode: 200 }],
})

const shouldRequestHandoff = ifElse({
  version: 2.3,
  config: {
    name: 'Should Request Handoff',
    position: [5280, 360],
    parameters: {
      conditions: {
        conditions: [
          {
            leftValue: '={{ $(\"Flatten Decision Output\").item.json.targetStatus }}',
            operator: { type: 'string', operation: 'equals' },
            rightValue: 'aguardando_humano',
          },
        ],
      },
    },
  },
})

const notifyHandoffRequested = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Notify Handoff Requested',
    position: [5560, 280],
    parameters: {
      method: 'POST',
      url: '={{ $env.APP_BASE_URL + "/api/integrations/n8n/lead-events" }}',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: `={{
        ({
          event_id: $('Flatten Decision Output').item.json.eventIds.handoff,
          event_type: 'lead.handoff_requested',
          event_version: 1,
          source: 'n8n',
          occurred_at: $now.toISO(),
          lead: {
            external_session_id: $('Flatten Decision Output').item.json.sessionId,
            phone_number: $('Flatten Decision Output').item.json.phoneNumber,
            lead_name: $('Flatten Decision Output').item.json.leadName,
          },
          payload: {
            handoff_summary: $('Flatten Decision Output').item.json.handoffSummary,
            priority: $('Flatten Decision Output').item.json.handoffPriority,
            requested_by: 'ai',
          },
          metadata: {
            provider: 'whatsapp',
            workflow_id: $workflow.id,
            conversation_id: $('Flatten Decision Output').item.json.conversationId,
            sender_id: $('Flatten Decision Output').item.json.senderId,
          },
        })
      }}`,
    },
  },
  output: [{ statusCode: 200 }],
})

export default workflow('uSyQG0p1lSp-T5-4HUI-C', 'My workflow')
  .add(inboundWebhook)
  .to(normalizeInbound)
  .to(pushDebounceBuffer)
  .to(waitForDebounce)
  .to(loadDebounceBuffer)
  .to(aggregateBufferedContent)
  .to(shouldProcessLatestBatch.onTrue(
    clearDebounceBuffer
      .to(notifyLeadCreated)
      .to(notifyInboundMessage)
      .to(aiDecisionAgent)
      .to(flattenDecision)
      .to(notifyClassification)
      .to(sendPresence)
      .to(sendOutboundMessage)
      .to(notifyOutboundMessage)
      .to(notifyStatusChanged)
      .to(shouldRequestHandoff.onTrue(notifyHandoffRequested))
  ));
