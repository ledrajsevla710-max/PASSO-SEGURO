/**
 * js/historico.js - Passo Seguro
 * Módulo para consulta, listagem e detalhamento do histórico de inspeções do paciente.
 * 
 * Dependências:
 * - config.js (fornece a instância `supabase` global)
 * - auth.js (garante o usuário autenticado e fornece funções de verificação de sessão)
 * - js/foto.js (opcional, para renderização e obtenção de URLs assinadas/temporárias de fotos)
 */

// Estado local do módulo de histórico
const HistoricoModule = {
  inspecoes: [],
  inspecaoSelecionada: null,
};

/**
 * Inicializa a tela de histórico buscando os registros do paciente logado.
 * Pode ser chamada diretamente na carga da aba ou página de histórico.
 */
async function carregarHistorico() {
  const container = document.getElementById('lista-historico');
  const loader = document.getElementById('historico-loader');
  const mensagemVazia = document.getElementById('historico-vazio');

  try {
    if (loader) loader.style.display = 'block';
    if (mensagemVazia) mensagemVazia.style.display = 'none';
    if (container) container.innerHTML = '';

    // Obtém o usuário atual autenticado
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      throw new Error('Usuário não autenticado. Efetue login novamente.');
    }

    const userId = session.user.id;

    // Consulta à VIEW `historico_inspecoes` ordenando por data de criação (mais recente primeiro)
    const { data, error } = await supabase
      .from('historico_inspecoes')
      .select('*')
      .eq('paciente_id', userId)
      .order('data_inspecao', { ascending: false });

    if (error) {
      console.warn('Falha ao consultar historico_inspecoes, tentando fallback na tabela inspecoes:', error);
      // Fallback para tabela direta `inspecoes` caso a VIEW não esteja disponível
      return await carregarHistoricoFallback(userId);
    }

    HistoricoModule.inspecoes = data || [];

    if (loader) loader.style.display = 'none';

    if (HistoricoModule.inspecoes.length === 0) {
      if (mensagemVazia) mensagemVazia.style.display = 'block';
      return;
    }

    renderizarListaHistorico(HistoricoModule.inspecoes);

  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    if (loader) loader.style.display = 'none';
    mostrarNotificacaoHistorico('Erro ao carregar seu histórico. Tente novamente.', 'erro');
  }
}

/**
 * Fallback para consulta direta nas tabelas caso a VIEW apresente divergências.
 */
