/**
 * Exercícios introdutórios do Function Implementation Trainer.
 *
 * IMPORTANTE: são exercícios ILUSTRATIVOS escritos para o ALGOLAB. Não são
 * questões de exame do professor. O header do Stack segue a estrutura
 * apresentada nos slides "Stack ADT" (ALGO_05_stack); a "lista simples"
 * (upo_list_*) é um ADT didático criado aqui, no mesmo estilo de nomes.
 */
import type { Exercise } from '../types';
import { buildList, buildStack, describeNodePtr, expectNumber, withUnchanged } from './helpers';

// ---------------------------------------------------------------------------
const STACK_HEADER = `/* ===== include/upo/stack.h  (header PÚBLICO) ===== */
#include <stddef.h>

typedef struct upo_stack_s* upo_stack_t;   /* handle opaco */

int    upo_stack_is_empty(const upo_stack_t stack);
size_t upo_stack_size(const upo_stack_t stack);

/* ===== src/stack_private.h  (header PRIVADO) ===== */
struct upo_stack_node_s {
    void *data;                       /* dado genérico do usuário */
    struct upo_stack_node_s *next;    /* nó de baixo             */
};
typedef struct upo_stack_node_s upo_stack_node_t;

struct upo_stack_s {
    upo_stack_node_t *top;   /* topo da pilha (NULL se vazia) */
    size_t size;             /* número de elementos           */
};
`;

const LIST_HEADER = `/* ADT didático "lista simples" (ilustrativo, criado para o ALGOLAB) */

/* ===== include/upo/list.h  (header PÚBLICO) ===== */
#include <stddef.h>

typedef struct upo_list_s* upo_list_t;            /* handle opaco      */
typedef struct upo_list_node_s upo_list_node_t;   /* tipo do NÓ        */

size_t           upo_list_count(const upo_list_t list);
upo_list_node_t* upo_list_find(const upo_list_t list, int value);

/* ===== src/list_private.h  (header PRIVADO) ===== */

struct upo_list_node_s {
    int value;                  /* valor guardado no nó      */
    upo_list_node_t *next;      /* próximo nó, ou NULL       */
};

struct upo_list_s {
    upo_list_node_t *head;      /* primeiro nó, ou NULL      */
};
`;

const listDiagram = (values: number[]) => ({
  kind: 'boxes' as const,
  title: 'Como a lista fica na memória',
  caption: '`list` é só um ponteiro (handle). A struct upo_list_s guarda `head`, que aponta para o primeiro nó. O último nó tem next = NULL.',
  boxes: [
    { id: 'h', label: 'list', type: 'upo_list_t', fields: [{ name: '', to: 'c' }], col: 0, variant: 'handle' as const },
    { id: 'c', type: 'struct upo_list_s', fields: [{ name: 'head', to: values.length ? 'n0' : 'NULL' }], col: 1, variant: 'var' as const },
    ...values.map((v, i) => ({
      id: `n${i}`,
      type: 'upo_list_node_t',
      fields: [
        { name: 'value', value: String(v) },
        { name: 'next', to: i + 1 < values.length ? `n${i + 1}` : 'NULL' },
      ],
      col: i + 2,
      variant: 'node' as const,
    })),
  ],
});

