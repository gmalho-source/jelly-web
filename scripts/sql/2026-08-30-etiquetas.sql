-- As etiquetas: aquilo de que um artigo fala.
--
-- A categoria é a prateleira — uma, exclusiva, e é ela que aparece na etiqueta
-- do cartão e no último degrau da migalha de pão. As etiquetas são o assunto, e
-- um artigo pode ter várias: um texto sobre automação de campanhas está na
-- prateleira do Marketing e fala de marketing e de tecnologia.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa estes campos.
-- Aditivo, e correr duas vezes não faz mal.

-- ── A tabela das etiquetas ─────────────────────────────────────────────────
create table if not exists tags (
  id serial primary key,
  title_pt varchar not null,
  title_en varchar,
  slug varchar not null,
  updated_at timestamp(3) with time zone not null default now(),
  created_at timestamp(3) with time zone not null default now()
);

create unique index if not exists tags_slug_idx on tags (slug);
create index if not exists tags_created_at_idx on tags (created_at);
create index if not exists tags_updated_at_idx on tags (updated_at);

-- ── A ligação aos artigos ──────────────────────────────────────────────────
-- Uma relação de muitos não vive numa coluna do artigo: vive numa tabela de
-- ligação, que é o que o Payload chama `_rels`. Os artigos ainda não tinham
-- nenhuma, e por isso a tabela é criada aqui — `if not exists` para o dia em que
-- já existir por outra razão.
create table if not exists posts_rels (
  id serial primary key,
  "order" integer,
  parent_id integer not null references posts(id) on delete cascade,
  path varchar not null
);

alter table posts_rels add column if not exists tags_id integer references tags(id) on delete cascade;

create index if not exists posts_rels_order_idx on posts_rels ("order");
create index if not exists posts_rels_parent_idx on posts_rels (parent_id);
create index if not exists posts_rels_path_idx on posts_rels (path);
create index if not exists posts_rels_tags_id_idx on posts_rels (tags_id);

-- ── E às versões dos artigos ───────────────────────────────────────────────
-- Os artigos têm rascunhos, e um rascunho é uma linha na tabela de versões. Sem
-- isto, gravar um rascunho com etiquetas rebentava — as etiquetas não teriam
-- onde ficar.
create table if not exists _posts_v_rels (
  id serial primary key,
  "order" integer,
  parent_id integer not null references _posts_v(id) on delete cascade,
  path varchar not null
);

alter table _posts_v_rels add column if not exists tags_id integer references tags(id) on delete cascade;

create index if not exists _posts_v_rels_order_idx on _posts_v_rels ("order");
create index if not exists _posts_v_rels_parent_idx on _posts_v_rels (parent_id);
create index if not exists _posts_v_rels_path_idx on _posts_v_rels (path);
create index if not exists _posts_v_rels_tags_id_idx on _posts_v_rels (tags_id);

-- ── O painel, que tranca documentos enquanto alguém os edita ───────────────
alter table payload_locked_documents_rels
  add column if not exists tags_id integer references tags(id) on delete cascade;

create index if not exists payload_locked_documents_rels_tags_id_idx
  on payload_locked_documents_rels (tags_id);
