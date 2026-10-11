-- Ficheiros pessoais no Blob, passo 1 de 3: o nome novo de cada um.
-- Cria a tabela `blob_renomear` com um nome impossível de adivinhar para cada
-- CV, briefing e documento para assinar (o nome de agora mais um sufixo
-- aleatório). Não muda nada nas fichas. 4 instruções, uma por linha. Correr
-- duas vezes não faz mal: os nomes já sorteados ficam. Se aparecer o botão
-- «Commit», carregar nele no fim. Depois: avisar, para os ficheiros serem
-- copiados para os nomes novos.

create table if not exists public.blob_renomear (tabela text not null, id integer not null, antigo text not null, novo text not null, primary key (tabela, id));

insert into public.blob_renomear (tabela, id, antigo, novo) select 'documents', id, filename, regexp_replace(filename, '(\.[A-Za-z0-9]{1,8})?$', '-' || replace(gen_random_uuid()::text, '-', '') || '\1') from public.documents where filename is not null on conflict do nothing;

insert into public.blob_renomear (tabela, id, antigo, novo) select 'attachments', id, filename, regexp_replace(filename, '(\.[A-Za-z0-9]{1,8})?$', '-' || replace(gen_random_uuid()::text, '-', '') || '\1') from public.attachments where filename is not null on conflict do nothing;

insert into public.blob_renomear (tabela, id, antigo, novo) select 'assinaturas_ficheiros', id, filename, regexp_replace(filename, '(\.[A-Za-z0-9]{1,8})?$', '-' || replace(gen_random_uuid()::text, '-', '') || '\1') from public.assinaturas_ficheiros where filename is not null on conflict do nothing;