// ---------------------------------------------------------------------------
const isEmpty: Exercise = {
  id: 'stack-is-empty',
  level: 2,
  title: 'A pilha está vazia?',
  summary: 'Complete uma única linha: decidir se a pilha está vazia olhando os campos da struct.',
  concepts: ['handle opaco', '->', 'NULL', 'retornar 1/0'],
  signature: 'int upo_stack_is_empty(const upo_stack_t stack);',
  task: [
    'Implemente `upo_stack_is_empty`: ela deve retornar **1** se a pilha estiver vazia e **0** caso contrário.',
    'Uma pilha vazia tem `top == NULL` (e `size == 0`). A função só **consulta** a pilha: ela não pode alterar `top` nem `size`.',
    'Convenção deste exercício: se `stack` for `NULL`, considere a pilha vazia (essa parte já está pronta no esqueleto).',
  ],
  header: STACK_HEADER,
  requiredFunctions: ['upo_stack_is_empty'],
  starterCode: `int upo_stack_is_empty(const upo_stack_t stack)
{
    if (stack == NULL)
        return 1;   /* convenção do exercício: pilha inexistente = vazia */

    /* TODO: substitua o 0 abaixo por uma expressão que valha
     *       1 se a pilha estiver vazia e 0 caso contrário. */
    return 0;
}
`,
  diagram: {
    kind: 'boxes',
    title: 'Pilha com dois elementos',
    caption: '`stack` aponta para a struct upo_stack_s. O campo `top` aponta para o nó do topo. Em uma pilha vazia, `top` seria NULL e `size` seria 0.',
    boxes: [
      { id: 'h', label: 'stack', type: 'upo_stack_t', fields: [{ name: '', to: 's' }], col: 0, variant: 'handle' },
      { id: 's', type: 'struct upo_stack_s', fields: [{ name: 'top', to: 'n0' }, { name: 'size', value: '2' }], col: 1, variant: 'var' },
      { id: 'n0', type: 'upo_stack_node_t', fields: [{ name: 'data', to: 'd0' }, { name: 'next', to: 'n1' }], col: 2, variant: 'node' },
      { id: 'n1', type: 'upo_stack_node_t', fields: [{ name: 'data', to: 'd1' }, { name: 'next', to: 'NULL' }], col: 3, variant: 'node' },
      { id: 'd0', type: 'int', fields: [{ name: '', value: '7' }], col: 2, row: 1, variant: 'data' },
      { id: 'd1', type: 'int', fields: [{ name: '', value: '2' }], col: 3, row: 1, variant: 'data' },
    ],
  },
  trace: {
    prompt: 'Nível 1 · Leia esta tentativa de implementação (um erro comum). O que está errado?',
    code: `int upo_stack_is_empty(const upo_stack_t stack)
{
    stack->top = NULL;
    return stack;
}`,
    options: [
      'Nada: a função funciona.',
      'Ela APAGA a ligação com o topo (perde os nós) e retorna um ponteiro em vez de 1/0.',
      'Só falta um cast: return (int) stack;',
      'Deveria usar stack.top em vez de stack->top.',
    ],
    correct: 1,
    explanation:
      '`stack->top = NULL` é uma ATRIBUIÇÃO: ela desliga a pilha dos seus nós (e os nós ficam perdidos na memória: memory leak). Além disso `return stack` devolve o ponteiro, não 1 ou 0. A função deveria só comparar: `stack->top == NULL`. O `->` está certo, porque `stack` é um ponteiro.',
  },
  tests: [
    {
      id: 'empty',
      title: 'Pilha recém-criada (vazia)',
      scenario: 'top = NULL, size = 0',
      run(m) {
        const s = buildStack(m, []);
        return expectNumber(m.invoke('upo_stack_is_empty', [s.handle]), 1, (a) =>
          a !== 0 ? 'Retorne exatamente 1 para "verdadeiro" (a API documenta 1/0).' : 'Com top == NULL a pilha está vazia: o retorno deveria ser 1.',
        );
      },
    },
    {
      id: 'one',
      title: 'Pilha com 1 elemento',
      scenario: 'top → [7] → NULL, size = 1',
      run(m) {
        const s = buildStack(m, [7]);
        const before = s.snapshot();
        const out = expectNumber(m.invoke('upo_stack_is_empty', [s.handle]), 0, () => 'top aponta para um nó, então a pilha NÃO está vazia: o retorno deveria ser 0.');
        return withUnchanged(out, before, s.snapshot(), 'a pilha');
      },
    },
    {
      id: 'three',
      title: 'Pilha com 3 elementos',
      scenario: 'top → [5] → [9] → [1] → NULL, size = 3',
      run(m) {
        const s = buildStack(m, [5, 9, 1]);
        const before = s.snapshot();
        const out = expectNumber(m.invoke('upo_stack_is_empty', [s.handle]), 0);
        return withUnchanged(out, before, s.snapshot(), 'a pilha');
      },
    },
    {
      id: 'null',
      title: 'Handle NULL',
      scenario: 'stack == NULL (convenção do exercício: vazia)',
      run(m) {
        const s = buildStack(m, null);
        return expectNumber(m.invoke('upo_stack_is_empty', [s.handle]), 1, () => 'O esqueleto já tratava stack == NULL retornando 1: não apague esse if.');
      },
    },
  ],
  hints: [
    'Pense no que DIFERENCIA uma pilha vazia de uma não vazia olhando a struct upo_stack_s: qual campo muda?',
    '`stack` é um ponteiro (upo_stack_t = struct upo_stack_s*). Para ler um campo através de um ponteiro, use `->`: `stack->top`.',
    'Em C, uma comparação como `a == b` já vale 1 (verdadeiro) ou 0 (falso). Você pode retorná-la diretamente.',
    'Estrutura da resposta: `return stack->???  ==  ???;` (compare, não atribua: `==`, não `=`).',
  ],
  solution: `int upo_stack_is_empty(const upo_stack_t stack)
{
    if (stack == NULL)
        return 1;

    return stack->top == NULL;
}
`,
  solutionNotes: [
    { from: 1, text: 'A assinatura vem do header. `const upo_stack_t` = o PONTEIRO stack é constante (não dá para fazer stack = ...).' },
    { from: 3, to: 4, text: 'Caso especial: sem pilha, não há o que acessar. Sem esse teste, `stack->top` com stack == NULL causaria Segmentation fault.' },
    { from: 6, text: '`stack->top == NULL` é uma comparação: vale 1 se não há nó no topo e 0 caso contrário. Também seria correto `return stack->size == 0;`.' },
  ],
  errorTips: {
    TYPE_MISMATCH: 'Se você escreveu `return stack;`, está devolvendo o endereço da pilha, não 1/0. Retorne o resultado de uma comparação.',
    CONST_ASSIGN: 'O parâmetro é `const upo_stack_t`: o ponteiro stack não pode ser reatribuído. E is_empty não precisa modificar nada.',
  },
};

