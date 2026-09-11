-- Outro setor em Clientes: Mediação, consultoria, angariação e gestão imobiliária.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que o usa. O campo é um enum
-- em Postgres: acrescentar a opção no código sem acrescentar o valor aqui faz
-- a gravação falhar. (Desta vez foi corrido a partir da sessão, com o driver
-- serverless da Neon.)
alter type enum_clients_sector add value if not exists 'imobiliario' after 'construcao';
