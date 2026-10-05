# Reaja

Portal educativo bilíngue e estático para consulta de recomendações de autoproteção. Esta primeira entrega usa HTML, CSS e JavaScript nativos: não requer etapa de build, reduz dependências e facilita a publicação em hospedagem estática.

## O que o site oferece

O Reaja ajuda a pessoa a encontrar rapidamente a fonte oficial para cada um dos 13 temas cobertos pelo portal. A interface foi pensada para leitura rápida, inclusive no celular, com busca, filtros por categoria, páginas individuais e links diretos aos PDFs da Sedec/MIDR.

- Mantém contatos de emergência do Brasil sempre à mão, com links para ligar pelo celular, e informa o SMS 40199 para alertas.
- Permite escolher português ou inglês e alternar entre tema claro e escuro.
- Pode guardar as páginas do site para consulta offline depois da primeira visita com internet; os PDFs oficiais continuam hospedados no gov.br e podem exigir conexão.
- Oferece impressão ou salvamento da página em PDF e compartilhamento do link.
- Não usa cookies de rastreamento nem analytics e não carrega imagens pesadas ou bibliotecas externas.

O principal benefício é reduzir o caminho entre identificar um tema e abrir a orientação oficial correspondente. O site não substitui alertas, instruções ou atendimento da Defesa Civil local.

## Executar localmente

Sirva a pasta `reaja` por um servidor HTTP local (service workers não funcionam em `file://`). Por exemplo, com Python instalado, execute `python -m http.server 8000` dentro da pasta e abra `http://localhost:8000/pt/`.

## Publicar

Publique o conteúdo desta pasta em Vercel, Netlify ou Cloudflare Pages como site estático. Configure `/pt` como entrada padrão se a plataforma exigir um diretório raiz. Os arquivos `robots.txt` e `sitemap.xml` incluem `https://reaja.example`, que deve ser substituído pelo domínio real antes da publicação. HTTPS é necessário para o service worker em produção.

## Conteúdo e licença

As páginas identificam a fonte e levam aos PDFs oficiais da Secretaria Nacional de Proteção e Defesa Civil (Sedec/MIDR); não reproduzem nem resumem as recomendações. Os PDFs indicados pelo MIDR são licenciados sob CC BY-ND 3.0. A licença permite compartilhamento com atribuição, mas não derivações. **Solicite autorização formal ao MIDR antes de adaptar, resumir, reformatar editorialmente ou traduzir as recomendações oficiais.** Por esse motivo, a interface inglesa apresenta marcadores `[VERIFY]` e direciona ao material original, sem publicar tradução de instruções de segurança.

## Estrutura

- `pt/`, `en/`: rotas de idioma e metadados hreflang.
- `data/`: catálogo dos 13 temas e traduções da interface.
- `assets/`: estilos, scripts e ícones SVG.
- `sw.js`, `manifest.webmanifest`: suporte instalável e consulta offline após a primeira visita online.

Para adicionar um desastre, acrescente os campos PT/EN ao catálogo em `data/disasters.js`, atribua um slug e link oficial, e mantenha o ícone no mesmo grid 24×24 com traço de 1.8. Para adicionar outro idioma, crie seu diretório de rota e traduções de interface em `data/i18n.js`; não traduza conteúdo Sedec sem autorização.

## QA

- [x] 13 páginas temáticas vinculadas por slug, com nome PT/EN, categoria, cor, ícone SVG próprio e link ao PDF oficial.
- [x] Interface PT-BR/EN, seletor persistente, detecção inicial do navegador e hreflang.
- [x] Tema claro/escuro com preferência do sistema, persistência e prevenção de flash.
- [x] Busca local nos nomes, filtros por categoria, contatos `tel:`, SMS 40199.
- [x] Botões de impressão e compartilhamento, links para PDFs oficiais, avisos editoriais.
- [x] Manifesto e service worker para cache de páginas e recursos do site após primeira conexão; PDFs externos não são armazenados.
- [x] Skip link, landmarks semânticos, foco visível, movimento reduzido, alvos de toque amplos.
- [x] Estilo de impressão e sem cookies/analytics.
- [ ] Executar QA visual em dispositivos e leitores de tela, auditoria axe e medição Lighthouse em hospedagem HTTPS.
- [ ] Confirmar autorização MIDR antes de publicar qualquer conteúdo traduzido/adaptado e substituir domínio de exemplo.

Não foi possível afirmar conformidade WCAG 2.2 AA, pontuação Lighthouse ≥95 ou validação com leitor de tela sem auditoria em navegador e ferramentas dedicadas. O desempenho real do offline depende de o usuário ter aberto as páginas enquanto online.
