-- Os planos JellyCARE passam a viver no painel, e a caixa de mensagens passa a
-- saber de onde veio cada pedido.
--
-- care_plans: nome, chave, preço, ordem, selo, campanha de arranque. A página
-- /jellycare lê daqui; sem estas tabelas cai nos planos escritos no código, que
-- são os mesmos preços de sempre — mas então nada disto se gere de fora.
--
-- care_plans_features: as linhas do cartão, uma por registo, com a ordem.
--
-- messages: uma subscrição do JellyCARE entra na mesma caixa dos briefings. As
-- três colunas novas são o que as distingue: a origem, o plano e o site.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa estas coleções.
-- Aditivo, e correr duas vezes não faz mal.

create table if not exists care_plans (
  id serial primary key,
  name varchar not null,
  key varchar not null,
  price numeric not null,
  "order" numeric default 100,
  active boolean default true,
  badge_pt varchar,
  badge_en varchar,
  campaign_active boolean default false,
  campaign_until timestamp(3) with time zone,
  campaign_label_pt varchar,
  campaign_label_en varchar,
  campaign_first_price numeric,
  updated_at timestamp(3) with time zone default now() not null,
  created_at timestamp(3) with time zone default now() not null
);

create unique index if not exists care_plans_key_idx on care_plans (key);
create index if not exists care_plans_created_at_idx on care_plans (created_at);
create index if not exists care_plans_updated_at_idx on care_plans (updated_at);

create table if not exists care_plans_features (
  _order integer not null,
  _parent_id integer not null,
  id varchar primary key,
  item_pt varchar not null,
  item_en varchar
);

create index if not exists care_plans_features_order_idx on care_plans_features (_order);
create index if not exists care_plans_features_parent_id_idx on care_plans_features (_parent_id);

do $$ begin
  alter table care_plans_features
    add constraint care_plans_features_parent_id_fk
    foreign key (_parent_id) references care_plans(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- O painel tranca um documento enquanto alguém o edita, e a tabela das relações
-- precisa de uma coluna por coleção. Sem isto, abrir um plano dá erro.
alter table payload_locked_documents_rels add column if not exists care_plans_id integer;
create index if not exists payload_locked_documents_rels_care_plans_id_idx
  on payload_locked_documents_rels (care_plans_id);

do $$ begin
  alter table payload_locked_documents_rels
    add constraint payload_locked_documents_rels_care_plans_fk
    foreign key (care_plans_id) references care_plans(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- De onde veio a mensagem, e o que a subscrição escolheu.
do $$ begin create type enum_messages_origin as enum ('contacto', 'jellycare'); exception when duplicate_object then null; end $$;
alter table messages add column if not exists origin enum_messages_origin default 'contacto';
alter table messages add column if not exists plan varchar;
alter table messages add column if not exists site varchar;
