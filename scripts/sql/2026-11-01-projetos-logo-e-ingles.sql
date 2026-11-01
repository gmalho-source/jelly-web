-- Projetos: o logo do cliente (escolhido da parede «Clientes») e a linha de
-- apoio em inglês. As disciplinas em inglês não precisam de nada: vão para a
-- tabela que já guarda as portuguesas.
-- 8 instruções, uma por linha. Correr duas vezes não faz mal. Se aparecer o
-- botão «Commit», carregar nele no fim. Só acrescenta colunas vazias.

alter table public.projects add column if not exists client_logo_id integer;

alter table public.projects add column if not exists subtitle_en character varying;

alter table public._projects_v add column if not exists version_client_logo_id integer;

alter table public._projects_v add column if not exists version_subtitle_en character varying;

create index if not exists projects_client_logo_idx ON public.projects USING btree (client_logo_id);

create index if not exists _projects_v_version_version_client_logo_idx ON public._projects_v USING btree (version_client_logo_id);

do $$ begin if not exists (select 1 from pg_constraint where conname = 'projects_client_logo_id_logos_id_fk') then alter table only public.projects ADD CONSTRAINT projects_client_logo_id_logos_id_fk FOREIGN KEY (client_logo_id) REFERENCES public.logos(id) ON DELETE SET NULL; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = '_projects_v_version_client_logo_id_logos_id_fk') then alter table only public._projects_v ADD CONSTRAINT _projects_v_version_client_logo_id_logos_id_fk FOREIGN KEY (version_client_logo_id) REFERENCES public.logos(id) ON DELETE SET NULL; end if; end $$;
