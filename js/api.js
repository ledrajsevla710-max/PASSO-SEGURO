// js/api.js
// Camada de Serviços para Consulta de Dados no Supabase (Passo Seguro SESAPI/HGV)

const ApiService = {
    // Busca o histórico de inspeções diárias do paciente logado
    async obterHistoricoInspecoes(pacienteId) {
        try {
            if (typeof window.supabase === 'undefined') throw new Error("Supabase não inicializado.");

            const { data, error } = await window.supabase
                .from('inspecoes_diarias')
                .select('*')
                .eq('user_id', pacienteId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Erro ao carregar histórico de inspeções:", error.message);
            return [];
        }
    },

    // Busca os dados clínicos, Cartão SUS e situação de remissão do paciente
    async obterPerfilPaciente(pacienteId) {
        try {
            if (typeof window.supabase === 'undefined') throw new Error("Supabase não inicializado.");

            const { data, error } = await window.supabase
                .from('perfis_usuarios')
                .select('*')
                .eq('id', pacienteId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (error) {
            console.error("Erro ao carregar perfil do paciente:", error.message);
            return null;
        }
    }
};
