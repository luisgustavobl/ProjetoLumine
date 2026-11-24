// Chaves para ligar/desligar recursos inteiros do projeto.

/**
 * Agendamento online (pedidos gravados no banco).
 *
 * false (atual): o formulário do site só monta a mensagem e abre o WhatsApp da profissional.
 *   Nada é gravado; Agenda e Bloqueios somem do painel; /api/pedidos e /api/horarios respondem 404.
 * true: a cliente envia um pedido (com código), a equipe confirma/recusa na Agenda do painel,
 *   os horários ocupados/bloqueados somem do site. Todo o código continua no projeto:
 *   components/AgendamentoOnline.tsx, app/api/pedidos, app/api/horarios,
 *   app/painel/(logado)/agenda e bloqueios, tabelas pedidos/bloqueios no banco.
 *
 * Desligado porque as profissionais já usam o MinhaAgenda (maapp): duas agendas gerariam conflito.
 */
export const AGENDAMENTO_ONLINE = false;
