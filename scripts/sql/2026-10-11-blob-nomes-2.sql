-- Ficheiros pessoais no Blob, passo 2 de 3: as fichas passam a apontar para os
-- nomes novos. Só depois de os ficheiros terem sido copiados (passo 1 e a
-- cópia). Só muda as fichas que ainda têm o nome antigo — uma que tenha sido
-- trocada entretanto fica como está. O `url` fica vazio de propósito: o Payload
-- calcula-o a partir do nome sempre que lê. 3 instruções, uma por linha.
-- Correr duas vezes não faz mal. Se aparecer o botão «Commit», carregar nele.

update public.documents d set filename = r.novo, url = null from public.blob_renomear r where r.tabela = 'documents' and r.id = d.id and d.filename = r.antigo;

update public.attachments d set filename = r.novo, url = null from public.blob_renomear r where r.tabela = 'attachments' and r.id = d.id and d.filename = r.antigo;

update public.assinaturas_ficheiros d set filename = r.novo, url = null from public.blob_renomear r where r.tabela = 'assinaturas_ficheiros' and r.id = d.id and d.filename = r.antigo;
