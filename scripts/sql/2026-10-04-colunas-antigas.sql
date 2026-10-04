-- Colunas que o código já não usa, e que pararam a gravação do áudio.
--
-- Três colunas ficaram na base depois de os campos saírem do painel:
--   · projects.hide_cover_in_body e _projects_v.version_hide_cover_in_body — a
--     caixa «Não mostrar a capa dentro da página», que morreu a 24 de setembro
--     quando o topo do caso ganhou imagem própria (3 projetos tinham-na
--     ligada; o site já não lia o valor);
--   · clients.sector, e o tipo dele — o setor escrito à mão, de uma lista
--     fixa, antes de os setores passarem a coleção («Setores»). Os 57 clientes
--     têm todos o setor novo preenchido.
--
-- Nada no site as lê. Foram elas que fizeram o Payload, na corrida do áudio,
-- parar a perguntar se as podia apagar; isso já está resolvido no código, e
-- isto é só a arrumação.
--
-- Uma instrução por linha. Correr na Neon, no SQL Editor; se aparecer o botão
-- «Commit», carregar nele no fim. Correr duas vezes não faz mal. Não precisa
-- de deploy.

alter table public.projects drop column if exists hide_cover_in_body;

alter table public._projects_v drop column if exists version_hide_cover_in_body;

alter table public.clients drop column if exists sector;

drop type if exists public.enum_clients_sector;
