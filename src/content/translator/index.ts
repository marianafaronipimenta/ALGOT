/**
 * Exemplos do Code Translator.
 *
 * Todo o código aqui é ILUSTRATIVO, escrito para o ALGOLAB no estilo de nomes
 * do curso (prefixo upo_, sufixos _s/_t/_impl). Não é código original do
 * toolkit do professor; as structs seguem o que aparece nos slides.
 * Cada linha "upo" tem uma linha "generic" com a MESMA semântica.
 */
import type { TranslatorExample } from '../types';

const typedefs: TranslatorExample = {
  id: 'bst-typedefs',
  title: 'Tipos do BST: nó × handle',
  summary: 'As duas linhas mais importantes para ler código de árvore: um typedef cria o tipo do NÓ, o outro cria o HANDLE (um ponteiro).',
  renames: [
    { upo: 'struct upo_bst_node_s', generic: 'struct tree_node_s', kind: 'tag da struct do nó' },
    { upo: 'upo_bst_node_t', generic: 'Node', kind: 'tipo do nó (struct)' },
    { upo: 'struct upo_bst_s', generic: 'struct tree_s', kind: 'tag da struct da árvore' },
    { upo: 'upo_bst_t', generic: 'Tree', kind: 'handle (ponteiro)' },
    { upo: 'upo_bst_comparator_t', generic: 'Comparator', kind: 'ponteiro para função' },
  ],
  rows: [
    { upo: 'typedef int (*upo_bst_comparator_t)(const void*, const void*);', generic: 'typedef int (*Comparator)(const void*, const void*);', note: 'Tipo "ponteiro para função que recebe dois const void* e devolve int". As chaves são genéricas, então a árvore precisa de alguém que saiba compará-las.' },
    { upo: '', generic: '', note: '' },
    { upo: 'struct upo_bst_node_s {', generic: 'struct tree_node_s {', note: 'Define o NÓ da árvore. `upo_bst_node_s` é apenas o nome (tag) da struct.' },
    { upo: '    void *key;', generic: '    void *key;', note: 'Chave genérica (ponteiro para o dado real).' },
    { upo: '    void *value;', generic: '    void *value;', note: 'Valor associado à chave, também genérico.' },
    { upo: '    struct upo_bst_node_s *left;', generic: '    struct tree_node_s *left;', note: 'Filho esquerdo: ponteiro para outro nó (ou NULL). Chaves MENORES ficam à esquerda.' },
    { upo: '    struct upo_bst_node_s *right;', generic: '    struct tree_node_s *right;', note: 'Filho direito: chaves MAIORES ficam à direita.' },
    { upo: '};', generic: '};', note: '' },
    { upo: 'typedef struct upo_bst_node_s upo_bst_node_t;', generic: 'typedef struct tree_node_s Node;', note: 'TIPO DO NÓ. Sem `*`: `upo_bst_node_t` é a struct inteira. Para apontar um nó você escreve `upo_bst_node_t *n`.' },
    { upo: '', generic: '', note: '' },
    { upo: 'struct upo_bst_s {', generic: 'struct tree_s {', note: 'A struct da ÁRVORE como um todo (não é um nó).' },
    { upo: '    upo_bst_node_t *root;', generic: '    Node *root;', note: 'Ponteiro para o nó raiz (NULL se a árvore está vazia).' },
    { upo: '    upo_bst_comparator_t key_cmp;', generic: '    Comparator key_cmp;', note: 'A função de comparação usada em todas as buscas e inserções.' },
    { upo: '};', generic: '};', note: '' },
    { upo: 'typedef struct upo_bst_s* upo_bst_t;', generic: 'typedef struct tree_s* Tree;', note: 'HANDLE OPACO. Note o `*` DENTRO do typedef: `upo_bst_t` já é um ponteiro para a struct da árvore. Por isso se escreve `tree->root`, nunca `tree.root`.' },
  ],
  takeaways: [
    '`upo_bst_node_t` (sem *) é um NÓ; `upo_bst_t` (com * escondido) é um PONTEIRO para a árvore.',
    'Para percorrer use `upo_bst_node_t *node = tree->root;`, nunca `upo_bst_t node`.',
    '`upo` é só um prefixo de nomes do curso, não uma palavra-chave de C.',
  ],
  diagram: {
    kind: 'boxes',
    title: 'tree → struct upo_bst_s → nós',
    caption: 'O handle `tree` aponta para a struct da árvore; `root` aponta para o primeiro nó; cada nó aponta para seus filhos.',
    boxes: [
      { id: 't', label: 'tree', type: 'upo_bst_t', fields: [{ name: '', to: 's' }], col: 0, variant: 'handle' },
      { id: 's', type: 'struct upo_bst_s', fields: [{ name: 'root', to: 'r' }, { name: 'key_cmp', value: 'int_compare' }], col: 1, variant: 'var' },
      { id: 'r', type: 'upo_bst_node_t', fields: [{ name: 'key', value: '6' }, { name: 'left', to: 'NULL' }, { name: 'right', to: 'NULL' }], col: 2, variant: 'node' },
    ],
  },
};

