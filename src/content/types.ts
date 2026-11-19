/**
 * Tipos do conteúdo didático. Todo o conteúdo (lições, exemplos do Code
 * Translator, exercícios) fica em src/content/ e é independente da UI.
 */
import type { RunnableExercise } from '../engine/runner';

// ---------- diagramas ----------
export interface MemoryRow {
  name: string;
  addr: string;
  value: string;
  /** Nome da linha para a qual o valor aponta (desenha a seta). */
  pointsTo?: string;
  highlight?: boolean;
}

export interface DiagramField {
  name: string;
  value?: string;
  /** id da caixa de destino, ou 'NULL'. */
  to?: string;
}

export interface DiagramBox {
  id: string;
  /** Rótulo acima da caixa (nome da variável), ex.: "list". */
  label?: string;
  /** Tipo mostrado no cabeçalho da caixa, ex.: "struct upo_list_s". */
  type: string;
  fields: DiagramField[];
  col: number;
  row?: number;
  variant?: 'var' | 'handle' | 'node' | 'data' | 'freed';
}

export type Diagram =
  | { kind: 'memory'; title: string; caption?: string; rows: MemoryRow[] }
  | { kind: 'boxes'; title: string; caption?: string; boxes: DiagramBox[] };

// ---------- lições ----------
export interface QuizQuestion {
  prompt: string;
  code?: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface LineNote {
  /** Linha inicial (1-based) e final opcional do exemplo. */
  from: number;
  to?: number;
  text: string;
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  /** Termos em italiano usados nos slides do curso. */
  terms: { it: string; pt: string }[];
  /** Parágrafos; aceitam `código` e **negrito**. */
  intro: string[];
  example: { filename: string; code: string; lineNotes: LineNote[] };
  diagrams?: Diagram[];
  tables?: { title: string; headers: string[]; rows: string[][] }[];
  keyPoints: string[];
  pitfalls: string[];
  quiz: QuizQuestion[];
  /** Material do curso relacionado (nome dos arquivos de slides). */
  sources: string[];
}

// ---------- Code Translator ----------
export interface TranslatorRow {
  /** Linha no estilo do professor (convenções UPO). */
  upo: string;
  /** Mesma linha com nomes genéricos (semântica idêntica). */
  generic: string;
  /** Explicação em português (vazio = linha trivial). */
  note: string;
}

export interface TranslatorExample {
  id: string;
  title: string;
  summary: string;
  /** Mapeamento de nomes: UPO -> genérico. */
  renames: { upo: string; generic: string; kind: string }[];
  rows: TranslatorRow[];
  takeaways: string[];
  diagram?: Diagram;
}

// ---------- exercícios ----------
export type Level = 1 | 2 | 3 | 4;

export interface TraceQuestion {
  prompt: string;
  code: string;
  diagram?: Diagram;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Exercise extends RunnableExercise {
  id: string;
  level: Level;
  title: string;
  summary: string;
  concepts: string[];
  /** Assinatura exata, como estaria no header. */
  signature: string;
  task: string[];
  /** Header mostrado ao aluno (o mesmo texto é usado pelo simulador). */
  header: string;
  starterCode: string;
  /** Diagrama da estrutura de dados envolvida. */
  diagram?: Diagram;
  /** Aquecimento de nível 1 (entender e rastrear). */
  trace: TraceQuestion;
  hints: string[];
  solution: string;
  solutionNotes: LineNote[];
  /** Dicas específicas deste exercício para certos códigos de erro. */
  errorTips?: Partial<Record<string, string>>;
}
