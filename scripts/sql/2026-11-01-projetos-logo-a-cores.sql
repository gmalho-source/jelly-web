-- Projetos: a opção «Mostrar o logo a cores». Sem ela o logo do cliente vai a
-- branco; ligada, vai como é (para logos com fundo próprio no ficheiro).
-- 2 instruções, uma por linha. Correr duas vezes não faz mal. Se aparecer o
-- botão «Commit», carregar nele no fim. Só acrescenta uma coluna, desligada.

alter table public.projects add column if not exists client_logo_cores boolean DEFAULT false;

alter table public._projects_v add column if not exists version_client_logo_cores boolean DEFAULT false;
