-- Os Downloads do Newsroom: o press kit completo e os logos.
--
-- Uma coleção nova no painel, «Downloads», com ficheiros que vão do browser
-- direito ao armazenamento (como os vídeos), sem o limite de 4,5 MB: o press
-- kit tem 97 MB. Cada ficheiro diz onde aparece no Newsroom, e o site mostra o
-- mais recente de cada sítio.
--
-- A tabela, o tipo e a sequência dela, e a coluna que o painel usa para
-- bloquear um documento enquanto alguém o edita (payload_locked_documents_rels).
-- Os nomes são os que o Payload cria sozinho numa base vazia.
--
-- No fim, os dois ficheiros que já estão no armazenamento ficam registados na
-- coleção — o press kit (96 994 955 bytes) e os logos (47 996 129 bytes) — com
-- os mesmos endereços: não se volta a carregar nada.
--
-- Uma instrução por linha, menos de 40. Correr na Neon, no SQL Editor, ANTES do
-- deploy. Se o editor mostrar o botão «Commit», carregar nele no fim. Correr
-- duas vezes não faz mal.

do $$ begin create type public.enum_downloads_uso as enum ('press-kit', 'logos'); exception when duplicate_object then null; end $$;

create sequence if not exists public.downloads_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;

create table if not exists public.downloads (id integer default nextval('public.downloads_id_seq'::regclass) not null, title character varying not null, uso public.enum_downloads_uso not null, updated_at timestamp(3) with time zone default now() not null, created_at timestamp(3) with time zone default now() not null, url character varying, thumbnail_u_r_l character varying, filename character varying, mime_type character varying, filesize numeric, width numeric, height numeric, focal_x numeric, focal_y numeric, constraint downloads_pkey primary key (id));

alter sequence public.downloads_id_seq owned by public.downloads.id;

create index if not exists downloads_created_at_idx on public.downloads using btree (created_at);

create index if not exists downloads_updated_at_idx on public.downloads using btree (updated_at);

create unique index if not exists downloads_filename_idx on public.downloads using btree (filename);

alter table public.payload_locked_documents_rels add column if not exists downloads_id integer;

do $$ begin alter table public.payload_locked_documents_rels add constraint payload_locked_documents_rels_downloads_fk foreign key (downloads_id) references public.downloads(id) on delete cascade; exception when duplicate_object then null; end $$;

create index if not exists payload_locked_documents_rels_downloads_id_idx on public.payload_locked_documents_rels using btree (downloads_id);

insert into public.downloads (title, uso, filename, mime_type, filesize, url) select 'Press kit 2026', 'press-kit', 'Jelly PressKit 2026.zip', 'application/zip', 96994955, 'https://vndty5nncbevu59o.public.blob.vercel-storage.com/Jelly%20PressKit%202026.zip' where not exists (select 1 from public.downloads where filename = 'Jelly PressKit 2026.zip');

insert into public.downloads (title, uso, filename, mime_type, filesize, url) select 'Logos Jelly', 'logos', 'Logos Jelly leve.zip', 'application/zip', 47996129, 'https://vndty5nncbevu59o.public.blob.vercel-storage.com/Logos%20Jelly%20leve.zip' where not exists (select 1 from public.downloads where filename = 'Logos Jelly leve.zip');
