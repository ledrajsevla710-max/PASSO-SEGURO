// =====================================================
// PASSO SEGURO
// Arquivo: js/historico.js
// Histórico de inspeções + impressão
// =====================================================

const HistoricoModule = {
    inspecoes: [],
    inspecaoSelecionada: null
};

// Helper para obter o cliente Supabase
function getSupabase() {
    return window.supabaseClient || window.PASSO_SEGURO?.supabaseClient || null;
}

// -----------------------------------------------------
// CARREGAR HISTÓRICO
// -----------------------------------------------------
async function carregarHistorico() {
    const container = document.getElementById("lista-historico");
    const loader = document.getElementById("historico-loader");
    const mensagemVazia = document.getElementById("historico-vazio");

    try {
        if (loader) loader.style.display = "block";
        if (mensagemVazia) mensagemVazia.style.display = "none";
        if (container) container.innerHTML = "";

        const supabase = getSupabase();
        if (!supabase) {
            throw new Error("Conexão com o sistema não encontrada.");
        }

        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.user) {
            throw new Error("Usuário não autenticado. Faça login novamente.");
        }

        const userId = session.user.id;

        // Tenta a view primeiro, se falhar usa a tabela direta
        let data = null;
        let error = null;

        const resView = await supabase
            .from("historico_inspecoes")
            .select("*")
            .eq("paciente_id", userId)
            .order("data_inspecao", { ascending: false });

        if (resView.error) {
            console.warn("View historico_inspecoes não disponível, usando fallback...");
            return await carregarHistoricoFallback(userId);
        }

        data = resView.data;
        HistoricoModule.inspecoes = data || [];

        if (loader) loader.style.display = "none";

        if (HistoricoModule.inspecoes.length === 0) {
            if (mensagemVazia) mensagemVazia.style.display = "block";
            return;
        }

        renderizarListaHistorico(HistoricoModule.inspecoes);

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        if (loader) loader.style.display = "none";
        mostrarNotificacaoHistorico(error.message || "Erro ao carregar seu histórico.", "erro");
    }
}

// -----------------------------------------------------
// FALLBACK (consulta direta na tabela inspecoes)
// -----------------------------------------------------
async function carregarHistoricoFallback(userId) {
    const supabase = getSupabase();
    const loader = document.getElementById("historico-loader");
    const mensagemVazia = document.getElementById("historico-vazio");

    const { data, error } = await supabase
        .from("inspecoes")
        .select(`
            id,
            created_at,
            pe_direito_inspecionado,
            pe_esquerdo_inspecionado,
            identificou_alteracao,
            observacoes,
            alteracoes (
                id,
                tipo_alteracao,
                local_pe,
                descricao
            ),
            fotos_inspecao (
                id,
                caminho_arquivo
            )
        `)
        .eq("paciente_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    HistoricoModule.inspecoes = (data || []).map(item => {
        let pe = "ambos";
        if (item.pe_direito_inspecionado && !item.pe_esquerdo_inspecionado) pe = "direito";
        if (!item.pe_direito_inspecionado && item.pe_esquerdo_inspecionado) pe = "esquerdo";

        return {
            inspecao_id: item.id,
            data_inspecao: item.created_at,
            pe_avaliado: pe,
            observacoes: item.observacoes,
            qtd_alteracoes: item.alteracoes ? item.alteracoes.length : 0,
            qtd_fotos: item.fotos_inspecao ? item.fotos_inspecao.length : 0,
            alteracoes: item.alteracoes || [],
            fotos: item.fotos_inspecao || []
        };
    });

    if (loader) loader.style.display = "none";

    if (HistoricoModule.inspecoes.length === 0) {
        if (mensagemVazia) mensagemVazia.style.display = "block";
        return;
    }

    renderizarListaHistorico(HistoricoModule.inspecoes);
}

