-- Assinatura digital de documentos: NDA, propostas, contratos.
--
-- Quatro tabelas novas (os pedidos, os signatários de cada pedido, o histórico
-- de cada pedido e os PDFs), os tipos delas, e na ficha dos prestadores a
-- marca «NDA assinado» com a data. Os nomes são os que o Payload cria sozinho
-- numa base vazia.
--
-- Uma instrução por linha, 25 instruções. Correr na Neon, no SQL Editor, ANTES
-- do deploy; depois correr o segundo ficheiro (2026-10-11-assinaturas-indices).
-- Se o editor mostrar o botão «Commit», carregar nele no fim. Correr duas vezes
-- não faz mal.

do $$ begin create type public.enum_assinaturas_tipo as enum ('nda', 'contrato', 'proposta', 'outro'); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_assinaturas_estado as enum ('rascunho', 'enviado', 'concluido', 'cancelado'); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_assinaturas_origem as enum ('modelo-nda', 'pdf'); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_assinaturas_signatarios_papel as enum ('contraparte', 'jelly'); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_assinaturas_signatarios_estado as enum ('pendente', 'assinado'); exception when duplicate_object then null; end $$;

create sequence if not exists public.assinaturas_ficheiros_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;

create sequence if not exists public.assinaturas_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;

create table if not exists public.assinaturas_ficheiros (id integer default nextval('public.assinaturas_ficheiros_id_seq'::regclass) not null, updated_at timestamp(3) with time zone default now() not null, created_at timestamp(3) with time zone default now() not null, url character varying, thumbnail_u_r_l character varying, filename character varying, mime_type character varying, filesize numeric, width numeric, height numeric, focal_x numeric, focal_y numeric, constraint assinaturas_ficheiros_pkey primary key (id));

create table if not exists public.assinaturas (id integer default nextval('public.assinaturas_id_seq'::regclass) not null, titulo character varying not null, tipo public.enum_assinaturas_tipo default 'nda'::public.enum_assinaturas_tipo not null, estado public.enum_assinaturas_estado default 'rascunho'::public.enum_assinaturas_estado, origem public.enum_assinaturas_origem default 'modelo-nda'::public.enum_assinaturas_origem not null, pdf_id integer, prestador_id integer, outra_parte_nome character varying, outra_parte_nif character varying, jelly_assina boolean default false, mensagem character varying, validade timestamp(3) with time zone, enviado_em timestamp(3) with time zone, concluido_em timestamp(3) with time zone, original_id integer, hash_original character varying, assinado_id integer, hash_final character varying, updated_at timestamp(3) with time zone default now() not null, created_at timestamp(3) with time zone default now() not null, constraint assinaturas_pkey primary key (id));

create table if not exists public.assinaturas_signatarios (_order integer not null, _parent_id integer not null, id character varying not null, nome character varying not null, email character varying not null, cargo character varying, papel public.enum_assinaturas_signatarios_papel default 'contraparte'::public.enum_assinaturas_signatarios_papel, estado public.enum_assinaturas_signatarios_estado default 'pendente'::public.enum_assinaturas_signatarios_estado, assinado_em timestamp(3) with time zone, enviado_em timestamp(3) with time zone, visto_em timestamp(3) with time zone, codigo_verificado_em timestamp(3) with time zone, nome_escrito character varying, ip character varying, navegador character varying, codigo_hash character varying, codigo_expira timestamp(3) with time zone, codigo_tentativas numeric, codigo_enviado_em timestamp(3) with time zone, constraint assinaturas_signatarios_pkey primary key (id));

create table if not exists public.assinaturas_registo (_order integer not null, _parent_id integer not null, id character varying not null, quando timestamp(3) with time zone, evento character varying, detalhe character varying, constraint assinaturas_registo_pkey primary key (id));

alter sequence public.assinaturas_ficheiros_id_seq owned by public.assinaturas_ficheiros.id;

alter sequence public.assinaturas_id_seq owned by public.assinaturas.id;

alter table public.prestadores add column if not exists nda_assinado boolean default false;

alter table public.prestadores add column if not exists nda_data timestamp(3) with time zone;

alter table public.payload_locked_documents_rels add column if not exists assinaturas_id integer;

alter table public.payload_locked_documents_rels add column if not exists assinaturas_ficheiros_id integer;

do $$ begin alter table public.assinaturas add constraint assinaturas_pdf_id_assinaturas_ficheiros_id_fk foreign key (pdf_id) references public.assinaturas_ficheiros(id) on delete set null; exception when duplicate_object then null; end $$;

do $$ begin alter table public.assinaturas add constraint assinaturas_original_id_assinaturas_ficheiros_id_fk foreign key (original_id) references public.assinaturas_ficheiros(id) on delete set null; exception when duplicate_object then null; end $$;

do $$ begin alter table public.assinaturas add constraint assinaturas_assinado_id_assinaturas_ficheiros_id_fk foreign key (assinado_id) references public.assinaturas_ficheiros(id) on delete set null; exception when duplicate_object then null; end $$;

do $$ begin alter table public.assinaturas add constraint assinaturas_prestador_id_prestadores_id_fk foreign key (prestador_id) references public.prestadores(id) on delete set null; exception when duplicate_object then null; end $$;

do $$ begin alter table public.assinaturas_signatarios add constraint assinaturas_signatarios_parent_id_fk foreign key (_parent_id) references public.assinaturas(id) on delete cascade; exception when duplicate_object then null; end $$;

do $$ begin alter table public.assinaturas_registo add constraint assinaturas_registo_parent_id_fk foreign key (_parent_id) references public.assinaturas(id) on delete cascade; exception when duplicate_object then null; end $$;

do $$ begin alter table public.payload_locked_documents_rels add constraint payload_locked_documents_rels_assinaturas_fk foreign key (assinaturas_id) references public.assinaturas(id) on delete cascade; exception when duplicate_object then null; end $$;

do $$ begin alter table public.payload_locked_documents_rels add constraint payload_locked_documents_rels_assinaturas_ficheiros_fk foreign key (assinaturas_ficheiros_id) references public.assinaturas_ficheiros(id) on delete cascade; exception when duplicate_object then null; end $$;
