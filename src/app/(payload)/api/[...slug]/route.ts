import config from "@payload-config";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";

// Os pedidos que passam por um modelo — ler um CV, escrever o resumo de um
// artigo, descrever uma imagem — demoram dezenas de segundos, e o tempo que a
// Vercel dá por defeito a uma função é curto. Sem isto, um currículo de três
// páginas morre a meio e o painel recebe uma página de erro do serviço, não a
// resposta do Payload: um minuto chega para todos, e quem não precisa não paga.
export const maxDuration = 60;

export const GET = REST_GET(config);
export const POST = REST_POST(config);
export const DELETE = REST_DELETE(config);
export const PATCH = REST_PATCH(config);
export const PUT = REST_PUT(config);
export const OPTIONS = REST_OPTIONS(config);
