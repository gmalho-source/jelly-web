-- A parede de um logo deixa de ser texto escrito em cada registo e passa a ser
-- uma tabela: `logo_walls`.
--
-- Porquê: o campo era `logos.gallery`, um varchar. Quarenta e quatro registos
-- com "Clientes" escrito à mão são quarenta e quatro oportunidades de escrever
-- "clientes", e ficam duas paredes onde devia haver uma. Agora o nome existe
-- uma vez só, e cada logo aponta para ele.
--
-- O slug é o que liga a parede à página: a homepage pede `clientes`, a página
-- de Marketing pede `parceiros-marketing`, a de Tecnologia `parceiros-tecnologia`.
--
-- As duas paredes de parceiros são novas: substituem as listas de nomes que
-- estavam escritas em `src/content/marketing.ts` e `src/content/tecnologia.ts`.
-- Entram com os logos que já existiam e, onde ainda não há logo, só com o nome
-- — os selos de parceiro da Google e da Meta só o próprio parceiro os emite, e
-- até lá a faixa mostra o nome, como mostrava antes.
--
-- Os nove logos da parede "Logo Parceiros Consultoria" (nome que veio do
-- importador, não de ninguém) arrumam-se por tema: Mailchimp e Pipedrive em
-- marketing; iubenda, Google Workspace e cPanel em tecnologia; OpenAI, Claude,
-- Perplexity e Gemini numa parede de IA, que ainda não tem página onde apareça.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa a coleção nova.
-- Correr duas vezes não faz mal. Se a última instrução falhar por haver logos
-- sem parede, é porque sobrou uma galeria que isto não soube arrumar: ver quais
-- com `select distinct gallery from logos where wall_id is null`.

-- ── A tabela das paredes ───────────────────────────────────────────────────
create table if not exists logo_walls (
  id serial primary key,
  name varchar not null,
  slug varchar not null,
  updated_at timestamp(3) with time zone default now() not null,
  created_at timestamp(3) with time zone default now() not null
);

create unique index if not exists logo_walls_slug_idx on logo_walls using btree (slug);
create index if not exists logo_walls_updated_at_idx on logo_walls using btree (updated_at);
create index if not exists logo_walls_created_at_idx on logo_walls using btree (created_at);

-- O painel tranca o documento que alguém está a editar, e a tranca é uma
-- relação para cada coleção. Sem esta coluna, abrir uma parede dá erro.
alter table payload_locked_documents_rels add column if not exists logo_walls_id integer;

do $$
begin
  alter table payload_locked_documents_rels
    add constraint payload_locked_documents_rels_logo_walls_fk
    foreign key (logo_walls_id) references logo_walls(id) on delete cascade;
exception
  when duplicate_object then null;
end
$$;

create index if not exists payload_locked_documents_rels_logo_walls_id_idx
  on payload_locked_documents_rels using btree (logo_walls_id);

-- ── As paredes ─────────────────────────────────────────────────────────────
insert into logo_walls (name, slug) values
  ('Clientes', 'clientes'),
  ('Tecnologias Web', 'tecnologias-web'),
  ('Parceiros de marketing', 'parceiros-marketing'),
  ('Parceiros de tecnologia', 'parceiros-tecnologia'),
  ('Inteligência artificial', 'ia')
on conflict (slug) do nothing;

-- ── A coluna nova nos logos ────────────────────────────────────────────────
alter table logos add column if not exists wall_id integer;

do $$
begin
  alter table logos
    add constraint logos_wall_id_logo_walls_id_fk
    foreign key (wall_id) references logo_walls(id) on delete set null;
exception
  when duplicate_object then null;
end
$$;

create index if not exists logos_wall_idx on logos using btree (wall_id);

