
/* =====================================================
   PASSO SEGURO
   Arquivo: js/inspecao.js
   Módulo: Inspeção guiada dos pés
   Banco: Supabase
   Tabela: inspecoes_diarias
===================================================== */

let usuarioInspecao = null;

// -----------------------------------------------------
// 1. INICIALIZAÇÃO
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    inicializarInspecao();
});

async function inicializarInspecao() {
    try {
        if (!window.supabase) {
            throw new Error("Supabase não inicializado.");
        }

        const { data, error } =
            await window.supabase.auth.getUser();

        if (error || !data.user) {
            window.location.href = "login.html";
            return;
        }

        usuarioInspecao = data.user;

        const formulario =
            document.getElementById("form-inspecao");

        if (formulario) {
            formulario.addEventListener(
                "submit",
                registrarInspecao
            );
        }

        await carregarHistoricoInspecao();

    } catch (erro) {
        console.error("Erro na inspeção:", erro);
        mostrarMensagemInspecao(
            "Não foi possível iniciar a inspeção."
        );
    }
}

// -----------------------------------------------------
// 2. REGISTRAR INSPEÇÃO
// -----------------------------------------------------

async function registrarInspecao(event) {
    event.preventDefault();

    try {
        if (!usuarioInspecao) {
            throw new Error("Usuário não autenticado.");
        }

        const pe = document.getElementById(
            "pe-observado"
        ).value;

        const regiao = document.getElementById(
            "regiao-pe"
        ).value;

        const alteracoes = Array.from(
            document.querySelectorAll(
                'input[name="alteracao"]:checked'
            )
        ).map(campo => campo.value);

        if (!pe || !regiao) {
            mostrarMensagemInspecao(
                "Preencha os campos obrigatórios."
            );
            return;
        }

        const registro = {
            user_id: usuarioInspecao.id,
            pe_observado: pe,
            regiao_pe: regiao,
            alteracoes: alteracoes
        };

        const { error } = await window.supabase
            .from("inspecoes_diarias")
            .insert([registro]);

        if (error) throw error;

        mostrarMensagemInspecao(
            "Inspeção registrada com sucesso!"
        );

        document.getElementById(
            "form-inspecao"
        ).reset();

        await carregarHistoricoInspecao();

    } catch (erro) {
        console.error("Erro ao registrar:", erro);

        mostrarMensagemInspecao(
            "Erro ao salvar inspeção: " + erro.message
        );
    }
}

// -----------------------------------------------------
// 3. CARREGAR HISTÓRICO
// -----------------------------------------------------

async function carregarHistoricoInspecao() {
    const container = document.getElementById(
        "container-historico-inspecoes"
    );

    if (!container || !usuarioInspecao) return;

    container.textContent = "Carregando histórico...";

    try {
        const { data, error } = await window.supabase
            .from("inspecoes_diarias")
            .select("*")
            .eq("user_id", usuarioInspecao.id)
            .order("created_at", {
                ascending: false
            })
            .limit(30);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.textContent =
                "Nenhuma inspeção registrada até o momento.";
            return;
        }

        const lista = document.createElement("div");

        data.forEach(registro => {
            const card = document.createElement("div");

            card.style.cssText =
                "padding:12px;margin-bottom:10px;" +
                "border:1px solid #dbe3ea;border-radius:8px;";

            const dataRegistro = new Date(
                registro.created_at
            ).toLocaleString("pt-BR");

            const titulo = document.createElement("strong");
            titulo.textContent = dataRegistro;

            const pe = document.createElement("p");
            pe.textContent =
                "Pé observado: " + registro.pe_observado;

            const regiao = document.createElement("p");
            regiao.textContent =
                "Região: " + registro.regiao_pe;

            const alteracoes = document.createElement("p");
            alteracoes.textContent =
                "Alterações: " +
                (Array.isArray(registro.alteracoes) &&
                registro.alteracoes.length
                    ? registro.alteracoes.join(", ")
                    : "Nenhuma relatada");

            card.append(titulo, pe, regiao, alteracoes);

            lista.appendChild(card);
        });

        container.replaceChildren(lista);

    } catch (erro) {
        console.error("Erro no histórico:", erro);

        container.textContent =
            "Não foi possível carregar o histórico.";
    }
}

// -----------------------------------------------------
// 4. MENSAGENS
// -----------------------------------------------------

function mostrarMensagemInspecao(mensagem) {
    const elemento = document.getElementById(
        "mensagem-inspecao"
    );

    if (elemento) {
        elemento.textContent = mensagem;
    } else {
        alert(mensagem);
    }
}

// -----------------------------------------------------
// 5. FUNÇÕES GLOBAIS
// -----------------------------------------------------

window.registrarInspecao = registrarInspecao;
window.carregarHistoricoInspecao =
    carregarHistoricoInspecao;
