# 📕 BÍBLIA DO PROJETO — ARCANA (RPG Suite)

Fonte única de verdade. Este documento registra TODAS as decisões, requisitos, modelo de dados, roadmap e log de progresso do projeto. Consultar e ATUALIZAR este arquivo a cada etapa. Se algo aqui mudar, o código muda junto — e vice-versa.

Nome de trabalho: ARCANA — Plataforma de RPG 100% personalizável  
Workspace: /home/user/ArcaneRPG  
Criado em: 2026-09-15  
Status: 🟡 Em construção (Fase 1 — Motor de Dados & Presets)  
Idioma do produto: PT-BR primário (i18n com EN secundário)

---

## 📑 Índice
1. Visão geral
2. Decisões confirmadas pelo usuário
3. Inspirações e o que roubar de cada uma
4. Os 4 pilares — especificação funcional
5. Motor de dados — gramática
6. Presets de sistemas de RPG
7. Modelo de dados (IndexedDB/Dexie + Supabase)
8. Arquitetura e árvore de arquivos
9. Temas e personalização visual
10. Atalhos e paleta de comandos
11. Deploy: GitHub + Vercel + Supabase
12. Roadmap com checklist
13. Convenções de código
14. Entregáveis finais
15. Riscos e limitações conhecidas
16. Log de progresso

---

## 1. Visão geral
Um site/app de RPG completo, offline-first, que unifica:
- **Mesa (VTT):** mapa, tokens, dados, iniciativa, combate (estilo Roll20/Foundry/RPGKraken).
- **Personagens e NPCs:** fichas dinâmicas renderizadas a partir de SystemDefinitions (estilo D&D Beyond).
- **Vault:** anotações em Markdown com backlinks `[[wikilinks]]`, tags `#tag`, grafo interativo e busca instantânea (estilo Obsidian).
- **Campanhas e Sessões:** worldbuilding, lore, timeline, missões, sessões e rastreadores (estilo World Anvil/Campfire/Sheets).

### Promessas de produto:
1. Funciona 100% offline — abrir `dist/index.html` sem internet não pode falhar.
2. Zero perda de dados — export JSON + Markdown sempre disponível; auto-save contínuo.
3. Customizável em tudo — todo campo, atributo, recurso, tema e fórmula é editável.
4. Rápido — primeiro paint < 2s, busca no vault < 100ms.
5. Sem lock-in — export aberto em Markdown e JSON.

---

## 2. Decisões confirmadas pelo usuário
- **Stack Front-end:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Dexie.js (IndexedDB).
- **Sistemas de RPG:** Pacote completo (D&D 5e, Ordem Paranormal, Tormenta20, Vampiro: A Máscara 5e, Call of Cthulhu 7e, Fate, Sistema Próprio / Genérico).
- **Prioridades:** Os 4 pilares completos.
- **Salvamento/Sync:** Offline-first nativo + Supabase lazy-loaded opcional (sem chaves = modo 100% local).
- **Direção visual:** Temas trocáveis via CSS variables (Arcana Dark, Pergaminho, Paranormal, Starlight, Cyberpunk).
- **Hardware constraints:** 2GB RAM e 2 cores. Grafo e mapa em Canvas/SVG nativo (sem React Flow ou dnd-kit pesados).

---

## 3. Os 4 Pilares
- **Pilar 1 — MESA:** Rolador de dados com expressões livres (`3d6+2`, `1d20+5kh1`, `4d6k3`, `6d10cs>=8`, `1d100`, `4dF+2`), macros, histórico de rolagens, tracker de iniciativa, turnos, condições, mapa Canvas com grid quadrado/hexagonal, tokens arrastáveis com snap, régua de distância e desenho livre.
- **Pilar 2 — PERSONAGENS & NPCs:** Fichas dinâmicas a partir de SystemDefinition (atributos, modificadores automáticos, perícias, barras de recursos, slots de magia, inventário com peso/carga, bio), biblioteca de NPCs/Bestiário, stat blocks e adição rápida ao combate.
- **Pilar 3 — VAULT:** Anotações em Markdown, `[[wikilinks]]`, backlinks, menções não-linkadas, grafo de conhecimento SVG com forças, tags com busca full-text, templates e export compatível com Obsidian.
- **Pilar 4 — CAMPANHAS & SESSÕES:** Registro de sessões, data, resumo, XP, participantes, timeline cronológica, missões/quests e relatório automatizado.

---

## 4. Motor de dados & Gramática
Gramática formal:
```
expression := term (('+' | '-') term)*
term       := factor (('*' | '/' | '%') factor)*
factor     := '-' factor | '(' expression ')' | roll | number | variable
roll       := [count] 'd' sides [modifiers]
count      := number | expression
sides      := number | 'F' (Fate) | '%' (=100)
modifiers  := keepMod | dropMod | explodeMod | critMod | rerollMod | sortMod
keepMod    := ('kh' | 'kl') number
dropMod    := ('dh' | 'dl') number
explodeMod := '!' [comparison]
critMod    := ('cs' | 'cf') comparison
rerollMod  := ('ro' | 'rr') comparison
sortMod    := 's'
comparison := ('>=' | '<=' | '>' | '<' | '=') number
variable   := '$' identifier
```

---

## 5. Presets de Sistemas Oficiais
1. **D&D 5e (SRD):** FOR, DES, CON, INT, SAB, CAR (3-20); PV, DV, slots de magia; `1d20 + mod + prof`; Vantagem/Desvantagem; `floor((atr-10)/2)`.
2. **Ordem Paranormal:** AGI, FOR, INT, PRE, VIG (1-5 base); PV, PE (Esforço), SAN (Sanidade), NEX%; `1d20 + atr vs CD`; dano por elemento (Sangue/Morte/Energia/Conhecimento/Medo).
3. **Tormenta20:** FOR, DES, CON, INT, SAB, CAR; PV, PM (Mana); `1d20 + atr + perícias`.
4. **Vampiro: A Máscara 5e:** Atributos Físicos/Sociais/Mentais (1-5); Força de Vontade, Saúde, Fome (0-5); pool de d10, sucessos em `>=6` ou `>=8`, críticos em 10.
5. **Call of Cthulhu 7e:** FOR, CON, TAM, DES, APA, INT, POD, EDU, SOR (percentuais); PV, SAN, Sorte, Magia; `1d100 <= perícia`, sucesso extremo `<= 1/5`.
6. **Fate Core / Acelerado:** Abordagens/Perícias (−2 a +8); Pontos de Fate, Consequências; `4dF + abordagem`.
7. **Sistema Genérico / Custom:** Totalmente aberto e configurável no editor visual.

---

## 6. Modelo de dados Dexie (IndexedDB)
Tabelas:
- `campaigns`: `id, name, systemId, updatedAt`
- `characters`: `id, campaignId, name, systemId, type(pc/npc)`
- `notes`: `id, campaignId, title, folder, *tags, updatedAt`
- `maps`: `id, campaignId, name`
- `encounters`: `id, campaignId, name`
- `sessions`: `id, campaignId, date`
- `rolls`: `id, campaignId, createdAt`
- `items`: `id, campaignId, name, *tags`
- `macros`: `id, systemId`
- `systems`: `id, builtin, name`
- `settings`: `key`
- `assets`: `id, campaignId, kind`
