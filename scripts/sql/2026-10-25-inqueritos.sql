-- Inquéritos: os formulários, os links pessoais e as respostas (o módulo
-- «Inquéritos» do painel). 69 instruções, uma por linha. Correr duas
-- vezes não faz mal. Se aparecer o botão «Commit», carregar nele no fim.
-- Só cria coisas novas: nenhuma tabela que já existe perde nada.

do $$ begin create type public.enum_inqueritos_estado AS ENUM ( 'rascunho', 'aberto', 'fechado' ); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_inqueritos_lingua AS ENUM ( 'pt', 'en' ); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_inqueritos_perguntas_preencher AS ENUM ( 'empresa', 'nome' ); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_inqueritos_perguntas_tipo AS ENUM ( 'escolha', 'escala', 'nps', 'sim-nao', 'texto-curto', 'texto-longo', 'grelha', 'campos' ); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_inqueritos_publico AS ENUM ( 'clientes', 'equipa', 'todos' ); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_inqueritos_respostas_estado AS ENUM ( 'incompleta', 'completa' ); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_inqueritos_respostas_origem AS ENUM ( 'geral', 'pessoal', 'equipa', 'typeform' ); exception when duplicate_object then null; end $$;

alter type public.enum_users_roles add value if not exists 'inqueritos' after 'debitos';

create sequence if not exists public.inqueritos_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public.inqueritos_links_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create sequence if not exists public.inqueritos_respostas_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create table if not exists public.inqueritos ( id integer NOT NULL, titulo character varying NOT NULL, estado public.enum_inqueritos_estado DEFAULT 'rascunho'::public.enum_inqueritos_estado NOT NULL, publico public.enum_inqueritos_publico DEFAULT 'clientes'::public.enum_inqueritos_publico, lingua public.enum_inqueritos_lingua DEFAULT 'pt'::public.enum_inqueritos_lingua NOT NULL, abertura_titulo character varying, abertura_texto character varying, fecho_titulo character varying, fecho_texto character varying, avisar character varying, typeform_id character varying, chave character varying, updated_at timestamp(3) with time zone DEFAULT now() NOT NULL, created_at timestamp(3) with time zone DEFAULT now() NOT NULL );

create table if not exists public.inqueritos_links ( id integer NOT NULL, inquerito_id integer NOT NULL, empresa character varying, nome character varying, pipedrive_id numeric, pipedrive_titulo character varying, pipedrive_organizacao character varying, respondido_em timestamp(3) with time zone, resposta_id integer, titulo character varying, chave character varying, updated_at timestamp(3) with time zone DEFAULT now() NOT NULL, created_at timestamp(3) with time zone DEFAULT now() NOT NULL );

create table if not exists public.inqueritos_perguntas ( _order integer NOT NULL, _parent_id integer NOT NULL, id character varying NOT NULL, tipo public.enum_inqueritos_perguntas_tipo DEFAULT 'escolha'::public.enum_inqueritos_perguntas_tipo NOT NULL, obrigatoria boolean, titulo character varying NOT NULL, descricao character varying, varias boolean, maximo numeric, outra boolean, escala_min numeric DEFAULT 0, escala_max numeric DEFAULT 10, rotulo_min character varying, rotulo_meio character varying, rotulo_max character varying, mostrar_se character varying, mostrar_valor character varying, preencher public.enum_inqueritos_perguntas_preencher, chave character varying );

create table if not exists public.inqueritos_perguntas_linhas ( _order integer NOT NULL, _parent_id character varying NOT NULL, id character varying NOT NULL, rotulo character varying, chave character varying );

create table if not exists public.inqueritos_perguntas_opcoes ( _order integer NOT NULL, _parent_id character varying NOT NULL, id character varying NOT NULL, rotulo character varying, imagem_id integer, chave character varying );

create table if not exists public.inqueritos_respostas ( id integer NOT NULL, inquerito_id integer NOT NULL, origem public.enum_inqueritos_respostas_origem, estado public.enum_inqueritos_respostas_estado DEFAULT 'incompleta'::public.enum_inqueritos_respostas_estado, link_id integer, preenchida_por_id integer, iniciada_em timestamp(3) with time zone, concluida_em timestamp(3) with time zone, empresa character varying, nome character varying, pipedrive_id numeric, dados jsonb, titulo character varying, sessao character varying, typeform_token character varying, gravacoes numeric DEFAULT 0, updated_at timestamp(3) with time zone DEFAULT now() NOT NULL, created_at timestamp(3) with time zone DEFAULT now() NOT NULL );

