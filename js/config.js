// =====================================================
// PASSO SEGURO
// Arquivo: js/config.js
// Configuração central e credenciais do Supabase
// =====================================================

(function () {
    // 1. CREDENCIAIS DO SUPABASE
    const SUPABASE_URL = "https://mzswyxklinbgkfqiatnc.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_fBH2HbtJY3NajxGpR5985A_hAmdDGwd";

    // 2. INICIALIZAÇÃO DO CLIENTE
    let supabaseClient = null;

    if (typeof supabase !== "undefined" && typeof supabase.createClient === "function") {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Passo Seguro: Supabase inicializado com sucesso.");
        } catch (error) {
            console.error("Passo Seguro: Erro ao criar o cliente Supabase:", error);
        }
    } else {
        console.error(
            "Passo Seguro: Biblioteca do Supabase não encontrada. Verifique se o script do CDN foi carregado antes do config.js."
        );
    }

    // 3. NOMES DAS TABELAS (padronização)
    const TABELAS = {
        PERFIS: "perfis_usuarios",
        INSPECOES: "inspecoes",
        ALTERACOES: "alteracoes",
        FOTOS: "fotos_inspecao",
        LEMBRETES: "lembretes",
        PROFISSIONAIS: "profissionais"
    };

    // 4. CONSTANTES DO APLICATIVO
    const APP = {
        NOME: "Passo Seguro",
        VERSAO: "1.0.0",
        AVISO_LIMITES: "O Passo Seguro é uma ferramenta de apoio ao autocuidado. Não substitui avaliação, diagnóstico ou acompanhamento realizado por profissionais de saúde."
    };

    // 5. LOCAIS DO PÉ
    const LOCAIS_PE = [
        { id: "planta_direita", label: "Planta do pé direito" },
        { id: "planta_esquerda", label: "Planta do pé esquerdo" },
        { id: "calcanhar_direito", label: "Calcanhar direito" },
        { id: "calcanhar_esquerdo", label: "Calcanhar esquerdo" },
        { id: "dedos_direito", label: "Dedos do pé direito" },
        { id: "dedos_esquerdo", label: "Dedos do pé esquerdo" },
        { id: "dorso_direito", label: "Dorso do pé direito" },
        { id: "dorso_esquerdo", label: "Dorso do pé esquerdo" },
        { id: "entre_dedos_direito", label: "Entre os dedos (pé direito)" },
        { id: "entre_dedos_esquerdo", label: "Entre os dedos (pé esquerdo)" },
        { id: "outro", label: "Outro local" }
    ];

    // 6. TIPOS DE ALTERAÇÃO
    const TIPOS_ALTERACAO = [
        { id: "vermelhidao", label: "Vermelhidão" },
        { id: "inchaco", label: "Inchaço" },
        { id: "calor", label: "Calor local" },
        { id: "bolha", label: "Bolha" },
        { id: "calo", label: "Calo ou endurecimento" },
        { id: "ferimento", label: "Ferimento / abertura na pele" },
        { id: "secrecao", label: "Secreção" },
        { id: "dor", label: "Dor ou sensibilidade alterada" },
        { id: "outro", label: "Outra alteração" }
    ];

    // 7. Exposição segura no escopo global
    window.PASSO_SEGURO = {
        supabaseClient,
        TABELAS,
        APP,
        LOCAIS_PE,
        TIPOS_ALTERACAO
    };

    // Atalho global (mantido por compatibilidade)
    window.supabaseClient = supabaseClient;
})();
