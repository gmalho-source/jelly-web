-- Títulos de artigos com código HTML à vista.
--
-- Três artigos vieram do WordPress com o «&» escrito como código — «D&#038;B»,
-- «Social Shopping &#038; D2C», «Online &#038; Clicking» — e o site mostrava o
-- código em vez do símbolo, no título da página, no separador do browser e nas
-- listas. Corrige-se na tabela dos artigos e na versão mais recente de cada um,
-- que é a que o editor abre (as versões antigas ficam como estavam: são
-- história).
--
-- Só os títulos, em português e em inglês, e só onde o código aparece. Correr
-- duas vezes não faz mal: à segunda já não encontra nada. Na Neon, no SQL
-- Editor; se aparecer o botão «Commit», carregar nele no fim. Não precisa de
-- deploy: o site lê os títulos novos na próxima publicação ou purga.

update public.posts set title_pt = replace(replace(title_pt, '&#038;', '&'), '&amp;', '&') where title_pt like '%&#038;%' or title_pt like '%&amp;%';

update public.posts set title_en = replace(replace(title_en, '&#038;', '&'), '&amp;', '&') where title_en like '%&#038;%' or title_en like '%&amp;%';

update public._posts_v set version_title_pt = replace(replace(version_title_pt, '&#038;', '&'), '&amp;', '&') where latest = true and (version_title_pt like '%&#038;%' or version_title_pt like '%&amp;%');

update public._posts_v set version_title_en = replace(replace(version_title_en, '&#038;', '&'), '&amp;', '&') where latest = true and (version_title_en like '%&#038;%' or version_title_en like '%&amp;%');
