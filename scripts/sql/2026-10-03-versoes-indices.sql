-- Os índices das versões das Páginas e dos Serviços.
--
-- Continuação de 2026-10-03-versoes-paginas-e-servicos.sql. O SQL Editor da
-- Neon corre cerca de 40 instruções de cada vez, e esse script tem 66: as
-- tabelas, os tipos e as chaves ficaram todos, e dos 34 índices só os 6
-- primeiros. Este ficheiro tem só os 34, e os que já existem são saltados.
--
-- Os índices não mudam o que o painel faz, só a rapidez com que lê as
-- versões. Correr na Neon, no SQL Editor; se o editor pedir, carregar em
-- «Commit» no fim. Correr duas vezes não faz mal.

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
