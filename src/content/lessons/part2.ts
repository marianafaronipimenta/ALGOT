import type { Lesson } from '../types';

export const lesson5: Lesson = {
  id: 'void-ptr',
  number: 5,
  title: 'void* e dados genéricos',
  subtitle: 'Como uma pilha guarda "qualquer coisa"',
  terms: [
    { it: 'puntatore generico', pt: 'ponteiro genérico' },
    { it: 'cast', pt: 'conversão explícita de tipo' },
    { it: 'comparatore', pt: 'comparador (função de comparação)' },
    { it: 'tipi generici', pt: 'tipos genéricos' },
  ],
  intro: [
    'Os ADTs do curso (pilha, BST, hash table) funcionam para **qualquer tipo de dado**. O truque é guardar `void*`: um ponteiro genérico que pode receber o endereço de qualquer coisa. No nó da pilha, o campo é `void *data;`.',
    'O preço: o compilador não sabe o que existe naquele endereço. Por isso um `void*` **não pode ser desreferenciado** (`*vptr` é erro) e não aceita aritmética de ponteiros. Para usar o dado, converta para o tipo certo: com cast `*((int*) vptr)` ou com uma variável auxiliar `int *ip = vptr;`.',
    'O cast precisa ser para o tipo **real** do dado. Converter o endereço de um double para `int*` não "converte o número": lê os bytes errados e dá um resultado sem sentido.',
    'Quando a estrutura precisa comparar dados genéricos (como o BST com as chaves), ela recebe um **comparador**: um ponteiro para função com assinatura `int cmp(const void *a, const void *b)`, que devolve <0, 0 ou >0. Nos slides: `typedef int (*upo_bst_comparator_t)(const void*, const void*);`.',
  ],
  example: {
    filename: 'void_ptr.c',
    code: `int x = 1;
double d = 10.25;
void *vptr = &x;

int y = *((int*) vptr);
int *iptr = vptr;
*iptr = 5;

vptr = &d;
double e = *((double*) vptr);

int int_compare(const void *a, const void *b)
{
    const int *ia = a;
    const int *ib = b;
    return (*ia > *ib) - (*ia < *ib);
}`,
    lineNotes: [
      { from: 3, text: 'Qualquer ponteiro pode ser atribuído a um void* sem cast.' },
      { from: 5, text: 'Cast para int* e só então * : y == 1. Escrever `*vptr` seria erro.' },
      { from: 6, text: 'Alternativa ao cast: um void* pode ser atribuído a um ponteiro tipado.' },
      { from: 7, text: 'Escreve através do ponteiro tipado: x == 5.' },
      { from: 9, to: 10, text: 'O mesmo void* agora guarda o endereço de um double; o cast deve acompanhar o tipo real.' },
      { from: 12, text: 'Comparador genérico: recebe dois void* constantes (não vai modificar os dados).' },
      { from: 14, to: 15, text: 'Converte os ponteiros genéricos para o tipo que sabemos que os dados têm.' },
      { from: 16, text: 'Devolve 1 se *ia > *ib, -1 se menor, 0 se iguais (truque dos slides, evita overflow de a - b).' },
    ],
  },
  diagrams: [
    {
      kind: 'boxes',
      title: 'Um nó de pilha guardando um int',
      caption: 'O nó não "contém" o 7: contém o endereço de um int que está em outro lugar. Quem usa a pilha sabe que o dado é int e faz o cast.',
      boxes: [
        { id: 'n', label: 'nó', type: 'upo_stack_node_t', fields: [{ name: 'data (void*)', to: 'd' }, { name: 'next', to: 'NULL' }], col: 0, variant: 'node' },
        { id: 'd', type: 'int', fields: [{ name: '', value: '7' }], col: 1, variant: 'data' },
      ],
    },
  ],
  keyPoints: [
    'void* guarda qualquer endereço, mas não pode ser desreferenciado diretamente.',
    'Para usar: `*((T*) p)` ou `T *tp = p;` com T = tipo REAL do dado.',
    'ADTs genéricos guardam void* e recebem comparadores (ponteiros para função).',
  ],
  pitfalls: [
    '`*node->data` com data do tipo void* (falta o cast).',
    'Fazer cast para o tipo errado.',
    'Achar que a pilha copia o dado: ela guarda só o endereço.',
  ],
  quiz: [
    {
      prompt: 'Com `void *p = &x;` (x é int), qual linha está correta para ler x?',
      options: ['int y = *p;', 'int y = *((int*) p);', 'int y = (int) p;', 'int y = p->x;'],
      correct: 1,
      explanation: 'Primeiro converte o ponteiro para int*, depois desreferencia. `(int) p` converteria o ENDEREÇO em número.',
    },
    {
      prompt: 'Por que o nó da pilha usa `void *data` em vez de `int data`?',
      options: [
        'Porque void* ocupa menos memória.',
        'Para que a mesma implementação da pilha funcione com qualquer tipo de dado.',
        'Porque int não pode ficar dentro de struct.',
        'Para evitar usar malloc.',
      ],
      correct: 1,
      explanation: 'Com ponteiros genéricos basta uma implementação para todos os tipos (inclusive structs do usuário).',
    },
    {
      prompt: 'O que `int_compare(&a, &b)` devolve se a = 3 e b = 8?',
      options: ['-1', '0', '1', '-5'],
      correct: 0,
      explanation: '(3 > 8) - (3 < 8) = 0 - 1 = -1: "a vem antes de b".',
    },
  ],
  sources: ['laboratorio_1.pdf (Puntatori generici, Puntatori a funzioni)', 'ALGO_07_bst.pdf (Comparatore)'],
};

