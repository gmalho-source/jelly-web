-- Outro setor em Clientes: ONG.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que o usa. O campo é um enum
-- em Postgres: acrescentar a opção no código sem acrescentar o valor aqui faz
-- a gravação falhar.
alter type enum_clients_sector add value if not exists 'ong' after 'servicos';