// -----------------------------------------------------
// RENDERIZAR LISTA
// -----------------------------------------------------
function renderizarListaHistorico(lista) {
    const container = document.getElementById("lista-historico");
    if (!container) return;

    container.innerHTML = "";

    lista.forEach((item) => {
        const dataFormatada = formatarDataHora(item.data_inspecao);
        const card = document.createElement("div");
        card.className = "card-historico";
        card.setAttribute("data-id", item.inspecao_id || item.id);

        const totalAlteracoes = item.qtd_alteracoes ?? (item.alteracoes ? item.alteracoes.length : 0);
        const totalFotos = item.qtd_fotos ?? (item.fotos ? item.fotos.length : 0);
        const peTexto = traduzirPeAvaliado(item.pe_avaliado);

        card.innerHTML = `
            <div class="historico-header">
                <span class="historico-data"><i class="far fa-calendar-alt"></i> ${dataFormatada}</span>
                <span class="badge-pe">${peTexto}</span>
            </div>
            <div class="historico-body">
                <p class="historico-resumo">
                    <strong><i class="fas fa-exclamation-triangle"></i> Alterações:</strong> ${totalAlteracoes}
                </p>
                <p class="historico-resumo">
                    <strong><i class="fas fa-camera"></i> Fotografias:</strong> ${totalFotos}
                </p>
                ${item.observacoes ? `<p class="historico-obs"><em>"${escaparHTML(item.observacoes)}"</em></p>` : ""}
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

// -----------------------------------------------------
// ABRIR DETALHES
// -----------------------------------------------------
async function abrirDetalhesInspecao(inspecaoId) {
    const modal = document.getElementById("modal-detalhes-inspecao");
    const conteudoModal = document.getElementById("detalhes-inspecao-conteudo");

    try {
        if (conteudoModal) conteudoModal.innerHTML = "<div class='spinner'>Carregando detalhes...</div>";
        if (modal) modal.style.display = "block";

        const supabase = getSupabase();

        const [resInspecao, resAlteracoes, resFotos] = await Promise.all([
            supabase.from("inspecoes").select("*").eq("id", inspecaoId).single(),
            supabase.from("alteracoes").select("*").eq("inspecao_id", inspecaoId),
            supabase.from("fotos_inspecao").select("*").eq("inspecao_id", inspecaoId)
        ]);

        if (resInspecao.error) throw resInspecao.error;

        const inspecao = resInspecao.data;
        const alteracoes = resAlteracoes.data || [];
        const fotos = resFotos.data || [];

        // Tenta gerar URLs assinadas das fotos
        const fotosComUrl = await Promise.all(
            fotos.map(async (foto) => {
                try {
                    const { data, error } = await supabase.storage
                        .from("fotos-inspecao")
                        .createSignedUrl(foto.caminho_arquivo, 3600);

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
        console.error("Erro ao abrir detalhes:", error);
        if (conteudoModal) {
            conteudoModal.innerHTML = "<p class='texto-erro'>Não foi possível carregar os detalhes desta inspeção.</p>";
        }
    }
}

// -----------------------------------------------------
// RENDERIZAR MODAL DE DETALHES
// -----------------------------------------------------
function renderizarModalDetalhes(inspecao, alteracoes, fotos) {
    const conteudoModal = document.getElementById("detalhes-inspecao-conteudo");
    if (!conteudoModal) return;

    const dataFormatada = formatarDataHora(inspecao.created_at || inspecao.data_inspecao);

    let peTexto = "Não informado";
    if (inspecao.pe_direito_inspecionado && inspecao.pe_esquerdo_inspecionado) peTexto = "Ambos os pés";
    else if (inspecao.pe_direito_inspecionado) peTexto = "Pé direito";
    else if (inspecao.pe_esquerdo_inspecionado) peTexto = "Pé esquerdo";

    let htmlAlteracoes = "";
    if (alteracoes.length === 0) {
        htmlAlteracoes = `<p class="texto-sucesso"><i class="fas fa-check-circle"></i> Nenhuma alteração registrada.</p>`;
    } else {
        htmlAlteracoes = `<ul class="lista-alteracoes-detalhe">`;
        alteracoes.forEach((alt) => {
            htmlAlteracoes += `
                <li>
                    <strong>${escaparHTML(alt.tipo_alteracao || "Alteração")}</strong> — 
                    Local: ${escaparHTML(alt.local_pe || alt.localizacao || "Não especificado")}
                </li>
            `;
        });
        htmlAlteracoes += `</ul>`;
    }

    let htmlFotos = "";
    if (fotos.length === 0) {
        htmlFotos = `<p class="texto-mutado">Nenhuma fotografia anexada.</p>`;
    } else {
        htmlFotos = `<div class="galeria-fotos-detalhe">`;
        fotos.forEach((foto) => {
            if (foto.url) {
                htmlFotos += `
                    <div class="item-foto">
                        <a href="${foto.url}" target="_blank">
                            <img src="${foto.url}" alt="Foto da inspeção" loading="lazy" />
                        </a>
                    </div>
                `;
            }
        });
        htmlFotos += `</div>`;
    }

    conteudoModal.innerHTML = `
        <div class="detalhes-header">
            <h3>Inspeção de ${dataFormatada}</h3>
            <span class="badge-pe">${peTexto}</span>
        </div>

        <div class="detalhes-secao">
            <h4><i class="fas fa-notes-medical"></i> Alterações Encontradas</h4>
            ${htmlAlteracoes}
        </div>

        <div class="detalhes-secao">
            <h4><i class="fas fa-comment-alt"></i> Observações</h4>
            <p>${inspecao.observacoes ? escaparHTML(inspecao.observacoes) : "<em>Nenhuma observação informada.</em>"}</p>
        </div>

        <div class="detalhes-secao">
            <h4><i class="fas fa-images"></i> Fotografias</h4>
            ${htmlFotos}
        </div>
    `;
}

// -----------------------------------------------------
// FECHAR MODAL
// -----------------------------------------------------
function fecharModalDetalhes() {
    const modal = document.getElementById("modal-detalhes-inspecao");
    if (modal) modal.style.display = "none";
}

// Fecha o modal ao clicar no X
document.addEventListener("DOMContentLoaded", () => {
    const btnFechar = document.getElementById("btn-fechar-modal-detalhes");
    if (btnFechar) {
        btnFechar.addEventListener("click", fecharModalDetalhes);
    }

    // Fecha ao clicar fora do conteúdo
    const modal = document.getElementById("modal-detalhes-inspecao");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) fecharModalDetalhes();
        });
    }
});

// -----------------------------------------------------
// IMPRIMIR HISTÓRICO
// -----------------------------------------------------
function imprimirHistorico() {
    const lista = HistoricoModule.inspecoes || [];
    const nomePaciente = localStorage.getItem("usuario_nome") || "Paciente";

    if (lista.length === 0) {
        alert("Não há registros de inspeção para imprimir.");
        return;
    }

    let html = `
        <html>
        <head>
            <title>Histórico de Inspeções - Passo Seguro</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #222; }
                h1 { color: #087e78; margin-bottom: 5px; }
                .subtitulo { color: #666; margin-bottom: 25px; }
                .registro { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
                .data { font-weight: bold; color: #087e78; }
                .obs { font-style: italic; color: #555; margin-top: 8px; }
                .rodape { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
                @media print {
                    body { padding: 15px; }
                    .registro { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <h1>Passo Seguro</h1>
            <p class="subtitulo">Histórico de Inspeções — ${escaparHTML(nomePaciente)}</p>
            <p>Data de emissão: ${new Date().toLocaleString("pt-BR")}</p>
            <hr>
    `;

    lista.forEach((item, index) => {
        const data = formatarDataHora(item.data_inspecao);
        const pe = traduzirPeAvaliado(item.pe_avaliado);
        const qtdAlt = item.qtd_alteracoes ?? (item.alteracoes ? item.alteracoes.length : 0);

        html += `
            <div class="registro">
                <div class="data">${index + 1}. ${data}</div>
                <div>Pé avaliado: <strong>${pe}</strong></div>
                <div>Alterações encontradas: <strong>${qtdAlt}</strong></div>
                ${item.observacoes ? `<div class="obs">"${escaparHTML(item.observacoes)}"</div>` : ""}
            </div>
        `;
    });

    html += `
            <div class="rodape">
                Passo Seguro — Ferramenta de apoio ao autocuidado.<br>
                Este documento não substitui avaliação profissional de saúde.
            </div>
        </body>
        </html>
    `;

    const janela = window.open("", "_blank", "width=800,height=600");
    janela.document.write(html);
    janela.document.close();
    janela.focus();

    setTimeout(() => {
        janela.print();
    }, 400);
}

// -----------------------------------------------------
// FUNÇÕES AUXILIARES
// -----------------------------------------------------
function formatarDataHora(dataISO) {
    if (!dataISO) return "Data não informada";
    try {
        const data = new Date(dataISO);
        return data.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return dataISO;
    }
}

function traduzirPeAvaliado(valor) {
    const mapa = {
        direito: "Pé direito",
        esquerdo: "Pé esquerdo",
        ambos: "Ambos os pés"
    };
    return mapa[valor] || valor || "Não informado";
}

function escaparHTML(texto) {
    if (!texto) return "";
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

function mostrarNotificacaoHistorico(mensagem, tipo) {
    const el = document.getElementById("notificacao-historico");
    if (!el) {
        alert(mensagem);
        return;
    }
    el.textContent = mensagem;
    el.style.display = "block";
    el.className = tipo === "sucesso"
        ? "notificacao notificacao-sucesso"
        : "notificacao notificacao-erro";
}

// Disponibiliza funções globalmente
window.carregarHistorico = carregarHistorico;
window.abrirDetalhesInspecao = abrirDetalhesInspecao;
window.imprimirHistorico = imprimirHistorico;
window.fecharModalDetalhes = fecharModalDetalhes;
