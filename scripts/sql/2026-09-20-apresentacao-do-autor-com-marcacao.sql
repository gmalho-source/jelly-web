-- A apresentação de um autor passa a aceitar marcação.
--
-- Era uma linha de texto simples. Passa a ser texto rico com a régua curta —
-- negrito, itálico e links — porque quem escreve precisa de poder apontar para
-- o LinkedIn ou para o sítio da pessoa, e um endereço escrito por extenso no
-- meio de uma frase de apresentação lê-se mal.
--
-- O Payload guarda texto rico em jsonb, e o Postgres recusa mudar varchar para
-- jsonb sem lhe dizer como: é o `using` daqui que faz a conversão. Uma
-- apresentação que já exista passa a um parágrafo com uma linha de texto
-- dentro, que é exactamente a árvore que o editor abre. Vazia ou em branco
-- fica nula, para o painel não mostrar um parágrafo vazio.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy: enquanto a coluna for
-- varchar, o código novo não lê nem grava este campo.
--
-- Não é idempotente por natureza — à segunda vez a coluna já é jsonb e o
-- `using` falha. O `do` à volta resolve isso: se já for jsonb, não faz nada.

do $$
begin
  if (select data_type from information_schema.columns
      where table_name = 'authors' and column_name = 'bio') = 'character varying'
  then
    alter table authors
      alter column bio type jsonb
      using case
        when bio is null or btrim(bio) = '' then null
        else jsonb_build_object(
          'root', jsonb_build_object(
            'type', 'root', 'format', '', 'indent', 0, 'version', 1, 'direction', 'ltr',
            'children', jsonb_build_array(jsonb_build_object(
              'type', 'paragraph', 'format', '', 'indent', 0, 'version', 1,
              'direction', 'ltr', 'textFormat', 0, 'textStyle', '',
              'children', jsonb_build_array(jsonb_build_object(
                'type', 'text', 'detail', 0, 'format', 0, 'mode', 'normal',
                'style', '', 'text', bio, 'version', 1))))))
      end;
  end if;
end $$;
