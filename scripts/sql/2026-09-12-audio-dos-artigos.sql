-- O artigo lido em voz alta.
--
-- Oito colunas por tabela: o endereço do MP3, a duração em segundos, a voz que
-- o disse e a impressão digital do texto lido, vezes duas línguas. A impressão
-- digital é o que faz o guião `npm run audio` poder correr sempre: só volta a
-- falar o que mudou.
--
-- As mesmas colunas em `_posts_v` porque os artigos têm rascunhos, e uma versão
-- sem estas colunas não grava.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Aditivo, e correr duas vezes
-- não faz mal.

alter table posts add column if not exists audio_pt varchar;
alter table posts add column if not exists audio_pt_segundos numeric;
alter table posts add column if not exists audio_pt_voz varchar;
alter table posts add column if not exists audio_pt_hash varchar;
alter table posts add column if not exists audio_en varchar;
alter table posts add column if not exists audio_en_segundos numeric;
alter table posts add column if not exists audio_en_voz varchar;
alter table posts add column if not exists audio_en_hash varchar;

alter table _posts_v add column if not exists version_audio_pt varchar;
alter table _posts_v add column if not exists version_audio_pt_segundos numeric;
alter table _posts_v add column if not exists version_audio_pt_voz varchar;
alter table _posts_v add column if not exists version_audio_pt_hash varchar;
alter table _posts_v add column if not exists version_audio_en varchar;
alter table _posts_v add column if not exists version_audio_en_segundos numeric;
alter table _posts_v add column if not exists version_audio_en_voz varchar;
alter table _posts_v add column if not exists version_audio_en_hash varchar;
