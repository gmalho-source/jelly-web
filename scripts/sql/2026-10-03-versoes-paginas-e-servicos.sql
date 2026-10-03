-- Versões nas Páginas e nos Serviços.
--
-- Cada gravação de uma página ou de um serviço passa a guardar uma versão, e o
-- separador «Versões» do painel deixa comparar e restaurar — um texto ou um
-- bloco apagado sem querer volta em dois cliques. Sem rascunhos: grava-se e
-- publica-se de uma vez, como até aqui. Até 50 versões por documento.
--
-- Só tabelas novas (as _pages_v* e _services_v*) e dois tipos para elas: as
-- tabelas que já existem não mudam uma coluna nem um índice. Os nomes são os
-- que o Payload cria sozinho numa base vazia — tirados de lá com pg_dump, e
-- não escritos à mão.
--
-- Uma instrução por linha, e as chaves dentro do «create table»: o SQL Editor
-- da Neon parte o script em instruções, e a primeira versão deste ficheiro —
-- com blocos de várias linhas — foi cortada a meio de uma (nada ficou
-- aplicado: o editor desfez tudo).
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Aditivo: não toca em nada do
-- que já lá está, e correr duas vezes não faz mal.
--
-- As versões começam vazias: a primeira aparece na primeira gravação de cada
-- página ou serviço depois do deploy.

begin;

do $$ begin create type public.enum__services_v_version_accent as enum ('lavender', 'chartreuse', 'coral'); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum__services_v_version_hero_height as enum ('curto', 'medio', 'alto'); exception when duplicate_object then null; end $$;

create sequence if not exists public._pages_v_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._pages_v_rels_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._pages_v_version_entries_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._services_v_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._services_v_rels_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._services_v_texts_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._services_v_version_areas_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._services_v_version_essay_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._services_v_version_includes_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public._services_v_version_phases_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create table if not exists public._pages_v (id integer DEFAULT nextval('public._pages_v_id_seq'::regclass) NOT NULL, parent_id integer, version_title character varying NOT NULL, version_key character varying NOT NULL, version_updated_at timestamp(3) with time zone, version_created_at timestamp(3) with time zone, created_at timestamp(3) with time zone DEFAULT now() NOT NULL, updated_at timestamp(3) with time zone DEFAULT now() NOT NULL, CONSTRAINT _pages_v_pkey PRIMARY KEY (id), CONSTRAINT _pages_v_parent_id_pages_id_fk FOREIGN KEY (parent_id) REFERENCES public.pages(id) ON DELETE SET NULL);

create table if not exists public._pages_v_rels (id integer DEFAULT nextval('public._pages_v_rels_id_seq'::regclass) NOT NULL, "order" integer, parent_id integer NOT NULL, path character varying NOT NULL, media_id integer, CONSTRAINT _pages_v_rels_pkey PRIMARY KEY (id), CONSTRAINT _pages_v_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE, CONSTRAINT _pages_v_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public._pages_v(id) ON DELETE CASCADE);

create table if not exists public._pages_v_version_entries (_order integer NOT NULL, _parent_id integer NOT NULL, id integer DEFAULT nextval('public._pages_v_version_entries_id_seq'::regclass) NOT NULL, key character varying NOT NULL, pt character varying, en character varying, _uuid character varying, CONSTRAINT _pages_v_version_entries_pkey PRIMARY KEY (id), CONSTRAINT _pages_v_version_entries_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._pages_v(id) ON DELETE CASCADE);