const subtreeMax: TranslatorExample = {
  id: 'bst-subtree-max',
  title: 'upo_bst_subtree_max: maior chave de uma subárvore',
  summary: 'Função auxiliar que recebe um NÓ e desce sempre para a direita; a função pública recebe a ÁRVORE e delega.',
  renames: [
    { upo: 'upo_bst_subtree_max', generic: 'subtree_max', kind: 'auxiliar privada (recebe nó)' },
    { upo: 'upo_bst_max', generic: 'tree_max', kind: 'função pública (recebe árvore)' },
    { upo: 'upo_bst_node_t', generic: 'Node', kind: 'tipo do nó' },
    { upo: 'upo_bst_t', generic: 'Tree', kind: 'handle' },
  ],
  rows: [
    { upo: 'static upo_bst_node_t* upo_bst_subtree_max(upo_bst_node_t *node)', generic: 'static Node* subtree_max(Node *node)', note: '`static`: só visível neste .c (privada). Recebe a raiz de uma SUBÁRVORE e devolve um ponteiro para o nó com a maior chave.' },
    { upo: '{', generic: '{', note: '' },
    { upo: '    if (node == NULL)', generic: '    if (node == NULL)', note: 'Subárvore vazia: não existe máximo.' },
    { upo: '        return NULL;', generic: '        return NULL;', note: 'NULL é o retorno convencional para "não existe".' },
    { upo: '    while (node->right != NULL)', generic: '    while (node->right != NULL)', note: 'Propriedade do BST: tudo à DIREITA é maior. Enquanto existir filho direito, ainda há uma chave maior.' },
    { upo: '        node = node->right;', generic: '        node = node->right;', note: 'Desce um nível para a direita. `node` é uma cópia local: a árvore não muda.' },
    { upo: '    return node;', generic: '    return node;', note: 'O nó sem filho direito é o máximo (ele pode ter filho esquerdo, que é menor).' },
    { upo: '}', generic: '}', note: '' },
    { upo: '', generic: '', note: '' },
    { upo: 'void* upo_bst_max(const upo_bst_t tree)', generic: 'void* tree_max(const Tree tree)', note: 'Pública: recebe a ÁRVORE. Devolve a chave (void*) ou NULL.' },
    { upo: '{', generic: '{', note: '' },
    { upo: '    if (tree == NULL)', generic: '    if (tree == NULL)', note: 'Sem árvore, nada a fazer. Necessário antes de ler `tree->root`.' },
    { upo: '        return NULL;', generic: '        return NULL;', note: '' },
    { upo: '    upo_bst_node_t *max_node = upo_bst_subtree_max(tree->root);', generic: '    Node *max_node = subtree_max(tree->root);', note: 'Passa a RAIZ (um nó), não a árvore. Esta é a ponte entre o mundo "árvore" e o mundo "nós".' },
    { upo: '    return max_node != NULL ? max_node->key : NULL;', generic: '    return max_node != NULL ? max_node->key : NULL;', note: 'Se a árvore estava vazia, max_node é NULL e não podemos ler ->key.' },
    { upo: '}', generic: '}', note: '' },
  ],
  takeaways: [
    'Em um BST, chaves MAIORES ficam na subárvore DIREITA; o máximo é o nó mais à direita.',
    'Função pública recebe a árvore; a auxiliar recebe um nó (aqui iterativa; poderia ser recursiva com sufixo _impl).',
    'Antes de cada `->`, garanta que o ponteiro não é NULL.',
  ],
  diagram: {
    kind: 'boxes',
    title: 'Caminho até o máximo',
    caption: 'A partir da raiz 6: direita → 7, direita → 8. O nó 8 não tem filho direito: é o máximo. (Os nós 2, 1 e 4 nem são visitados.)',
    boxes: [
      { id: 'n6', label: 'root', type: 'nó', fields: [{ name: 'key', value: '6' }, { name: 'left', to: 'n2' }, { name: 'right', to: 'n7' }], col: 1, row: 0, variant: 'node' },
      { id: 'n2', type: 'nó', fields: [{ name: 'key', value: '2' }, { name: 'left', value: '…' }, { name: 'right', value: '…' }], col: 0, row: 1, variant: 'var' },
      { id: 'n7', type: 'nó', fields: [{ name: 'key', value: '7' }, { name: 'left', to: 'NULL' }, { name: 'right', to: 'n8' }], col: 2, row: 1, variant: 'node' },
      { id: 'n8', label: 'máximo', type: 'nó', fields: [{ name: 'key', value: '8' }, { name: 'left', to: 'NULL' }, { name: 'right', to: 'NULL' }], col: 3, row: 2, variant: 'handle' },
    ],
  },
};

