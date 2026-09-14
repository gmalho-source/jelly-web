-- A capa inglesa de um artigo.
--
-- Quase sempre a portuguesa serve: uma fotografia não tem língua. Serve mal
-- quando tem texto lá dentro — o artigo dos ChatGPT Ads abre com um telemóvel
-- a mostrar uma conversa em português, e no site inglês isso lê-se como um
-- descuido. Vazia, o inglês continua a usar a portuguesa.
--
-- Uma coluna por tabela: a dos artigos e a das versões, porque os artigos têm
-- rascunhos e uma versão sem a coluna não grava.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Aditivo: não toca em nada do
-- que já lá está, e correr duas vezes não faz mal.

alter table posts add column if not exists cover_en_id integer references media(id) on delete set null;
create index if not exists posts_cover_en_idx on posts (cover_en_id);

alter table _posts_v add column if not exists version_cover_en_id integer references media(id) on delete set null;
create index if not exists _posts_v_version_cover_en_idx on _posts_v (version_cover_en_id);
