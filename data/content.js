/*
 * Conteúdo das orientações oficiais (Sedec/MIDR) exibido direto nas páginas.
 *
 * ESTE ARQUIVO É GERADO por `python3 tools/extract_pdfs.py` a partir dos PDFs oficiais.
 * Enquanto uma entrada não existir, a página do desastre mostra o aviso + botão do PDF.
 *
 * Schema por slug (apenas pt; o texto é reproduzido do original, sem edição):
 *   '<slug>': { pt: {
 *       before:  ['item', ...],     // Antes
 *       during:  ['item', ...],     // Durante
 *       after:   ['item', ...],     // Depois
 *       general: ['item', ...],     // Recomendações gerais (opcional)
 *       avoid:   ['item', ...],     // "Não faça" (opcional)
 *       extra:   [{ title:'', items:[''] }]   // outras seções do PDF (opcional)
 *   } }
 */
window.REAJA_CONTENT = {};
