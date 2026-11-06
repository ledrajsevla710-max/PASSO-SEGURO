// js/profissional.js
// Lógica do Painel do Profissional, Moderação de Cadastros e Ficha HGV

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.supabase === 'undefined') {
        alert("Erro crítico: Supabase não inicializado.");
        return;
    }

    // 1. Verificar sessão ativa
    const { data: { session }, error } = await window.supabase.auth.getSession();
    if (error || !session) {
        window.location.href = "login.html";
        return;
    }

    // 2. Buscar perfil do profissional logado
    const { data: perfilLogado, error: errPerfil } = await window.supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (errPerfil || !perfilLogado || perfilLogado.tipo !== 'profissional') {
        alert("Acesso restrito a profissionais cadastrados.");
        window.location.href = "login.html";
        return;
    }

    // Validação de segurança: Profissional precisa estar aprovado
    if (!perfilLogado.aprovado) {
        alert("Seu cadastro profissional está aguardando liberação da moderação SESAPI/HGV.");
        await window.supabase.auth.signOut();
        window.location.href = "login.html";
        return;
    }

    document.getElementById("nome-profissional-display").textContent = perfilLogado.nome_completo || session.user.email;

    // Botão Sair
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", async () => {
            await window.supabase.auth.signOut();
            window.location.href = "login.html";
        });
    }

    // Carregar painéis
    carregarCadastrosPendentes();
    carregarListaPacientes(perfilLogado.nome_completo);
});

// Função para carregar profissionais pendentes de aprovação
async function carregarCadastrosPendentes() {
    const container = document.getElementById("container-pendentes");
    if (!container) return;
    
    const { data, error } = await window.supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('tipo', 'profissional')
        .eq('aprovado', false);

    if (error) {
        container.innerHTML = `<p style="color: red; font-size: 13px;">Erro ao carregar pendências: ${error.message}</p>`;
        return;
    }

    if (data && data.length > 0) {
        let html = `<table class="tabela-dados">
            <thead>
                <tr>
                    <th>Nome do Profissional</th>
                    <th>E-mail</th>
                    <th>COREN</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>`;
        
        data.forEach(prof => {
            html += `<tr>
                <td>${prof.nome_completo || 'Não informado'}</td>
                <td>${prof.email}</td>
                <td>${prof.coren || 'Não informado'}</td>
                <td><button class="btn-primario" onclick="aprovarProfissional('${prof.id}')">Aprovar Acesso</button></td>
            </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } else {
        container.innerHTML = `<p style="color: #64748b; font-size: 13px;">Nenhum cadastro profissional pendente de moderação no momento.</p>`;
    }
}

// Função global para aprovar o profissional
window.aprovarProfissional = async function(id) {
    const { error } = await window.supabase
        .from('perfis_usuarios')
        .update({ aprovado: true })
        .eq('id', id);

    if (error) {
        alert("Erro ao aprovar profissional: " + error.message);
    } else {
        alert("Profissional aprovado com sucesso!");
        carregarCadastrosPendentes();
    }
};

// Função para carregar a listagem de pacientes
async function carregarListaPacientes(nomeProfissional) {
    const container = document.getElementById("container-pacientes");
    if (!container) return;

    const { data, error } = await window.supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('tipo', 'paciente');

    if (error) {
        container.innerHTML = `<p style="color: red; font-size: 13px;">Erro ao carregar pacientes: ${error.message}</p>`;
        return;
    }

    if (data && data.length > 0) {
        let html = `<table class="tabela-dados">
            <thead>
                <tr>
                    <th>Nome do Paciente</th>
                    <th>Nº Cartão SUS</th>
                    <th>Situação Clínica</th>
                    <th>Ações Clínicas</th>
                </tr>
            </thead>
            <tbody>`;

        data.forEach(pac => {
            let statusTexto = pac.status_clinico === 'prevencao' ? 'Prevenção' : (pac.status_clinico === 'em_tratamento' ? 'Em Tratamento' : 'Remissão');
            html += `<tr>
                <td>${pac.nome_completo || 'Paciente'}</td>
                <td><strong>${pac.cartao_sus || 'Não cadastrado'}</strong></td>
                <td>${statusTexto}</td>
                <td>
                    <button class="btn-primario" onclick='gerarPdfPaciente(${JSON.stringify(pac)}, "${nomeProfissional}")'>Gerar Ficha HGV</button>
                </td>
            </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } else {
        container.innerHTML = `<p style="color: #64748b; font-size: 13px;">Nenhum paciente cadastrado no sistema no momento.</p>`;
    }
}

// Função global para gerar a ficha em PDF do paciente selecionado
window.gerarPdfPaciente = async function(paciente, nomeProfissional) {
    document.getElementById("pdf-nome-paciente").textContent = paciente.nome_completo || "Paciente";
    document.getElementById("pdf-sus").textContent = paciente.cartao_sus || "Não informado";
    document.getElementById("pdf-data").textContent = new Date().toLocaleDateString("pt-BR");
    document.getElementById("pdf-status").textContent = paciente.status_clinico || "Em Acompanhamento";
    document.getElementById("pdf-nome-assinatura").textContent = nomeProfissional;

    // Buscar últimas inspeções do paciente
    const { data: inspecoes } = await window.supabase
        .from('inspecoes_diarias')
        .select('*')
        .eq('user_id', paciente.id)
        .order('created_at', { ascending: false })
        .limit(1);

    const detalhesInspecao = document.getElementById("pdf-detalhes-inspecao");
    if (inspecoes && inspecoes.length > 0) {
        let ultima = inspecoes[0];
        detalhesInspecao.innerHTML = `
            <p style="margin: 2px 0;"><strong>Última Inspeção:</strong> ${new Date(ultima.created_at).toLocaleDateString("pt-BR")}</p>
            <p style="margin: 2px 0;"><strong>Pé / Região Observada:</strong> ${ultima.pe_observado} - ${ultima.regiao_pe}</p>
            <p style="margin: 2px 0;"><strong>Alterações Notadas:</strong> ${ultima.alteracoes ? ultima.alteracoes.join(", ") : "Nenhuma"}</p>
        `;
    } else {
        detalhesInspecao.innerHTML = `<p style="margin: 2px 0;">Nenhuma inspeção diária registrada recentemente pelo paciente.</p>`;
    }

    const elemento = document.getElementById("modelo-ficha-pdf");
    elemento.style.display = "block";

    html2pdf().set({
        margin: 10,
        filename: `Ficha_Clinica_HGV_${paciente.cartao_sus || 'Paciente'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(elemento).save().then(() => {
        elemento.style.display = "none";
    });
};