async function carregarHistoricoFallback(userId) {
  const { data, error } = await supabase
    .from('inspecoes')
    .select(`
      id,
      created_at,
      pe_avaliado,
      observacoes,
      alteracoes (
        id,
        tipo_alteracao,
        localizacao,
        gravidade
      ),
      fotos_inspecao (
        id,
        caminho_arquivo
      )
    `)
    .eq('paciente_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Normaliza a estrutura para corresponder à VIEW
  HistoricoModule.inspecoes = (data || []).map(item => ({
    inspecao_id: item.id,
    data_inspecao: item.created_at,
    pe_avaliado: item.pe_avaliado,
    observacoes: item.observacoes,
    qtd_alteracoes: item.alteracoes ? item.alteracoes.length : 0,
    qtd_fotos: item.fotos_inspecao ? item.fotos_inspecao.length : 0,
    alteracoes: item.alteracoes || [],
    fotos: item.fotos_inspecao || []
  }));

  if (HistoricoModule.inspecoes.length === 0) {
    const mensagemVazia = document.getElementById('historico-vazio');
    if (mensagemVazia) mensagemVazia.style.display = 'block';
    return;
  }

  renderizarListaHistorico(HistoricoModule.inspecoes);
}

/**
 * Renderiza os cartões de histórico no HTML.
 * @param {Array} lista - Lista de inspeções recuperadas
 */
function renderizarListaHistorico(lista) {
  const container = document.getElementById('lista-historico');
  if (!container) return;

  container.innerHTML = '';

  lista.forEach((item) => {
    const dataFormatada = formatarDataHora(item.data_inspecao);
    const card = document.createElement('div');
    card.className = 'card-historico';
    card.setAttribute('data-id', item.inspecao_id || item.id);

    const totalAlteracoes = item.qtd_alteracoes ?? (item.alteracoes ? item.alteracoes.length : 0);
    const totalFotos = item.qtd_fotos ?? (item.fotos ? item.fotos.length : 0);
    const peTexto = traduzirPeAvaliado(item.pe_avaliado);

    card.innerHTML = `
      <div class="historico-header">
        <span class="historico-data"><i class="far fa-calendar-alt"></i> ${dataFormatada}</span>
        <span class="badge-pe pe-${item.pe_avaliado}">${peTexto}</span>
      </div>
      <div class="historico-body">
        <p class="historico-resumo">
          <strong><i class="fas fa-exclamation-triangle"></i> Alterações:</strong> ${totalAlteracoes} encontrada(s)
        </p>
        <p class="historico-resumo">
          <strong><i class="fas fa-camera"></i> Fotografias:</strong> ${totalFotos} anexa(s)
        </p>
        ${item.observacoes ? `<p class="historico-obs"><em>"${escaparHTML(item.observacoes)}"</em></p>` : ''}
      </div>
      <div class="historico-footer">
        <button class="btn-detalhes" onclick="abrirDetalhesInspecao('${item.inspecao_id || item.id}')">
          Ver detalhes <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * Abre os detalhes de uma inspeção específica em um modal ou painel de detalhes.
 * @param {string} inspecaoId - ID UUID da inspeção
 */
async function abrirDetalhesInspecao(inspecaoId) {
  const modal = document.getElementById('modal-detalhes-inspecao');
  const conteudoModal = document.getElementById('detalhes-inspecao-conteudo');

  try {
    if (conteudoModal) conteudoModal.innerHTML = '<div class="spinner">Carregando detalhes...</div>';
    if (modal) modal.style.display = 'block';

    // Busca detalhes completos das alterações e fotos associadas a esta inspeção
    const [resInspecao, resAlteracoes, resFotos] = await Promise.all([
      supabase.from('inspecoes').select('*').eq('id', inspecaoId).single(),
      supabase.from('alteracoes').select('*').eq('inspecao_id', inspecaoId),
      supabase.from('fotos_inspecao').select('*').eq('inspecao_id', inspecaoId)
    ]);

    if (resInspecao.error) throw resInspecao.error;

    const inspecao = resInspecao.data;
    const alteracoes = resAlteracoes.data || [];
    const fotos = resFotos.data || [];

    // Obter URLs assinadas/temporárias para as fotos privadas no Supabase Storage
    const fotosComUrl = await Promise.all(
      fotos.map(async (foto) => {
        try {
          const { data, error } = await supabase.storage
            .from('fotos-inspecao')
            .createSignedUrl(foto.caminho_arquivo, 3600); // URL válida por 1 hora

          return {
            ...foto,
            url: error ? null : data?.signedUrl
          };
        } catch {
          return { ...foto, url: null };
        }
      })
    );

    renderizarModalDetalhes(inspecao, alteracoes, fotosComUrl);

  } catch (error) {
    console.error('Erro ao abrir detalhes da inspeção:', error);
    if (conteudoModal) {
      conteudoModal.innerHTML = '<p class="texto-erro">Não foi possível carregar os detalhes desta inspeção.</p>';
    }
  }
}

/**
 * Constrói o HTML interno da janela/modal de detalhes da inspeção.
 */
function renderizarModalDetalhes(inspecao, alteracoes, fotos) {
  const conteudoModal = document.getElementById('detalhes-inspecao-conteudo');
  if (!conteudoModal) return;

  const dataFormatada = formatarDataHora(inspecao.created_at || inspecao.data_inspecao);
  const peTexto = traduzirPeAvaliado(inspecao.pe_avaliado);

  let htmlAlteracoes = '';
  if (alteracoes.length === 0) {
    htmlAlteracoes = '<p class="texto-sucesso"><i class="fas fa-check-circle"></i> Nenhuma alteração/lesão foi registrada nesta inspeção.</p>';
  } else {
    htmlAlteracoes = '<ul class="lista-alteracoes-detalhe">';
    alteracoes.forEach((alt) => {
      htmlAlteracoes += `
        <li>
          <strong>${escaparHTML(alt.tipo_alteracao || 'Alteração')}</strong> - 
          <span>Local: ${escaparHTML(alt.localizacao || 'Não especificado')}</span>
          ${alt.gravidade ? `<span class="badge-gravidade gravidade-${alt.gravidade}">Gravidade: ${alt.gravidade}</span>` : ''}
        </li>
      `;
    });
    htmlAlteracoes += '</ul>';
  }

  let htmlFotos = '';
  if (fotos.length === 0) {
    htmlFotos = '<p class="texto-mutado">Nenhuma fotografia anexada.</p>';
  } else {
    htmlFotos = '<div class="galeria-fotos-detalhe">';
    fotos.forEach((foto) => {
      if (foto.url) {
        htmlFotos += `
          <div class="item-foto">
            <a href="${foto.url}" target="_blank" title="Clique para ampliar">
              <img src="${foto.url}" alt="Foto da inspeção do pé" loading="lazy" />
            </a>
          </div>
        `;
      } else {
        htmlFotos += `
          <div class="item-foto foto-erro">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Erro ao carregar imagem</span>
          </div>
        `;
      }
    });
    htmlFotos += '</div>';
  }

  conteudoModal.innerHTML = `
    <div class="detalhes-header">
      <h3>Inspeção de ${dataFormatada}</h3>
      <span class="badge-pe pe-${inspecao.pe_avaliado}">${peTexto}</span>
    </div>
    
    <div class="detalhes-secao">
      <h4><i class="fas fa-notes-medical"></i> Alterações Encontradas</h4>
      ${htmlAlteracoes}
    </div>

    <div class="detalhes-secao">
      <h4><i class="fas fa-comment-alt"></i> Observações</h4>
      <p>${inspecao.observacoes ? meEscreveTexto(inspecao.observacoes) : '<em>Nenhuma observação informada.</em>'}</p>
    </div>

    <div class="detalhes-secao">
      <h4><i class="fas fa-images"></i> Fotografias Anexadas</h4>
      ${htmlFotos}
    </div>
  `;
}

/**
 * Fecha a janela modal de detalhes.
 */
