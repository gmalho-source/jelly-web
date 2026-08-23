import { en } from "@payloadcms/translations/languages/en";
import { pt } from "@payloadcms/translations/languages/pt";
import type { Config } from "payload";

/**
 * O painel em português — e em português de Portugal.
 *
 * O pacote `pt` do Payload é brasileiro: «Salvar», «Excluir», «Painel de
 * Controle», «Arquivo», e um «Cultura» memorável onde devia estar «Recortar»
 * (crop, a colheita). Serve de base, e por cima vai a lista abaixo, que traduz
 * o que quem edita vê todos os dias. Só isso: emendar as trezentas cadeias que
 * ninguém encontra seria trabalho para não se ver.
 *
 * A voz é a mesma do site para quem é de casa — tratamento por «tu».
 */
const casa = {
  general: {
    save: "Guardar",
    saveChanges: "Guardar alterações",
    createNew: "Criar",
    delete: "Apagar",
    dashboard: "Painel",
    backToDashboard: "Voltar ao painel",
    perPage: "Por página: {{limit}}",
    password: "Palavra-passe",
    loading: "A carregar",
    editing: "A editar",
    searchBy: "Procurar por {{label}}",
    lastModified: "Última alteração",
    updatedSuccessfully: "Guardado.",
    deletedSuccessfully: "Apagado.",
    payloadSettings: "Preferências",
    livePreview: "Pré-visualizar",
    ascending: "Crescente",
    descending: "Decrescente",
    next: "Seguinte",
    submit: "Enviar",
    clearAll: "Limpar",
    selectAll: "Selecionar {{count}} {{label}}",
    showAllLabel: "Mostrar {{label}}",
    noResults:
      "Não há {{label}}. Ou ainda não existe nenhum, ou nenhum corresponde aos filtros acima.",
    unsavedChanges: "Tens alterações que não estão guardadas. Guarda ou descarta antes de sair.",
    changesNotSaved: "As tuas alterações não estão guardadas. Se saíres agora, perdem-se.",
    aboutToDelete: "Vais apagar {{label}} <1>{{title}}</1>. Tens a certeza?",
  },
  authentication: {
    login: "Entrar",
    logOut: "Sair",
    logBackIn: "Entrar outra vez",
    forgotPassword: "Esqueceste-te da palavra-passe?",
    forgotPasswordQuestion: "Esqueceste-te da palavra-passe?",
    newPassword: "Nova palavra-passe",
    confirmPassword: "Confirmar a palavra-passe",
    resetPassword: "Redefinir a palavra-passe",
    resetYourPassword: "Redefinir a tua palavra-passe",
    account: "Conta",
    loggedOutInactivity: "Saíste por inatividade.",
    forgotPasswordEmailInstructions:
      "Escreve o teu email. Enviamos-te um link para definires uma nova palavra-passe.",
  },
  version: {
    draft: "Rascunho",
    published: "Publicado",
    saveDraft: "Guardar rascunho",
    publishChanges: "Publicar",
    status: "Estado",
    changed: "Alterado",
    currentDraft: "Rascunho atual",
    restoreThisVersion: "Restaurar esta versão",
    unpublish: "Retirar de publicação",
  },
  upload: {
    dragAndDrop: "Arrasta um ficheiro para aqui",
    selectFile: "Escolher um ficheiro",
    addFile: "Adicionar ficheiro",
    addFiles: "Adicionar ficheiros",
    fileName: "Nome do ficheiro",
    fileSize: "Tamanho",
    filesToUpload: "Ficheiros a carregar",
    fileToUpload: "Ficheiro a carregar",
    editImage: "Editar imagem",
    crop: "Recortar",
  },
  fields: {
    addNew: "Adicionar",
    chooseFromExisting: "Escolher um que exista",
    saveChanges: "Guardar alterações",
    swapUpload: "Trocar o ficheiro",
    uploadNewLabel: "Carregar {{label}}",
    passwordsDoNotMatch: "As palavras-passe não coincidem.",
  },
} as const;

export const i18n: Config["i18n"] = {
  fallbackLanguage: "pt",
  supportedLanguages: { pt, en },
  translations: { pt: casa },
};