export const lesson6: Lesson = {
  id: 'malloc-free',
  number: 6,
  title: 'malloc, free e posse da memória',
  subtitle: 'Heap, NULL, dangling pointers, memory leaks e destroy_data',
  terms: [
    { it: 'allocazione dinamica', pt: 'alocação dinâmica' },
    { it: 'deallocare / liberare', pt: 'desalocar / liberar' },
    { it: 'memory leak', pt: 'vazamento de memória' },
    { it: 'dangling pointer', pt: 'ponteiro pendurado (para memória já liberada)' },
  ],
  intro: [
    'Variáveis locais morrem quando a função termina. Nós de uma lista ou pilha precisam **sobreviver** à função que os criou, então são alocados no **heap** com `malloc(sizeof(T))`, que devolve o endereço de um bloco novo (ou NULL se faltar memória).',
    '`malloc` **não inicializa** o bloco: os campos contêm lixo até você atribuir. (`calloc` zera a memória.) Sempre verifique se o retorno é NULL, como faz o código do toolkit com `perror` + `abort()`.',
    'Toda memória do malloc deve ser liberada com `free` **exatamente uma vez**, quando não for mais necessária. Esquecer → **memory leak**. Usar depois do free → **dangling pointer**. Liberar duas vezes → **double free**.',
    'E quem libera o DADO guardado no nó? Depende de quem é o "dono". Por isso as funções do Stack ADT recebem o parâmetro `destroy_data` (nos slides, `d`): se `!= 0`, a pilha também chama `free(node->data)`; se `== 0`, o dado continua sendo responsabilidade do usuário (por exemplo, se ele apontava para uma variável local `&a`).',
    'Para verificar vazamentos e acessos inválidos num ambiente real, o curso usa: `valgrind --tool=memcheck --leak-check=full ./programa`.',
  ],
  example: {
    filename: 'nodes.c',
    code: `upo_stack_node_t* node_create(void *data)
{
    upo_stack_node_t *node = malloc(sizeof(upo_stack_node_t));
    if (node == NULL) {
        perror("Unable to create a node");
        abort();
    }
    node->data = data;
    node->next = NULL;
    return node;
}

void node_destroy(upo_stack_node_t *node, int destroy_data)
{
    if (destroy_data != 0)
        free(node->data);
    free(node);
}`,
    lineNotes: [
      { from: 1, text: 'Exemplo inspirado em upo_stack_node_create do stack.c do toolkit (aqui com nome genérico, só para estudo).' },
      { from: 3, text: 'Reserva no heap espaço para UM nó. `sizeof(upo_stack_node_t)` calcula o tamanho em bytes.' },
      { from: 4, to: 7, text: 'malloc pode falhar e devolver NULL: sem este teste, node->data seria um acesso via NULL.' },
      { from: 8, to: 9, text: 'Inicializa TODOS os campos: o malloc não faz isso por você.' },
      { from: 10, text: 'Devolve o endereço. O bloco continua existindo depois do return (diferente de uma variável local).' },
      { from: 15, to: 16, text: 'Libera o dado só se a estrutura for dona dele (destroy_data != 0).' },
      { from: 17, text: 'Libera o próprio nó. Depois disto, `node->...` é proibido (dangling pointer).' },
    ],
  },
  diagrams: [
    {
      kind: 'boxes',
      title: 'Limpar uma pilha sem perder o resto',
      caption: 'Para liberar nós em sequência: (1) guarde o nó do topo numa variável temporária, (2) avance top para o próximo, (3) libere o nó guardado. Se liberar primeiro, `node->next` já não pode ser lido.',
      boxes: [
        { id: 's', label: 'stack', type: 'struct upo_stack_s', fields: [{ name: 'top', to: 'n1' }, { name: 'size', value: '1' }], col: 0, variant: 'var' },
        { id: 'tmp', label: 'node (temp)', type: 'upo_stack_node_t*', fields: [{ name: '', to: 'n0' }], col: 0, row: 1, variant: 'handle' },
        { id: 'n0', type: 'nó liberado', fields: [{ name: 'data', value: '—' }, { name: 'next', value: '—' }], col: 1, row: 1, variant: 'freed' },
        { id: 'n1', type: 'upo_stack_node_t', fields: [{ name: 'data', value: '…' }, { name: 'next', to: 'NULL' }], col: 2, variant: 'node' },
      ],
    },
  ],
  keyPoints: [
    'malloc(sizeof(T)) → bloco no heap, NÃO inicializado; pode devolver NULL.',
    'Um free para cada malloc. Nada de usar o ponteiro depois do free.',
    'Antes de liberar um nó, salve o que ainda precisa dele (ex.: next).',
    'destroy_data decide se o dado do usuário também é liberado.',
  ],
  pitfalls: [
    '`free(node); node = node->next;` (lê memória já liberada).',
    'Liberar `node->data` quando o dado é uma variável local do usuário.',
    'Esquecer de atualizar `size` e `top` depois de remover nós.',
  ],
  quiz: [
    {
      prompt: 'Qual ordem está correta para remover o nó do topo?',
      options: [
        'free(stack->top); stack->top = stack->top->next;',
        'node = stack->top; stack->top = node->next; free(node);',
        'stack->top = NULL; free(stack->top);',
        'free(stack); stack->top = NULL;',
      ],
      correct: 1,
      explanation: 'Guardar, avançar, liberar. Na primeira opção, stack->top->next é lido depois do free.',
    },
    {
      prompt: 'O usuário fez `int a = 0; upo_stack_push(stack, &a);`. Como deve destruir a pilha?',
      options: ['upo_stack_destroy(stack, 1)', 'upo_stack_destroy(stack, 0)', 'free(&a)', 'Tanto faz'],
      correct: 1,
      explanation: '&a não veio do malloc: chamar free nele é inválido. Por isso destroy_data deve ser 0 (exemplo 1 dos slides).',
    },
    {
      prompt: 'O que acontece se uma função faz malloc, guarda o endereço numa variável local e retorna sem free nem return do ponteiro?',
      options: ['Nada, a memória é liberada sozinha', 'Memory leak: o bloco fica inacessível', 'Segmentation fault imediato', 'Double free'],
      correct: 1,
      explanation: 'O ponteiro local some, mas o bloco no heap continua alocado e ninguém mais sabe o endereço.',
    },
  ],
  sources: ['A2023_02_cptr.pdf (Allocazione dinamica)', 'laboratorio_1.pdf (Dangling/Wild pointers, Memory leaks, Valgrind)', 'ALGO_05_stack.pdf (Il parametro d)'],
};

