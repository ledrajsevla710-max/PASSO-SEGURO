// js/app.js
// Lógica do Painel (Dashboard) e Salvamento de Dados com Supabase

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Verificar se o usuário está autenticado de forma segura pelo Supabase
    if (typeof supabaseClient !== 'undefined') {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error || !session) {
            alert("Sessão expirada ou acesso não autorizado. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const user = session.user;
        carregarPerfilUsuario(user.id);
    } else {
        console.error("Cliente Supabase não inicializado.");
    }

    // 2. Configurar o botão de Sair (Logout) seguro
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", async (e) => {
            e.preventDefault();
            if (typeof supabaseClient !== 'undefined') {
                await supabaseClient.auth.signOut();
            }
            window.location.href = "login.html";
        });
    }

    // 3. Configurar o envio do Histórico de Remissão
    const formHistorico = document.getElementById("form-historico-remissao");
    if (formHistorico) {
        formHistorico.addEventListener("submit", async (e) => {
            e.preventDefault();
            await salvarHistoricoRemissao();
        });
    }

    // 4. Configurar o formulário de Inspeção dos Pés
    const formInspecao = document.getElementById("form-inspecao");
    if (formInspecao) {
        formInspecao.addEventListener("submit", async (e) => {
            e.preventDefault();
            await salvarInspecaoPes();
        });
    }
});

// Função para carregar o nome do perfil com segurança
async function carregarPerfilUsuario(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        if (data) {
            const elementoNome = document.getElementById("nome-usuario-display");
            if (elementoNome) {
                elementoNome.textContent = data.nome_completo;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar perfil:", error.message);
    }
}

// Função para salvar o Histórico da Úlcera Cicatrizada
async function salvarHistoricoRemissao() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const dataLesao = document.getElementById("data-ultima-lesao").value;
        const localLesao = document.getElementById("local-ultima-lesao").value;
        const amputacaoRadio = document.querySelector('input[name="amputacao"]:checked');
        const antecedenteAmputacao = amputacaoRadio ? amputacaoRadio.value === 'sim' : false;

        const { error } = await supabaseClient
            .from('historico_pacientes')
            .insert([
                {
                    paciente_id: session.user.id,
                    data_ultima_lesao: dataLesao || null,
                    localizacao_ultima_lesao: localLesao,
                    antecedente_amputacao: antecedenteAmputacao
                }
            ]);

        if (error) throw error;

        alert("Histórico de remissão salvo com sucesso!");
    } catch (error) {
        alert("Erro ao salvar histórico: " + error.message);
        console.error("Erro histórico:", error);
    }
}

// Função para registrar a inspeção dos pés no banco de dados
async function salvarInspecaoPes() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const realizadoPor = document.getElementById("realizado-por").value;
        const peObservado = document.getElementById("pe-observado").value;
        const regiao = document.getElementById("regiao-observada").value;
        const procurouAtendimento = document.getElementById("procurou-atendimento").checked;

        // Capturar alterações marcadas nas caixas de seleção
        const alteracoesSelecionadas = [];
        document.querySelectorAll('.chk-alteracao:checked').forEach(checkbox => {
            alteracoesSelecionadas.push(checkbox.value);
        });

        const { error } = await supabaseClient
            .from('inspecoes_pes')
            .insert([
                {
                    paciente_id: session.user.id,
                    realizado_por: realizadoPor,
                    pe_observado: peObservado,
                    regiao: regiao,
                    alteracoes_percebidas: alteracoesSelecionadas,
                    procurou_atendimento: procurouAtendimento
                }
            ]);

        if (error) throw error;

        alert("Inspeção registrada com sucesso!");
        document.getElementById("form-inspecao").reset();
    } catch (error) {
        alert("Erro ao salvar inspeção: " + error.message);
        console.error("Erro inspeção:", error);
    }
}
function exportarFichaPDF(dadosPaciente, listaInspecoes) {
    // 1. Preenche os dados no modelo HTML
    document.getElementById("pdf-nome-paciente").textContent = dadosPaciente.nome || "Paciente Registrado";
    document.getElementById("pdf-data").textContent = new Date().toLocaleDateString("pt-BR");
    document.getElementById("pdf-status").textContent = dadosPaciente.statusClinico || "Em Acompanhamento";
    document.getElementById("pdf-amputacao").textContent = dadosPaciente.temAmputacao ? "Sim" : "Não";

    // 2. Preenche o histórico de inspeções
    const containerInspecoes = document.getElementById("pdf-conteudo-inspecoes");
    if (listaInspecoes && listaInspecoes.length > 0) {
        let html = `<table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
                <tr style="background-color: #003366; color: white;">
                    <th style="padding: 6px; border: 1px solid #ccc;">Data</th>
                    <th style="padding: 6px; border: 1px solid #ccc;">Pé</th>
                    <th style="padding: 6px; border: 1px solid #ccc;">Região</th>
                    <th style="padding: 6px; border: 1px solid #ccc;">Alterações Identificadas</th>
                </tr>
            </thead><tbody>`;

        listaInspecoes.forEach(item => {
            html += `<tr>
                <td style="padding: 6px; border: 1px solid #ccc;">${new Date(item.created_at).toLocaleDateString("pt-BR")}</td>
                <td style="padding: 6px; border: 1px solid #ccc;">${item.pe_observado}</td>
                <td style="padding: 6px; border: 1px solid #ccc;">${item.regiao_pe}</td>
                <td style="padding: 6px; border: 1px solid #ccc;">${item.alteracoes ? item.alteracoes.join(", ") : "Nenhuma"}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
        containerInspecoes.innerHTML = html;
    } else {
        containerInspecoes.innerHTML = "<p>Nenhuma inspeção registrada até o momento.</p>";
    }

    // 3. Exibe temporariamente para captura
    const elemento = document.getElementById("modelo-ficha-pdf");
    elemento.style.display = "block";

    // 4. Configuração e Geração do PDF
    const opcoes = {
        margin:       10,
        filename:     `Ficha_Clinica_Passo_Seguro_${dadosPaciente.nome || 'Paciente'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opcoes).from(elemento).save().then(() => {
        // Oculta novamente após a geração
        elemento.style.display = "none";
    });
}
