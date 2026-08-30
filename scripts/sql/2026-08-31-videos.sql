-- Vídeos carregados pelo painel.
--
-- Um pedido a uma função da Vercel não pode passar de 4,5 MB, e é esse o tecto
-- com que alguém bate ao tentar carregar um vídeo de 34 MB. As imagens têm de
-- passar pelo servidor — é lá que o sharp as converte — mas um vídeo não tem
-- nada a converter, e por isso vai do browser direito ao armazenamento. Daí uma
-- coleção só para eles.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa estes campos.
-- Aditivo, e correr duas vezes não faz mal.

create table if not exists videos (
  id serial primary key,
  title varchar,
  note varchar,
  updated_at timestamp(3) with time zone not null default now(),
  created_at timestamp(3) with time zone not null default now(),
  url varchar,
  thumbnail_u_r_l varchar,
  filename varchar,
  mime_type varchar,
  filesize numeric,
  width numeric,
  height numeric,
  focal_x numeric,
  focal_y numeric
);

create unique index if not exists videos_filename_idx on videos (filename);
create index if not exists videos_created_at_idx on videos (created_at);
create index if not exists videos_updated_at_idx on videos (updated_at);

-- O bloco de vídeo de um caso passa a poder apontar para um ficheiro carregado,
-- em vez de só para um endereço escrito à mão. As duas tabelas: a do projeto e
-- a das versões dele.
alter table projects_blocks_video
  add column if not exists ficheiro_id integer references videos(id) on delete set null;
create index if not exists projects_blocks_video_ficheiro_idx on projects_blocks_video (ficheiro_id);

alter table _projects_v_blocks_video
  add column if not exists ficheiro_id integer references videos(id) on delete set null;
create index if not exists _projects_v_blocks_video_ficheiro_idx on _projects_v_blocks_video (ficheiro_id);

-- O painel, que tranca documentos enquanto alguém os edita.
alter table payload_locked_documents_rels
  add column if not exists videos_id integer references videos(id) on delete cascade;
create index if not exists payload_locked_documents_rels_videos_id_idx
  on payload_locked_documents_rels (videos_id);