export const lesson7: Lesson = {
  id: 'adt-handles',
  number: 7,
  title: 'Interfaces de ADT e handles opacos',
  subtitle: 'Header público, header privado e information hiding',
  terms: [
    { it: 'tipo di dato astratto (ADT)', pt: 'tipo abstrato de dados' },
    { it: 'tipo incompleto', pt: 'tipo incompleto' },
    { it: 'information hiding', pt: 'ocultação de informação' },
    { it: 'pre-condizione / post-condizione', pt: 'pré-condição / pós-condição' },
  ],
  intro: [
    'Um **ADT** é um tipo cujo conteúdo é escondido do usuário (o "cliente"), que só pode usar as operações da **API**. O curso implementa isso com um **tipo incompleto**: no header público aparece só `typedef struct upo_timer_s* upo_timer_t;`, sem os campos.',
    'Esse `upo_timer_t` é um **handle opaco**: um ponteiro para uma struct cujos campos o cliente não enxerga. O cliente pode guardar e passar o handle, mas não pode fazer `t->start` (tipo incompleto). Os campos são definidos no **header privado** (ex.: `src/timer_private.h`), incluído apenas pela implementação (`timer.c`).',
    'No exame, a função que você implementa fica no `.c` da implementação, que inclui o header privado. Então **você enxerga os campos** e usa `stack->top`, `tree->root` etc.',
    'Detalhe importante: `const upo_stack_t stack` torna constante o **ponteiro** (você não pode fazer `stack = ...`), não a struct apontada. É diferente de `const struct upo_stack_s *stack`.',
    'Estratégia de leitura para o exame: (1) leia o comentário da função no header público (`\\brief`, `\\param`, `\\return`, `\\pre`); (2) veja os campos no header privado; (3) olhe funções já prontas, como create/destroy, como exemplo de estilo; (4) só então escreva no lugar do TODO.',
  ],
  example: {
    filename: 'timer (3 arquivos)',
    code: `/* include/upo/timer.h  (PÚBLICO) */
typedef struct upo_timer_s* upo_timer_t;

upo_timer_t upo_timer_create();
void upo_timer_destroy(upo_timer_t timer);
void upo_timer_start(upo_timer_t timer);
int  upo_timer_is_stopped(const upo_timer_t timer);

/* src/timer_private.h  (PRIVADO) */
#include <upo/timer.h>
struct upo_timer_s {
    time_t start;
    time_t stop;
};

/* apps/use_timer.c  (CLIENTE) */
upo_timer_t t = upo_timer_create();
upo_timer_start(t);
/* t->start = 0;   erro aqui: tipo incompleto */
upo_timer_destroy(t);`,
    lineNotes: [
      { from: 2, text: 'Declara o handle: ponteiro para uma struct que, NESTE arquivo, ainda não tem campos (tipo incompleto).' },
      { from: 4, to: 7, text: 'A API: tudo o que o cliente pode fazer. Todas as funções recebem/devolvem o handle; nenhuma expõe os campos.' },
      { from: 7, text: 'Funções "is_..." devolvem 1/0. `const` aqui protege o ponteiro timer.' },
      { from: 10, text: 'O header privado inclui o público (para conhecer o typedef)...' },
      { from: 11, to: 14, text: '...e completa a struct com os campos. Só timer.c inclui este arquivo.' },
      { from: 17, text: 'O cliente obtém um timer válido via create (que faz o malloc e inicializa os campos).' },
      { from: 19, text: 'O cliente não vê os campos: acessar t->start daria "dereferencing pointer to incomplete type".' },
      { from: 20, text: 'destroy libera a memória alocada por create.' },
    ],
  },
  diagrams: [
    {
      kind: 'boxes',
      title: 'O que cada lado enxerga',
      caption: 'O cliente segura apenas o handle (uma seta). A implementação, que inclui o header privado, enxerga o conteúdo da struct.',
      boxes: [
        { id: 't', label: 't (cliente)', type: 'upo_timer_t', fields: [{ name: '', to: 's' }], col: 0, variant: 'handle' },
        { id: 's', label: 'visível só em timer.c', type: 'struct upo_timer_s', fields: [{ name: 'start', value: 'time_t' }, { name: 'stop', value: 'time_t' }], col: 1, variant: 'var' },
      ],
    },
  ],
  keyPoints: [
    'upo_X_t = ponteiro para struct upo_X_s (handle opaco).',
    'Header público: typedef do handle + protótipos documentados. Header privado: campos.',
    'Na implementação (onde você escreve no exame), os campos são visíveis.',
    '`const upo_X_t x` = ponteiro constante, conteúdo modificável.',
  ],
  pitfalls: [
    'Procurar os campos no header público (eles estão no privado).',
    'Usar `stack.top` porque "não tem asterisco" (o handle É um ponteiro).',
    'Ignorar as pré-condições (\\pre) do comentário da função.',
  ],
  quiz: [
    {
      prompt: 'O que é `upo_timer_t`?',
      options: ['Uma struct com start e stop', 'Um ponteiro para struct upo_timer_s', 'Uma palavra-chave de C', 'Um int com o tempo'],
      correct: 1,
      explanation: 'O typedef inclui o *: upo_timer_t é um ponteiro (handle).',
    },
    {
      prompt: 'Por que `use_timer.c` não consegue compilar `t->start = 0;`?',
      options: [
        'Porque start é privado por palavra-chave private.',
        'Porque nesse arquivo struct upo_timer_s é um tipo incompleto (os campos não foram declarados).',
        'Porque t é NULL.',
        'Porque deveria ser t.start.',
      ],
      correct: 1,
      explanation: 'C não tem "private": o encapsulamento vem de o cliente não incluir o header privado.',
    },
    {
      prompt: 'Em `int upo_stack_is_empty(const upo_stack_t stack)`, o que o const impede?',
      options: ['Ler stack->top', 'Fazer stack = outro_ponteiro', 'Chamar a função duas vezes', 'Retornar 0'],
      correct: 1,
      explanation: 'Com typedef de ponteiro, const se aplica ao próprio ponteiro. (A função ainda poderia, tecnicamente, alterar stack->top; mas não deve.)',
    },
  ],
  sources: ['A2023_04_adt.pdf (ADT, Information Hiding, Toolkit)'],
};