ALTER SEQUENCE public.inqueritos_id_seq OWNED BY public.inqueritos.id;

ALTER SEQUENCE public.inqueritos_links_id_seq OWNED BY public.inqueritos_links.id;

ALTER SEQUENCE public.inqueritos_respostas_id_seq OWNED BY public.inqueritos_respostas.id;

alter table public.payload_locked_documents_rels add column if not exists inqueritos_id integer;

alter table public.payload_locked_documents_rels add column if not exists inqueritos_links_id integer;

alter table public.payload_locked_documents_rels add column if not exists inqueritos_respostas_id integer;

alter table only public.inqueritos ALTER COLUMN id SET DEFAULT nextval('public.inqueritos_id_seq'::regclass);

alter table only public.inqueritos_links ALTER COLUMN id SET DEFAULT nextval('public.inqueritos_links_id_seq'::regclass);

alter table only public.inqueritos_respostas ALTER COLUMN id SET DEFAULT nextval('public.inqueritos_respostas_id_seq'::regclass);

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_links_pkey') then alter table only public.inqueritos_links ADD CONSTRAINT inqueritos_links_pkey PRIMARY KEY (id); end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_perguntas_linhas_pkey') then alter table only public.inqueritos_perguntas_linhas ADD CONSTRAINT inqueritos_perguntas_linhas_pkey PRIMARY KEY (id); end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_perguntas_opcoes_pkey') then alter table only public.inqueritos_perguntas_opcoes ADD CONSTRAINT inqueritos_perguntas_opcoes_pkey PRIMARY KEY (id); end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_perguntas_pkey') then alter table only public.inqueritos_perguntas ADD CONSTRAINT inqueritos_perguntas_pkey PRIMARY KEY (id); end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_pkey') then alter table only public.inqueritos ADD CONSTRAINT inqueritos_pkey PRIMARY KEY (id); end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_respostas_pkey') then alter table only public.inqueritos_respostas ADD CONSTRAINT inqueritos_respostas_pkey PRIMARY KEY (id); end if; end $$;

create index if not exists inqueritos_created_at_idx ON public.inqueritos USING btree (created_at);

create index if not exists inqueritos_links_chave_idx ON public.inqueritos_links USING btree (chave);

create index if not exists inqueritos_links_created_at_idx ON public.inqueritos_links USING btree (created_at);

create index if not exists inqueritos_links_inquerito_idx ON public.inqueritos_links USING btree (inquerito_id);

create index if not exists inqueritos_links_resposta_idx ON public.inqueritos_links USING btree (resposta_id);

create index if not exists inqueritos_links_updated_at_idx ON public.inqueritos_links USING btree (updated_at);

create index if not exists inqueritos_perguntas_linhas_order_idx ON public.inqueritos_perguntas_linhas USING btree (_order);

create index if not exists inqueritos_perguntas_linhas_parent_id_idx ON public.inqueritos_perguntas_linhas USING btree (_parent_id);

create index if not exists inqueritos_perguntas_opcoes_imagem_idx ON public.inqueritos_perguntas_opcoes USING btree (imagem_id);

create index if not exists inqueritos_perguntas_opcoes_order_idx ON public.inqueritos_perguntas_opcoes USING btree (_order);

create index if not exists inqueritos_perguntas_opcoes_parent_id_idx ON public.inqueritos_perguntas_opcoes USING btree (_parent_id);

create index if not exists inqueritos_perguntas_order_idx ON public.inqueritos_perguntas USING btree (_order);

create index if not exists inqueritos_perguntas_parent_id_idx ON public.inqueritos_perguntas USING btree (_parent_id);

create index if not exists inqueritos_respostas_concluida_em_idx ON public.inqueritos_respostas USING btree (concluida_em);

create index if not exists inqueritos_respostas_created_at_idx ON public.inqueritos_respostas USING btree (created_at);

create index if not exists inqueritos_respostas_inquerito_idx ON public.inqueritos_respostas USING btree (inquerito_id);

create index if not exists inqueritos_respostas_link_idx ON public.inqueritos_respostas USING btree (link_id);

