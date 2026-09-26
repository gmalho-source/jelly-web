-- Os setores da página de Clientes passam a viver no painel (Casa → Setores).
--
-- Até aqui eram uma lista fechada no código e um enum na base: cada setor novo
-- pedia um deploy e uma linha de SQL. Passam a ser uma coleção, com nome em
-- português e inglês e ordem, e cada cliente aponta para um setor dela.
--
-- O que isto faz, por esta ordem, numa só transacção:
--   1. cria a tabela `sectors` e mete lá os 17 setores, com os nomes que
--      estavam no site — os editados no painel incluídos («Retalho e consumo»,
--      «Serviços e saúde») — e o novo «Indústria ou comércio automóvel»;
--   2. acrescenta `clients.sector_id` e liga cada cliente ao seu setor, pelo
--      identificador que já tinha;
--   3. confirma que nenhum cliente ficou sem setor — se ficar, pára e não muda
--      nada;
--   4. acrescenta a coluna que o painel usa para trancar um setor enquanto
--      alguém o edita (`payload_locked_documents_rels.sectors_id`).
--
-- A coluna antiga `clients.sector` fica, sem uso e já sem obrigatoriedade:
-- é o caminho de volta, se for preciso. Apaga-se mais tarde.
--
-- Os nomes das tabelas, índices e chaves são os que o Payload cria sozinho
-- numa base vazia — tirados de lá, e não escritos à mão.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Correr duas vezes não faz mal.

begin;

create table if not exists sectors (
  id serial primary key,
  name_pt character varying not null,
  name_en character varying,
  slug character varying not null,
  "order" numeric default 100,
  updated_at timestamp(3) with time zone default now() not null,
  created_at timestamp(3) with time zone default now() not null
);
create unique index if not exists sectors_slug_idx on sectors (slug);
create index if not exists sectors_created_at_idx on sectors (created_at);
create index if not exists sectors_updated_at_idx on sectors (updated_at);

insert into sectors (name_pt, name_en, slug, "order") values
  ('Financeiro e seguros', 'Finance and insurance', 'financeiro', 10),
  ('Saúde e estética', 'Health and aesthetics', 'saude', 20),
  ('Bebidas e espirituosas', 'Drinks and spirits', 'bebidas', 30),
  ('Indústria alimentar', 'Food industry', 'alimentar', 40),
  ('Produtos de consumo', 'Consumer products', 'consumo', 50),
  ('Retalho e consumo', 'Retail and consumer', 'retalho', 60),
  ('Indústria', 'Industry', 'industria', 70),
  ('Indústria ou comércio automóvel', 'Automotive industry and retail', 'automovel', 80),
  ('Arquitetura e construção', 'Architecture and construction', 'construcao', 90),
  ('Mediação, consultoria, angariação e gestão imobiliária', 'Real estate brokerage, consulting, sourcing and management', 'imobiliario', 100),
  ('Transportes & Logística', 'Transport & Logistics', 'transportes', 110),
  ('Serviços e saúde', 'Services and health', 'servicos', 120),
  ('ONG', 'NGOs', 'ong', 130),
  ('Arte e coleccionismo', 'Art and collecting', 'arte', 140),
  ('Eventos e espaços', 'Events and venues', 'eventos', 150),
  ('Turismo e lazer', 'Travel and leisure', 'lazer', 160),
  ('Tecnologia', 'Technology', 'tecnologia', 170)
on conflict (slug) do nothing;

alter table clients add column if not exists sector_id integer;
update clients c set sector_id = s.id
  from sectors s
  where c.sector_id is null and s.slug = c.sector::text;

do $$ begin
  if exists (select 1 from clients where sector_id is null) then
    raise exception 'Há clientes sem setor: %', (select string_agg(name, ', ') from clients where sector_id is null);
  end if;
end $$;

alter table clients alter column sector_id set not null;
do $$ begin
  alter table clients add constraint clients_sector_id_sectors_id_fk
    foreign key (sector_id) references sectors(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists clients_sector_idx on clients (sector_id);

-- A coluna antiga deixa de ser obrigatória: o painel já não a preenche.
alter table clients alter column sector drop not null;

alter table payload_locked_documents_rels add column if not exists sectors_id integer;
create index if not exists payload_locked_documents_rels_sectors_id_idx on payload_locked_documents_rels (sectors_id);
do $$ begin
  alter table payload_locked_documents_rels add constraint payload_locked_documents_rels_sectors_fk
    foreign key (sectors_id) references sectors(id) on delete cascade;
exception when duplicate_object then null; end $$;

commit;
