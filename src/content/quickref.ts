/** Referência rápida de C exibida no dashboard. */
export interface QuickRef {
  title: string;
  code: string;
  note: string;
  lesson: string;
}

export const QUICK_REF: QuickRef[] = [
  { title: 'Endereço e conteúdo', code: 'int *p = &v;\n*p = 5;', note: '`&v` = endereço de v. `*p` = o que está no endereço p.', lesson: 'ponteiros' },
  { title: 'Ponto × seta', code: 's.campo     /* struct */\np->campo    /* ponteiro */', note: '`p->campo` é o mesmo que `(*p).campo`.', lesson: 'ponteiro-struct' },
  { title: 'Nó × handle', code: 'typedef struct upo_X_node_s upo_X_node_t;\ntypedef struct upo_X_s* upo_X_t;', note: 'O primeiro é a struct do nó; o segundo é um PONTEIRO (handle opaco).', lesson: 'convencoes-upo' },
  { title: 'Percorrer uma lista', code: 'node_t *n = list->head;\nwhile (n != NULL) {\n    /* ... */\n    n = n->next;\n}', note: 'Ponteiro auxiliar do tipo do nó; avance sempre.', lesson: 'ponteiro-struct' },
  { title: 'void* precisa de cast', code: 'int x = *((int*) data);', note: 'Não dá para usar `*` direto em void*.', lesson: 'void-ptr' },
  { title: 'malloc / free', code: 'T *p = malloc(sizeof(T));\nif (p == NULL) abort();\n/* ... */\nfree(p);', note: 'Um free para cada malloc; nada de usar p depois do free.', lesson: 'malloc-free' },
];
