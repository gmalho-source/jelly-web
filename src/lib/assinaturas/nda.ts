import { CASA } from "@/lib/email-papel";
import type { Bloco } from "./pdf";

/**
 * O Acordo de Confidencialidade dos prestadores, preenchido com a ficha.
 *
 * O texto é o do NDA que a Jelly usava no PandaDoc (outubro de 2026), com
 * correções só de forma — o conteúdo jurídico é o mesmo:
 *  - a finalidade (2.1) dizia «Jellycode»; passa a ser a Jelly, que é a parte;
 *  - a numeração da Quinta e da Sexta estava trocada (4.x, 1.) e a 7.2 remetia
 *    para a 6.1; fica 5.x, 6.1 e 7.1;
 *  - a entrada em vigor (5.1) era «por ambas as partes», mas o NDA é assinado
 *    só pelo Recetor; passa a ser a data da assinatura dele;
 *  - o fecho («Feito em Sintra, originais…») passa a dizer que é assinado
 *    eletronicamente e que cada parte fica com uma cópia;
 *  - o nome da Jelly é o da certidão (`CASA.legal`).
 *
 * Mudar uma palavra aqui muda os NDA enviados daí em diante; os que já foram
 * assinados ficam com o texto que tinham, no PDF guardado.
 */
export type DadosDoPrestador = {
  nome: string;
  morada: string;
  documento: string;
  nif: string;
};

/** O que falta na ficha para o NDA poder sair. */
export function faltaNaFicha(d: Partial<DadosDoPrestador>): string[] {
  const falta: string[] = [];
  if (!d.nome?.trim()) falta.push("nome");
  if (!d.morada?.trim()) falta.push("morada");
  if (!d.documento?.trim()) falta.push("cartão de cidadão / passaporte");
  if (!d.nif?.trim()) falta.push("NIF");
  return falta;
}