create table if not exists public._services_v (id integer DEFAULT nextval('public._services_v_id_seq'::regclass) NOT NULL, parent_id integer, version_name_pt character varying NOT NULL, version_name_en character varying, version_slug character varying NOT NULL, version_slug_en character varying, version_order numeric DEFAULT 100, version_claim_pt character varying, version_claim_en character varying, version_hero_title_pt character varying, version_hero_title_en character varying, version_link_pt character varying, version_link_en character varying, version_promise_pt character varying, version_promise_en character varying, version_accent public.enum__services_v_version_accent, version_hero_video character varying, version_hero_poster_id integer, version_hero_height public.enum__services_v_version_hero_height DEFAULT 'medio'::public.enum__services_v_version_hero_height, version_statement_first_pt character varying, version_statement_first_en character varying, version_statement_second_pt character varying, version_statement_second_en character varying, version_essay_title_pt character varying, version_essay_title_en character varying, version_essay_image_id integer, version_closing_question_pt character varying, version_closing_question_en character varying, version_closing_answer_pt character varying, version_closing_answer_en character varying, version_updated_at timestamp(3) with time zone, version_created_at timestamp(3) with time zone, created_at timestamp(3) with time zone DEFAULT now() NOT NULL, updated_at timestamp(3) with time zone DEFAULT now() NOT NULL, CONSTRAINT _services_v_pkey PRIMARY KEY (id), CONSTRAINT _services_v_parent_id_services_id_fk FOREIGN KEY (parent_id) REFERENCES public.services(id) ON DELETE SET NULL, CONSTRAINT _services_v_version_essay_image_id_media_id_fk FOREIGN KEY (version_essay_image_id) REFERENCES public.media(id) ON DELETE SET NULL, CONSTRAINT _services_v_version_hero_poster_id_media_id_fk FOREIGN KEY (version_hero_poster_id) REFERENCES public.media(id) ON DELETE SET NULL);

create table if not exists public._services_v_rels (id integer DEFAULT nextval('public._services_v_rels_id_seq'::regclass) NOT NULL, "order" integer, parent_id integer NOT NULL, path character varying NOT NULL, projects_id integer, CONSTRAINT _services_v_rels_pkey PRIMARY KEY (id), CONSTRAINT _services_v_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public._services_v(id) ON DELETE CASCADE, CONSTRAINT _services_v_rels_projects_fk FOREIGN KEY (projects_id) REFERENCES public.projects(id) ON DELETE CASCADE);

create table if not exists public._services_v_texts (id integer DEFAULT nextval('public._services_v_texts_id_seq'::regclass) NOT NULL, "order" integer NOT NULL, parent_id integer NOT NULL, path character varying NOT NULL, text character varying, CONSTRAINT _services_v_texts_pkey PRIMARY KEY (id), CONSTRAINT _services_v_texts_parent_fk FOREIGN KEY (parent_id) REFERENCES public._services_v(id) ON DELETE CASCADE);

create table if not exists public._services_v_version_areas (_order integer NOT NULL, _parent_id integer NOT NULL, id integer DEFAULT nextval('public._services_v_version_areas_id_seq'::regclass) NOT NULL, title_pt character varying, title_en character varying, body_pt character varying, body_en character varying, _uuid character varying, CONSTRAINT _services_v_version_areas_pkey PRIMARY KEY (id), CONSTRAINT _services_v_version_areas_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._services_v(id) ON DELETE CASCADE);

create table if not exists public._services_v_version_essay (_order integer NOT NULL, _parent_id integer NOT NULL, id integer DEFAULT nextval('public._services_v_version_essay_id_seq'::regclass) NOT NULL, body_pt character varying, body_en character varying, _uuid character varying, CONSTRAINT _services_v_version_essay_pkey PRIMARY KEY (id), CONSTRAINT _services_v_version_essay_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._services_v(id) ON DELETE CASCADE);

create table if not exists public._services_v_version_includes (_order integer NOT NULL, _parent_id integer NOT NULL, id integer DEFAULT nextval('public._services_v_version_includes_id_seq'::regclass) NOT NULL, item_pt character varying, item_en character varying, _uuid character varying, CONSTRAINT _services_v_version_includes_pkey PRIMARY KEY (id), CONSTRAINT _services_v_version_includes_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._services_v(id) ON DELETE CASCADE);

create table if not exists public._services_v_version_phases (_order integer NOT NULL, _parent_id integer NOT NULL, id integer DEFAULT nextval('public._services_v_version_phases_id_seq'::regclass) NOT NULL, name_pt character varying, name_en character varying, body_pt character varying, body_en character varying, _uuid character varying, CONSTRAINT _services_v_version_phases_pkey PRIMARY KEY (id), CONSTRAINT _services_v_version_phases_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._services_v(id) ON DELETE CASCADE);

ALTER SEQUENCE public._pages_v_id_seq OWNED BY public._pages_v.id;

ALTER SEQUENCE public._pages_v_rels_id_seq OWNED BY public._pages_v_rels.id;

ALTER SEQUENCE public._pages_v_version_entries_id_seq OWNED BY public._pages_v_version_entries.id;

