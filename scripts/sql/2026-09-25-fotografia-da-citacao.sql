-- A fotografia de quem dá o testemunho num caso.
--
-- A citação do cliente passou a aparecer em todas as páginas de projeto, e não
-- só nas que são caso escrito: vive no mesmo registo, e só dependia do caso por
-- ter nascido com ele. E ganha a cara de quem a assina — num círculo e a preto
-- e branco no site, seja qual for a fotografia carregada.
--
-- Uma coluna por tabela: a dos projetos e a das versões, porque os projetos
-- têm rascunhos e uma versão sem a coluna não grava. Os nomes da coluna, do
-- índice e da chave são os que o Payload cria sozinho numa base vazia — tirados
-- de lá, e não escritos à mão.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Aditivo: não toca em nada do
-- que já lá está, e correr duas vezes não faz mal.

alter table projects add column if not exists quote_photo_id integer;
do $$ begin
  alter table projects add constraint projects_quote_photo_id_media_id_fk
    foreign key (quote_photo_id) references media(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists projects_quote_quote_photo_idx on projects (quote_photo_id);

alter table _projects_v add column if not exists version_quote_photo_id integer;
do $$ begin
  alter table _projects_v add constraint _projects_v_version_quote_photo_id_media_id_fk
    foreign key (version_quote_photo_id) references media(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists _projects_v_version_quote_version_quote_photo_idx on _projects_v (version_quote_photo_id);
