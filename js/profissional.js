// js/profissional.js
// Lógica do Painel do Profissional de Saúde

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
        // Busca os vínculos ativos onde o profissional é o logado
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
            // Busca o nome do paciente na tabela profiles
            const { data: perfilPaciente } = await supabaseClient
                .from('profiles')
                .select('nome_completo')
                .eq('id', v.paciente_id)
                .single();

            const item = document.createElement("li");
            item.style.padding = "10px";
            item.style.borderBottom = "1px solid #ccc";
            item.style.marginBottom = "5px";
            item.style.display = "flex";
            item.style.justifyContent = "space-between";
            item.style.alignItems = "center";

            const nomeSpan = document.createElement("span");
            nomeSpan.textContent = perfilPaciente ? perfilPaciente.nome_completo : "Paciente ID: " + v.paciente_id;

            const btnVer = document.createElement("button");
            btnVer.textContent = "Ver Registros";
            btnVer.className = "btn-secundario";
            btnVer.onclick = () => carregarDetalhesPaciente(v.paciente_id, nomeSpan.textContent);

            item.appendChild(nomeSpan);
            item.appendChild(btnVer);
            lista.appendChild(item);
        }

        container.appendChild(lista);
    } catch (error) {
        console.error("Erro ao buscar vínculos:", error.message);
        container.textContent = "Erro ao carregar pacientes vinculados.";
    }
}

async function carregarDetalhesPaciente(pacienteId, nomePaciente) {
    const container = document.getElementById("container-detalhes-paciente");
    if (!container) return;

    container.textContent = `Carregando histórico de ${nomePaciente}...`;

    try {
        const { data: inspecoes, error } = await supabaseClient
            .from('inspecoes_pes')
            .select('*')
            .eq('paciente_id', pacienteId)
            .order('data_inspecao', { ascending: false });

        if (error) throw error;

        container.textContent = "";
        const titulo = document.createElement("h3");
        titulo.textContent = `Registros de Inspeção: ${nomePaciente}`;
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
