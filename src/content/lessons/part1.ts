import type { Lesson } from '../types';

export const lesson1: Lesson = {
  id: 'funcoes',
  number: 1,
  title: 'Funções em C',
  subtitle: 'Parâmetros, valor de retorno e escopo',
  terms: [
    { it: 'funzione', pt: 'função' },
    { it: 'parametro / argomento', pt: 'parâmetro / argumento' },
    { it: 'valore di ritorno', pt: 'valor de retorno' },
    { it: 'passaggio per valore', pt: 'passagem por valor' },
  ],
  intro: [
    'No exame você não escreve um programa inteiro: você recebe a **assinatura** de uma função e escreve o corpo dela. Por isso, a primeira habilidade é ler uma assinatura e saber exatamente o que entra e o que sai.',
    'Uma assinatura tem três partes: o **tipo de retorno** (o que a função devolve), o **nome** e a **lista de parâmetros** (o que ela recebe). Em `size_t upo_stack_size(const upo_stack_t stack)`, a função recebe uma pilha e devolve um `size_t` (um número sem sinal, usado para tamanhos).',
    '**Em C, todos os parâmetros são passados por valor**: a função recebe uma CÓPIA do argumento. Alterar o parâmetro dentro da função não altera a variável de quem chamou. (Na lição 3 você verá como ponteiros contornam isso.)',
    'Variáveis declaradas dentro de uma função (ou de um bloco `{ }`) são **locais**: só existem ali e somem quando a função termina. E atenção: variáveis locais **não começam em 0**; sem inicialização, contêm lixo.',
  ],
  example: {
    filename: 'funcoes.c',
    code: `#include <stdio.h>

int square(int x)
{
    int result = x * x;
    return result;
}

void try_change(int a)
{
    a = 100;
}

int main(void)
{
    int v = 7;
    int s = square(v);
    try_change(v);
    printf("v=%d s=%d\\n", v, s);
    return 0;
}`,
    lineNotes: [
      { from: 3, text: '`int square(int x)`: recebe um int (chamado x dentro da função) e promete devolver um int.' },
      { from: 5, text: '`result` é uma variável local: existe só durante esta chamada de square. Foi inicializada na declaração.' },
      { from: 6, text: '`return` encerra a função e entrega o valor a quem chamou.' },
      { from: 9, text: '`void` como tipo de retorno: a função não devolve nada.' },
      { from: 11, text: 'Muda apenas a cópia local `a`. A variável v do main não é afetada.' },
      { from: 16, to: 17, text: 'square(v) recebe uma cópia de v (7) e devolve 49, que é guardado em s.' },
      { from: 18, text: 'try_change recebe uma cópia de v. Depois da chamada, v continua 7.' },
      { from: 19, text: 'Imprime "v=7 s=49".' },
    ],
  },
  diagrams: [
    {
      kind: 'memory',
      title: 'Memória durante try_change(v)',
      caption: 'Cada chamada tem suas próprias variáveis. `a` é uma cópia de `v` em outro endereço: mudar `a` não muda `v`. (Endereços ilustrativos.)',
      rows: [
        { name: 'v  (main)', addr: '0x00001130', value: '7' },
        { name: 's  (main)', addr: '0x00001134', value: '49' },
        { name: 'a  (try_change)', addr: '0x00001200', value: '7 → 100', highlight: true },
      ],
    },
  ],
  keyPoints: [
    'Assinatura = tipo de retorno + nome + parâmetros. No exame ela é dada: não a modifique.',
    'Parâmetros são cópias (passagem por valor).',
    'Variáveis locais vivem só dentro do seu bloco e não são inicializadas automaticamente.',
    'Uma função não-void deve executar `return valor;` em TODOS os caminhos.',
  ],
  pitfalls: [
    'Esquecer o `return` no fim (ex.: depois de um laço).',
    'Achar que mudar um parâmetro muda a variável original.',
    'Usar uma variável local sem inicializá-la (`size_t n; n++;`).',
  ],
  quiz: [
    {
      prompt: 'O que o programa do exemplo imprime?',
      options: ['v=100 s=49', 'v=7 s=49', 'v=7 s=14', 'v=100 s=10000'],
      correct: 1,
      explanation: 'try_change altera só a cópia `a`; v continua 7. square(7) = 49.',
    },
    {
      prompt: 'Lendo a assinatura `int upo_stack_is_empty(const upo_stack_t stack);`, o que a função recebe e devolve?',
      options: [
        'Recebe um int e devolve uma pilha.',
        'Recebe uma pilha (upo_stack_t) e devolve um int (1 ou 0).',
        'Não recebe nada e devolve void.',
        'Recebe uma pilha e não devolve nada.',
      ],
      correct: 1,
      explanation: 'O tipo antes do nome (int) é o retorno; dentro dos parênteses está o parâmetro: `stack`, do tipo upo_stack_t.',
    },
    {
      prompt: 'Onde a variável `result` de square pode ser usada?',
      options: ['Em qualquer lugar do arquivo', 'Só no main', 'Só dentro de square', 'Em square e em try_change'],
      correct: 2,
      explanation: 'É uma variável local de square: seu escopo é o corpo da função.',
    },
  ],
  sources: ['A2023_02_cptr.pdf (Puntatori in C: passaggio parametri)'],
};