export const lesson8: Lesson = {
  id: 'convencoes-upo',
  number: 8,
  title: 'Convenções de nomes UPO',
  subtitle: 'Ler upo_bst_node_t, _impl, destroy_data e valores de retorno',
  terms: [
    { it: 'prefisso', pt: 'prefixo' },
    { it: 'name clash', pt: 'conflito de nomes' },
    { it: 'implementazione ricorsiva privata', pt: 'implementação recursiva privada' },
    { it: 'valore precedente', pt: 'valor anterior' },
  ],
  intro: [
    '**`upo` não é palavra-chave de C.** É um **prefixo** escolhido pelo curso (Università del Piemonte Orientale) para evitar conflitos de nomes: se o ADT Timer tivesse uma função `start()`, ela colidiria com uma `start()` do usuário. A regra dos slides é: `"upo" + "_" + nome do ADT + "_"`.',
    'Com isso, um nome se lê da esquerda para a direita como um "endereço": `upo_bst_node_t` = biblioteca upo → ADT bst → parte node → tipo (_t). E `upo_stack_is_empty` = biblioteca upo → ADT stack → operação is_empty.',
    'Nas árvores, as operações públicas recebem a **árvore** (o handle), mas a recursão trabalha com **nós**. Por isso aparece o par: função pública `upo_bst_size(tree)` que chama uma função privada recursiva com sufixo `_impl` que recebe `tree->root`.',
    'Algumas funções devolvem o **valor anterior** ou NULL: segundo os slides, `put` insere ou substitui e devolve o valor que existia antes (ou NULL se a chave era nova). Leia sempre o `\\return` do comentário.',
    'As assinaturas abaixo são **ilustrativas**, no estilo do curso: confira sempre o header real do toolkit (`include/upo/bst.h`) para os tipos exatos.',
  ],
  example: {
    filename: 'convencoes.h (ilustrativo)',
    code: `/* Prefixo: "upo" + "_" + nome do ADT + "_" */
typedef struct upo_bst_s* upo_bst_t;
typedef struct upo_bst_node_s upo_bst_node_t;
typedef int (*upo_bst_comparator_t)(const void*, const void*);

/* Pública: recebe a ÁRVORE (handle) */
size_t upo_bst_size(const upo_bst_t tree);

/* Privada e recursiva: recebe um NÓ, sufixo _impl */
static size_t upo_bst_size_impl(const upo_bst_node_t *node);

/* Devolve o valor anterior, ou NULL */
void* upo_bst_put(upo_bst_t tree, void *key, void *value);
void  upo_bst_delete(upo_bst_t tree, const void *key, int destroy_data);`,
    lineNotes: [
      { from: 2, text: 'Handle da árvore: PONTEIRO para struct upo_bst_s (que contém root e key_cmp).' },
      { from: 3, text: 'Tipo do NÓ: a própria struct (sem *). Um ponteiro para nó se escreve upo_bst_node_t*.' },
      { from: 4, text: 'Ponteiro para função comparadora: devolve <0, 0, >0 comparando duas chaves genéricas.' },
      { from: 7, text: 'Operação pública: o usuário sempre passa a árvore inteira.' },
      { from: 10, text: '`static` = visível só neste .c. `_impl` = implementação recursiva sobre um nó (subárvore).' },
      { from: 13, text: 'Retorno void*: o valor antigo associado à chave, ou NULL se não havia.' },
      { from: 14, text: '`destroy_data`: mesma ideia do Stack ADT, decide se a chave/valor também é liberado.' },
    ],
  },
  tables: [
    {
      title: 'Dicionário de sufixos e padrões',
      headers: ['Padrão', 'Significado', 'Exemplo'],
      rows: [
        ['upo_', 'Prefixo da biblioteca do curso (não é palavra-chave)', 'upo_stack_push'],
        ['_s', 'Nome (tag) de uma struct', 'struct upo_bst_node_s'],
        ['_t', 'Tipo criado com typedef', 'upo_bst_node_t'],
        ['upo_X_t', 'Handle opaco: ponteiro para struct upo_X_s', 'upo_bst_t, upo_stack_t'],
        ['upo_X_node_t', 'Tipo de um nó do ADT X (struct, sem *)', 'upo_stack_node_t'],
        ['_impl', 'Função privada (geralmente recursiva) que recebe um nó', 'is_bst_impl(n, l, h)'],
        ['_create / _destroy', 'Inicializa (malloc) / finaliza (free) o ADT', 'upo_timer_create'],
        ['destroy_data (d)', 'Se != 0, também libera os dados do usuário', 'upo_stack_pop(s, 1)'],
        ['_comparator_t / _visitor_t', 'Tipo ponteiro para função', 'upo_bst_comparator_t'],
        ['_private.h', 'Header privado com os campos das structs', 'stack_private.h'],
      ],
    },
  ],
  keyPoints: [
    'upo é só um prefixo contra conflitos de nomes.',
    'upo_X_t (handle, ponteiro) ≠ upo_X_node_t (nó, struct).',
    'Pública recebe o ADT; _impl recebe nós e faz a recursão.',
    'Leia o \\return: algumas funções devolvem o valor anterior ou NULL.',
  ],
  pitfalls: [
    'Passar `tree` para uma função _impl que espera um nó (passe `tree->root`).',
    'Declarar `upo_bst_t node` para percorrer nós (o tipo certo é `upo_bst_node_t *node`).',
    'Ignorar o valor devolvido por put (o valor antigo pode precisar de free).',
  ],
  quiz: [
    {
      prompt: '`upo` é uma palavra-chave da linguagem C?',
      options: ['Sim, desde o C11', 'Não: é um prefixo de nomes usado pelo curso', 'Sim, mas só no gcc', 'É uma macro do pré-processador'],
      correct: 1,
      explanation: 'É convenção de nomes da biblioteca do curso, para reduzir name clashes.',
    },
    {
      prompt: 'Qual a diferença entre `upo_bst_t` e `upo_bst_node_t`?',
      options: [
        'Nenhuma, são sinônimos.',
        'upo_bst_t é um ponteiro para a struct da árvore; upo_bst_node_t é a struct de um nó.',
        'upo_bst_t é um nó e upo_bst_node_t é a árvore.',
        'Os dois são ponteiros para nó.',
      ],
      correct: 1,
      explanation: 'Um é o handle do ADT inteiro (com *), o outro é o tipo de cada nó (sem *).',
    },
    {
      prompt: 'O que o sufixo `_impl` costuma indicar?',
      options: ['Uma função do usuário', 'Uma função privada que implementa a recursão sobre nós', 'Uma função inline', 'Uma função que ainda não foi implementada'],
      correct: 1,
      explanation: 'A pública recebe a árvore e delega para a _impl, que recebe um nó.',
    },
  ],
  sources: ['A2023_04_adt.pdf (Name Clashes, prefissi)', 'ALGO_07_bst.pdf (upo_bst_t, comparatore, is_bst_impl, put)'],
};