-- ── Arrumar o que já lá estava ─────────────────────────────────────────────
-- Tudo isto lê a coluna `gallery`, que desaparece no fim. À segunda passagem a
-- coluna já não existe e não há nada para arrumar — daí a guarda, que é o que
-- torna este ficheiro seguro de correr outra vez.
do $mig$
begin
  if exists (select 1 from information_schema.columns where table_name = 'logos' and column_name = 'gallery') then

    execute $q$
      update logos l set wall_id = w.id
      from logo_walls w
      where l.wall_id is null and w.slug = 'clientes' and l.gallery = 'Clientes'
    $q$;

    execute $q$
      update logos l set wall_id = w.id
      from logo_walls w
      where l.wall_id is null and w.slug = 'tecnologias-web' and l.gallery = 'Tecnologias Web'
    $q$;

    -- Os nove da consultoria, por tema. A ordem é a da faixa onde vão aparecer.
    execute $q$
      update logos l set wall_id = w.id, "order" = d.ord
      from (values
        ('Mailchimp', 'parceiros-marketing', 5),
        ('Pipedrive', 'parceiros-marketing', 6),
        ('iubenda', 'parceiros-tecnologia', 2),
        ('Google Workspace', 'parceiros-tecnologia', 7),
        ('cPanel', 'parceiros-tecnologia', 8),
        ('OpenAI', 'ia', 1),
        ('Claude', 'ia', 2),
        ('Perplexity', 'ia', 3),
        ('Gemini', 'ia', 4)
      ) as d(nome, parede, ord)
      join logo_walls w on w.slug = d.parede
      where l.gallery = 'Logo Parceiros Consultoria' and l.name = d.nome
    $q$;

    -- Uma galeria escrita à mão que isto não conheça fica com parede própria, com
    -- o nome que tinha. Mais vale uma parede a mais do que um logo sem sítio.
    execute $q$
      insert into logo_walls (name, slug)
      select distinct trim(l.gallery), lower(regexp_replace(trim(l.gallery), '\s+', '-', 'g'))
      from logos l
      where l.wall_id is null and coalesce(trim(l.gallery), '') <> ''
      on conflict (slug) do nothing
    $q$;

    execute $q$
      update logos l set wall_id = w.id
      from logo_walls w
      where l.wall_id is null and w.slug = lower(regexp_replace(trim(l.gallery), '\s+', '-', 'g'))
    $q$;

  end if;
end
$mig$;

-- A imagem deixa de ser obrigatória antes de entrar a primeira marca sem logo.
alter table logos alter column image_id drop not null;

-- ── As marcas que estavam escritas no código ───────────────────────────────
-- Sem imagem: a faixa mostra o nome até alguém carregar o logo.
insert into logos (name, wall_id, image_id, link, "order", updated_at, created_at)
select d.nome, w.id, null, d.sitio, d.ord, now(), now()
from (values
  ('Google Partner', 'parceiros-marketing', 'https://www.google.com/partners', 1),
  ('Meta Business Partner', 'parceiros-marketing', 'https://www.facebook.com/business/partner-directory', 2),
  ('Informa D&B', 'parceiros-marketing', 'https://www.informadb.pt', 3),
  ('Brevo', 'parceiros-marketing', 'https://www.brevo.com', 4),
  ('HighLevel', 'parceiros-marketing', 'https://www.gohighlevel.com', 7),
  ('Shopify', 'parceiros-tecnologia', 'https://www.shopify.com', 3),
  ('WooCommerce', 'parceiros-tecnologia', 'https://woocommerce.com', 4),
  ('WordPress', 'parceiros-tecnologia', 'https://wordpress.org', 5),
  ('Zoho', 'parceiros-tecnologia', 'https://www.zoho.com', 6),
  ('Next.js', 'parceiros-tecnologia', 'https://nextjs.org', 9),
  ('Payload CMS', 'parceiros-tecnologia', 'https://payloadcms.com', 10),
  ('Vercel', 'parceiros-tecnologia', 'https://vercel.com', 11)
) as d(nome, parede, sitio, ord)
join logo_walls w on w.slug = d.parede
where not exists (select 1 from logos l where l.wall_id = w.id and l.name = d.nome);

-- O Pipedrive está nas duas listas, e um registo só pode estar numa parede: o
-- segundo aponta para a mesma imagem do primeiro.
insert into logos (name, wall_id, image_id, link, "order", updated_at, created_at)
select 'Pipedrive', w.id,
  (select image_id from logos where name = 'Pipedrive' and image_id is not null order by id limit 1),
  'https://www.pipedrive.com', 1, now(), now()
from logo_walls w
where w.slug = 'parceiros-tecnologia'
  and not exists (select 1 from logos l where l.wall_id = w.id and l.name = 'Pipedrive');

-- ── Fechar ─────────────────────────────────────────────────────────────────
-- A parede passa a ser. Se isto falhar, sobrou um logo sem parede — ver acima.
alter table logos alter column wall_id set not null;

-- E o texto sai, que era o ponto disto tudo.
alter table logos drop column if exists gallery;