export const lesson2: Lesson = {
  id: 'struct-typedef',
  number: 2,
  title: 'struct e typedef',
  subtitle: 'Agrupar dados e dar nomes a tipos',
  terms: [
    { it: 'struttura / struct', pt: 'estrutura' },
    { it: 'campo / membro', pt: 'campo / membro' },
    { it: 'tipo composito', pt: 'tipo composto' },
    { it: 'alias di tipo', pt: 'apelido de tipo' },
  ],
  intro: [
    'Uma **struct** agrupa vários valores (campos) em um único objeto. A definição `struct point_s { int x; int y; };` cria um "molde"; cada variável desse tipo tem seus próprios x e y.',
    '**typedef** não cria um tipo novo: ele dá um **apelido** a um tipo existente. Depois de `typedef struct point_s point_t;`, escrever `point_t` é exatamente o mesmo que escrever `struct point_s`.',
    'No código do curso você verá sempre o par de sufixos: `_s` para o nome da struct (o "tag") e `_t` para o tipo criado com typedef, por exemplo `struct upo_stack_node_s` e `upo_stack_node_t`. Isso é uma **convenção de nomes**, não uma regra da linguagem.',
    'Os campos de uma struct (variável comum) são acessados com o **ponto**: `b.x`. Atribuir uma struct a outra (`a = b;`) copia **todos** os campos.',
    'Um typedef pode apelidar também um **ponteiro**: `typedef struct upo_stack_s* upo_stack_t;`. Aí `upo_stack_t` já É um ponteiro, mesmo sem `*` visível. Isso é central nos ADTs do curso (lição 7).',
  ],
  example: {
    filename: 'struct_typedef.c',
    code: `struct point_s {
    int x;
    int y;
};

typedef struct point_s point_t;

int main(void)
{
    struct point_s a = {1, 2};
    point_t b = {3, 4};
    b.x = 10;
    a = b;
    return a.x + a.y;
}`,
    lineNotes: [
      { from: 1, to: 4, text: 'Define a struct `point_s` com dois campos int. O `;` depois da `}` é obrigatório.' },
      { from: 6, text: 'Cria o apelido `point_t` para `struct point_s`. Nenhuma memória é alocada aqui.' },
      { from: 10, text: 'Declara `a` usando o nome completo `struct point_s` e inicializa x=1, y=2.' },
      { from: 11, text: '`b` tem exatamente o mesmo tipo de `a`, escrito com o apelido.' },
      { from: 12, text: 'Acesso a campo de uma struct (não ponteiro): operador ponto.' },
      { from: 13, text: 'Copia todos os campos de b para a. Agora a = {10, 4}; a e b continuam sendo objetos separados.' },
      { from: 14, text: 'Devolve 10 + 4 = 14.' },
    ],
  },
  diagrams: [
    {
      kind: 'boxes',
      title: 'Depois de a = b',
      caption: 'Duas structs independentes com o mesmo conteúdo. Mudar b.x depois disto não muda a.x.',
      boxes: [
        { id: 'a', label: 'a', type: 'point_t', fields: [{ name: 'x', value: '10' }, { name: 'y', value: '4' }], col: 0, variant: 'var' },
        { id: 'b', label: 'b', type: 'point_t', fields: [{ name: 'x', value: '10' }, { name: 'y', value: '4' }], col: 1, variant: 'var' },
      ],
    },
  ],
  keyPoints: [
    '`struct X_s { ... };` define os campos; `typedef struct X_s X_t;` cria um apelido.',
    '`X_t` e `struct X_s` são o MESMO tipo.',
    'Struct comum: campo com ponto (`s.campo`).',
    'Um typedef pode esconder um ponteiro: `typedef struct X_s* X_t;`.',
  ],
  pitfalls: [
    'Esquecer o `;` depois da `}` da struct.',
    'Confundir o tag da struct (`upo_stack_node_s`) com o nome do typedef (`upo_stack_node_t`).',
    'Achar que `a = b` faz a e b "serem o mesmo objeto" (é uma cópia).',
  ],
  quiz: [
    {
      prompt: 'O que `typedef struct point_s point_t;` faz?',
      options: [
        'Cria uma variável chamada point_t.',
        'Cria um apelido: point_t passa a significar struct point_s.',
        'Aloca memória para um ponto.',
        'Define os campos x e y.',
      ],
      correct: 1,
      explanation: 'typedef só dá um nome alternativo a um tipo. Nenhuma variável nem memória é criada.',
    },
    {
      prompt: 'Qual o valor devolvido pelo main do exemplo?',
      options: ['3', '7', '14', '13'],
      correct: 2,
      explanation: 'Depois de b.x = 10 e a = b, a vale {10, 4}: 10 + 4 = 14.',
    },
    {
      prompt: 'Dado `typedef struct upo_stack_s* upo_stack_t;`, o que é uma variável `upo_stack_t s;`?',
      options: ['Uma struct upo_stack_s', 'Um ponteiro para struct upo_stack_s', 'Um int', 'Uma palavra-chave especial de C'],
      correct: 1,
      explanation: 'O `*` faz parte do typedef: upo_stack_t é "ponteiro para struct upo_stack_s".',
    },
  ],
  sources: ['A2023_04_adt.pdf (Data Structure, typedef)', 'ALGO_05_stack.pdf (definição de upo_stack_node_s)'],
};

