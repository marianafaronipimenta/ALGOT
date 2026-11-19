/** Os seis módulos do ALGOLAB. Só o C Programming Lab e o Progresso estão ativos na fase 1. */

export type ModuleStatus = 'active' | 'upcoming';

export interface ModuleInfo {
  id: string;
  number: number;
  title: string;
  /** Rótulo curto em português. */
  pt: string;
  route: string;
  status: ModuleStatus;
  description: string;
  /** Conteúdo previsto (baseado nos slides do curso), para módulos futuros. */
  planned?: string[];
  icon: 'c' | 'ds' | 'algo' | 'cx' | 'exam' | 'prog';
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'c-lab',
    number: 1,
    title: 'C Programming Lab',
    pt: 'Laboratório de C',
    route: '/c-lab',
    status: 'active',
    description: 'Funções, structs, ponteiros, void*, malloc/free, ADTs e convenções UPO. Inclui o Code Translator e o Function Trainer.',
    icon: 'c',
  },
  {
    id: 'data-structures',
    number: 2,
    title: 'Data Structures',
    pt: 'Estruturas de dados',
    route: '/modulo/data-structures',
    status: 'upcoming',
    description: 'Implementação das funções dos ADTs do curso, uma de cada vez.',
    planned: [
      'Stack ADT completo: push, pop, top, size, clear, destroy (ALGO_05_stack)',
      'Alberi Binari di Ricerca: get, put, insert, delete, min/max, floor/ceiling, keys_range, is_bst (ALGO_07_bst)',
      'Tabelle hash (ALGO_08_hash)',
      'Visualização passo a passo de ponteiros em cada operação',
    ],
    icon: 'ds',
  },
  {
    id: 'algorithms',
    number: 3,
    title: 'Algorithms',
    pt: 'Algoritmos',
    route: '/modulo/algorithms',
    status: 'upcoming',
    description: 'Algoritmos de ordenação e de busca vistos em aula.',
    planned: ['Algoritmos de ordenação (ALGO_06_sort) com visualização', 'Avaliação de expressões postfix com pilha', 'Percursos em árvore (in-order, visitor)'],
    icon: 'algo',
  },
  {
    id: 'complexity',
    number: 4,
    title: 'Complexity Lab',
    pt: 'Complexidade',
    route: '/modulo/complexity',
    status: 'upcoming',
    description: 'Análise assintótica aplicada ao código que você escreve.',
    planned: ['Notação O, Ω, Θ', 'Contagem de passos em laços e recursões', 'Complexidade das operações de BST e hash table'],
    icon: 'cx',
  },
  {
    id: 'exam',
    number: 5,
    title: 'Exam Lab',
    pt: 'Simulado de exame',
    route: '/modulo/exam',
    status: 'upcoming',
    description: 'Simulações no formato do exame prático: enunciado, header dado, função a implementar e tempo.',
    planned: ['Enunciados no formato: algoritmo pedido, exemplo, detalhes', 'Cronômetro e correção automática', 'Opcional futuro: backend com gcc + valgrind reais'],
    icon: 'exam',
  },
  {
    id: 'progress',
    number: 6,
    title: 'Progress',
    pt: 'Progresso',
    route: '/progresso',
    status: 'active',
    description: 'Lições concluídas, exercícios resolvidos e nível atual (salvo neste navegador).',
    icon: 'prog',
  },
];

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}
