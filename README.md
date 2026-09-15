# 🔮 ARCANA RPG Suite

> **A plataforma definitiva de RPG de mesa 100% customizável, offline-first e leve, unindo VTT tático, fichas dinâmicas universais, compêndio/vault de conhecimento estilo Obsidian e gestão completa de campanhas.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38b2ac?style=flat-square&logo=tailwind-css)
![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB_Offline--First-orange?style=flat-square)
![Tests](https://img.shields.io/badge/Vitest-32_passed-brightgreen?style=flat-square)

---

## 📖 Visão Geral

O **ARCANA** foi construído do zero para libertar mestres e jogadores das amarras de plataformas proprietárias pesadas ou dependentes de conexão constante à internet. 

Inspirado nas melhores qualidades de ferramentas como Roll20, Foundry VTT, Notion e Obsidian, o ARCANA opera **100% no navegador de forma offline-first** usando IndexedDB via Dexie.js, com código modular, tipagem estrita e renderização gráfica em HTML5 Canvas e SVG nativos (sem bibliotecas externas inchadas).

---

## 🏛️ Os 4 Pilares do ARCANA

### 1. ⚔️ Pilar Mesa (VTT Avançado)
- **Motor Multi-camadas em HTML5 Canvas Nativo:**
  - Suporte a **Grid Quadrado** e **Grid Hexagonal (Pointy-topped)** de alta performance.
  - Alinhamento inteligente (Snap to Grid) e zoom/pan suaves.
  - Suporte a mapas ilimitados e imagens de fundo salvas localmente no IndexedDB.
- **Régua de Medição em Tempo Real:** cálculo simultâneo de distância euclidiana em células e metros/pés ao arrastar o mouse.
- **Névoa de Guerra (Fog of War):** camada de ocultação com revelação dinâmica em tempo real (`destination-out`) e botão de restauração rápida.
- **Marcadores de Texto e Notas no Mapa:** inserção de avisos estilizados diretamente sobre o tabuleiro.
- **Tokens Táticos:**
  - Escala configurável de 0.5x até 4x (Miúdo, Médio, Grande, Enorme, Imenso).
  - Anéis de identificação de time e aliança (Aliado / Inimigo / Neutro).
  - Trava e destrava de posição contra movimentações acidentais.
  - Barras de pontos de vida e badges de condições em tempo real.
- **Combat & Initiative Tracker:**
  - Contador de rounds e ciclo contínuo de turnos.
  - Rolagem em lote de iniciativa por modificador.
  - Aplicação rápida de dano/cura com limites automáticos de PV.
  - Painel de condições (Atordoado, Caído, Cego, Envenenado, etc.).
- **Escudo do Mestre (GM Reference Panel):**
  - Tabela canônica de Classes de Dificuldade (CDs) de 5 a 30.
  - Glossário rápido das condições do sistema ativo.
  - Bloco de rascunho temporário com salvamento automático.
  - Gerador de áudio ambiente procedural via Web Audio API (Ruídos de Masmorra, Floresta, Chuva e Taverna sem arquivos pesados).
- **Cronômetro de Sessão:** relógio flutuante de controle do tempo da mesa (play, pause e reset).

---

### 2. 📜 Pilar Personagens & Editor Visual de Sistemas
- **Fichas Dinâmicas Universais:**
  - Estruturadas dinamicamente com base em um esquema `SystemDefinition`.
  - Atributos configuráveis, modificadores automáticos, inventário com cálculo de peso e carga, e habilidades/magias.
- **7 Presets Oficiais Embutidos:**
  1. **D&D 5e (SRD):** Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma; cálculo de mod `floor((atr-10)/2)`; espaços de magia e PVs.
  2. **Ordem Paranormal:** Agilidade, Força, Intelecto, Presença, Vigor; PV, PE, Sanidade, NEX%; dano elemental (Sangue, Morte, Energia, Conhecimento, Medo).
  3. **Tormenta20:** 6 atributos base; PV, PM (Pontos de Mana); perícias treinadas.
  4. **Vampiro: A Máscara 5e:** Atributos Físicos, Sociais e Mentais; Vitalidade, Força de Vontade, Fome (0-5); pools de d10 com sucessos `>= 6` e críticos.
  5. **Call of Cthulhu 7e:** Sistema percentual d100; Sanidade, Sorte, Pontos de Magia; sucessos normais, bons (1/2) e extremos (1/5).
  6. **Fate Core / Acelerado:** Abordagens e perícias (-2 a +8); dados Fudge/Fate (`4dF`).
  7. **Sistema Genérico / Custom:** Totalmente aberto para homebrew.
- **Motor de Dados & Expressões Matemáticas:**
  - Parser manual por descida recursiva (Recursive Descent) sem uso de `eval()`.
  - Suporte a fórmulas complexas: `1d20+5`, `4d6k3` (keep highest), `2d20kl1` (keep lowest), `6d10cs>=8` (sucessos), `4dF+2` (dados Fate), `1d100`.
  - Execução segura de hooks e fórmulas não-lineares em JavaScript puro.
- **Bestiário & Stat Block Parser:**
  - Criação rápida de monstros e NPCs via texto simples (estilo stat block).
  - Injeção instantânea de criaturas na cena do VTT e na ordem de iniciativa.
- **Editor Visual de Regras de RPG:**
  - Interface visual para criar ou duplicar qualquer sistema oficial sem digitar código.
  - Exportação e importação completa em formato `.json` com validação de integridade via schemas **Zod**.

---

### 3. 🧠 Pilar Vault de Conhecimento & Grafo Interativo
- **Editor e Renderizador Nativo de Markdown:**
  - Suporte a títulos (`#`, `##`), listas ordenadas e com marcadores, checklists (`- [ ]`), citações (`>`), tabelas e blocos de código.
  - Barra de ferramentas rápida de formatação.
- **Wikilinks Bidirecionais (`[[Nome da Nota]]` ou `[[Nome|Alias]]`):**
  - Resolução automática e hiperlinks clicáveis para navegação fluida.
  - Detecção de notas fantasmas: clicar em um wikilink de nota inexistente permite criá-la imediatamente.
- **Painel de Backlinks:** visualização instantânea de todas as notas que citam o documento aberto.
- **Detector de Menções Não-Linkadas (Unlinked Mentions):**
  - Escaneia todo o compêndio buscando o título da nota em textos comuns.
  - Botão de 1 clique **`+ Linkar`** para converter a citação em wikilink (estilo Obsidian / Roam Research).
- **Modelos de Worldbuilding Pré-definidos:**
  - Inserção de templates estruturados: Personagem (PNJ), Localidade/Masmorra, Facção, Item Mágico e Anotações de Sessão.
- **Grafo de Conhecimento SVG Nativo:**
  - Simulação física de forças em tempo real (repulsão Coulomb, molas Hooke e atração gravitacional central).
  - Raio dos nós proporcional ao grau de conexões (degree centrality).
  - Filtros rápidos por categoria e busca com destaque em tempo real.
  - Abertura de notas por duplo-clique no nó ou através da tooltip de informações.
- **Compatibilidade com Obsidian:**
  - Exportação de qualquer nota individual como `.md` com **YAML Frontmatter** padronizado.
  - Importação de arquivos Markdown preservando metadados e tags.

---

### 4. 🗺️ Pilar Campanhas, Sessões, Quests & Linha do Tempo
- **Atas e Registro de Sessões:**
  - Histórico cronológico de sessões com número, data, participantes presentes, resumo das decisões tomadas e XP concedido.
  - Badges de itens e saques (loot) encontrados pela equipe.
- **Diário de Missões (Quests Tracker):**
  - Gerenciamento de status: Ativa, Concluída ou Falhada.
  - Registro de doador (NPC), recompensas prometidas e sub-objetivos com checklists interativas.
- **Linha do Tempo Cronológica:**
  - Linha do tempo visual com datas do mundo de jogo (*in-game*).
  - Categorização de acontecimentos: Marcos Épicos, Batalhas, Descobertas Arcanas, Lore e Tragédias.
- **Relatório Automatizado da Campanha:**
  - Compilação instantânea em Markdown contendo resumo geral, estatísticas do grupo, diário de missões, histórico de sessões e cronologia.
  - Botões para cópia direta para a área de transferência e download em `.md`.

---

## 🛠️ Tecnologias & Arquitetura

| Tecnologia | Uso no Projeto |
| :--- | :--- |
| **React 18** | Renderização declarativa e componentização reativa |
| **TypeScript (Strict)** | Tipagem 100% estrita, sem uso de `any` |
| **Vite 5** | Bundler ultra-rápido com HMR instantâneo |
| **Tailwind CSS** | Estilização por Design Tokens via CSS Variables |
| **Dexie.js** | Persistência local robusta via IndexedDB |
| **Zustand** | Gerenciamento de estado descentralizado por pilares com AppStore central |
| **Zod** | Validação estrita de contratos de dados em tempo de execução |
| **HTML5 Canvas & SVG** | Renderização tática do VTT e Grafo de Conhecimento com consumo mínimo de memória |
| **Vitest** | Suíte de 32 testes unitários de alta velocidade |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** (versão 9 ou superior)

### 1. Clonar o Repositório
```bash
git clone https://github.com/CariocaOtakuKK/ArcaneRPG.git
cd ArcaneRPG
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em `http://localhost:5173`.

### 4. Executar os Testes Unitários
```bash
npm test
```
Executa a suíte completa de 32 testes do motor de dados, combate, parsing e compêndio.

### 5. Compilar para Produção
```bash
npm run build
```
Gera os arquivos otimizados e minificados no diretório `dist/`.

---

## 📂 Estrutura de Pastas

```
ArcaneRPG/
├── BIBLIA.md                    # Especificação canônica e registro das fases
├── README.md                    # Documentação oficial do projeto
├── index.html                   # Entry point HTML
├── package.json                 # Metadados e dependências
├── tsconfig.json                # Configuração do compilador TypeScript
├── vite.config.ts               # Configuração do Vite
└── src/
    ├── App.tsx                  # Componente raiz da aplicação
    ├── index.css                # Design tokens e CSS Variables
    ├── main.tsx                 # Bootstrapping React
    ├── types/                   # Contratos de tipos TypeScript unificados
    │   └── index.ts
    ├── components/              # Componentes de UI reutilizáveis e layout
    │   ├── layout/              # Header, navegação de pilares (PillarShell)
    │   └── ui/                  # Button, Card, Badge, Input, Toast
    ├── core/                    # Núcleo da arquitetura
    │   ├── db/                  # Configuração do Dexie.js e dados iniciais
    │   ├── dice/                # Motor de rolagem por descida recursiva
    │   ├── engine/              # Validação Zod e executor de fórmulas
    │   └── store/               # Zustand AppStore central
    ├── systems/                 # Presets de regras oficiais
    │   ├── presets/             # D&D 5e, Ordem, T20, Vampiro V5, CoC 7e, Fate
    │   └── registry.ts          # Registro de sistemas embutidos
    └── modules/                 # Módulos funcionais dos pilares
        ├── characters/          # Fichas dinâmicas, Bestiário e Parser de Stat Blocks
        ├── vtt/                 # VTT Canvas (grid, fog, tokens, ruler, combate, escudo do mestre)
        ├── vault/               # Compêndio Markdown, wikilinks, backlinks e Grafo SVG
        ├── campaigns/           # Gestão de campanhas, sessões, quests, timeline e relatórios
        └── system/              # Editor visual de regras de RPG
```

---

## 📄 Licença

Distribuído sob licença ISC. Desenvolvido para a comunidade de RPG de mesa mundial.