ALTER SEQUENCE public._services_v_id_seq OWNED BY public._services_v.id;

ALTER SEQUENCE public._services_v_rels_id_seq OWNED BY public._services_v_rels.id;

ALTER SEQUENCE public._services_v_texts_id_seq OWNED BY public._services_v_texts.id;

ALTER SEQUENCE public._services_v_version_areas_id_seq OWNED BY public._services_v_version_areas.id;

ALTER SEQUENCE public._services_v_version_essay_id_seq OWNED BY public._services_v_version_essay.id;

ALTER SEQUENCE public._services_v_version_includes_id_seq OWNED BY public._services_v_version_includes.id;

ALTER SEQUENCE public._services_v_version_phases_id_seq OWNED BY public._services_v_version_phases.id;

create index if not exists _pages_v_created_at_idx ON public._pages_v USING btree (created_at);

create index if not exists _pages_v_parent_idx ON public._pages_v USING btree (parent_id);

create index if not exists _pages_v_rels_media_id_idx ON public._pages_v_rels USING btree (media_id);

create index if not exists _pages_v_rels_order_idx ON public._pages_v_rels USING btree ("order");

create index if not exists _pages_v_rels_parent_idx ON public._pages_v_rels USING btree (parent_id);

create index if not exists _pages_v_rels_path_idx ON public._pages_v_rels USING btree (path);

create index if not exists _pages_v_updated_at_idx ON public._pages_v USING btree (updated_at);

create index if not exists _pages_v_version_entries_order_idx ON public._pages_v_version_entries USING btree (_order);

create index if not exists _pages_v_version_entries_parent_id_idx ON public._pages_v_version_entries USING btree (_parent_id);

create index if not exists _pages_v_version_version_created_at_idx ON public._pages_v USING btree (version_created_at);

create index if not exists _pages_v_version_version_key_idx ON public._pages_v USING btree (version_key);

create index if not exists _pages_v_version_version_updated_at_idx ON public._pages_v USING btree (version_updated_at);

create index if not exists _services_v_created_at_idx ON public._services_v USING btree (created_at);

create index if not exists _services_v_parent_idx ON public._services_v USING btree (parent_id);

create index if not exists _services_v_rels_order_idx ON public._services_v_rels USING btree ("order");

create index if not exists _services_v_rels_parent_idx ON public._services_v_rels USING btree (parent_id);

create index if not exists _services_v_rels_path_idx ON public._services_v_rels USING btree (path);

create index if not exists _services_v_rels_projects_id_idx ON public._services_v_rels USING btree (projects_id);

create index if not exists _services_v_texts_order_parent ON public._services_v_texts USING btree ("order", parent_id);

create index if not exists _services_v_updated_at_idx ON public._services_v USING btree (updated_at);

create index if not exists _services_v_version_areas_order_idx ON public._services_v_version_areas USING btree (_order);

create index if not exists _services_v_version_areas_parent_id_idx ON public._services_v_version_areas USING btree (_parent_id);

create index if not exists _services_v_version_essay_order_idx ON public._services_v_version_essay USING btree (_order);

create index if not exists _services_v_version_essay_parent_id_idx ON public._services_v_version_essay USING btree (_parent_id);

create index if not exists _services_v_version_includes_order_idx ON public._services_v_version_includes USING btree (_order);

create index if not exists _services_v_version_includes_parent_id_idx ON public._services_v_version_includes USING btree (_parent_id);

create index if not exists _services_v_version_phases_order_idx ON public._services_v_version_phases USING btree (_order);

create index if not exists _services_v_version_phases_parent_id_idx ON public._services_v_version_phases USING btree (_parent_id);

create index if not exists _services_v_version_version_created_at_idx ON public._services_v USING btree (version_created_at);

create index if not exists _services_v_version_version_essay_image_idx ON public._services_v USING btree (version_essay_image_id);

create index if not exists _services_v_version_version_hero_poster_idx ON public._services_v USING btree (version_hero_poster_id);

create index if not exists _services_v_version_version_slug_en_idx ON public._services_v USING btree (version_slug_en);

create index if not exists _services_v_version_version_slug_idx ON public._services_v USING btree (version_slug);

create index if not exists _services_v_version_version_updated_at_idx ON public._services_v USING btree (version_updated_at);

commit;