export const lesson3: Lesson = {
  id: 'ponteiros',
  number: 3,
  title: 'Ponteiros e endereços de memória',
  subtitle: '&, * e NULL',
  terms: [
    { it: 'puntatore', pt: 'ponteiro' },
    { it: 'indirizzo di memoria', pt: 'endereço de memória' },
    { it: 'dereferenziare', pt: 'desreferenciar (acessar o valor apontado)' },
    { it: 'riferimento indiretto', pt: 'referência indireta' },
  ],
  intro: [
    'Um **ponteiro** é uma variável cujo valor é um **endereço de memória**. Uma variável comum (`int v = 7;`) guarda um valor diretamente; um ponteiro guarda ONDE um valor está.',
    'Três operações: `&v` dá o endereço de v; `*ptr` acessa (lê ou escreve) o conteúdo no endereço guardado em ptr; `NULL` é um valor especial que significa "não aponta para nada".',
    'Cuidado com o asterisco: em uma **declaração** (`int *ptr;`) ele diz "ptr é um ponteiro para int". Em uma **expressão** (`*ptr = 5;`) ele significa "o lugar para onde ptr aponta".',
    'Como os parâmetros são cópias, para uma função modificar uma variável do chamador passamos o **endereço** dela: `void f(int *p) { *p = 3; }` chamado como `f(&v);`. A cópia do endereço ainda aponta para o v original.',
  ],
  example: {
    filename: 'ponteiros.c',
    code: `int v = 7;
int *ptr = NULL;
int *ptr2 = NULL;

ptr = &v;
*ptr = 5;
ptr2 = ptr;
*ptr2 = 9;
ptr2 = NULL;`,
    lineNotes: [
      { from: 1, text: 'v guarda o valor 7 diretamente (referência direta).' },
      { from: 2, to: 3, text: 'Dois ponteiros para int, inicializados com NULL: ainda não apontam para nada. Inicializar evita wild pointers.' },
      { from: 5, text: 'ptr recebe o ENDEREÇO de v. Agora ptr "aponta para" v.' },
      { from: 6, text: 'Escreve 5 no lugar apontado por ptr, ou seja, em v. Agora v == 5.' },
      { from: 7, text: 'Copia o endereço: ptr2 também aponta para v (não copia o 5!).' },
      { from: 8, text: 'Escreve 9 através de ptr2: v == 9 (e *ptr também é 9).' },
      { from: 9, text: 'ptr2 deixa de apontar para v. v continua 9 e ptr continua apontando para v.' },
    ],
  },
  diagrams: [
    {
      kind: 'memory',
      title: 'Memória depois da última linha',
      caption: 'Mesmo modelo dos slides: v no endereço 0x00001130, NULL representado por 0x0. O valor de um ponteiro é um endereço.',
      rows: [
        { name: 'v', addr: '0x00001130', value: '0x00000009' },
        { name: 'ptr', addr: '0x00001800', value: '0x00001130', pointsTo: 'v', highlight: true },
        { name: 'ptr2', addr: '0x00001804', value: '0x00000000 (NULL)' },
      ],
    },
  ],
  keyPoints: [
    '`&x` = endereço de x. `*p` = o conteúdo no endereço p.',
    'Copiar um ponteiro (`p2 = p`) copia o endereço: os dois apontam para o mesmo lugar.',
    'NULL significa "nenhum objeto". Nunca use `*p` ou `p->` com p == NULL.',
    'Para uma função alterar algo do chamador, passe o endereço (ponteiro).',
  ],
  pitfalls: [
    'Usar `*p` em um ponteiro não inicializado (wild pointer).',
    'Confundir o `*` da declaração com o `*` de desreferência.',
    'Escrever `p = 5` (muda o endereço!) quando queria `*p = 5`.',
  ],
  quiz: [
    {
      prompt: 'Logo depois da linha 6 (`*ptr = 5;`), quanto vale v?',
      options: ['7', '5', 'O endereço de ptr', 'NULL'],
      correct: 1,
      explanation: 'ptr aponta para v, então escrever em *ptr é escrever em v.',
    },
    {
      prompt: 'Depois de `int x = 1;` e `void inc(int *p) { *p = *p + 1; }`, quanto vale x após `inc(&x);`?',
      options: ['1', '2', 'O endereço de x', 'Erro de compilação'],
      correct: 1,
      explanation: 'inc recebe uma cópia do endereço de x, mas a cópia ainda aponta para x. *p = *p + 1 altera x.',
    },
    {
      prompt: 'Em `int *ptr = NULL;`, o que significa o `*`?',
      options: ['Multiplicação', 'Desreferência: ler o valor apontado', 'Parte do tipo: ptr é um ponteiro para int', 'Que ptr é constante'],
      correct: 2,
      explanation: 'Numa declaração, o * faz parte do tipo. Ele só significa "desreferenciar" dentro de expressões.',
    },
  ],
  sources: ['A2023_02_cptr.pdf (Puntatori in C - Concetti base)'],
};

