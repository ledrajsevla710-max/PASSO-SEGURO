// js/profissional.js
// Lógica do Painel do Profissional de Saúde com Geração de Ficha de Impressão

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof supabaseClient !== 'undefined') {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error || !session) {
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const user = session.user;
        carregarPerfilProfissional(user.id);
        carregarPacientesVinculados(user.id);
    }

    const btnSair = document.getElementById("btn-sair-prof");
    if (btnSair) {
        btnSair.addEventListener("click", async () => {
            await supabaseClient.auth.signOut();
            window.location.href = "login.html";
        });
    }
});

async function carregarPerfilProfissional(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        if (data) {
            document.getElementById("nome-profissional-display").textContent = data.nome_completo;
        }
    } catch (error) {
        console.error("Erro ao carregar perfil profissional:", error.message);
    }
}

async function carregarPacientesVinculados(profissionalId) {
    const container = document.getElementById("container-pacientes-vinculados");
    if (!container) return;

    try {
        const { data: vinculos, error } = await supabaseClient
            .from('vinculos_profissionais')
            .select('paciente_id, status')
            .eq('profissional_id', profissionalId)
            .eq('status', 'ativo');

        if (error) throw error;

        if (!vinculos || vinculos.length === 0) {
            container.textContent = "Nenhum paciente vinculado no momento.";
            return;
        }

        container.textContent = "";
        const lista = document.createElement("ul");
        lista.style.listStyle = "none";
        lista.style.padding = "0";

        for (const v of vinculos) {
            const { data: perfilPaciente } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', v.paciente_id)
                .single();

            const item = document.createElement("li");
            item.style.padding = "10px";
            item.style.borderBottom = "1px solid #ccc";
            item.style.marginBottom = "8px";
            item.style.display = "flex";
            item.style.justifyContent = "space-between";
            item.style.alignItems = "center";
            item.style.flexWrap = "wrap";

            const nomeSpan = document.createElement("span");
            nomeSpan.textContent = perfilPaciente ? perfilPaciente.nome_completo : "Paciente ID: " + v.paciente_id;
            nomeSpan.style.fontWeight = "bold";

            const divBotoes = document.createElement("div");

            const btnVer = document.createElement("button");
            btnVer.textContent = "Ver Registros";
            btnVer.className = "btn-secundario";
            btnVer.style.marginRight = "5px";
            btnVer.onclick = () => carregarDetalhesPaciente(v.paciente_id, perfilPaciente);

            const btnImprimir = document.createElement("button");
            btnImprimir.textContent = "Imprimir Ficha (PDF/Ficha)";
            btnImprimir.className = "btn-primario";
            btnImprimir.onclick = () => gerarFichaImpressao(perfilPaciente);

            divBotoes.appendChild(btnVer);
            divBotoes.appendChild(btnImprimir);

            item.appendChild(nomeSpan);
            item.appendChild(divBotoes);
            lista.appendChild(item);
        }

        container.appendChild(lista);
    } catch (error) {
        console.error("Erro ao buscar vínculos:", error.message);
        container.textContent = "Erro ao carregar pacientes vinculados.";
    }
}

async function carregarDetalhesPaciente(pacienteId, perfilPaciente) {
    const container = document.getElementById("container-detalhes-paciente");
    if (!container) return;

    const nome = perfilPaciente ? perfilPaciente.nome_completo : "Paciente";
    container.textContent = `Carregando histórico de ${nome}...`;

    try {
        const { data: inspecoes, error } = await supabaseClient
            .from('inspecoes_pes')
            .select('*')
            .eq('paciente_id', pacienteId)
            .order('data_inspecao', { ascending: false });

        if (error) throw error;

        container.textContent = "";
        const titulo = document.createElement("h3");
        titulo.textContent = `Registros de Inspeção: ${nome}`;
        container.appendChild(titulo);

        if (!inspecoes || inspecoes.length === 0) {
            const p = document.createElement("p");
            p.textContent = "Este paciente ainda não possui inspeções registradas.";
            container.appendChild(p);
            return;
        }

        const lista = document.createElement("ul");
        lista.style.listStyle = "none";
        lista.style.padding = "0";

        inspecoes.forEach(reg => {
            const li = document.createElement("li");
            li.style.padding = "8px";
            li.style.borderBottom = "1px dashed #ddd";

            const dataFormatada = new Date(reg.data_inspecao).toLocaleDateString('pt-BR');
            const alteracoes = reg.alteracoes_percebidas.length > 0 ? reg.alteracoes_percebidas.join(", ") : "Nenhuma";

            li.textContent = `[${dataFormatada}] Pé: ${reg.pe_observado} | Região: ${reg.regiao} | Alterações: ${alteracoes} | Buscou atendimento: ${reg.procurou_atendimento ? 'Sim' : 'Não'}`;
            lista.appendChild(li);
        });

        container.appendChild(lista);
    } catch (error) {
        console.error("Erro ao carregar detalhes do paciente:", error.message);
        container.textContent = "Erro ao carregar os dados clínicos do paciente.";
    }
}

