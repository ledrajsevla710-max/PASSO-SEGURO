/**
 * js/profissional.js - Passo Seguro
 * Módulo para gerenciar o perfil do profissional de saúde, registro profissional,
 * solicitações de vínculo com pacientes e visualização de pacientes autorizados.
 * 
 * Dependências:
 * - config.js (fornece a instância `supabase` global)
 * - auth.js (garante o usuário autenticado e verificação de papéis)
 */

const ProfissionalModule = {
  perfilProfissional: null,
  solicitacoesPendentes: [],
  pacientesAutorizados: [],
};

/**
 * Inicializa o painel do profissional, carregando dados do cadastro,
 * solicitações de vínculo e lista de pacientes autorizados.
 */
async function inicializarPainelProfissional() {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      throw new Error('Usuário não autenticado.');
    }

    const userId = session.user.id;

    // 1. Carregar perfil profissional
    await carregarPerfilProfissional(userId);

    // 2. Se o perfil estiver aprovado/ativo, carregar solicitações e pacientes
    if (ProfissionalModule.perfilProfissional) {
      await carregarSolicitacoesVinculo(ProfissionalModule.perfilProfissional.id);
      await carregarPacientesAutorizados(ProfissionalModule.perfilProfissional.id);
    }

  } catch (error) {
    console.error('Erro ao inicializar painel profissional:', error);
    mostrarNotificacaoProfissional('Erro ao carregar dados do painel.', 'erro');
  }
}

/**
 * Consulta o cadastro do profissional na tabela `profissionais`.
 */
async function carregarPerfilProfissional(userId) {
  const containerForm = document.getElementById('form-cadastro-profissional');
  const containerStatus = document.getElementById('status-profissional-container');

  const { data, error } = await supabase
    .from('profissionais')
    .select('*')
    .eq('usuario_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil profissional:', error);
    throw error;
  }

  ProfissionalModule.perfilProfissional = data;

  if (data) {
    // Profissional já cadastrado: preencher formulário/exibir status
    if (containerForm) {
      preencherFormularioProfissional(data);
    }
    if (containerStatus) {
      renderizarStatusAprovacao(data.status_aprovacao || 'pendente');
    }
  } else {
    // Primeiro acesso ao painel: exibir formulário de cadastro profissional
    if (containerStatus) {
      containerStatus.innerHTML = '<p class="alerta-info">Você ainda não possui cadastro profissional. Preencha os dados abaixo para solicitar o acesso.</p>';
    }
  }
}

/**
 * Preenche o formulário com os dados existentes do profissional.
 */
function preencherFormularioProfissional(dados) {
  const campoNome = document.getElementById('prof-nome');
  const campoConselho = document.getElementById('prof-conselho');
  const campoUf = document.getElementById('prof-uf-conselho');
  const campoEspecialidade = document.getElementById('prof-especialidade');
  const campoTelefone = document.getElementById('prof-telefone');

  if (campoNome) campoNome.value = dados.nome_completo || '';
  if (campoConselho) campoConselho.value = dados.numero_conselho || '';
  if (campoUf) campoUf.value = dados.uf_conselho || '';
  if (campoEspecialidade) campoEspecialidade.value = dados.especialidade || '';
  if (campoTelefone) campoTelefone.value = dados.telefone || '';
}

/**
 * Salva ou atualiza o cadastro do profissional na tabela `profissionais`.
 */
async function salvarPerfilProfissional(event) {
  if (event) event.preventDefault();

  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) throw new Error('Sessão expirada.');

    const userId = session.user.id;

    const dadosForm = {
      usuario_id: userId,
      nome_completo: document.getElementById('prof-nome').value.trim(),
      numero_conselho: document.getElementById('prof-conselho').value.trim(),
      uf_conselho: document.getElementById('prof-uf-conselho').value.trim().toUpperCase(),
      especialidade: document.getElementById('prof-especialidade').value.trim(),
      telefone: document.getElementById('prof-telefone').value.trim(),
      status_aprovacao: ProfissionalModule.perfilProfissional ? ProfissionalModule.perfilProfissional.status_aprovacao : 'pendente'
    };

    let res;
    if (ProfissionalModule.perfilProfissional) {
      // Atualizar registro existente
      res = await supabase
        .from('profissionais')
        .update(dadosForm)
        .eq('id', ProfissionalModule.perfilProfissional.id)
        .select()
        .single();
    } else {
      // Inserir novo registro
      res = await supabase
        .from('profissionais')
        .insert([dadosForm])
        .select()
        .single();
    }

    if (res.error) throw res.error;

    ProfissionalModule.perfilProfissional = res.data;
    mostrarNotificacaoProfissional('Cadastro profissional salvo com sucesso!', 'sucesso');
    renderizarStatusAprovacao(res.data.status_aprovacao);

  } catch (error) {
    console.error('Erro ao salvar perfil profissional:', error);
    mostrarNotificacaoProfissional('Erro ao salvar cadastro: ' + error.message, 'erro');
  }
}

