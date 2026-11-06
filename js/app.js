// js/app.js
// Lógica do Painel (Dashboard) e Salvamento de Dados com Supabase

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar se o usuário está autenticado de forma segura pelo Supabase
    if (typeof window.supabase !== 'undefined') {
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error || !session) {
            alert("Sessão expirada ou acesso não autorizado. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const user = session.user;
        carregarPerfilUsuario(user.id);
        carregarHistoricoInspecoes(user.id);
    } else {
        console.error("Cliente Supabase não inicializado.");
    }

    // 2. Configurar o botão de Sair (Logout) seguro
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", async (e) => {
            e.preventDefault();
            if (typeof window.supabase !== 'undefined') {
                await window.supabase.auth.signOut();
            }
            window.location.href = "login.html";
        });
    }

    // 3. Configurar o envio dos Dados Cadastrais e Situação Clínica (com Cartão SUS)
    const formHistorico = document.getElementById("form-historico");
    if (formHistorico) {
        formHistorico.addEventListener("submit", async (e) => {
            e.preventDefault();
            await salvarDadosCadastrais();
        });
    }

    // 4. Configurar o formulário de Inspeção Diária dos Pés
    const formInspecao = document.getElementById("form-inspecao");
    if (formInspecao) {
        formInspecao.addEventListener("submit", async (e) => {
            e.preventDefault();
            await salvarInspecaoPes();
        });
    }

    // 5. Configurar o botão de exportar PDF no modelo HGV / SESAPI
    const btnExportarPdf = document.getElementById("btn-exportar-pdf");
    if (btnExportarPdf) {
        btnExportarPdf.addEventListener("click", async () => {
            const { data: { session } } = await window.supabase.auth.getSession();
            if (!session) return;

            // Busca dados do perfil e inspeções para compor o PDF
            const { data: perfil } = await window.supabase
                .from('perfis_usuarios')
                .select('*')
                .eq('id', session.user.id)
                .single();

            const { data: inspecoes } = await window.supabase
                .from('inspecoes_diarias')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            exportarFichaPDF(perfil || { nome_completo: "Paciente" }, inspecoes || []);
        });
    }
});

// Função para carregar o perfil do usuário
async function carregarPerfilUsuario(userId) {
    try {
        const { data, error } = await window.supabase
            .from('perfis_usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        if (data) {
            const elementoNome = document.getElementById("nome-paciente-display");
            if (elementoNome) {
                elementoNome.textContent = data.nome_completo || data.email || "Paciente";
            }

            // Preenche os campos caso já estejam salvos
            if (data.cartao_sus) document.getElementById("num-sus").value = data.cartao_sus;
            if (data.status_clinico) document.getElementById("status-clinico").value = data.status_clinico;
            if (data.data_ultima_lesao) document.getElementById("data-lesao").value = data.data_ultima_lesao;
            if (data.localizacao_lesao) document.getElementById("localizacao-lesao").value = data.localizacao_lesao;
            if (data.historico_amputacao !== undefined) {
                document.getElementById("historico-amputacao").checked = data.historico_amputacao;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar perfil:", error.message);
    }
}

// Função para salvar dados cadastrais, situação clínica e Cartão SUS
async function salvarDadosCadastrais() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session) return;

        const numSus = document.getElementById("num-sus").value;
        const statusClinico = document.getElementById("status-clinico").value;
        const dataLesao = document.getElementById("data-lesao").value || null;
        const localizacao = document.getElementById("localizacao-lesao").value;
        const amputacao = document.getElementById("historico-amputacao").checked;

        const { error } = await window.supabase
            .from('perfis_usuarios')
            .update({
                cartao_sus: numSus,
                status_clinico: statusClinico,
                data_ultima_lesao: dataLesao,
                localizacao_lesao: localizacao,
                historico_amputacao: amputacao
            })
            .eq('id', session.user.id);

        if (error) throw error;

        alert("Situação clínica e Cartão SUS salvos com sucesso!");
    } catch (error) {
        alert("Erro ao salvar dados cadastrais: " + error.message);
        console.error("Erro:", error);
    }
}