export const lesson4: Lesson = {
  id: 'ponteiro-struct',
  number: 4,
  title: 'Ponteiros para structs e ponteiro para ponteiro',
  subtitle: 'O operador -> e o tipo T**',
  terms: [
    { it: 'puntatore a struttura', pt: 'ponteiro para struct' },
    { it: 'operatore freccia (->)', pt: 'operador seta' },
    { it: 'nodo', pt: 'nó' },
    { it: 'lista concatenata', pt: 'lista encadeada' },
  ],
  intro: [
    'Estruturas de dados (listas, pilhas, árvores) são feitas de **nós** ligados por ponteiros. Um nó típico tem um dado e um ponteiro para o próximo nó: `struct node_s { int value; node_t *next; };`.',
    'Com um ponteiro para struct, os campos são acessados com a **seta**: `p->value`. Ela é só um atalho para `(*p).value`: "vá até a struct apontada por p e pegue o campo value". Regra prática: **variável struct usa ponto; ponteiro para struct usa seta**.',
    'Encadeando setas você anda pela estrutura: `p->next->value` é o valor do nó seguinte. Cada `->` exige que o ponteiro à esquerda NÃO seja NULL.',
    'Às vezes uma função precisa mudar um **ponteiro** do chamador (por exemplo, a cabeça de uma lista). Pela mesma lógica da lição 3, passamos o endereço desse ponteiro: um **ponteiro para ponteiro** (`node_t **head`). Dentro da função, `*head` é o ponteiro original.',
  ],
  example: {
    filename: 'ponteiro_struct.c',
    code: `typedef struct node_s node_t;
struct node_s {
    int value;
    node_t *next;
};

void set_value(node_t *n, int v)
{
    n->value = v;
}

void reset_head(node_t **head)
{
    *head = NULL;
}

int main(void)
{
    node_t a = {1, NULL};
    node_t *p = &a;
    set_value(p, 42);
    reset_head(&p);
    return a.value;
}`,
    lineNotes: [
      { from: 1, text: 'O typedef pode vir ANTES da definição da struct: assim o campo next já pode usar o nome node_t.' },
      { from: 4, text: 'Um nó guarda o endereço do próximo nó (ou NULL no último).' },
      { from: 9, text: '`n->value = v` é o mesmo que `(*n).value = v`: altera a struct a do main, porque n aponta para ela.' },
      { from: 12, text: '`node_t **head`: ponteiro para um ponteiro de nó. Permite alterar o ponteiro do chamador.' },
      { from: 14, text: '`*head` é o próprio p do main. Atribuir NULL muda p, não a struct a.' },
      { from: 19, text: '`a` é uma struct (variável comum): se fosse acessar campos, seria `a.value`.' },
      { from: 20, text: '`p` guarda o endereço de a.' },
      { from: 21, text: 'Passa o ponteiro (cópia do endereço). a.value vira 42.' },
      { from: 22, text: 'Passa o ENDEREÇO de p. Depois da chamada p == NULL, mas a continua existindo.' },
      { from: 23, text: 'Devolve 42.' },
    ],
  },
  diagrams: [
    {
      kind: 'boxes',
      title: 'Durante reset_head(&p)',
      caption: '`head` aponta para `p`, e `p` aponta para `a`. `*head = NULL` corta a seta de p para a, sem tocar em a.',
      boxes: [
        { id: 'h', label: 'head', type: 'node_t**', fields: [{ name: '', to: 'p' }], col: 0, variant: 'handle' },
        { id: 'p', label: 'p', type: 'node_t*', fields: [{ name: '', to: 'a' }], col: 1, variant: 'var' },
        { id: 'a', label: 'a', type: 'node_t', fields: [{ name: 'value', value: '42' }, { name: 'next', to: 'NULL' }], col: 2, variant: 'node' },
      ],
    },
  ],
  keyPoints: [
    '`p->campo` ≡ `(*p).campo`.',
    'struct → ponto; ponteiro para struct → seta.',
    'Antes de cada `->`, o ponteiro precisa ser diferente de NULL.',
    'Para mudar um ponteiro do chamador, receba `T **` e atribua a `*pp`.',
  ],
  pitfalls: [
    '`p.value` com p ponteiro (deveria ser `p->value`).',
    '`pp->value` com pp do tipo `T**` (deveria ser `(*pp)->value`).',
    'Ler `node->next` quando node já é NULL (fim da lista).',
  ],
  quiz: [
    {
      prompt: 'Qual expressão é equivalente a `p->value`?',
      options: ['*p.value', '(*p).value', '&p.value', 'p.value'],
      correct: 1,
      explanation: 'Os parênteses são necessários: `*p.value` seria interpretado como `*(p.value)`, porque o ponto tem precedência maior.',
    },
    {
      prompt: 'Por que reset_head recebe `node_t **` e não `node_t *`?',
      options: [
        'Porque é mais rápido.',
        'Para poder alterar o ponteiro p do chamador (e não só uma cópia dele).',
        'Porque a struct é grande.',
        'Porque NULL só pode ser atribuído a ponteiros duplos.',
      ],
      correct: 1,
      explanation: 'Com `node_t *head`, a função receberia uma cópia de p e só mudaria a cópia.',
    },
    {
      prompt: 'Se `node_t **pp = &p;`, como ler o value do nó apontado por p através de pp?',
      options: ['pp->value', '*pp.value', '(*pp)->value', '**pp->value'],
      correct: 2,
      explanation: '`*pp` é p (um node_t*); depois `->value` acessa o campo.',
    },
  ],
  sources: ['A2023_02_cptr.pdf (Puntatori a strutture; do_something(int** p))', 'ALGO_05_stack.pdf (nó da pilha)'],
};
