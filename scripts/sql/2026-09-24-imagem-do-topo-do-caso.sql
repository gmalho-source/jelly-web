-- A imagem do topo da página de um caso.
--
-- A capa é a capa: identifica o projeto na grelha, no índice e como primeiro
-- fotograma dos vídeos do caso. Desde que o topo da página passou a ser uma
-- imagem grande com o título por cima, a capa passou a fazer também esse
-- papel — e nem todas servem para os dois. Uma capa que é um logótipo centrado
-- num fundo liso identifica bem e fica a boiar num topo de 560px.
--
-- Por isso esta coluna: uma segunda imagem, opcional, só para o topo. Vazia, o
-- topo continua a usar a capa, que é o que acontece na esmagadora maioria.
--
-- Uma coluna por tabela: a dos projetos e a das versões, porque os projetos
-- têm rascunhos e uma versão sem a coluna não grava.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Aditivo: não toca em nada do
-- que já lá está, e correr duas vezes não faz mal.

alter table projects add column if not exists hero_image_id integer references media(id) on delete set null;
create index if not exists projects_hero_image_idx on projects (hero_image_id);

alter table _projects_v add column if not exists version_hero_image_id integer references media(id) on delete set null;
create index if not exists _projects_v_version_hero_image_idx on _projects_v (version_hero_image_id);