// Função para registrar a inspeção diária dos pés
async function salvarInspecaoPes() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session) return;

        const peObservado = document.getElementById("pe-observado").value;
        const regiaoPe = document.getElementById("regiao-pe").value;

        // Capturar alterações marcadas nas caixas de seleção
        const alteracoesChecked = document.querySelectorAll('input[name="alteracao"]:checked');
        const alteracoes = Array.from(alteracoesChecked).map(cb => cb.value);

        const { error } = await window.supabase
            .from('inspecoes_diarias')
            .insert([
                {
                    user_id: session.user.id,
                    pe_observado: peObservado,
                    regiao_pe: regiaoPe,
                    alteracoes: alteracoes
                }
            ]);

        if (error) throw error;

        alert("Inspeção diária registrada com sucesso!");
        document.getElementById("form-inspecao").reset();
        carregarHistoricoInspecoes(session.user.id);
    } catch (error) {
        alert("Erro ao salvar inspeção: " + error.message);
        console.error("Erro inspeção:", error);
    }
}

// Função para listar o histórico de inspeções na tela
async function carregarHistoricoInspecoes(userId) {
    try {
        const container = document.getElementById("container-historico-inspecoes");
        if (!container) return;

        const { data, error } = await window.supabase
            .from('inspecoes_diarias')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
            let html = `<div style="display: flex; flex-direction: column; gap: 8px;">`;
            data.forEach(item => {
                const dataFormatada = new Date(item.created_at).toLocaleDateString("pt-BR", {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                html += `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
                        <strong>Data:</strong> ${dataFormatada} | <strong>Pé:</strong> ${item.pe_observado} | <strong>Região:</strong> ${item.regiao_pe}<br>
                        <strong>Achados:</strong> ${item.alteracoes && item.alteracoes.length > 0 ? item.alteracoes.join(", ") : "Nenhuma alteração relatada"}
                    </div>
                `;
            });
            html += `</div>`;
            container.innerHTML = html;
        } else {
            container.innerHTML = `<p style="color: #64748b; font-size: 13px;">Nenhum registro de inspeção encontrado.</p>`;
        }
    } catch (error) {
        console.error("Erro ao carregar histórico de inspeções:", error);
    }
}

// Função para exportar o PDF oficial do HGV / SESAPI
function exportarFichaPDF(dadosPaciente, listaInspecoes) {
    // 1. Preenche os dados no modelo HTML oculto
    document.getElementById("pdf-nome-paciente").textContent = dadosPaciente.nome_completo || "Paciente Registrado";
    document.getElementById("pdf-sus").textContent = dadosPaciente.cartao_sus || "Não informado";
    document.getElementById("pdf-data").textContent = new Date().toLocaleDateString("pt-BR");
    document.getElementById("pdf-status").textContent = dadosPaciente.status_clinico === 'prevencao' ? 'Prevenção' : (dadosPaciente.status_clinico === 'em_tratamento' ? 'Em Tratamento Ativo' : 'Remissão');

    // 2. Preenche o histórico de inspeções no PDF se houver
    const detalhesInspecao = document.getElementById("pdf-detalhes-inspecao");
    if (listaInspecoes && listaInspecoes.length > 0) {
        let ultima = listaInspecoes[0];
        detalhesInspecao.innerHTML = `
            <p style="margin: 2px 0;"><strong>Última Inspeção Registrada:</strong> ${new Date(ultima.created_at).toLocaleDateString("pt-BR")}</p>
            <p style="margin: 2px 0;"><strong>Pé / Região:</strong> ${ultima.pe_observado} - ${ultima.regiao_pe}</p>
            <p style="margin: 2px 0;"><strong>Alterações Notadas:</strong> ${ultima.alteracoes ? ultima.alteracoes.join(", ") : "Nenhuma"}</p>
            <p style="margin: 2px 0; margin-top: 6px;"><em>Paciente em acompanhamento regular pelo protocolo Passo Seguro SESAPI/HGV.</em></p>
        `;
    }

    // 3. Exibe temporariamente para captura pelo html2pdf
    const elemento = document.getElementById("modelo-ficha-pdf");
    elemento.style.display = "block";

    // 4. Configuração e Geração do PDF
    const opcoes = {
        margin:       10,
        filename:     `Ficha_HGV_SESAPI_${dadosPaciente.cartao_sus || 'Paciente'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opcoes).from(elemento).save().then(() => {
        elemento.style.display = "none";
    });
}
