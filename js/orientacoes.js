/**
 * js/orientacoes.js - Passo Seguro
 * Módulo de orientações educativas e preventivas para o autocuidado dos pés.
 * 
 * Dependências:
 * - Opcionalmente interage com o DOM da página `dashboard.html` na aba de orientações.
 */

const OrientacoesModule = {
  // Lista de diretrizes educativas baseadas em protocolos clínicos de prevenção
  diretrizes: [
    {
      id: 1,
      titulo: "Inspeção diária dos pés",
      icone: "fas fa-search",
      resumo: "Observe diariamente a planta, o calcanhar, o dorso e os espaços entre os dedos.",
      descricao: "Faça uma inspeção minuciosa todos os dias. Verifique se há áreas avermelhadas, bolhas, cortes, inchaço ou alterações de temperatura. Caso tenha dificuldade visual ou física para examinar a planta dos pés, utilize um espelho com cabo ou peça ajuda a um familiar ou cuidador de confiança."
    },
    {
      id: 2,
      titulo: "Higiene e secagem adequada",
      icone: "fas fa-soap",
      resumo: "Higienize os pés cuidadosamente e seque principalmente entre os dedos.",
      descricao: "Lave os pés diariamente com água morna (sempre testando a temperatura antes com o dorso da mão ou cotovelo) e sabão neutro. Não deixe os pés de molho por longos períodos para evitar o amolecimento excessivo da pele. Seque muito bem, com toques suaves, dando atenção especial à região entre os dedos para evitar proliferação de fungos."
    },
    {
      id: 3,
      titulo: "Hidratação correta da pele",
      icone: "fas fa-hand-holding-water",
      resumo: "Hidrate a pele seca para evitar rachaduras, evitando aplicar produto entre os dedos.",
      descricao: "Utilize cremes hidratantes recomendados para manter a pele flexível e prevenir fissuras ou calosidades. Contudo, **nunca aplique creme ou loção entre os dedos**, pois o acúmulo de umidade nessa região favorece infecções fúngicas e bacterianas."
    },
    {
      id: 4,
      titulo: "Cuidados essenciais com calçados",
      icone: "fas fa-shoe-prints",
      resumo: "Utilize calçados confortáveis, macios e fechados, verificando o interior antes de calçar.",
      descricao: "Evite sapatos apertados, de bico fino, saltos altos ou sandálias abertas que deixem os dedos expostos a traumas. Antes de calçar qualquer sapato, inspecione o interior com as mãos para certificar-se de que não há pedrinhas, costuras soltas ou objetos estranhos que possam machucar a pele."
    },
    {
      id: 5,
      titulo: "Atenção a alterações percebidas",
      icone: "fas fa-exclamation-triangle",
      resumo: "Identifique sinais precoces de alerta e saiba quando procurar ajuda.",
      descricao: "Qualquer alteração repentina — como vermelhidão intensa, inchaço localizado, aumento da temperatura em um dos pés, dor, pequenas bolhas, feridas ou arranhões — deve ser tratada como sinal de alerta. O acompanhamento precoce evita complicações graves."
    },
    {
      id: 6,
      titulo: "Avaliação profissional regular",
      icone: "fas fa-user-md",
      resumo: "Mantenha o acompanhamento periódico com a equipe de saúde e profissionais especializados.",
      descricao: "As orientações contidas neste aplicativo possuem caráter exclusivamente educativo e de suporte ao autocuidado, **não substituindo em hipótese alguma o diagnóstico médico, consultas presenciais ou prescrições de tratamentos**. Consulte regularmente a equipe de saúde da sua unidade de referência."
    }
  ],

  /**
   * Renderiza as orientações dinamicamente na página caso exista o contêiner adequado.
   */
  inicializar() {
    const container = document.getElementById('container-orientacoes');
    if (!container) return;

    container.innerHTML = '';

    this.diretrizes.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'orientation-item';
      card.innerHTML = `
        <h3><i class="${item.icone}"></i> ${item.titulo}</h3>
        <p><strong>${item.resumo}</strong></p>
        <p class="orientacao-detalhe">${item.descricao}</p>
      `;
      container.appendChild(card);
    });
  }
};

// Inicializa automaticamente ao carregar o DOM se a seção estiver presente
document.addEventListener('DOMContentLoaded', () => {
  OrientacoesModule.inicializar();
});