/**
 * Exibe o status visual da aprovação do profissional.
 */
function renderizarStatusAprovacao(status) {
  const containerStatus = document.getElementById('status-profissional-container');
  if (!containerStatus) return;

  let mensagem = '';
  let classeBadge = '';

  switch (status) {
    case 'aprovado':
      mensagem = '<i class="fas fa-check-circle"></i> Conta profissional aprovada e ativa.';
      classeBadge = 'status-aprovado';
      break;
    case 'rejeitado':
      mensagem = '<i class="fas fa-times-circle"></i> Seu cadastro profissional foi rejeitado. Revise seus dados.';
      classeBadge = 'status-rejeitado';
      break;
    case 'pendente':
    default:
      mensagem = '<i class="fas fa-clock"></i> Cadastro em análise pela administração.';
      classeBadge = 'status-pendente';
      break;
  }

  containerStatus.innerHTML = `<div class="badge-status ${classeBadge}">${mensagem}</div>`;
}

/**
 * Consulta solicitações de vínculo pendentes na tabela `vinculos_profissionais`.
 */
async function carregarSolicitacoesVinculo(profissionalId) {
  const container = document.getElementById('lista-solicitacoes-vinculo');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('vinculos_profissionais')
      .select(`
        id,
        status,
        created_at,
        paciente_id
      `)
      .eq('profissional_id', profissionalId)
      .eq('status', 'pendente');

    if (error) throw error;

    ProfissionalModule.solicitacoesPendentes = data || [];
    renderizarSolicitacoesVinculo(ProfissionalModule.solicitacoesPendentes);

  } catch (error) {
    console.error('Erro ao carregar solicitações de vínculo:', error);
  }
}

/**
 * Renderiza as solicitações de vínculo pendentes na tela.
 */
function renderizarSolicitacoesVinculo(solicitacoes) {
  const container = document.getElementById('lista-solicitacoes-vinculo');
  if (!container) return;

  if (solicitacoes.length === 0) {
    container.innerHTML = '<p class="texto-mutado">Nenhuma solicitação de vínculo pendente no momento.</p>';
    return;
  }

  let html = '<ul class="lista-vinculos">';
  solicitacoes.forEach((sol) => {
    html += `
      <li class="vinculo-item" data-id="${sol.id}">
        <div>
          <strong>Paciente ID:</strong> ${sol.paciente_id}
          <br><small>Solicitado em: ${formatarDataHora(sol.created_at)}</small>
        </div>
        <div class="acoes-vinculo">
          <button class="btn-aceitar" onclick="atualizarStatusVinculo('${sol.id}', 'ativo')">Aceitar</button>
          <button class="btn-rejeitar" onclick="atualizarStatusVinculo('${sol.id}', 'rejeitado')">Rejeitar</button>
        </div>
      </li>
    `;
  });
  html += '</ul>';

  container.innerHTML = html;
}

/**
 * Aceita ou rejeita uma solicitação de vínculo de paciente.
 */
async function atualizarStatusVinculo(vinculoId, novoStatus) {
  try {
    const { error } = await supabase
      .from('vinculos_profissionais')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', vinculoId);

    if (error) throw error;

    mostrarNotificacaoProfissional(`Vínculo ${novoStatus === 'ativo' ? 'aceito' : 'rejeitado'} com sucesso!`, 'sucesso');
    
    // Recarregar dados do painel
    if (ProfissionalModule.perfilProfissional) {
      await carregarSolicitacoesVinculo(ProfissionalModule.perfilProfissional.id);
      await carregarPacientesAutorizados(ProfissionalModule.perfilProfissional.id);
    }
  } catch (error) {
    console.error('Erro ao atualizar status do vínculo:', error);
    mostrarNotificacaoProfissional('Erro ao processar solicitação de vínculo.', 'erro');
  }
}

