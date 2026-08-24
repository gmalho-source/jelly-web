-- Terceira via (confirmação pelo candidato) e porta B (CV reenviado por email).
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa estes campos. Em
-- produção o Payload nunca mexe no esquema, de propósito — ver
-- docs/PAYLOAD.md, «Mudar a estrutura».
--
-- Tudo aqui é aditivo: nenhuma coluna é apagada, nenhum dado é reescrito.
-- Correr duas vezes não faz mal.

-- Um estado antes de «Nova»: a ficha existe, os dados vieram de um CV ou de um
-- email, e ainda não passaram pelos olhos da pessoa a quem pertencem.
alter type enum_applications_status add value if not exists 'por_confirmar' before 'nova';

-- O link de confirmação. Guarda-se o resumo criptográfico, não o token: quem
-- puser os olhos na base de dados não fica com a chave da porta de ninguém.
alter table applications add column if not exists confirm_token_hash varchar;
create index if not exists applications_confirm_token_hash_idx on applications (confirm_token_hash);

-- Quando o pedido saiu, e quando a pessoa confirmou. A data de consentimento
-- continua a ser a `consent_at`, e passa a ser esta confirmação a preenchê-la
-- quando a candidatura não veio do formulário do site.
alter table applications add column if not exists confirm_sent_at timestamp(3) with time zone;
alter table applications add column if not exists confirmed_at timestamp(3) with time zone;

-- O email original, quando a candidatura entrou por reenvio: remetente, data,
-- assunto e corpo. É o que permite perceber de onde veio aquilo, meses depois.
alter table applications add column if not exists source_email varchar;
