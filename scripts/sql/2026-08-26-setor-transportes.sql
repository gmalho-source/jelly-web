-- Um setor novo em Clientes: Transportes & Logística.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que o usa. O campo é um
-- `select` no Payload, e um `select` em Postgres é um enum: acrescentar uma
-- opção no código sem acrescentar o valor aqui faz a gravação falhar.
--
-- Aditivo, e correr duas vezes não faz mal.
alter type enum_clients_sector add value if not exists 'transportes' after 'construcao';