// ---------------------------------------------------------------------------
const count: Exercise = {
  id: 'list-count',
  level: 3,
  title: 'Contar os nós de uma lista',
  summary: 'Escreva a função inteira: percorrer a lista com um ponteiro auxiliar e contar.',
  concepts: ['percorrer lista', 'ponteiro auxiliar', 'inicializar variáveis', 'size_t'],
  signature: 'size_t upo_list_count(const upo_list_t list);',
  task: [
    'Implemente `upo_list_count`: ela deve retornar quantos nós existem na lista.',
    'Se `list` for `NULL` ou a lista estiver vazia (`list->head == NULL`), retorne 0.',
    'A função **não pode modificar** a lista: percorra-a com um ponteiro auxiliar do tipo `upo_list_node_t*`.',
  ],
  header: LIST_HEADER,
  requiredFunctions: ['upo_list_count'],
  starterCode: `size_t upo_list_count(const upo_list_t list)
{
    /* TODO: percorra a lista a partir de list->head e conte os nós.
     *       Não esqueça: list pode ser NULL. */

    return 0;
}
`,
  diagram: listDiagram([4, 8, 15]),
  trace: {
    prompt: 'Nível 1 · Para a lista 4 → 8 → 15 → NULL, quantas vezes a condição `node != NULL` é avaliada?',
    code: `size_t n = 0;
upo_list_node_t *node = list->head;
while (node != NULL) {
    n++;
    node = node->next;
}`,
    diagram: listDiagram([4, 8, 15]),
    options: ['2 vezes', '3 vezes', '4 vezes', 'Infinitas vezes'],
    correct: 2,
    explanation:
      'A condição é testada uma vez para cada nó (node aponta para 4, 8, 15: verdadeira 3 vezes) e mais uma vez quando node vira NULL (falsa: o laço termina). Total: 4 avaliações, 3 iterações, n termina em 3.',
  },
  tests: [
    {
      id: 'null',
      title: 'Handle NULL',
      scenario: 'list == NULL',
      run(m) {
        const l = buildList(m, null);
        return expectNumber(m.invoke('upo_list_count', [l.handle]), 0);
      },
    },
    {
      id: 'empty',
      title: 'Lista vazia',
      scenario: 'head = NULL',
      run(m) {
        const l = buildList(m, []);
        return expectNumber(m.invoke('upo_list_count', [l.handle]), 0);
      },
    },
    {
      id: 'one',
      title: 'Um nó',
      scenario: 'head → [42] → NULL',
      run(m) {
        const l = buildList(m, [42]);
        const before = l.snapshot();
        return withUnchanged(expectNumber(m.invoke('upo_list_count', [l.handle]), 1), before, l.snapshot(), 'a lista');
      },
    },
    {
      id: 'three',
      title: 'Três nós',
      scenario: 'head → [4] → [8] → [15] → NULL',
      run(m) {
        const l = buildList(m, [4, 8, 15]);
        const before = l.snapshot();
        const out = expectNumber(m.invoke('upo_list_count', [l.handle]), 3, (a) =>
          a === 2 ? 'Faltou contar um nó: talvez o laço pare em node->next == NULL (pulando o último) ou comece em head->next.' : a === 4 ? 'Contou um a mais: o contador começou em 1, ou contou o NULL?' : undefined,
        );
        return withUnchanged(out, before, l.snapshot(), 'a lista');
      },
    },
    {
      id: 'many',
      title: 'Lista longa (50 nós)',
      scenario: '50 nós com valores 0..49',
      run(m) {
        const l = buildList(m, Array.from({ length: 50 }, (_, i) => i));
        const before = l.snapshot();
        return withUnchanged(expectNumber(m.invoke('upo_list_count', [l.handle]), 50), before, l.snapshot(), 'a lista');
      },
    },
  ],
  hints: [
    'Você precisa de duas variáveis locais: um contador e um ponteiro que "anda" pela lista. Em C, variáveis locais NÃO começam em 0: inicialize as duas.',
    'O ponteiro auxiliar tem o tipo do NÓ, não o tipo da lista: `upo_list_node_t *node = list->head;`. (`upo_list_t` é ponteiro para a struct da lista, outro tipo.)',
    'Trate primeiro o caso `list == NULL` (retorne 0). Só depois é seguro escrever `list->head`.',
    'Esqueleto: `while (node != NULL) { /* conte */  node = node->next; }`. Se esquecer de avançar `node`, o laço nunca termina.',
  ],
  solution: `size_t upo_list_count(const upo_list_t list)
{
    if (list == NULL)
        return 0;

    size_t n = 0;
    upo_list_node_t *node = list->head;

    while (node != NULL) {
        n++;
        node = node->next;
    }
    return n;
}
`,
  solutionNotes: [
    { from: 3, to: 4, text: 'Sem lista não há nós. Este teste vem ANTES de qualquer `list->...`, senão seria um acesso via NULL.' },
    { from: 6, text: 'O contador começa explicitamente em 0. `size_t` é o tipo usado para tamanhos/contagens (sem sinal).' },
    { from: 7, text: '`node` é um ponteiro AUXILIAR do tipo do nó. Copiamos o endereço do primeiro nó; a lista em si não muda.' },
    { from: 9, text: 'Enquanto `node` aponta para um nó de verdade...' },
    { from: 10, to: 11, text: '...conta o nó e avança para o próximo. Quando `node->next` for NULL, node vira NULL e o laço termina.' },
    { from: 13, text: 'Retorna o total. Para uma lista vazia (head == NULL) o while não executa nenhuma vez e n continua 0.' },
  ],
  errorTips: {
    INCOMPATIBLE_PTR: 'O ponteiro que percorre a lista deve ser `upo_list_node_t*` (nó), não `upo_list_t` (lista). São structs diferentes.',
    INFINITE_LOOP: 'Dentro do while, `node` precisa avançar: `node = node->next;`.',
    UNINIT_READ: 'Inicialize o contador: `size_t n = 0;`.',
  },
};