create index if not exists inqueritos_respostas_preenchida_por_idx ON public.inqueritos_respostas USING btree (preenchida_por_id);

create unique index if not exists inqueritos_respostas_sessao_idx ON public.inqueritos_respostas USING btree (sessao);

create unique index if not exists inqueritos_respostas_typeform_token_idx ON public.inqueritos_respostas USING btree (typeform_token);

create index if not exists inqueritos_respostas_updated_at_idx ON public.inqueritos_respostas USING btree (updated_at);

create index if not exists inqueritos_updated_at_idx ON public.inqueritos USING btree (updated_at);

create index if not exists payload_locked_documents_rels_inqueritos_id_idx ON public.payload_locked_documents_rels USING btree (inqueritos_id);

create index if not exists payload_locked_documents_rels_inqueritos_links_id_idx ON public.payload_locked_documents_rels USING btree (inqueritos_links_id);

create index if not exists payload_locked_documents_rels_inqueritos_respostas_id_idx ON public.payload_locked_documents_rels USING btree (inqueritos_respostas_id);

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_links_inquerito_id_inqueritos_id_fk') then alter table only public.inqueritos_links ADD CONSTRAINT inqueritos_links_inquerito_id_inqueritos_id_fk FOREIGN KEY (inquerito_id) REFERENCES public.inqueritos(id) ON DELETE SET NULL; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_links_resposta_id_inqueritos_respostas_id_fk') then alter table only public.inqueritos_links ADD CONSTRAINT inqueritos_links_resposta_id_inqueritos_respostas_id_fk FOREIGN KEY (resposta_id) REFERENCES public.inqueritos_respostas(id) ON DELETE SET NULL; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_perguntas_linhas_parent_id_fk') then alter table only public.inqueritos_perguntas_linhas ADD CONSTRAINT inqueritos_perguntas_linhas_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.inqueritos_perguntas(id) ON DELETE CASCADE; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_perguntas_opcoes_imagem_id_media_id_fk') then alter table only public.inqueritos_perguntas_opcoes ADD CONSTRAINT inqueritos_perguntas_opcoes_imagem_id_media_id_fk FOREIGN KEY (imagem_id) REFERENCES public.media(id) ON DELETE SET NULL; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_perguntas_opcoes_parent_id_fk') then alter table only public.inqueritos_perguntas_opcoes ADD CONSTRAINT inqueritos_perguntas_opcoes_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.inqueritos_perguntas(id) ON DELETE CASCADE; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_perguntas_parent_id_fk') then alter table only public.inqueritos_perguntas ADD CONSTRAINT inqueritos_perguntas_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.inqueritos(id) ON DELETE CASCADE; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_respostas_inquerito_id_inqueritos_id_fk') then alter table only public.inqueritos_respostas ADD CONSTRAINT inqueritos_respostas_inquerito_id_inqueritos_id_fk FOREIGN KEY (inquerito_id) REFERENCES public.inqueritos(id) ON DELETE SET NULL; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_respostas_link_id_inqueritos_links_id_fk') then alter table only public.inqueritos_respostas ADD CONSTRAINT inqueritos_respostas_link_id_inqueritos_links_id_fk FOREIGN KEY (link_id) REFERENCES public.inqueritos_links(id) ON DELETE SET NULL; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'inqueritos_respostas_preenchida_por_id_users_id_fk') then alter table only public.inqueritos_respostas ADD CONSTRAINT inqueritos_respostas_preenchida_por_id_users_id_fk FOREIGN KEY (preenchida_por_id) REFERENCES public.users(id) ON DELETE SET NULL; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'payload_locked_documents_rels_inqueritos_fk') then alter table only public.payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_inqueritos_fk FOREIGN KEY (inqueritos_id) REFERENCES public.inqueritos(id) ON DELETE CASCADE; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'payload_locked_documents_rels_inqueritos_links_fk') then alter table only public.payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_inqueritos_links_fk FOREIGN KEY (inqueritos_links_id) REFERENCES public.inqueritos_links(id) ON DELETE CASCADE; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'payload_locked_documents_rels_inqueritos_respostas_fk') then alter table only public.payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_inqueritos_respostas_fk FOREIGN KEY (inqueritos_respostas_id) REFERENCES public.inqueritos_respostas(id) ON DELETE CASCADE; end if; end $$;