const push: TranslatorExample = {
  id: 'stack-push',
  title: 'upo_stack_push: inserir no topo',
  summary: 'Três atribuições de ponteiro, na ordem certa, ligam um nó novo no topo da pilha.',
  renames: [
    { upo: 'upo_stack_t', generic: 'Stack', kind: 'handle' },
    { upo: 'upo_stack_node_t', generic: 'StackNode', kind: 'tipo do nó' },
    { upo: 'upo_stack_node_create', generic: 'node_create', kind: 'auxiliar que faz malloc do nó' },
    { upo: 'upo_stack_push', generic: 'stack_push', kind: 'operação pública' },
  ],
  rows: [
    { upo: 'void upo_stack_push(upo_stack_t stack, void *data)', generic: 'void stack_push(Stack stack, void *data)', note: 'Recebe o handle da pilha e um ponteiro genérico para o dado. Não devolve nada.' },
    { upo: '{', generic: '{', note: '' },
    { upo: '    if (stack == NULL)', generic: '    if (stack == NULL)', note: 'Proteção: sem pilha não há onde inserir (evita `stack->` com NULL).' },
    { upo: '        return;', generic: '        return;', note: '`return;` sem valor, pois a função é void.' },
    { upo: '    upo_stack_node_t *node = upo_stack_node_create(data);', generic: '    StackNode *node = node_create(data);', note: 'Cria um nó no heap (malloc dentro da auxiliar) com node->data = data e node->next = NULL.' },
    { upo: '    node->next = stack->top;', generic: '    node->next = stack->top;', note: 'PRIMEIRO liga o nó novo ao antigo topo (que pode ser NULL se a pilha estava vazia).' },
    { upo: '    stack->top = node;', generic: '    stack->top = node;', note: 'DEPOIS o topo passa a ser o nó novo. Se invertesse estas duas linhas, perderia o antigo topo.' },
    { upo: '    stack->size += 1;', generic: '    stack->size += 1;', note: 'Mantém o campo size coerente com o número de nós.' },
    { upo: '}', generic: '}', note: '' },
  ],
  takeaways: [
    'A pilha guarda o PONTEIRO do dado (void*), não uma cópia.',
    'Ordem: node->next = top; top = node; size++.',
    'O dado continua sendo do usuário até alguém chamar pop/clear/destroy com destroy_data != 0.',
  ],
  diagram: {
    kind: 'boxes',
    title: 'Depois do push',
    caption: 'O nó novo aponta para o antigo topo; top aponta para o nó novo.',
    boxes: [
      { id: 's', label: 'stack', type: 'struct upo_stack_s', fields: [{ name: 'top', to: 'new' }, { name: 'size', value: '2' }], col: 0, variant: 'var' },
      { id: 'new', label: 'nó novo', type: 'upo_stack_node_t', fields: [{ name: 'data', value: '&dado' }, { name: 'next', to: 'old' }], col: 1, variant: 'handle' },
      { id: 'old', label: 'antigo topo', type: 'upo_stack_node_t', fields: [{ name: 'data', value: '…' }, { name: 'next', to: 'NULL' }], col: 2, variant: 'node' },
    ],
  },
};

