-- Assinaturas: os índices. Segundo ficheiro, a correr depois de
-- 2026-10-11-assinaturas.sql. 18 instruções, uma por linha. Correr duas vezes
-- não faz mal. Se aparecer o botão «Commit», carregar nele no fim.

create index if not exists assinaturas_pdf_idx on public.assinaturas using btree (pdf_id);

create index if not exists assinaturas_prestador_idx on public.assinaturas using btree (prestador_id);

create index if not exists assinaturas_original_idx on public.assinaturas using btree (original_id);

create index if not exists assinaturas_assinado_idx on public.assinaturas using btree (assinado_id);

create index if not exists assinaturas_estado_idx on public.assinaturas using btree (estado);

create index if not exists assinaturas_enviado_em_idx on public.assinaturas using btree (enviado_em);

create index if not exists assinaturas_concluido_em_idx on public.assinaturas using btree (concluido_em);

create index if not exists assinaturas_updated_at_idx on public.assinaturas using btree (updated_at);

create index if not exists assinaturas_created_at_idx on public.assinaturas using btree (created_at);

create index if not exists assinaturas_signatarios_order_idx on public.assinaturas_signatarios using btree (_order);

create index if not exists assinaturas_signatarios_parent_id_idx on public.assinaturas_signatarios using btree (_parent_id);

create index if not exists assinaturas_registo_order_idx on public.assinaturas_registo using btree (_order);

create index if not exists assinaturas_registo_parent_id_idx on public.assinaturas_registo using btree (_parent_id);

create unique index if not exists assinaturas_ficheiros_filename_idx on public.assinaturas_ficheiros using btree (filename);

create index if not exists assinaturas_ficheiros_updated_at_idx on public.assinaturas_ficheiros using btree (updated_at);

create index if not exists assinaturas_ficheiros_created_at_idx on public.assinaturas_ficheiros using btree (created_at);

create index if not exists payload_locked_documents_rels_assinaturas_id_idx on public.payload_locked_documents_rels using btree (assinaturas_id);

create index if not exists payload_locked_documents_rels_assinaturas_ficheiros_id_idx on public.payload_locked_documents_rels using btree (assinaturas_ficheiros_id);