// Função para gerar a Ficha de Avaliação pronta para Impressão baseada no modelo institucional
async function gerarFichaImpressao(perfilPaciente) {
    if (!perfilPaciente) return;

    // Busca histórico de remissão do paciente para enriquecer a ficha
    let historicoRemissao = null;
    try {
        const { data } = await supabaseClient
            .from('historico_pacientes')
            .select('*')
            .eq('paciente_id', perfilPaciente.id)
            .limit(1)
            .single();
        historicoRemissao = data;
    } catch (e) {
        console.log("Nenhum histórico adicional encontrado para impressão.");
    }

    // Cria uma nova janela limpa formatada como documento oficial de saúde
    const janelaImpressao = window.open('', '_blank');
    
    const htmlFicha = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Ficha de Avaliação e Acompanhamento - Passo Seguro</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 20px; }
                .header-institucional { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
                .header-institucional h2 { margin: 0; font-size: 14px; text-transform: uppercase; }
                .header-institucional h3 { margin: 2px 0; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                th, td { border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top; }
                th { background-color: #f2f2f2; text-transform: uppercase; font-size: 11px; }
                .secao-titulo { background-color: #ddd; font-weight: bold; text-align: center; padding: 4px; font-size: 11px; }
                .campo-linha { margin-bottom: 8px; }
                .assinatura-box { margin-top: 50px; text-align: center; }
                .linha-assinatura { display: inline-block; width: 300px; border-top: 1px solid #000; padding-top: 5px; }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header-institucional">
                <h2>Governo do Estado / Serviço de Estomaterapia</h2>
                <h3>Sistema Passo Seguro - Ficha de Avaliação e Acompanhamento Clínico</h3>
            </div>

            <table>
                <tr>
                    <td colspan="2"><strong>Nome do Paciente:</strong> ${perfilPaciente.nome_completo}</td>
                    <td><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</td>
                </tr>
                <tr>
                    <td><strong>ID do Sistema:</strong> ${perfilPaciente.id}</td>
                    <td><strong>Tipo de Perfil:</strong> ${perfilPaciente.tipo_usuario}</td>
                    <td><strong>Data da Última Lesão (Remissão):</strong> ${historicoRemissao && historicoRemissao.data_ultima_lesao ? historicoRemissao.data_ultima_lesao : 'Não informada'}</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Localização da Última Lesão:</strong> ${historicoRemissao && historicoRemissao.localizacao_ultima_lesao ? historicoRemissao.localizacao_ultima_lesao : 'Não especificada'}</td>
                    <td><strong>Histórico de Amputação:</strong> ${historicoRemissao && historicoRemissao.antecedente_amputacao ? 'Sim' : 'Não'}</td>
                </tr>
            </table>

            <div class="secao-titulo">REGISTROS RECENTES DE INSPEÇÃO DOMICILIAR</div>
            <table style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Data / Hora</th>
                        <th>Realizado por</th>
                        <th>Pé Observado</th>
                        <th>Região</th>
                        <th>Alterações Percebidas</th>
                        <th>Buscou Atendimento?</th>
                    </tr>
                </thead>
                <tbody id="linhas-inspecao">
                    <tr>
                        <td colspan="6" style="text-align: center;">Carregando registros de inspeção...</td>
                    </tr>
                </tbody>
            </table>

            <div class="campo-linha" style="margin-top: 20px;">
                <strong>Avaliação de Enfermagem / Condutas / Observações Clínicas:</strong>
                <div style="border: 1px solid #000; height: 80px; margin-top: 5px; padding: 5px;"></div>
            </div>

            <div class="assinatura-box">
                <div class="linha-assinatura">
                    Assinatura do Profissional e Carimbo<br>
                    Enfermagem / Estomaterapia
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #007bff; color: #fff; border: none; border-radius: 4px;">Imprimir Ficha</button>
            </div>

            <script>
                // Script interno na página de impressão para carregar as inspeções do paciente via Supabase
                async function carregarInspecoesParaImpressao() {
                    const pacienteId = "${perfilPaciente.id}";
                    const tbody = document.getElementById("linhas-inspecao");
                    
                    if (typeof supabaseClient !== 'undefined') {
                        const { data: inspecoes, error } = await supabaseClient
                            .from('inspecoes_pes')
                            .select('*')
                            .eq('paciente_id', pacienteId)
                            .order('data_inspecao', { ascending: false });

                        if (!error && inspecoes && inspecoes.length > 0) {
                            tbody.innerHTML = "";
                            inspecoes.forEach(reg => {
                                const tr = document.createElement("tr");
                                const dataFmt = new Date(reg.data_inspecao).toLocaleString('pt-BR');
                                const alt = reg.alteracoes_percebidas.length > 0 ? reg.alteracoes_percebidas.join(", ") : "Nenhuma";
                                
                                tr.innerHTML = \`
                                    <td>\${dataFmt}</td>
                                    <td>\${reg.realizado_por}</td>
                                    <td>\${reg.pe_observado}</td>
                                    <td>\${reg.regiao}</td>
                                    <td>\${alt}</td>
                                    <td>\${reg.procurou_atendimento ? 'Sim' : 'Não'}</td>
                                \`;
                                tbody.appendChild(tr);
                            });
                        } else {
                            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma inspeção registrada por este paciente.</td></tr>';
                        }
                    }
                }
                setTimeout(carregarInspecoesParaImpressao, 500);
            </script>
        </body>
        </html>
    `;

    janelaImpressao.document.write(htmlFicha);
    janelaImpressao.document.close();
}
