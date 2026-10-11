-- Candidatura → prestador: o estado «Contratado» nas candidaturas, e a ligação
-- da ficha do prestador à candidatura de onde veio. 4 instruções, uma por
-- linha. Correr duas vezes não faz mal. Se aparecer o botão «Commit», carregar
-- nele no fim.

alter type public.enum_applications_status add value if not exists 'contratado' after 'aprovado';

alter table public.prestadores add column if not exists candidatura_id integer;

create index if not exists prestadores_candidatura_idx on public.prestadores using btree (candidatura_id);

do $$ begin if not exists (select 1 from pg_constraint where conname = 'prestadores_candidatura_id_applications_id_fk') then alter table public.prestadores add constraint prestadores_candidatura_id_applications_id_fk foreign key (candidatura_id) references public.applications(id) on delete set null; end if; end $$;
