-- A equipa ganha página própria: dois retratos por pessoa, apresentação e
-- LinkedIn.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa estes campos.
-- Aditivo, e correr duas vezes não faz mal.

-- O retrato a cores, o que aparece quando se abre a pessoa. O preto e branco
-- continua a ser o `photo_id` que já existe.
alter table team add column if not exists photo_color_id integer references media(id) on delete set null;

-- A apresentação que a casa escreve, nas duas línguas.
alter table team add column if not exists bio_pt varchar;
alter table team add column if not exists bio_en varchar;

alter table team add column if not exists linkedin varchar;
