-- Registo da área de prestadores: cada pedido de link e cada entrada em
-- billing.jelly.pt (a lista «Registo de acessos» no painel, em Faturação).
-- 13 instruções, uma por linha. Correr duas vezes não faz mal. Se
-- aparecer o botão «Commit», carregar nele no fim. Só cria coisas novas.

do $$ begin create type public.enum_registo_faturacao_evento AS ENUM ( 'pedido', 'pedido-nao-prestador', 'pedido-limite', 'envio-falhou', 'aberto', 'entrada', 'expirado', 'usado', 'invalido', 'sem-ficha' ); exception when duplicate_object then null; end $$;

create sequence if not exists public.registo_faturacao_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

create table if not exists public.registo_faturacao ( id integer NOT NULL, quando timestamp(3) with time zone NOT NULL, evento public.enum_registo_faturacao_evento NOT NULL, email character varying, prestador_id integer, pedido_em timestamp(3) with time zone, minutos_desde_o_pedido numeric, ip character varying, navegador character varying, detalhe character varying, updated_at timestamp(3) with time zone DEFAULT now() NOT NULL, created_at timestamp(3) with time zone DEFAULT now() NOT NULL );

ALTER SEQUENCE public.registo_faturacao_id_seq OWNED BY public.registo_faturacao.id;

alter table only public.registo_faturacao ALTER COLUMN id SET DEFAULT nextval('public.registo_faturacao_id_seq'::regclass);

do $$ begin if not exists (select 1 from pg_constraint where conname = 'registo_faturacao_pkey') then alter table only public.registo_faturacao ADD CONSTRAINT registo_faturacao_pkey PRIMARY KEY (id); end if; end $$;

create index if not exists registo_faturacao_created_at_idx ON public.registo_faturacao USING btree (created_at);

create index if not exists registo_faturacao_email_idx ON public.registo_faturacao USING btree (email);

create index if not exists registo_faturacao_evento_idx ON public.registo_faturacao USING btree (evento);

create index if not exists registo_faturacao_prestador_idx ON public.registo_faturacao USING btree (prestador_id);

create index if not exists registo_faturacao_quando_idx ON public.registo_faturacao USING btree (quando);

create index if not exists registo_faturacao_updated_at_idx ON public.registo_faturacao USING btree (updated_at);

do $$ begin if not exists (select 1 from pg_constraint where conname = 'registo_faturacao_prestador_id_prestadores_id_fk') then alter table only public.registo_faturacao ADD CONSTRAINT registo_faturacao_prestador_id_prestadores_id_fk FOREIGN KEY (prestador_id) REFERENCES public.prestadores(id) ON DELETE SET NULL; end if; end $$;
