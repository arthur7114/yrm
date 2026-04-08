begin;

alter type public.lead_status add value if not exists 'novo';
alter type public.lead_status add value if not exists 'em_qualificacao';
alter type public.lead_status add value if not exists 'aguardando_humano';
alter type public.lead_status add value if not exists 'em_atendimento_humano';
alter type public.lead_status add value if not exists 'encerrado';

update public.leads
set current_status = case
  when current_status::text = 'aguardando_classificacao' then 'novo'::public.lead_status
  when current_status::text = 'classificado' then 'em_qualificacao'::public.lead_status
  when current_status::text = 'encaminhado_humano' then 'aguardando_humano'::public.lead_status
  else current_status
end
where current_status::text in (
  'aguardando_classificacao',
  'classificado',
  'encaminhado_humano'
);

commit;
