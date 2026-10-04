-- O endereço do artigo do evento: «mext» → «next».
--
-- O artigo «Jelly "Next Mode Event 2026"» (id 185) foi publicado com uma gralha
-- no endereço: /newsroom/jelly-mext-mode-event-2026. Passa a
-- /newsroom/jelly-next-mode-event-2026, e o endereço com a gralha fica na lista
-- dos antigos — quem o tiver guardado ou partilhado é reencaminhado (308) para
-- o novo. É o que o painel faz sozinho quando se muda o slug à mão.
--
-- No artigo e na versão mais recente dele, que é a que o editor abre: sem isso,
-- a próxima publicação no painel voltava a pôr o endereço com a gralha.
--
-- Correr duas vezes não faz mal. Na Neon, no SQL Editor; se aparecer o botão
-- «Commit», carregar nele no fim. Não precisa de deploy.

update public.posts set slug = 'jelly-next-mode-event-2026' where id = 185 and slug = 'jelly-mext-mode-event-2026';

update public._posts_v set version_slug = 'jelly-next-mode-event-2026' where parent_id = 185 and latest = true and version_slug = 'jelly-mext-mode-event-2026';

insert into public.posts_texts ("order", parent_id, path, text) select coalesce((select max("order") from public.posts_texts where parent_id = 185 and path = 'oldSlugs'), 0) + 1, 185, 'oldSlugs', 'jelly-mext-mode-event-2026' where not exists (select 1 from public.posts_texts where parent_id = 185 and path = 'oldSlugs' and text = 'jelly-mext-mode-event-2026');

insert into public._posts_v_texts ("order", parent_id, path, text) select coalesce((select max(t."order") from public._posts_v_texts t where t.parent_id = v.id and t.path = 'version.oldSlugs'), 0) + 1, v.id, 'version.oldSlugs', 'jelly-mext-mode-event-2026' from public._posts_v v where v.parent_id = 185 and v.latest = true and not exists (select 1 from public._posts_v_texts t where t.parent_id = v.id and t.path = 'version.oldSlugs' and t.text = 'jelly-mext-mode-event-2026');
