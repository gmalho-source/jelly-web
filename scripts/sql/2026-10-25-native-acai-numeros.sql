-- Native Açaí (projeto 60): números do review de maio a setembro de 2026 e
-- resumo novo.
--
-- Os números vêm da apresentação «Review de Marca, maio a setembro de 2026».
-- O «Números validados com o cliente» fica como está — desligado — e por isso
-- os números ficam gravados mas não vão para o ecrã até a Native os confirmar.
-- O resumo, esse, muda já: o anterior falava de «gerações mais jovens», e o
-- review mostra que o público continua a ser 35 a 54 anos.
--
-- O projeto guarda versões, e o painel abre a mais recente: a ficha e essa
-- versão mudam as duas, senão o painel mostrava o texto antigo e voltava a
-- gravá-lo. Pode correr-se mais de uma vez — o resultado é o mesmo.
--
-- Depois de correr, o site ainda mostra o que tinha em cache: abrir o projeto
-- no painel e carregar em Publicar refaz as páginas.
--
-- Os valores levam um espaço que não parte ( ): «14 M» e «6 600» não se
-- separam em duas linhas. O valor é o mesmo nas duas línguas, por isso não há
-- casas decimais — a vírgula e o ponto discordavam.

begin;

update projects set
  headline_value = E'14 M',
  headline_label_pt = 'visualizações no Meta em cinco meses',
  headline_label_en = 'views on Meta in five months',
  summary_pt = 'Pusemos a marca em vídeo curto e lançámos o TikTok de raiz: 14,2 milhões de visualizações no Meta e +21% de seguidores no Instagram em cinco meses.',
  summary_en = 'We moved the brand into short-form video and launched its TikTok from scratch: 14.2 million views on Meta and 21% more Instagram followers in five months.',
  updated_at = now()
where id = 60 and slug = 'native-acai';

update _projects_v set
  version_headline_value = E'14 M',
  version_headline_label_pt = 'visualizações no Meta em cinco meses',
  version_headline_label_en = 'views on Meta in five months',
  version_summary_pt = 'Pusemos a marca em vídeo curto e lançámos o TikTok de raiz: 14,2 milhões de visualizações no Meta e +21% de seguidores no Instagram em cinco meses.',
  version_summary_en = 'We moved the brand into short-form video and launched its TikTok from scratch: 14.2 million views on Meta and 21% more Instagram followers in five months.',
  version_updated_at = now(),
  updated_at = now()
where parent_id = 60 and latest;

-- Os quatro números: apagar os que houver e pôr estes, na ficha e na versão.
delete from projects_kpis where _parent_id = 60;
insert into projects_kpis (_order, _parent_id, id, value, label_pt, label_en)
select n._order, 60, substr(md5(random()::text || n._order), 1, 24), n.value, n.label_pt, n.label_en
from (values
  (1, '+21%', 'seguidores no Instagram', 'Instagram followers'),
  (2, E'6 600', 'seguidores no TikTok, numa conta criada de raiz', 'TikTok followers, on an account built from scratch'),
  (3, '+173%', 'alcance orgânico no Instagram', 'organic reach on Instagram'),
  (4, E'53 000', 'interações com os conteúdos', 'content interactions')
) as n(_order, value, label_pt, label_en)
where exists (select 1 from projects where id = 60 and slug = 'native-acai');

delete from _projects_v_version_kpis
where _parent_id in (select id from _projects_v where parent_id = 60 and latest);
insert into _projects_v_version_kpis (_order, _parent_id, value, label_pt, label_en, _uuid)
select k._order, v.id, k.value, k.label_pt, k.label_en, k.id
from projects_kpis k
join _projects_v v on v.parent_id = 60 and v.latest
where k._parent_id = 60;

-- O que ficou: uma linha da ficha, uma da versão, quatro números em cada.
select 'ficha' as onde, headline_value, left(summary_pt, 40) as resumo,
       (select count(*) from projects_kpis where _parent_id = 60) as numeros
from projects where id = 60
union all
select 'versão', version_headline_value, left(version_summary_pt, 40),
       (select count(*) from _projects_v_version_kpis where _parent_id = v.id)
from _projects_v v where parent_id = 60 and latest;

commit;
