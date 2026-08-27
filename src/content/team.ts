import type { TeamMember } from "./types";

/**
 * A equipa, herdada da página do site antigo (jelly.pt/equipa-jelly): nomes,
 * funções, apresentações e os dois retratos de cada pessoa.
 *
 * Os retratos vivem agora em `public/media/equipa`, convertidos para WebP a 900
 * de largura — 42 ficheiros, 1,8 MB ao todo. Estavam no site antigo, mas o
 * optimizador do Next levava 403 a ir buscá-los lá, e um site novo pendurado no
 * antigo cai no dia em que o antigo for desligado.
 *
 * O painel ganha a isto, pessoa a pessoa e campo a campo: quem lá puser um
 * retrato, uma função ou um texto, é isso que aparece. Este ficheiro é o chão.
 *
 * As apresentações estão em português. O site em inglês serve as mesmas:
 * traduzir vinte e uma apresentações é trabalho de quem as escreveu.
 */
export const team: TeamMember[] = [
  {
    name: "Alícia Coquim",
    role: { pt: "Content Marketing Manager", en: "Content Marketing Manager" },
    bio: { pt: "Sou a Alícia e sou de Aveiro - o que significa que, de vez em quando, o \"v\" foge e dá lugar ao \"b\". Mas não é só na fala que gosto de dar o meu toque especial. Sempre fui apaixonada por livros, especialmente por histórias que me transportam para outros mundos, e foi isso que me levou ao marketing: uma área onde posso criar, contar narrativas e dar asas à minha imaginação.\nMas nem só de palavras e criatividade se faz a minha vida. Tenho uma costela agregada ao desporto, especialmente o basquetebol e a natação, que pratiquei durante a minha adolescência. Disciplina, estratégia e espírito de equipa tornaram-se parte da minha essência. No entanto, existe uma pequena (ou talvez grande) controvérsia na minha história: adoro comer.\nEntre livros, criatividade, desporto e boa comida, sou um equilíbrio improvável, mas que faz todo o sentido para mim. Afinal a vida é para ser vivida intensamente.", en: "Sou a Alícia e sou de Aveiro - o que significa que, de vez em quando, o \"v\" foge e dá lugar ao \"b\". Mas não é só na fala que gosto de dar o meu toque especial. Sempre fui apaixonada por livros, especialmente por histórias que me transportam para outros mundos, e foi isso que me levou ao marketing: uma área onde posso criar, contar narrativas e dar asas à minha imaginação.\nMas nem só de palavras e criatividade se faz a minha vida. Tenho uma costela agregada ao desporto, especialmente o basquetebol e a natação, que pratiquei durante a minha adolescência. Disciplina, estratégia e espírito de equipa tornaram-se parte da minha essência. No entanto, existe uma pequena (ou talvez grande) controvérsia na minha história: adoro comer.\nEntre livros, criatividade, desporto e boa comida, sou um equilíbrio improvável, mas que faz todo o sentido para mim. Afinal a vida é para ser vivida intensamente." },
    photo: { src: "/media/equipa/alicia-coquim-pb.webp", alt: "Retrato de Alícia Coquim", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/alicia-coquim-cor.webp", alt: "Retrato de Alícia Coquim", width: 900, height: 1125 },
  },
  {
    name: "Ana Ventura",
    role: { pt: "Lead Senior Designer", en: "Lead Senior Designer" },
    bio: { pt: "Ana Ventura é uma designer multidisciplinar experiente, com mais de 25 anos de experiência na criação de marcas e identidade visual. Trabalhou em vários setores, desenvolvendo marcas desde o conceito até sistemas visuais coerentes e aplicações no mundo real. Com uma formação que combina pensamento estratégico e design prático, e experiência anterior como diretora criativa, Ana concentra-se na construção de marcas significativas e consistentes, concebidas para perdurar.", en: "Ana Ventura é uma designer multidisciplinar experiente, com mais de 25 anos de experiência na criação de marcas e identidade visual. Trabalhou em vários setores, desenvolvendo marcas desde o conceito até sistemas visuais coerentes e aplicações no mundo real. Com uma formação que combina pensamento estratégico e design prático, e experiência anterior como diretora criativa, Ana concentra-se na construção de marcas significativas e consistentes, concebidas para perdurar." },
    photo: { src: "/media/equipa/ana-ventura-pb.webp", alt: "Retrato de Ana Ventura", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/ana-ventura-cor.webp", alt: "Retrato de Ana Ventura", width: 900, height: 1600 },
  },
  {
    name: "Anderson Carlos",
    role: { pt: "Senior Digital Designer", en: "Senior Digital Designer" },
    bio: { pt: "Com mais de 12 anos de experiência, já trabalhou com grandes marcas como a Bayer e Kepler. A sua trajetória é marcada por criação de identidades visuais impactantes, soluções estratégicas de design e uma paixão por transformar ideias em experiências visuais memoráveis.\nMas não é só de pixels e cores que vive. É um apaixonado por tipografia, um curioso por novas tecnologias e um entusiasta de branding. Quando não está mergulhado em projetos, encontramo-lo a explorar tendências de design, a estudar o comportamento do consumidor ou em busca de inspiração em tudo, desde arquitetura até música.\nVive no equilíbrio entre criatividade e estratégia, entre o minimalismo e o ousado, entre o digital e o físico. Porque, no fim, design não é apenas sobre como as coisas parecem, mas sobre como elas funcionam, comunicam e emocionam.", en: "Com mais de 12 anos de experiência, já trabalhou com grandes marcas como a Bayer e Kepler. A sua trajetória é marcada por criação de identidades visuais impactantes, soluções estratégicas de design e uma paixão por transformar ideias em experiências visuais memoráveis.\nMas não é só de pixels e cores que vive. É um apaixonado por tipografia, um curioso por novas tecnologias e um entusiasta de branding. Quando não está mergulhado em projetos, encontramo-lo a explorar tendências de design, a estudar o comportamento do consumidor ou em busca de inspiração em tudo, desde arquitetura até música.\nVive no equilíbrio entre criatividade e estratégia, entre o minimalismo e o ousado, entre o digital e o físico. Porque, no fim, design não é apenas sobre como as coisas parecem, mas sobre como elas funcionam, comunicam e emocionam." },
    photo: { src: "/media/equipa/anderson-carlos-pb.webp", alt: "Retrato de Anderson Carlos", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/anderson-carlos-cor.webp", alt: "Retrato de Anderson Carlos", width: 900, height: 1125 },
    linkedin: "https://www.linkedin.com/in/cristina-craveiro-87aaa11b9/",
  },
  {
    name: "Caroline Lima",
    role: { pt: "Video & Motion", en: "Video & Motion" },
    photo: { src: "/media/equipa/caroline-lima-pb.webp", alt: "Retrato de Caroline Lima", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/caroline-lima-cor.webp", alt: "Retrato de Caroline Lima", width: 900, height: 598 },
  },
  {
    name: "Cristina Craveiro",
    role: { pt: "Senior Web Developer", en: "Senior Web Developer" },
    bio: { pt: "Cristina Craveiro depois de terminar a sua licenciatura em Engenharia de Sistemas e Informática no Instituto Politécnico de Viseu, rumou em direção a Lisboa onde teve oportunidade de trabalhar em projetos emocionantes solidificando a sua paixão pela programação e análise de sistemas, sempre com o foco em tornar o trabalho dos nossos clientes mais fácil e simplificado.\nAdora ler, ver filmes e viajar.", en: "Cristina Craveiro depois de terminar a sua licenciatura em Engenharia de Sistemas e Informática no Instituto Politécnico de Viseu, rumou em direção a Lisboa onde teve oportunidade de trabalhar em projetos emocionantes solidificando a sua paixão pela programação e análise de sistemas, sempre com o foco em tornar o trabalho dos nossos clientes mais fácil e simplificado.\nAdora ler, ver filmes e viajar." },
    photo: { src: "/media/equipa/cristina-craveiro-pb.webp", alt: "Retrato de Cristina Craveiro", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/cristina-craveiro-cor.webp", alt: "Retrato de Cristina Craveiro", width: 900, height: 1195 },
    linkedin: "https://www.linkedin.com/in/cristina-craveiro-87aaa11b9/",
  },
  {
    name: "Daniela Costa",
    role: { pt: "Marketing Account Manager", en: "Marketing Account Manager" },
    bio: { pt: "Licenciada em Marketing e Publicidade, integra a equipa da Jelly, onde combina criatividade, estratégia e boa disposição para dar vida a ideias e transformá-las em projetos que fazem a diferença. Apaixonada por comunicação, gosta de pensar fora da caixa e de encontrar soluções que façam sentido tanto para as marcas como para as pessoas.\nCom um espírito colaborativo e uma curiosidade constante, acredita que os melhores resultados nascem do trabalho em equipa e da vontade de aprender todos os dias. Encarar desafios faz parte da sua forma de estar, sempre com foco em criar, evoluir e fazer a diferença.", en: "Licenciada em Marketing e Publicidade, integra a equipa da Jelly, onde combina criatividade, estratégia e boa disposição para dar vida a ideias e transformá-las em projetos que fazem a diferença. Apaixonada por comunicação, gosta de pensar fora da caixa e de encontrar soluções que façam sentido tanto para as marcas como para as pessoas.\nCom um espírito colaborativo e uma curiosidade constante, acredita que os melhores resultados nascem do trabalho em equipa e da vontade de aprender todos os dias. Encarar desafios faz parte da sua forma de estar, sempre com foco em criar, evoluir e fazer a diferença." },
    photo: { src: "/media/equipa/daniela-costa-pb.webp", alt: "Retrato de Daniela Costa", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/daniela-costa-cor.webp", alt: "Retrato de Daniela Costa", width: 900, height: 1125 },
  },
  {
    name: "Fausto Pinto",
    role: { pt: "Web Dev & Support", en: "Web Dev & Support" },
    bio: { pt: "Fausto Pinto, mais conhecido como \"Takumi\", é o nosso \"velhote\".\nChegou à Jelly em 2014 como Developer, mas para além dos zeros e uns, dá uma mãozinha aos nossos clientes... para garantir que nenhum problema fique por resolver.\nTem uma grande paixão por carros, por boa música e é fã de animes.", en: "Fausto Pinto, mais conhecido como \"Takumi\", é o nosso \"velhote\".\nChegou à Jelly em 2014 como Developer, mas para além dos zeros e uns, dá uma mãozinha aos nossos clientes... para garantir que nenhum problema fique por resolver.\nTem uma grande paixão por carros, por boa música e é fã de animes." },
    photo: { src: "/media/equipa/fausto-pinto-pb.webp", alt: "Retrato de Fausto Pinto", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/fausto-pinto-cor.webp", alt: "Retrato de Fausto Pinto", width: 900, height: 1195 },
  },
  {
    name: "Filipa Barata",
    role: { pt: "Marketing Account Manager", en: "Marketing Account Manager" },
    bio: { pt: "Filipa é licenciada em Gestão e possui um mestrado em Marketing, complementado por uma pós-graduação em Gestão de Projetos em Saúde. Desde o início da sua carreira, tem uma ligação forte à área da saúde, sempre atuando nas áreas de gestão e marketing.\nCom um espírito entusiasta e colaborativo, acredita que o trabalho em equipa é essencial para transformar ideias em projetos incríveis e para superar desafios. Está constantemente motivada a abraçar novos desafios e a fazer a diferença, tornando as suas visões uma realidade.", en: "Filipa é licenciada em Gestão e possui um mestrado em Marketing, complementado por uma pós-graduação em Gestão de Projetos em Saúde. Desde o início da sua carreira, tem uma ligação forte à área da saúde, sempre atuando nas áreas de gestão e marketing.\nCom um espírito entusiasta e colaborativo, acredita que o trabalho em equipa é essencial para transformar ideias em projetos incríveis e para superar desafios. Está constantemente motivada a abraçar novos desafios e a fazer a diferença, tornando as suas visões uma realidade." },
    photo: { src: "/media/equipa/filipa-barata-pb.webp", alt: "Retrato de Filipa Barata", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/filipa-barata-cor.webp", alt: "Retrato de Filipa Barata", width: 900, height: 1200 },
  },
  {
    name: "Filipa Santos",
    role: { pt: "PPC Manager", en: "PPC Manager" },
    bio: { pt: "Fascinada por marketing, publicidade e vendas, fiz mestrado em Marketing e Inovação. Diria que são estas as áreas que me puxam e onde gosto de estar sempre a aprender mais.\nAcredito genuinamente que o conhecimento não ocupa lugar, por isso procuro constantemente evoluir e desafiar-me. Fora do lado profissional, gosto de manter o equilíbrio: pratico desporto regularmente, com um gosto especial pelo kickboxing, que me ajuda a libertar energia e manter o foco. Adoro ler - é uma das minhas formas favoritas de viajar, mas também gosto de apanhar um avião sempre que posso. Para além disso, adoro animais e sou uma assumida cat lover.", en: "Fascinada por marketing, publicidade e vendas, fiz mestrado em Marketing e Inovação. Diria que são estas as áreas que me puxam e onde gosto de estar sempre a aprender mais.\nAcredito genuinamente que o conhecimento não ocupa lugar, por isso procuro constantemente evoluir e desafiar-me. Fora do lado profissional, gosto de manter o equilíbrio: pratico desporto regularmente, com um gosto especial pelo kickboxing, que me ajuda a libertar energia e manter o foco. Adoro ler - é uma das minhas formas favoritas de viajar, mas também gosto de apanhar um avião sempre que posso. Para além disso, adoro animais e sou uma assumida cat lover." },
    photo: { src: "/media/equipa/filipa-santos-pb.webp", alt: "Retrato de Filipa Santos", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/filipa-santos-cor.webp", alt: "Retrato de Filipa Santos", width: 900, height: 502 },
  },
  {
    name: "Frederico Pereira",
    role: { pt: "Head of Video", en: "Head of Video" },
    bio: { pt: "Uma Licenciatura em Multimédia, juntamente com a sua paixão por imagem em movimento, e uma aptidão natural para contar histórias, deram origem à constante procura por uma performance visual subtil e emotiva. Não descura estar sempre focado na procura constante de soluções e formas de inovar nas técnicas e linguagens usadas. Gosta de estar a par do que se faz de novo.", en: "Uma Licenciatura em Multimédia, juntamente com a sua paixão por imagem em movimento, e uma aptidão natural para contar histórias, deram origem à constante procura por uma performance visual subtil e emotiva. Não descura estar sempre focado na procura constante de soluções e formas de inovar nas técnicas e linguagens usadas. Gosta de estar a par do que se faz de novo." },
    photo: { src: "/media/equipa/frederico-pereira-pb.webp", alt: "Retrato de Frederico Pereira", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/frederico-pereira-cor.webp", alt: "Retrato de Frederico Pereira", width: 900, height: 1195 },
  },
  {
    name: "Frederico Teopisto",
    role: { pt: "Head of Design", en: "Head of Design" },
    bio: { pt: "Licenciado em Design Gráfico e com quase uma década de experiência, Frederico trabalha entre branding, identidade visual e editorial, a criar sistemas que fazem sentido na forma e na função. Na Jelly, transforma ideias em marcas claras, consistentes e prontas para crescer.\nFora do ecrã, mantém uma ligação próxima à natureza e ao lado manual de criar e reparar. Está sempre a testar, desmontar e reconstruir, com uma mentalidade de artesão dentro e fora do estúdio.", en: "Licenciado em Design Gráfico e com quase uma década de experiência, Frederico trabalha entre branding, identidade visual e editorial, a criar sistemas que fazem sentido na forma e na função. Na Jelly, transforma ideias em marcas claras, consistentes e prontas para crescer.\nFora do ecrã, mantém uma ligação próxima à natureza e ao lado manual de criar e reparar. Está sempre a testar, desmontar e reconstruir, com uma mentalidade de artesão dentro e fora do estúdio." },
    photo: { src: "/media/equipa/frederico-teopisto-pb.webp", alt: "Retrato de Frederico Teopisto", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/frederico-teopisto-cor.webp", alt: "Retrato de Frederico Teopisto", width: 900, height: 1612 },
  },
  {
    name: "Gonçalo Malho Rodrigues",
    role: { pt: "Founder & CEO", en: "Founder & CEO" },
    bio: { pt: "Com um percurso ligado ao marketing, à tecnologia e ao empreendedorismo, Gonçalo Malho Rodrigues trabalha diariamente com marcas e empresas que procuram mais do que visibilidade: procuram clareza, foco e resultados sustentáveis. A sua abordagem parte sempre do mindset e da compreensão profunda do negócio, antes das ferramentas ou canais.\nAo longo do seu percurso, tem desenvolvido e liderado projetos em áreas como branding, performance digital, análise de mercado e inovação, cruzando pensamento estratégico com uma forte orientação prática. Acredita que boas ideias só têm valor quando conseguem ser implementadas e medidas.\nNa Jelly, lidera a visão estratégica da agência, ajudando equipas e clientes a tomar melhores decisões num contexto digital cada vez mais complexo e, por isso, desafiante.", en: "Com um percurso ligado ao marketing, à tecnologia e ao empreendedorismo, Gonçalo Malho Rodrigues trabalha diariamente com marcas e empresas que procuram mais do que visibilidade: procuram clareza, foco e resultados sustentáveis. A sua abordagem parte sempre do mindset e da compreensão profunda do negócio, antes das ferramentas ou canais.\nAo longo do seu percurso, tem desenvolvido e liderado projetos em áreas como branding, performance digital, análise de mercado e inovação, cruzando pensamento estratégico com uma forte orientação prática. Acredita que boas ideias só têm valor quando conseguem ser implementadas e medidas.\nNa Jelly, lidera a visão estratégica da agência, ajudando equipas e clientes a tomar melhores decisões num contexto digital cada vez mais complexo e, por isso, desafiante." },
    photo: { src: "/media/equipa/goncalo-malho-rodrigues-pb.webp", alt: "Retrato de Gonçalo Malho Rodrigues", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/goncalo-malho-rodrigues-cor.webp", alt: "Retrato de Gonçalo Malho Rodrigues", width: 900, height: 1195 },
    linkedin: "https://www.linkedin.com/in/gmalho/",
  },
  {
    name: "Hugo Costa",
    role: { pt: "Operations & Projects Manager", en: "Operations & Projects Manager" },
    bio: { pt: "Hugo, o elemento mais antigo da JELLY. Está presente desde a sua génese e já passou por várias funções até chegar às Operações e Gestão de Projetos. Já perdeu a conta às muitas e muitas dezenas de projetos de design e desenvolvimento ao longo de quase 20 anos.\nÉ o nosso \"rezingão\" de serviço mas está sempre cá para ajudar.\nAdora Legos, é viciado em séries e filmes e um Chef de mão cheia nos tempos livres.", en: "Hugo, o elemento mais antigo da JELLY. Está presente desde a sua génese e já passou por várias funções até chegar às Operações e Gestão de Projetos. Já perdeu a conta às muitas e muitas dezenas de projetos de design e desenvolvimento ao longo de quase 20 anos.\nÉ o nosso \"rezingão\" de serviço mas está sempre cá para ajudar.\nAdora Legos, é viciado em séries e filmes e um Chef de mão cheia nos tempos livres." },
    photo: { src: "/media/equipa/hugo-costa-pb.webp", alt: "Retrato de Hugo Costa", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/hugo-costa-cor.webp", alt: "Retrato de Hugo Costa", width: 900, height: 1195 },
  },
  {
    name: "Joana Bon de Sousa",
    role: { pt: "Marketing Account Manager", en: "Marketing Account Manager" },
    bio: { pt: "Licenciada em Comunicação, Marketing e Relações Públicas e mestre em Comunicação Estratégica e Liderança pela Universidade Católica Portuguesa, vê o marketing como a combinação entre estratégia, criatividade e a capacidade de transformar ideias em experiências com impacto.\nAcredita que, hoje, as marcas vão muito além dos produtos são experiências, relações e ligações autênticas com as pessoas. É precisamente essa ligação entre pensamento estratégico, criatividade e impacto real no público que mais a motiva no universo do marketing.\nApaixonada pela constante evolução das marcas e das tendências, interessa-se especialmente pelo desenvolvimento de projetos capazes de criar relevância, diferenciação e proximidade. Com uma abordagem criativa, organizada e atenta ao detalhe, gosta de acompanhar diferentes fases de um projeto, procurando sempre soluções alinhadas com os objetivos de cada marca.\nFora do contexto profissional, viajar e descobrir novas culturas são algumas das experiências que mais alimentam a sua inspiração, criatividade e visão sobre o mundo.", en: "Licenciada em Comunicação, Marketing e Relações Públicas e mestre em Comunicação Estratégica e Liderança pela Universidade Católica Portuguesa, vê o marketing como a combinação entre estratégia, criatividade e a capacidade de transformar ideias em experiências com impacto.\nAcredita que, hoje, as marcas vão muito além dos produtos são experiências, relações e ligações autênticas com as pessoas. É precisamente essa ligação entre pensamento estratégico, criatividade e impacto real no público que mais a motiva no universo do marketing.\nApaixonada pela constante evolução das marcas e das tendências, interessa-se especialmente pelo desenvolvimento de projetos capazes de criar relevância, diferenciação e proximidade. Com uma abordagem criativa, organizada e atenta ao detalhe, gosta de acompanhar diferentes fases de um projeto, procurando sempre soluções alinhadas com os objetivos de cada marca.\nFora do contexto profissional, viajar e descobrir novas culturas são algumas das experiências que mais alimentam a sua inspiração, criatividade e visão sobre o mundo." },
    photo: { src: "/media/equipa/joana-bon-de-sousa-pb.webp", alt: "Retrato de Joana Bon de Sousa", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/joana-bon-de-sousa-cor.webp", alt: "Retrato de Joana Bon de Sousa", width: 900, height: 502 },
  },
  {
    name: "Letícia Lemos",
    role: { pt: "Video & Motion Editor", en: "Video & Motion Editor" },
    bio: { pt: "Desde pequena era uma amante de filmes e histórias. Letícia passou a infância entre o Oriente Médio e a Ásia. Depois de fazer sua licenciatura em Film Production na Inglaterra, completou o seu mestrado em Editing & Post-Production. Agora, encontra-se a viver em Portugal. Contando pequenas histórias nas redes sociais.\nPoderá sempre encontrá-la a consumir algum tipo de história... seja um livro, séries ou filme.", en: "Desde pequena era uma amante de filmes e histórias. Letícia passou a infância entre o Oriente Médio e a Ásia. Depois de fazer sua licenciatura em Film Production na Inglaterra, completou o seu mestrado em Editing & Post-Production. Agora, encontra-se a viver em Portugal. Contando pequenas histórias nas redes sociais.\nPoderá sempre encontrá-la a consumir algum tipo de história... seja um livro, séries ou filme." },
    photo: { src: "/media/equipa/leticia-lemos-pb.webp", alt: "Retrato de Letícia Lemos", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/leticia-lemos-cor.webp", alt: "Retrato de Letícia Lemos", width: 900, height: 1195 },
  },
  {
    name: "Maria Felix da Costa",
    role: { pt: "COO - Chief Operating Officer", en: "COO - Chief Operating Officer" },
    bio: { pt: "Licenciada em Gestão de Marketing e pós-graduada em Marketing Digital e Direção Comercial e Vendas, Maria conta com mais de uma década de experiência na coordenação de equipas e projetos em diversas áreas do marketing digital - IT, media, seo, social media, automation.\nPositiva e resiliente, assume que: Knowledge has to be improved, challenged, and increased constantly, or it vanishes (Peter Drucker).\nApaixonada por séries, praia, música, família e comida aproveita todas as oportunidades para uma escapadela e fazer o turn off. Assume, desde 2024, o papel de COO na Jelly.", en: "Licenciada em Gestão de Marketing e pós-graduada em Marketing Digital e Direção Comercial e Vendas, Maria conta com mais de uma década de experiência na coordenação de equipas e projetos em diversas áreas do marketing digital - IT, media, seo, social media, automation.\nPositiva e resiliente, assume que: Knowledge has to be improved, challenged, and increased constantly, or it vanishes (Peter Drucker).\nApaixonada por séries, praia, música, família e comida aproveita todas as oportunidades para uma escapadela e fazer o turn off. Assume, desde 2024, o papel de COO na Jelly." },
    photo: { src: "/media/equipa/maria-felix-da-costa-pb.webp", alt: "Retrato de Maria Felix da Costa", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/maria-felix-da-costa-cor.webp", alt: "Retrato de Maria Felix da Costa", width: 900, height: 1200 },
    linkedin: "https://www.linkedin.com/in/maria-felix-costa/",
  },
  {
    name: "Nuno Baptista Marques",
    role: { pt: "Board Executive Member", en: "Board Executive Member" },
    bio: { pt: "Nuno Baptista Marques tem um MBA da AESE e é um empresário de sucesso em várias áreas, em particular na área da saúde.\nÉ desde outubro de 2022 Membro Executivo da Direção da Jelly.", en: "Nuno Baptista Marques tem um MBA da AESE e é um empresário de sucesso em várias áreas, em particular na área da saúde.\nÉ desde outubro de 2022 Membro Executivo da Direção da Jelly." },
    photo: { src: "/media/equipa/nuno-baptista-marques-pb.webp", alt: "Retrato de Nuno Baptista Marques", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/nuno-baptista-marques-cor.webp", alt: "Retrato de Nuno Baptista Marques", width: 900, height: 1195 },
    linkedin: "https://www.linkedin.com/in/nuno-baptista-marques-b2b9815/",
  },
  {
    name: "Paulo Cleto Duarte",
    role: { pt: "Board Senior Advisor", en: "Board Senior Advisor" },
    bio: { pt: "Paulo Cleto Duarte tem um MBA da universidade católica e um AMP no IMD Business School, na Suíça. Tem assumido posições de liderança em várias empresas na área da saúde e é atualmente Executive Board Member na UNILABS.\nPaulo, gosta de passar o seu tempo em família e, nos tempos livres, é o nosso leme.", en: "Paulo Cleto Duarte tem um MBA da universidade católica e um AMP no IMD Business School, na Suíça. Tem assumido posições de liderança em várias empresas na área da saúde e é atualmente Executive Board Member na UNILABS.\nPaulo, gosta de passar o seu tempo em família e, nos tempos livres, é o nosso leme." },
    photo: { src: "/media/equipa/paulo-cleto-duarte-pb.webp", alt: "Retrato de Paulo Cleto Duarte", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/paulo-cleto-duarte-cor.webp", alt: "Retrato de Paulo Cleto Duarte", width: 900, height: 1195 },
    linkedin: "https://www.linkedin.com/in/paulocletoduarte/",
  },
  {
    name: "Paulo Pereira",
    role: { pt: "CBO - Chief Business Officer", en: "CBO - Chief Business Officer" },
    bio: { pt: "Paulo Pereira é um estrategista e líder empresarial com mais de 25 anos de experiência em marketing, branding e desenvolvimento de negócios. É licenciado em Gestão de Empresas e possui pós-graduação em Marketing e Comunicação, com formação académica internacional em Portugal e no Reino Unido. Como diretor de negócio da Jelly, Paulo é responsável pela estratégia comercial, trabalhando em estreita colaboração com as equipas para alinhar a estratégia, a execução e o crescimento sustentável. O seu trabalho centra-se na construção de modelos escaláveis que ligam o marketing, as vendas e a tecnologia, transformando ideias em resultados mensuráveis. Com uma forte mentalidade empreendedora, Paulo combina pensamento estratégico, criatividade e inovação, mantendo um foco constante no futuro e na criação de valor real para clientes e organizações.", en: "Paulo Pereira é um estrategista e líder empresarial com mais de 25 anos de experiência em marketing, branding e desenvolvimento de negócios. É licenciado em Gestão de Empresas e possui pós-graduação em Marketing e Comunicação, com formação académica internacional em Portugal e no Reino Unido. Como diretor de negócio da Jelly, Paulo é responsável pela estratégia comercial, trabalhando em estreita colaboração com as equipas para alinhar a estratégia, a execução e o crescimento sustentável. O seu trabalho centra-se na construção de modelos escaláveis que ligam o marketing, as vendas e a tecnologia, transformando ideias em resultados mensuráveis. Com uma forte mentalidade empreendedora, Paulo combina pensamento estratégico, criatividade e inovação, mantendo um foco constante no futuro e na criação de valor real para clientes e organizações." },
    photo: { src: "/media/equipa/paulo-pereira-pb.webp", alt: "Retrato de Paulo Pereira", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/paulo-pereira-cor.webp", alt: "Retrato de Paulo Pereira", width: 900, height: 1600 },
    linkedin: "https://www.linkedin.com/in/paulo-vasconcelos-pereira-0a544a9/",
  },
  {
    name: "Rafaela Barros",
    role: { pt: "Marketing Account Manager", en: "Marketing Account Manager" },
    bio: { pt: "A Rafaela tem um mestrado em Marketing e Promoção Turística pelo IPLeiria. Com o objetivo de expandir horizontes para além do setor do turismo, decidiu explorar novos desafios em diferentes mercados, adquirindo uma visão estratégica mais abrangente ao integrar a Jelly em 2022.\nDeterminada, curiosa e metódica, encara a aprendizagem e os desafios como uma verdadeira aventura. Acredita que, além da superação constante, o espírito crítico e o trabalho em equipa são pilares fundamentais para o sucesso. Por isso, está sempre motivada para novos projetos.\nEntre um desafio e outro, dá um saltinho à praia para recarregar energias e procura inspiração em viagens e passeios, sempre com a curiosidade de experimentar novos sabores e descobrir diferentes gastronomias. O desporto faz parte do seu dia a dia, equilibrando a energia que coloca em tudo o que faz.", en: "A Rafaela tem um mestrado em Marketing e Promoção Turística pelo IPLeiria. Com o objetivo de expandir horizontes para além do setor do turismo, decidiu explorar novos desafios em diferentes mercados, adquirindo uma visão estratégica mais abrangente ao integrar a Jelly em 2022.\nDeterminada, curiosa e metódica, encara a aprendizagem e os desafios como uma verdadeira aventura. Acredita que, além da superação constante, o espírito crítico e o trabalho em equipa são pilares fundamentais para o sucesso. Por isso, está sempre motivada para novos projetos.\nEntre um desafio e outro, dá um saltinho à praia para recarregar energias e procura inspiração em viagens e passeios, sempre com a curiosidade de experimentar novos sabores e descobrir diferentes gastronomias. O desporto faz parte do seu dia a dia, equilibrando a energia que coloca em tudo o que faz." },
    photo: { src: "/media/equipa/rafaela-barros-pb.webp", alt: "Retrato de Rafaela Barros", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/rafaela-barros-cor.webp", alt: "Retrato de Rafaela Barros", width: 900, height: 1195 },
    linkedin: "https://www.linkedin.com/in/rafaelabarros00/",
  },
  {
    name: "Raquel Reis",
    role: { pt: "Senior Marketing Strategist & Content Manager", en: "Senior Marketing Strategist & Content Manager" },
    bio: { pt: "Da saúde oral para o marketing digital. É verdade! Saiu da zona de (des)conforto e abraçou a mudança.\nFez a sua especialização em Estratégia de Marketing Digital na Lisbon Digital School e pelo caminho foi fazendo outras formações em copywriting e social media.\nProcura desenvolver várias skills, mas estratégias de marketing e comunicação é o que a fascina. Acredita que uma boa estratégia apenas acontece com trabalho de equipa.\nNos tempos livres é uma devoradora de séries e filmes. Adora ficção e fantasia. Se fosse uma personagem de um filme era claramente uma vampira.‍♀️", en: "Da saúde oral para o marketing digital. É verdade! Saiu da zona de (des)conforto e abraçou a mudança.\nFez a sua especialização em Estratégia de Marketing Digital na Lisbon Digital School e pelo caminho foi fazendo outras formações em copywriting e social media.\nProcura desenvolver várias skills, mas estratégias de marketing e comunicação é o que a fascina. Acredita que uma boa estratégia apenas acontece com trabalho de equipa.\nNos tempos livres é uma devoradora de séries e filmes. Adora ficção e fantasia. Se fosse uma personagem de um filme era claramente uma vampira.‍♀️" },
    photo: { src: "/media/equipa/raquel-reis-pb.webp", alt: "Retrato de Raquel Reis", width: 900, height: 600 },
    photoColor: { src: "/media/equipa/raquel-reis-cor.webp", alt: "Retrato de Raquel Reis", width: 900, height: 1195 },
  },
];