const clear: TranslatorExample = {
  id: 'stack-clear',
  title: 'upo_stack_clear: liberar todos os nós',
  summary: 'O padrão "guardar, avançar, liberar" e o parâmetro destroy_data. A condição do laço é sobre `stack->top`, não sobre `stack`.',
  renames: [
    { upo: 'upo_stack_t', generic: 'Stack', kind: 'handle' },
    { upo: 'upo_stack_node_t', generic: 'StackNode', kind: 'tipo do nó' },
    { upo: 'destroy_data', generic: 'free_items', kind: 'flag de posse dos dados' },
  ],
  rows: [
    { upo: 'void upo_stack_clear(upo_stack_t stack, int destroy_data)', generic: 'void stack_clear(Stack stack, int free_items)', note: 'Esvazia a pilha mas mantém a struct da pilha (diferente de destroy). `destroy_data` diz se os dados do usuário também devem ser liberados.' },
    { upo: '{', generic: '{', note: '' },
    { upo: '    if (stack == NULL)', generic: '    if (stack == NULL)', note: '' },
    { upo: '        return;', generic: '        return;', note: '' },
    { upo: '    while (stack->top != NULL) {', generic: '    while (stack->top != NULL) {', note: 'Enquanto houver nós. Atenção: `while (stack != NULL)` seria um erro, porque o ponteiro stack nunca muda dentro do laço.' },
    { upo: '        upo_stack_node_t *node = stack->top;', generic: '        StackNode *node = stack->top;', note: '1) GUARDA o nó do topo numa variável temporária (do tipo NÓ, não upo_stack_t).' },
    { upo: '        stack->top = stack->top->next;', generic: '        stack->top = stack->top->next;', note: '2) AVANÇA o topo enquanto o nó ainda é válido.' },
    { upo: '        if (destroy_data != 0)', generic: '        if (free_items != 0)', note: 'Só libera o dado se a pilha for responsável por ele.' },
    { upo: '            free(node->data);', generic: '            free(node->data);', note: 'Libera o dado ANTES do nó (depois de free(node), node->data não pode mais ser lido).' },
    { upo: '        free(node);', generic: '        free(node);', note: '3) LIBERA o nó guardado.' },
    { upo: '    }', generic: '    }', note: '' },
    { upo: '    stack->size = 0;', generic: '    stack->size = 0;', note: 'A pilha continua existindo, agora vazia (top já é NULL pelo laço).' },
    { upo: '}', generic: '}', note: '' },
  ],
  takeaways: [
    'Guardar → avançar → liberar.',
    'A condição do laço deve depender de algo que MUDA dentro do laço (stack->top).',
    'free(node->data) antes de free(node), e só se destroy_data != 0.',
  ],
};