/**
 * Consulta a lista de pacientes com autorização/vínculo ativo aprovado.
 */
async function carregarPacientesAutorizados(profissionalId) {
  const container = document.getElementById('lista-pacientes-autorizados');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('vinculos_profissionais')
      .select(`
        id,
        paciente_id,
        updated_at
      `)
      .eq('profissional_id', profissionalId)
      .eq('status', 'ativo');

    if (error) throw error;

    ProfissionalModule.pacientesAutorizados = data || [];
    renderizarPacientesAutorizados(ProfissionalModule.pacientesAutorizados);

  } catch (error) {
    console.error('Erro ao carregar pacientes autorizados:', error);
  }
}

/**
 * Renderiza a lista de pacientes autorizados com acesso seguro.
 */
function renderizarPacientesAutorizados(pacientes) {
  const container = document.getElementById('lista-pacientes-autorizados');
  if (!container) return;

  if (pacientes.length === 0) {
    container.innerHTML = '<p class="texto-mutado">Nenhum paciente autorizado vinculado no momento.</p>';
    return;
  }

  let html = '<ul class="lista-pacientes-segura">';
  pacientes.forEach((pac) => {
    html += `
      <li class="paciente-autorizado-item">
        <div>
          <strong>Paciente ID:</strong> ${pac.paciente_id}
          <br><small>Autorizado desde: ${formatarDataHora(pac.updated_at)}</small>
        </div>
        <div>
          <button class="btn-ver-prontuario" onclick="abrirProntuarioPaciente('${pac.paciente_id}')">
            <i class="fas fa-folder-open"></i> Ver Histórico/Inspeções
          </button>
        </div>
      </li>
    `;
  });
  html += '</ul>';

  container.innerHTML = html;
}

/**
 * Consulta segura ao histórico do paciente autorizado (respeitando RLS do banco).
 */
async function abrirProntuarioPaciente(pacienteId) {
  const containerProntuario = document.getElementById('prontuario-paciente-conteudo');
  if (!containerProntuario) return;

  try {
    containerProntuario.innerHTML = '<p class="loader">Carregando registros do paciente...</p>';

    // Consulta restrita pelas políticas RLS e vínculo ativo
    const { data, error } = await supabase
      .from('historico_inspecoes')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data_inspecao', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      containerProntuario.innerHTML = '<p class="alerta-info">Nenhuma inspeção registrada por este paciente.</p>';
      return;
    }

    let html = `<h4>Histórico de Inspeções do Paciente</h4><div class="grid-historico-profissional">`;
    data.forEach(inspecao => {
      html += `
        <div class="card-historico-mini">
          <p><strong>Data:</strong> ${formatarDataHora(inspecao.data_inspecao)}</p>
          <p><strong>Pé:</strong> ${inspecao.pe_avaliado}</p>
          <p><strong>Alterações:</strong> ${inspecao.qtd_alteracoes || 0}</p>
          ${inspecao.observacoes ? `<p><em>"${escaparHTMLProf(inspecao.observacoes)}"</em></p>` : ''}
        </div>
      `;
    });
    html += '</div>';

    containerProntuario.innerHTML = html;

  } catch (error) {
    console.error('Erro ao consultar prontuário seguro:', error);
    containerProntuario.innerHTML = '<p class="texto-erro">Acesso negado ou erro ao carregar dados do paciente. Verifique se o vínculo está ativo.</p>';
  }
}

/* ==========================================================================
   FUNÇÕES AUXILIARES
   ========================================================================== */

function formatarDataHora(dataIso) {
  if (!dataIso) return 'Data não informada';
  const data = new Date(dataIso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escaparHTMLProf(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function mostrarNotificacaoProfissional(mensagem, tipo) {
  const div = document.getElementById('notificacao-profissional');
  if (div) {
    div.textContent = mensagem;
    div.className = `notificacao notificacao-${tipo}`;
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 4000);
  } else {
    alert(mensagem);
  }
}

// Inicialização automática ao carregar o DOM na página do profissional
document.addEventListener('DOMContentLoaded', () => {
  const formProf = document.getElementById('form-cadastro-profissional');
  if (formProf) {
    formProf.addEventListener('submit', salvarPerfilProfissional);
  }

  // Se estivermos na página profissional, inicializa
  if (document.getElementById('painel-profissional')) {
    inicializarPainelProfissional();
  }
});
