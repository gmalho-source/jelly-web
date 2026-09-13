-- A abertura, o fecho e as linhas de uma vaga passam a levar marcação.
--
-- Eram `varchar` — texto simples numa caixa. Passam a `jsonb`, que é como o
-- Payload guarda um campo com editor: negrito, itálico e links dentro da frase,
-- e parágrafos a sério na abertura e no fecho.
--
-- Não há nada para converter. As oito vagas em produção têm estes campos todos
-- vazios — conferido antes de escrever isto: zero caracteres em `intro_pt`,
-- `intro_en` e `closing_pt` nas oito, e zero linhas nas quatro tabelas das
-- listas. Por isso o `using null` não perde nada de ninguém; se um dia houver
-- texto, esta migração deixa de servir e é preciso converter linha a linha.
--
-- As vagas não têm rascunhos — o estado da vaga já diz se está por publicar —
-- e por isso não há `_jobs_v` para acompanhar.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Correr duas vezes não faz
-- mal: uma coluna que já é `jsonb` fica na mesma.

alter table jobs alter column intro_pt type jsonb using null;
alter table jobs alter column intro_en type jsonb using null;
alter table jobs alter column closing_pt type jsonb using null;
alter table jobs alter column closing_en type jsonb using null;

alter table jobs_responsibilities alter column item_pt type jsonb using null;
alter table jobs_responsibilities alter column item_en type jsonb using null;

alter table jobs_requirements alter column item_pt type jsonb using null;
alter table jobs_requirements alter column item_en type jsonb using null;

alter table jobs_nice_to_have alter column item_pt type jsonb using null;
alter table jobs_nice_to_have alter column item_en type jsonb using null;

alter table jobs_benefits alter column item_pt type jsonb using null;
alter table jobs_benefits alter column item_en type jsonb using null;