export function blocosDoNda(d: DadosDoPrestador): Bloco[] {
  const p = (texto: string): Bloco => ({ t: "p", texto });
  const item = (texto: string): Bloco => ({ t: "item", texto });
  const clausula = (numero: string, titulo: string): Bloco => ({ t: "clausula", numero, titulo });

  return [
    { t: "titulo", texto: "ACORDO DE CONFIDENCIALIDADE UNILATERAL" },
    p("Entre:"),
    p(
      `${CASA.legal.toUpperCase()}, com sede em ${CASA.rua} - ${CASA.local.replace(" · Portugal", "")}, Pessoa Coletiva n.º ${CASA.vat.replace(/^PT/, "")}, representada por Fernando Gonçalo Rosa Malho Rodrigues, na qualidade de sócio-gerente, com poderes legais e estatutários de representação, como Primeiro Outorgante ou Emissor.`,
    ),
    p("E,"),
    { t: "p", texto: d.nome, negrito: true },
    p(`residente em ${d.morada}`),
    p(`Cartão de cidadão / Passaporte n.º ${d.documento}      Contribuinte n.º ${d.nif}`),
    p("como Segundo Outorgante ou Recetor."),
    { t: "espaco", altura: 6 },
    p("Considerando:"),
    p(
      "A necessidade de divulgação, pelo Primeiro Outorgante, Emissor, ao Segundo Outorgante, Recetor, de um conjunto de informação de natureza reservada, referente a clientes e projetos relacionados.",
    ),
    p("As partes acima identificadas celebram o presente ACORDO DE CONFIDENCIALIDADE, submetido às seguintes cláusulas:"),

    clausula("PRIMEIRA", "Objeto"),
    p(
      "1.1. O presente acordo tem por objeto garantir a confidencialidade e proteção da informação identificada como protegida, confidencial ou com outra expressão de igual significado, revelada pelo Primeiro Outorgante ou Emissor ao Segundo Outorgante ou Recetor, com a exclusiva finalidade fixada infra na Cláusula Segunda.",
    ),
    p(
      "1.2. Por informação protegida ou confidencial, adiante designada globalmente por «Informação», entende-se toda a informação que, independentemente do suporte utilizado, conste de:",
    ),
    item("Obras, de qualquer natureza, nomeadamente gráfica, escrita ou sonora, não publicadas;"),
    item("Compilações e seleções informativas inéditas;"),
    item("Documentação de natureza financeira;"),
    item("Conhecimento ou saber-fazer, dados tecnológicos, métodos, fórmulas, demonstrações, amostras ou estudos;"),
    item("Programas de computador ou blocos de programação em forma de código-fonte ou código-objeto;"),
    item("Documentos comerciais, nomeadamente listas de clientes;"),
    item("Relatórios, rascunhos, memorandos;"),
    item(
      "Quaisquer ativos intelectuais, enquanto conjunto de todos e quaisquer resultados de investigação, protegidos ou não por qualquer direito de propriedade industrial;",
    ),
    item(
      "Qualquer outra informação divulgada: oralmente, por escrito, ou por qualquer outro meio que seja; no citado contexto, pelo Emissor ao Recetor. A informação confidencial divulgada oralmente deverá ser sumariamente transposta para a forma escrita pelo Emissor, com a referência à data da sua divulgação, e submetida ao Recetor num prazo máximo de 15 (quinze) dias após a respetiva divulgação, sempre com a identificação referida no número 1.1.",
    ),

    clausula("SEGUNDA", "Finalidade da divulgação e dever de confidencialidade"),
    p(
      "2.1. A Informação é divulgada com a exclusiva finalidade de prestação de serviços ao Primeiro Outorgante e aos clientes do Primeiro Outorgante, em representação deste.",
    ),
    p(
      "2.2. O Recetor compromete-se a não usar, divulgar ou ceder a qualquer título, em Portugal ou no estrangeiro, a informação divulgada pelo Emissor para qualquer outra finalidade distinta da estipulada no número 2.1, salvo autorização por escrito do Emissor.",
    ),
    p(
      "2.3. O Recetor deve proteger a informação divulgada pelo Emissor utilizando o mesmo grau de cuidado que usa para prevenir a disseminação e publicação não autorizada da sua própria informação.",
    ),
    p(
      "2.4. O Recetor deve adotar todas as medidas necessárias para impedir o uso indevido da informação por qualquer pessoa que a ela tenha tido acesso e deve assegurar os meios adequados à prevenção do extravio ou perda da informação, comunicando sempre ao Emissor a ocorrência de incidentes desta natureza, ainda que esta comunicação não exclua a sua responsabilidade.",
    ),
    p(
      "2.5. O Recetor obriga-se a restituir qualquer cópia, excerto ou parte dos elementos da Informação referidos supra em 1.2., no prazo de 8 (oito) dias, mediante mera solicitação do Emissor. Obriga-se ainda a restituir toda a informação divulgada pelo Emissor findo o presente acordo, a solicitação deste.",
    ),

    clausula("TERCEIRA", "Propriedade e integridade da informação"),
    p("3.1. A Informação é propriedade exclusiva do Emissor."),
    p(
      "3.2. A divulgação da Informação ao Recetor não lhe concede qualquer direito de propriedade intelectual, legitimidade para requerer proteção sobre quaisquer direitos ou licença sobre qualquer registo ou pedido de registo de direito de propriedade industrial relacionado com aquela informação, sob pena de aplicação do disposto na alínea a) do n.º 1 do Artigo 34.º do Código da Propriedade Industrial.",
    ),
    p(
      "3.3. O Emissor não garante, direta ou indiretamente, no âmbito do presente acordo, a proteção da Informação em sede, designadamente, de direitos de autor ou de propriedade industrial.",
    ),
    p(
      "3.4. O Recetor aceita e reconhece que o presente acordo não limita o direito do Emissor modificar a respetiva informação, sem disso lhe dar prévio conhecimento.",
    ),
    p(
      "3.5. Tais modificações não implicam qualquer responsabilidade para o Emissor, nem o obrigam a desenvolver, anunciar, entregar, manter ou financiar quaisquer produtos ou planos de negócio baseados naquela Informação.",
    ),

    clausula("QUARTA", "Divulgação Interna da Informação"),
    p(
      "O Recetor deverá limitar a divulgação da Informação aos respetivos quadros, empregados ou colaboradores no âmbito do estritamente necessário à finalidade prevista no presente acordo, fornecendo-lhes as instruções adequadas a esse efeito e celebrando com estes equivalente compromisso escrito de confidencialidade, sendo integralmente responsável perante o Emissor quanto ao cumprimento, por aqueles, dos compromissos ora fixados, podendo este, a todo o tempo, exigir ao Recetor prova da celebração daqueles acordos.",
    ),

    clausula("QUINTA", "Duração"),
    p(
      "5.1. O presente acordo entra em vigor na data da sua assinatura pelo Recetor, ficando este vinculado ao presente compromisso de confidencialidade, nos exatos termos supra estipulados, por um período de 5 anos, contados desde a data da última divulgação de Informação ao abrigo do presente acordo.",
    ),
    p(
      "5.2. As partes poderão, por acordo e a todo o tempo, revogar ou alterar, no todo ou em parte, as disposições do presente acordo, conquanto não seja posta em causa a confidencialidade da Informação.",
    ),
    p(
      "5.3. Os seus efeitos podem igualmente cessar mediante a celebração de um qualquer compromisso contratual entre os Outorgantes no qual seja estipulada a confidencialidade das mesmas informações, sendo assim substituídos os termos deste acordo, sem prejuízo do disposto no número seguinte.",
    ),
    p("5.4. Em caso algum estão todavia as partes vinculadas, pelo presente acordo, a celebrar futuramente quaisquer negócios jurídicos."),

    clausula("SEXTA", "Responsabilidade"),
    p(
      "6.1. O Recetor é responsável perante o Emissor por quaisquer danos ou prejuízos judicialmente comprovados como sofridos pelo Emissor, incluindo danos emergentes e lucros cessantes, resultantes do incumprimento ou cumprimento defeituoso das suas obrigações de confidencialidade, sem prejuízo da eventual responsabilidade criminal em que incorre no caso de violação desta obrigação, nos termos da Legislação Portuguesa aplicável.",
    ),

    clausula("SÉTIMA", "Exceções ao dever de confidencialidade"),
    p("7.1. NÃO SE CONSIDERA ABRANGIDO pelo dever de confidencialidade qualquer elemento da Informação:"),
    item(
      "Cuja divulgação tenha sido expressamente autorizada pelo Emissor. Tal autorização deve ser solicitada ao Emissor e concedida por este por escrito no prazo de 8 (oito) dias úteis, findo o qual, na ausência de resposta, se considera indeferida a autorização;",
    ),
    item("Que até ao momento da divulgação tenha sido publicado, tornado público ou que, de outra forma não possa ignorar-se pertencer ao domínio público;"),
    item("Tornado público após a divulgação ou pertencente ao domínio público por motivo não imputável ao Recetor, a título de dolo ou negligência;"),
    item(
      "Recebido pelo Recetor de terceiros sem dever de confidencialidade, desde que estes tenham o direito de fornecer essa informação e que a mesma não tenha sido obtida por estes direta ou indiretamente do Emissor sob condição de confidencialidade;",
    ),
    item(
      "Que o Recetor seja obrigado, por lei ou decisão judicial, a divulgar. O Recetor compromete-se a notificar imediatamente o Emissor e a cooperar de forma razoável com os esforços empreendidos por este, para contestar ou limitar o âmbito de tal divulgação.",
    ),
    p("7.2. O ónus da prova de todas as exceções à obrigação de confidencialidade previstas no número 7.1. recai sobre o Recetor."),
    p(
      "7.3. A informação confidencial não deve ser considerada como pertencente ao domínio público apenas por ser do conhecimento de algumas pessoas que nela possam ter algum interesse, e a combinação de parte dessa informação não deve ser considerada como pertencente ao domínio público apenas pelo motivo de cada parcela dessa combinação separadamente se considerar disponível.",
    ),

    clausula("OITAVA", "Lei e Resolução de Litígios"),
    p("8.1. O presente acordo é submetido à Lei Portuguesa."),
    p(
      "8.2. Caso surja um diferendo ou litígio entre as Partes em matéria de interpretação, validade ou aplicação do presente Acordo, que as mesmas não consigam resolver de forma amigável, qualquer das Partes poderá submetê-lo a um tribunal arbitral, com expressa renúncia a qualquer outro tribunal.",
    ),
    p(
      "8.3. O tribunal arbitral será constituído e funcionará de acordo com as normas definidas pela Lei da Arbitragem Voluntária (Lei n.º 63/2011, de 14 de dezembro) e será composto por três árbitros, sendo nomeados um por cada uma das Partes e um terceiro por cooptação destas. Na falta de acordo quanto à designação do terceiro árbitro, será a sua designação efetuada pelo Juiz Presidente do Tribunal da Relação de Lisboa, a requerimento de qualquer das Partes.",
    ),
    p("8.4. O processo de arbitragem correrá em Lisboa, em língua portuguesa, salvo acordo em contrário das partes no processo arbitral."),
    p(
      "8.5. Sempre que esteja em causa um diferendo ou litígio relativo a matérias de propriedade intelectual, a competência para dirimir tais conflitos caberá ao Centro de Arbitragem ARBITRARE, com expressa renúncia a qualquer outro, aplicando-se nesse caso as regras do Regulamento do Centro de Arbitragem.",
    ),
    p(
      "8.6. O tribunal arbitral e/ou o centro de arbitragem apreciarão os factos e julgarão de acordo com a lei portuguesa e das decisões por eles proferidas não caberá recurso.",
    ),
    { t: "espaco", altura: 8 },
    {
      t: "p",
      negrito: true,
      texto:
        "O Emissor e o Recetor reconhecem e aceitam as disposições do presente Acordo, substituindo o mesmo, quanto às matérias nele previstas, todas as negociações e contactos prévios estabelecidos entre as partes.",
    },
    p(
      "O presente acordo é assinado eletronicamente pelo Recetor, na data e nos termos que constam do certificado de assinatura anexo, e cada uma das partes fica com uma cópia.",
    ),
  ];
}