const put: TranslatorExample = {
  id: 'bst-put',
  title: 'put com _impl: devolver o valor antigo ou NULL',
  summary: 'Uma implementação possível (ilustrativa) de put: recursão em uma função _impl, ponteiro para ponteiro e comparador. Leitura avançada.',
  renames: [
    { upo: 'upo_bst_put', generic: 'tree_put', kind: 'pública' },
    { upo: 'upo_bst_put_impl', generic: 'put_rec', kind: 'privada recursiva' },
    { upo: 'upo_bst_node_create', generic: 'node_create', kind: 'auxiliar ilustrativa (malloc)' },
    { upo: 'upo_bst_comparator_t', generic: 'Comparator', kind: 'ponteiro para função' },
  ],
  rows: [
    { upo: 'static void* upo_bst_put_impl(upo_bst_node_t **node, void *key,', generic: 'static void* put_rec(Node **node, void *key,', note: '`upo_bst_node_t **node`: ponteiro para o PONTEIRO que liga o pai ao filho (ou tree->root). Assim a função pode pendurar um nó novo ali.' },
    { upo: '                              void *value, upo_bst_comparator_t cmp)', generic: '                     void *value, Comparator cmp)', note: 'Recebe também o comparador, para não precisar da árvore inteira.' },
    { upo: '{', generic: '{', note: '' },
    { upo: '    if (*node == NULL) {', generic: '    if (*node == NULL) {', note: 'Chegou a uma posição vazia: a chave não existia.' },
    { upo: '        *node = upo_bst_node_create(key, value);', generic: '        *node = node_create(key, value);', note: 'Escreve no ponteiro do pai (ou em root): o nó novo fica ligado à árvore.' },
    { upo: '        return NULL;', generic: '        return NULL;', note: 'Chave nova: não havia valor anterior.' },
    { upo: '    }', generic: '    }', note: '' },
    { upo: '    int c = cmp(key, (*node)->key);', generic: '    int c = cmp(key, (*node)->key);', note: 'Chama a função comparadora via ponteiro. `(*node)->key`: primeiro * (vira upo_bst_node_t*), depois ->.' },
    { upo: '    if (c < 0)', generic: '    if (c < 0)', note: 'Chave menor: continua à esquerda.' },
    { upo: '        return upo_bst_put_impl(&(*node)->left, key, value, cmp);', generic: '        return put_rec(&(*node)->left, key, value, cmp);', note: 'Passa o ENDEREÇO do campo left, para que a chamada possa alterá-lo.' },
    { upo: '    if (c > 0)', generic: '    if (c > 0)', note: 'Chave maior: continua à direita.' },
    { upo: '        return upo_bst_put_impl(&(*node)->right, key, value, cmp);', generic: '        return put_rec(&(*node)->right, key, value, cmp);', note: '' },
    { upo: '    void *old = (*node)->value;', generic: '    void *old = (*node)->value;', note: 'c == 0: a chave já existe. Guarda o valor antigo antes de substituir.' },
    { upo: '    (*node)->value = value;', generic: '    (*node)->value = value;', note: 'Substitui o valor.' },
    { upo: '    return old;', generic: '    return old;', note: 'Devolve o valor ANTERIOR (o chamador decide se faz free nele).' },
    { upo: '}', generic: '}', note: '' },
    { upo: '', generic: '', note: '' },
    { upo: 'void* upo_bst_put(upo_bst_t tree, void *key, void *value)', generic: 'void* tree_put(Tree tree, void *key, void *value)', note: 'Pública: recebe a árvore.' },
    { upo: '{', generic: '{', note: '' },
    { upo: '    return upo_bst_put_impl(&tree->root, key, value, tree->key_cmp);', generic: '    return put_rec(&tree->root, key, value, tree->key_cmp);', note: 'Começa pelo endereço de root. (Uma versão completa também verificaria tree != NULL.)' },
    { upo: '}', generic: '}', note: '' },
  ],
  takeaways: [
    'Pública recebe a árvore e delega para _impl, que recebe nós.',
    '`T **` permite alterar o ponteiro do pai (inserir um filho).',
    'Ler o \\return: aqui, valor anterior ou NULL. O toolkit pode usar outra estratégia; confira o header real.',
  ],
};

export const TRANSLATOR_EXAMPLES: TranslatorExample[] = [typedefs, subtreeMax, push, clear, put];
