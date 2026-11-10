
/* =====================================================
   PASSO SEGURO
   ARQUIVO: js/foto.js
   MÓDULO DE FOTOGRAFIAS DAS INSPEÇÕES
   ===================================================== */

(function () {
  "use strict";

  // ---------------------------------------------------
  // 1. CONFIGURAÇÕES
  // ---------------------------------------------------

  const BUCKET = "fotos-inspecao";
  const TABELA_FOTOS = "fotos_inspecao";
  const TABELA_INSPECOES = "inspecoes";

  const TAMANHO_MAXIMO = 5 * 1024 * 1024;

  const TIPOS_PERMITIDOS = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  const LOCAIS_PERMITIDOS = [
    "planta_direita",
    "planta_esquerda",
    "calcanhar_direito",
    "calcanhar_esquerdo",
    "dedos_direito",
    "dedos_esquerdo",
    "dorso_direito",
    "dorso_esquerdo",
    "entre_dedos_direito",
    "entre_dedos_esquerdo",
    "outro"
  ];

  // ---------------------------------------------------
  // 2. CLIENTE SUPABASE
  // ---------------------------------------------------

  function obterCliente() {
    const cliente =
      window.PASSO_SEGURO?.supabaseClient ||
      window.supabaseClient;

    if (!cliente) {
      throw new Error(
        "Supabase não inicializado. Verifique config.js."
      );
    }

    return cliente;
  }

  // ---------------------------------------------------
  // 3. VERIFICAR USUÁRIO AUTENTICADO
  // ---------------------------------------------------

  async function obterUsuario() {
    const supabase = obterCliente();

    const { data, error } =
      await supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error(
        "Usuário não autenticado. Faça login novamente."
      );
    }

    return data.user;
  }

  // ---------------------------------------------------
  // 4. VALIDAR INSPEÇÃO
  // ---------------------------------------------------

  async function validarInspecao(inspecaoId, usuarioId) {
    const supabase = obterCliente();

    if (!inspecaoId) {
      throw new Error("Informe a inspeção.");
    }

    const { data, error } = await supabase
      .from(TABELA_INSPECOES)
      .select("id, paciente_id")
      .eq("id", inspecaoId)
      .eq("paciente_id", usuarioId)
      .single();

    if (error || !data) {
      throw new Error(
        "Inspeção não encontrada ou sem autorização."
      );
    }

    return data;
  }

  // ---------------------------------------------------
  // 5. VALIDAR ARQUIVO
  // ---------------------------------------------------

  function validarArquivo(arquivo) {
    if (!arquivo) {
      throw new Error("Selecione uma fotografia.");
    }

    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      throw new Error(
        "Formato inválido. Utilize JPEG, PNG ou WebP."
      );
    }

    if (arquivo.size <= 0 || arquivo.size > TAMANHO_MAXIMO) {
      throw new Error(
        "A fotografia deve ter no máximo 5 MB."
      );
    }
  }

  // ---------------------------------------------------
  // 6. VALIDAR LOCAL DO PÉ
  // ---------------------------------------------------

  function validarLocal(localPe) {
    if (!LOCAIS_PERMITIDOS.includes(localPe)) {
      throw new Error(
        "Informe uma região válida do pé."
      );
    }
  }

  // ---------------------------------------------------
  // 7. GERAR NOME DO ARQUIVO
  // ---------------------------------------------------

  function gerarExtensao(tipo) {
    const extensoes = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };

    return extensoes[tipo];
  }

  function gerarNomeArquivo(tipo) {
    const extensao = gerarExtensao(tipo);

    return (
      crypto.randomUUID() + "." + extensao
    );
  }

  // ---------------------------------------------------
  // 8. ENVIAR FOTOGRAFIA
  // ---------------------------------------------------

  async function enviar(arquivo, inspecaoId, localPe) {
    const supabase = obterCliente();

    validarArquivo(arquivo);
    validarLocal(localPe);

    const usuario = await obterUsuario();

    await validarInspecao(
      inspecaoId,
      usuario.id
    );

    const nomeArquivo = gerarNomeArquivo(
      arquivo.type
    );

    const caminhoArquivo =
      `${usuario.id}/${inspecaoId}/${nomeArquivo}`;

    // Primeiro: enviar ao Storage.

    const { error: erroUpload } = await supabase
      .storage
      .from(BUCKET)
      .upload(caminhoArquivo, arquivo, {
        contentType: arquivo.type,
        cacheControl: "3600",
        upsert: false
      });

    if (erroUpload) {
      throw new Error(
        "Não foi possível enviar a fotografia: " +
        erroUpload.message
      );
    }

    // Segundo: registrar os metadados.

    const registro = {
      inspecao_id: inspecaoId,
      nome_arquivo: nomeArquivo,
      caminho_arquivo: caminhoArquivo,
      tipo_mime: arquivo.type,
      tamanho_bytes: arquivo.size,
      local_pe: localPe
    };

    const { data, error } = await supabase
      .from(TABELA_FOTOS)
      .insert(registro)
      .select()
      .single();

    // Se o registro falhar, remover o arquivo enviado.

    if (error) {
      const { error: erroRemocao } = await supabase
        .storage
        .from(BUCKET)
        .remove([caminhoArquivo]);

      if (erroRemocao) {
        console.error(
          "Não foi possível remover o arquivo órfão:",
          erroRemocao.message
        );
      }

      throw new Error(
        "Fotografia enviada, mas não foi possível " +
        "registrar seus dados: " + error.message
      );
    }

    return {
      sucesso: true,
      mensagem: "Fotografia registrada com sucesso.",
      fotografia: data
    };
  }

  // ---------------------------------------------------
  // 9. LISTAR FOTOGRAFIAS DE UMA INSPEÇÃO
  // ---------------------------------------------------

  async function listar(inspecaoId) {
    const supabase = obterCliente();
    const usuario = await obterUsuario();

    await validarInspecao(
      inspecaoId,
      usuario.id
    );

    const { data, error } = await supabase
      .from(TABELA_FOTOS)
      .select("*")
      .eq("inspecao_id", inspecaoId)
      .order("created_at", {
        ascending: false
      });

    if (error) {
      throw new Error(
        "Erro ao consultar fotografias: " +
        error.message
      );
    }

    return data || [];
  }

  // ---------------------------------------------------
  // 10. GERAR URL TEMPORÁRIA
  // ---------------------------------------------------

  async function obterUrl(fotografiaId) {
    const supabase = obterCliente();
    const usuario = await obterUsuario();

    const { data: foto, error: erroConsulta } =
      await supabase
        .from(TABELA_FOTOS)
        .select("*")
        .eq("id", fotografiaId)
        .single();

    if (erroConsulta || !foto) {
      throw new Error(
        "Fotografia não encontrada ou sem autorização."
      );
    }

    await validarInspecao(
      foto.inspecao_id,
      usuario.id
    );

    const { data, error } = await supabase
      .storage
      .from(BUCKET)
      .createSignedUrl(
        foto.caminho_arquivo,
        60
      );

    if (error) {
      throw new Error(
        "Não foi possível acessar a fotografia: " +
        error.message
      );
    }

    return data.signedUrl;
  }

  // ---------------------------------------------------
  // 11. EXCLUIR FOTOGRAFIA
  // ---------------------------------------------------

  async function excluir(fotografiaId) {
    const supabase = obterCliente();
    const usuario = await obterUsuario();

    const { data: foto, error: erroConsulta } =
      await supabase
        .from(TABELA_FOTOS)
        .select("*")
        .eq("id", fotografiaId)
        .single();

    if (erroConsulta || !foto) {
      throw new Error(
        "Fotografia não encontrada ou sem autorização."
      );
    }

    await validarInspecao(
      foto.inspecao_id,
      usuario.id
    );

    // Primeiro remover o arquivo do Storage.

    const { error: erroStorage } = await supabase
      .storage
      .from(BUCKET)
      .remove([foto.caminho_arquivo]);

    if (erroStorage) {
      throw new Error(
        "Não foi possível excluir o arquivo: " +
        erroStorage.message
      );
    }

    // Depois remover o registro da tabela.

    const { error: erroBanco } = await supabase
      .from(TABELA_FOTOS)
      .delete()
      .eq("id", fotografiaId);

    if (erroBanco) {
      throw new Error(
        "Arquivo removido, mas houve erro ao excluir " +
        "seu registro: " + erroBanco.message
      );
    }

    return {
      sucesso: true,
      mensagem: "Fotografia excluída com sucesso."
    };
  }

  // ---------------------------------------------------
  // 12. DISPONIBILIZAR FUNÇÕES
  // ---------------------------------------------------

  window.PassoSeguroFotos = {
    enviar,
    listar,
    obterUrl,
    excluir
  };

  console.log(
    "Passo Seguro: módulo de fotografias carregado."
  );

})();