// ---------------------------------------------------------------------------
const find: Exercise = {
  id: 'list-find',
  level: 3,
  title: 'Procurar um valor na lista',
  summary: 'Percorrer e parar no primeiro nó com o valor procurado; retornar um ponteiro ou NULL.',
  concepts: ['retornar ponteiro', 'NULL como "não encontrado"', 'curto-circuito &&', 'percorrer lista'],
  signature: 'upo_list_node_t* upo_list_find(const upo_list_t list, int value);',
  task: [
    'Implemente `upo_list_find`: ela deve retornar um **ponteiro para o primeiro nó** cujo campo `value` seja igual ao parâmetro `value`.',
    'Se não houver nenhum nó com esse valor, ou se `list` for `NULL`, retorne `NULL`.',
    'A lista não pode ser modificada. Este exercício é um bom candidato ao **modo exame** (nível 4): tente sem dicas.',
  ],
  header: LIST_HEADER,
  requiredFunctions: ['upo_list_find'],
  starterCode: `upo_list_node_t* upo_list_find(const upo_list_t list, int value)
{
    /* TODO: devolva o PRIMEIRO nó com node->value == value,
     *       ou NULL se não existir. */

    return NULL;
}
`,
  diagram: listDiagram([3, 9, 9, 1]),
  trace: {
    prompt: 'Nível 1 · O valor 5 NÃO está na lista 3 → 9 → NULL. O que acontece com esta versão do laço?',
    code: `upo_list_node_t *node = list->head;
while (node->value != value && node != NULL) {
    node = node->next;
}
return node;`,
    options: [
      'Retorna NULL corretamente.',
      'Retorna o último nó (9).',
      'Quando node vira NULL, a condição ainda lê node->value: acesso via NULL (Segmentation fault).',
      'Entra em laço infinito.',
    ],
    correct: 2,
    explanation:
      '`&&` avalia da esquerda para a direita e para assim que encontra algo falso (curto-circuito). Aqui `node->value` é avaliado ANTES de verificar `node != NULL`. Depois do último nó, node == NULL e `node->value` é uma desreferência de NULL. A ordem certa é `node != NULL && node->value != value`.',
  },
  tests: [
    {
      id: 'null',
      title: 'Handle NULL',
      scenario: 'list == NULL, procura 3',
      run(m) {
        const l = buildList(m, null);
        const r = m.invoke('upo_list_find', [l.handle, m.num(3)]);
        const actual = describeNodePtr(r, l.nodes);
        return { pass: actual === 'NULL', expected: 'NULL', actual };
      },
    },
    {
      id: 'empty',
      title: 'Lista vazia',
      scenario: 'head = NULL, procura 3',
      run(m) {
        const l = buildList(m, []);
        const r = m.invoke('upo_list_find', [l.handle, m.num(3)]);
        const actual = describeNodePtr(r, l.nodes);
        return { pass: actual === 'NULL', expected: 'NULL', actual };
      },
    },
    ...([
      { id: 'head', title: 'Valor no primeiro nó', values: [3, 9, 1], target: 3, idx: 0 },
      { id: 'middle', title: 'Valor no meio', values: [3, 9, 1], target: 9, idx: 1 },
      { id: 'tail', title: 'Valor no último nó', values: [3, 9, 1], target: 1, idx: 2 },
      { id: 'dup', title: 'Valor repetido: devolve o PRIMEIRO', values: [3, 9, 9, 1], target: 9, idx: 1 },
      { id: 'absent', title: 'Valor ausente', values: [3, 9, 1], target: 5, idx: -1 },
    ].map((c) => ({
      id: c.id,
      title: c.title,
      scenario: `lista ${c.values.join(' → ')} → NULL, procura ${c.target}`,
      run(m: import('../../engine/interpreter').Machine) {
        const l = buildList(m, c.values);
        const before = l.snapshot();
        const r = m.invoke('upo_list_find', [l.handle, m.num(c.target)]);
        const actual = describeNodePtr(r, l.nodes);
        const expected = c.idx < 0 ? 'NULL' : describeNodePtr(m.ptrTo(l.nodes[c.idx]), l.nodes);
        let message: string | undefined;
        if (actual !== expected) {
          if (c.id === 'dup' && actual.includes('#2')) message = 'Você devolveu o ÚLTIMO nó com o valor. Pare o laço (ou dê return) no primeiro encontrado.';
          else if (c.idx >= 0 && actual === 'NULL') message = 'O valor está na lista, mas a função devolveu NULL. O laço está saindo cedo demais, ou a comparação está invertida?';
          else if (c.idx < 0) message = 'O valor não existe: a função deve devolver NULL.';
        }
        return withUnchanged({ pass: actual === expected, expected, actual, message }, before, l.snapshot(), 'a lista');
      },
    }))),
  ],
  hints: [
    'O tipo de retorno é `upo_list_node_t*`: você vai devolver o ENDEREÇO de um nó que já existe (não cria nada novo, não usa malloc).',
    'Mesmo padrão de percorrer do exercício de contagem: `upo_list_node_t *node = list->head;` e avance com `node = node->next;`. Trate `list == NULL` antes.',
    'Duas formas válidas: (a) dentro do laço, `if (node->value == value) return node;` e depois do laço `return NULL;`  (b) `while (node != NULL && node->value != value)` e no fim `return node;`.',
    'Na forma (b), a ORDEM no `&&` importa: primeiro `node != NULL`, depois `node->value`. O curto-circuito impede o acesso via NULL.',
  ],
  solution: `upo_list_node_t* upo_list_find(const upo_list_t list, int value)
{
    if (list == NULL)
        return NULL;

    upo_list_node_t *node = list->head;
    while (node != NULL) {
        if (node->value == value)
            return node;          /* primeiro encontrado */
        node = node->next;
    }
    return NULL;                  /* percorreu tudo: não existe */
}
`,
  solutionNotes: [
    { from: 1, text: 'Retornar um ponteiro permite ao chamador ler ou modificar o nó encontrado. NULL é o valor convencional para "não encontrado".' },
    { from: 3, to: 4, text: 'Sem lista, nada a procurar. Este teste vem antes de `list->head`.' },
    { from: 6, text: 'Ponteiro auxiliar do tipo do NÓ, começando no primeiro nó.' },
    { from: 8, to: 9, text: 'Assim que encontra, retorna imediatamente: isso garante que é o PRIMEIRO nó com aquele valor.' },
    { from: 10, text: 'Avança. Sem esta linha o laço não termina.' },
    { from: 12, text: 'Se o laço terminou, node chegou a NULL sem encontrar: retorna NULL.' },
  ],
  errorTips: {
    NULL_DEREF: 'Provavelmente `node->value` foi lido quando node já era NULL. Teste `node != NULL` ANTES (e à esquerda do &&).',
    INCOMPATIBLE_PTR: 'Retorne um `upo_list_node_t*` (um nó), não o handle `list`.',
  },
};

export const EXERCISES: Exercise[] = [isEmpty, count, find];

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
