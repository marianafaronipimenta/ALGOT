/**
 * Explicações didáticas dos erros detectados pelo simulador.
 * O motor gera uma mensagem curta e específica; aqui fica o "porquê" e o "como corrigir".
 */
import type { ErrorCode, WarningCode } from '../engine/errors';

export interface ErrorExplanation {
  title: string;
  /** O que isso significa, em linguagem simples. */
  meaning: string;
  /** Como costuma ser corrigido. */
  fix: string;
  /** Como esse erro apareceria num ambiente C real. */
  realC?: string;
}

export const ERROR_CATALOG: Record<ErrorCode, ErrorExplanation> = {
  SYNTAX: {
    title: 'Erro de sintaxe',
    meaning: 'O código não segue a gramática de C, então nem chega a ser executado. Muitas vezes o problema real está na linha ANTERIOR à indicada (um ; ou uma } faltando).',
    fix: 'Confira ponto e vírgula no fim das instruções, pareamento de ( ) e { }, e se os nomes estão escritos certo.',
    realC: 'gcc: "error: expected \';\' before ..."',
  },
  UNSUPPORTED: {
    title: 'Recurso fora do simulador',
    meaning: 'Este é um recurso válido de C, mas o simulador do ALGOLAB ainda não o implementa (ele cobre um subconjunto de C focado em ponteiros e structs).',
    fix: 'Reescreva com os recursos suportados (ponteiros, structs, if/while/for). Os exercícios desta fase não precisam desse recurso.',
  },
  UNDECLARED: {
    title: 'Nome não declarado',
    meaning: 'Você usou uma variável ou função que não existe neste ponto do código. Em C, toda variável precisa ser declarada (com tipo) antes do uso.',
    fix: 'Declare a variável (ex.: `upo_list_node_t *node = ...;`) ou corrija o nome. Atenção a maiúsculas/minúsculas e ao escopo: variáveis declaradas dentro de { } só existem ali.',
    realC: 'gcc: "error: \'x\' undeclared"',
  },
  REDECLARED: {
    title: 'Declaração repetida',
    meaning: 'O mesmo nome foi declarado duas vezes no mesmo escopo.',
    fix: 'Declare uma vez só; nas próximas vezes apenas atribua (sem repetir o tipo).',
    realC: 'gcc: "error: redefinition of \'x\'"',
  },
  UNKNOWN_TYPE: {
    title: 'Tipo desconhecido',
    meaning: 'O nome usado como tipo não existe. Os tipos válidos são os de C (int, size_t, ...) e os definidos no header com typedef/struct.',
    fix: 'Copie o nome do tipo exatamente como está no header (ex.: `upo_list_node_t`, com _t no final).',
  },
  NULL_DEREF: {
    title: 'Acesso através de NULL',
    meaning: 'Um ponteiro que vale NULL não aponta para nada. Usar `p->campo` ou `*p` com p == NULL é tentar ler um lugar que não existe.',
    fix: 'Antes de usar `p->...`, garanta que `p != NULL`. Em laços, teste `node != NULL` antes (e à esquerda do &&) de ler `node->value`.',
    realC: 'Segmentation fault (core dumped). O valgrind mostraria "Invalid read of size ...".',
  },
  WILD_POINTER: {
    title: 'Ponteiro não inicializado (wild pointer)',
    meaning: 'O ponteiro foi declarado mas nunca recebeu um endereço. Em C ele contém "lixo": pode apontar para qualquer lugar.',
    fix: 'Inicialize sempre: `T *p = NULL;` ou `T *p = list->head;`.',
    realC: 'Comportamento indefinido: às vezes funciona, às vezes Segmentation fault. O gcc com -Wall pode avisar "may be used uninitialized".',
  },
  UNINIT_READ: {
    title: 'Variável lida antes de receber valor',
    meaning: 'Em C, variáveis locais NÃO começam em 0. Ler uma variável que nunca recebeu valor dá um resultado imprevisível.',
    fix: 'Inicialize na declaração, ex.: `size_t n = 0;`.',
    realC: 'Comportamento indefinido; valgrind: "Conditional jump or move depends on uninitialised value(s)".',
  },
  USE_AFTER_FREE: {
    title: 'Uso de memória já liberada (dangling pointer)',
    meaning: 'Depois de `free(p)`, o bloco volta para o sistema. O ponteiro p continua com o endereço antigo, mas usá-lo é inválido.',
    fix: 'Leia o que precisar ANTES do free (ex.: salve `node->next` numa variável temporária), e não use o ponteiro depois.',
    realC: 'valgrind: "Invalid read ... Address ... is inside a block of size ... free\'d".',
  },
  DOUBLE_FREE: {
    title: 'free duas vezes',
    meaning: 'O mesmo bloco foi liberado duas vezes.',
    fix: 'Cada malloc corresponde a exatamente um free. Depois de liberar, você pode fazer `p = NULL;` para evitar repetir.',
    realC: '"free(): double free detected in tcache 2" e o programa aborta.',
  },
  INVALID_FREE: {
    title: 'free de memória que não veio do malloc',
    meaning: 'free só pode receber ponteiros devolvidos por malloc/calloc/realloc (ou NULL).',
    fix: 'Não libere endereços de variáveis locais (&x) nem memória que pertence a outra parte do programa.',
  },
  VOID_DEREF: {
    title: 'Desreferência de void*',
    meaning: '`void*` é um ponteiro genérico: o compilador não sabe o tipo nem o tamanho do que está lá, então não deixa usar * ou -> diretamente.',
    fix: 'Converta antes: `*((int*) data)` ou `int *ip = data; ... *ip`. Use o tipo REAL do dado.',
    realC: 'gcc: "warning: dereferencing \'void *\' pointer" / "error: invalid use of void expression".',
  },
  ARROW_ON_STRUCT: {
    title: '-> usado em uma struct (não ponteiro)',
    meaning: '`->` serve para acessar campos ATRAVÉS de um ponteiro. Se a variável é a própria struct, usa-se o ponto.',
    fix: 'Struct: `s.campo`. Ponteiro para struct: `p->campo` (que é o mesmo que `(*p).campo`).',
    realC: 'gcc: "error: invalid type argument of \'->\' (have \'struct ...\')"',
  },
  DOT_ON_POINTER: {
    title: '. usado em um ponteiro',
    meaning: 'A variável é um PONTEIRO para struct, então o campo deve ser acessado com `->`. Atenção: os handles `upo_X_t` são typedefs de ponteiro, mesmo sem * visível.',
    fix: 'Troque `p.campo` por `p->campo`.',
    realC: 'gcc: "error: \'p\' is a pointer; did you mean to use \'->\'?"',
  },
  UNKNOWN_FIELD: {
    title: 'Campo inexistente',
    meaning: 'A struct não tem um campo com esse nome. É comum confundir os campos da struct da LISTA (head) com os do NÓ (value, next).',
    fix: 'Volte ao header e veja os campos de cada struct. Confira também se o ponteiro é do tipo que você imagina.',
    realC: 'gcc: "error: \'struct ...\' has no member named \'...\'"',
  },
  INCOMPLETE_TYPE: {
    title: 'Tipo incompleto',
    meaning: 'A struct foi declarada mas seus campos não são visíveis aqui (information hiding). Só o arquivo de implementação, que inclui o header privado, enxerga os campos.',
    fix: 'No código cliente, use as funções da API em vez de acessar campos.',
    realC: 'gcc: "error: dereferencing pointer to incomplete type"',
  },
  TYPE_MISMATCH: {
    title: 'Tipos incompatíveis',
    meaning: 'Um valor de um tipo foi usado onde se espera outro: por exemplo, retornar um ponteiro numa função que retorna int, ou guardar um número num ponteiro.',
    fix: 'Confira o tipo de retorno e o tipo de cada variável. Para responder "sim/não", retorne o resultado de uma comparação (1/0), não um ponteiro.',
    realC: 'gcc: "warning: returning \'... *\' from a function with return type \'int\' makes integer from pointer without a cast". Warnings assim quase sempre são bugs.',
  },
  INCOMPATIBLE_PTR: {
    title: 'Ponteiros de tipos diferentes',
    meaning: 'Ponteiros para structs diferentes não são intercambiáveis. Exemplo clássico: `upo_list_t` (aponta para a struct da LISTA) e `upo_list_node_t*` (aponta para um NÓ).',
    fix: 'Use o tipo do nó para percorrer os nós (`upo_list_node_t *node = list->head;`).',
    realC: 'gcc: "warning: initialization of \'A *\' from incompatible pointer type \'B *\'"',
  },
  NOT_LVALUE: {
    title: 'Não é uma posição de memória',
    meaning: 'Só dá para atribuir (=) ou pegar o endereço (&) de algo que ocupa memória: variáveis, *p, p->campo.',
    fix: 'Verifique o lado esquerdo da atribuição.',
  },
  CONST_ASSIGN: {
    title: 'Modificação de algo const',
    meaning: '`const` promete que aquele objeto não muda. Em `const upo_list_t list`, o const vale para o PONTEIRO list (não dá para fazer list = ...).',
    fix: 'Use uma variável auxiliar (ex.: `upo_list_node_t *node = list->head;`) em vez de reatribuir o parâmetro.',
    realC: 'gcc: "error: assignment of read-only parameter"',
  },
  MISSING_RETURN: {
    title: 'Faltou return',
    meaning: 'A função promete devolver um valor, mas algum caminho de execução chega ao fim sem `return`.',
    fix: 'Garanta um return em TODOS os caminhos, inclusive depois do laço (ex.: `return NULL;` quando não encontrou).',
    realC: 'gcc -Wall: "warning: control reaches end of non-void function". O valor devolvido seria lixo.',
  },
  RETURN_VALUE_IN_VOID: {
    title: 'return com valor numa função void',
    meaning: 'Funções void não devolvem nada.',
    fix: 'Use apenas `return;` ou mude a lógica.',
  },
  ARG_COUNT: {
    title: 'Número de argumentos errado',
    meaning: 'A chamada passa mais ou menos argumentos do que a função declara.',
    fix: 'Confira o protótipo no header.',
  },
  NOT_A_FUNCTION: {
    title: 'Chamada de algo que não é função',
    meaning: 'Os parênteses ( ) depois de um nome significam "chamar". Esse nome não é uma função.',
    fix: 'Verifique o nome e se faltou um operador.',
  },
  MISSING_FUNCTION: {
    title: 'Função não encontrada',
    meaning: 'A função pedida não está definida no seu código (talvez a assinatura tenha sido apagada ou o nome mudou).',
    fix: 'Mantenha a assinatura exatamente como no esqueleto e escreva o corpo entre { }.',
  },
  INFINITE_LOOP: {
    title: 'Laço infinito (provável)',
    meaning: 'A execução não terminou num número razoável de passos. Quase sempre a variável da condição nunca muda.',
    fix: 'Dentro do while, avance o ponteiro: `node = node->next;`. Confira se a condição pode ficar falsa.',
    realC: 'O programa "trava" e precisa ser interrompido com Ctrl+C.',
  },
  STACK_OVERFLOW: {
    title: 'Recursão sem fim',
    meaning: 'A função chama a si mesma vezes demais: falta um caso base, ou a chamada não se aproxima dele.',
    fix: 'Comece pela condição de parada (ex.: `if (node == NULL) return 0;`) e chame a recursão com `node->next`.',
    realC: 'Segmentation fault por estouro da pilha de chamadas.',
  },
  DIV_BY_ZERO: {
    title: 'Divisão por zero',
    meaning: 'Dividir inteiros por zero é inválido em C.',
    fix: 'Teste o divisor antes.',
    realC: 'Floating point exception (core dumped).',
  },
  ABORT: {
    title: 'O programa foi abortado',
    meaning: 'abort() ou exit() encerrou a execução. No esqueleto do professor, `fprintf(stderr, "To be implemented!"); abort();` marca uma função ainda não implementada.',
    fix: 'Remova as linhas do esqueleto (como o comentário TO STUDENTS pede) e escreva a sua implementação.',
  },
};

export const WARNING_CATALOG: Record<WarningCode, ErrorExplanation> = {
  ASSIGN_IN_CONDITION: {
    title: '= dentro de uma condição',
    meaning: '`if (p = NULL)` ATRIBUI NULL a p (e a condição fica sempre falsa). Para comparar use `==`.',
    fix: 'Troque = por ==.',
    realC: 'gcc -Wall: "suggest parentheses around assignment used as truth value"',
  },
  UNUSED_RESULT: {
    title: 'Resultado não usado',
    meaning: 'A expressão calcula algo mas o resultado é descartado.',
    fix: 'Verifique se faltou uma atribuição ou um return.',
  },
};
