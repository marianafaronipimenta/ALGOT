# ALGOLAB

**Algoritmi 1 — C Programming & Data Structures**

Uma plataforma interativa de estudo para o curso Algoritmi 1 (UPO, DISIT Vercelli). O exame prático dá a infraestrutura do projeto e pede que o aluno implemente funções específicas. Por isso o ALGOLAB foca em **ler código C desconhecido e implementar a função que falta**, não em criar projetos do zero.

Todo o conteúdo didático está em português do Brasil, com a terminologia italiana dos slides quando ajuda.

## Como rodar

Requisitos: Node.js 18+ (testado com Node 22).

```bash
npm install
npm run dev        # servidor de desenvolvimento (http://localhost:5173)
npm run build      # typecheck + build de produção em dist/
npm run preview    # serve o build de produção
npm run typecheck  # só o TypeScript
npm test           # testes (vitest): motor + integridade do conteúdo
```

O build gera um site estático (`dist/`) que funciona em qualquer servidor de arquivos (usa rotas com `#`).

## O que existe na fase 1

| Área | Estado |
|---|---|
| Painel (dashboard) | Funcional: identidade, progresso real, trilha dos 6 módulos, "Continuar aprendendo", referência rápida |
| 01 · C Programming Lab | Funcional: 8 lições com exemplo comentado linha a linha, diagramas, quiz e conclusão |
| Code Translator | Funcional: 5 exemplos com três áreas sincronizadas (UPO / genérico / explicação) |
| Function Implementation Trainer | Funcional: 3 exercícios com editor, testes, dicas progressivas, explicação de erros, solução após tentativa, modo exame |
| 06 · Progress | Funcional: lições, exercícios, nível atual (salvo no `localStorage`) |
| 02 Data Structures, 03 Algorithms, 04 Complexity Lab, 05 Exam Lab | **Em breve**: páginas honestas listando o conteúdo planejado, sem funcionalidade falsa |

## Onde fica o conteúdo

Todo o conteúdo didático é separado da interface, em `src/content/`:

```
src/content/
  types.ts               tipos de Lesson, Exercise, TranslatorExample, Diagram
  lessons/part1.ts       lições 1–4 (funções, struct/typedef, ponteiros, ponteiro p/ struct e T**)
  lessons/part2.ts       lições 5–8 (void*, malloc/free, ADT e handles opacos, convenções UPO)
  translator/index.ts    exemplos do Code Translator
  exercises/index.ts     exercícios do Trainer (header, esqueleto, testes, dicas, solução)
  exercises/helpers.ts   montagem de listas e pilhas de teste dentro do simulador
  errorCatalog.ts        explicações acessíveis de cada tipo de erro
  modules.ts             os 6 módulos e o conteúdo planejado dos futuros
  quickref.ts            cartões de referência rápida do painel
```

Para **adicionar uma lição**, crie um objeto `Lesson` e inclua-o em `lessons/index.ts`. Para **um exercício**, crie um `Exercise` com o `header` em C (o mesmo texto é mostrado ao aluno e lido pelo simulador), o `starterCode`, os `tests` e a `solution`. Os testes em `tests/` verificam automaticamente que a solução de referência passa, que o esqueleto não passa, e que as notas de linha apontam para linhas existentes.

## Simulador de C: o que é e o que não é

O navegador não tem um compilador C, então os testes rodam no **simulador do ALGOLAB** (`src/engine/`): um lexer, parser e interpretador, em TypeScript, para um **subconjunto de C**. A interface sempre o rotula como "simulado".

**Suporta:** `typedef`, `struct`, ponteiros (inclusive `T**` e ponteiros para função), `->`, `.`, `*`, `&`, casts, `sizeof(T)`, `if/else`, `while`, `do/while`, `for`, `break/continue`, recursão (funções `_impl`), `malloc/calloc/free`, `printf`.

**Detecta e explica:** acesso via NULL, ponteiro não inicializado (wild), variável lida sem valor, uso depois do free, double free, desreferência de `void*`, `.` em ponteiro e `->` em struct, campo inexistente, ponteiros de tipos incompatíveis (ex.: `upo_list_t` × `upo_list_node_t*`), retornar ponteiro em função `int`, `return` faltando, laço infinito, recursão sem fim, assinatura alterada, `=` em condição, e a estrutura de dados modificada por uma função que só deveria consultar.

**Não é:** um compilador real. Não há endereços numéricos, aritmética de ponteiros, arrays, `switch`, nem comportamento indefinido "silencioso". Passar nos testes do simulador **não** garante que o código compila com `gcc -Wall -Wextra -std=c11 -pedantic`, nem que o valgrind não reclama.

**Pronto para um backend real.** A UI conversa com a interface `ExecutionBackend` (`src/engine/runner.ts`). Hoje só existe `SimulatedBackend`. Um backend com gcc + valgrind num servidor, ou clang em WebAssembly, pode implementar a mesma interface sem mudar os componentes.

## Fontes e honestidade do conteúdo

- As explicações seguem os slides do laboratório (Anna Sapienza): *Puntatori in C*, *Puntatori in C – concetti avanzati*, *Abstract Data Types*, *Stack ADT*, *Alberi Binari di Ricerca*. Cada lição indica o material relacionado.
- Os **exemplos e exercícios são ilustrativos**, escritos para o ALGOLAB no estilo de nomes do curso (`upo_`, `_s`, `_t`, `_impl`). **Não são código original do toolkit nem questões de exame do professor.** O ADT "lista simples" (`upo_list_*`) foi criado aqui; o header da pilha segue a estrutura mostrada nos slides do Stack ADT.
- Assinaturas de BST no Code Translator e na lição 8 são ilustrativas: confira sempre o header real do toolkit.

## Estrutura do código

```
src/
  engine/       lexer, parser, interpretador, compile/run (sem dependências de UI)
  content/      todo o conteúdo didático (ver acima)
  components/   CodeBlock, CodeEditor, Diagram, Quiz, ErrorCard, Layout, highlight
  pages/        Dashboard, CLabHome, LessonPage, TranslatorPage, TrainerHome, ExercisePage, ProgressPage, UpcomingModule
  state/        progresso (localStorage) e roteador por hash
  styles/       app.css (tokens de design, tema "blueprint")
tests/          testes do motor e de integridade do conteúdo
```

Dependências de runtime: só `react` e `react-dom`. O realce de sintaxe, o editor, os diagramas e o roteador são próprios.

## Próximas fases

- **Data Structures:** Stack ADT completo, BST (get/put/insert/delete, min/max, floor/ceiling, keys_range, is_bst), hash table, usando o mesmo Trainer.
- **Algorithms:** visualizadores de ordenação, postfix com pilha, percursos de árvore.
- **Complexity Lab:** análise assintótica do código escrito.
- **Exam Lab:** simulações cronometradas no formato do exame.
- **Motor:** arrays e aritmética de ponteiros no simulador; opcionalmente um backend com gcc/valgrind reais; detecção de memory leaks no fim de cada teste.
