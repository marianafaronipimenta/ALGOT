/**
 * Progresso do aluno, persistido em localStorage (somente neste navegador).
 * Todas as leituras/escritas são protegidas por try/catch: em janelas privadas
 * ou com armazenamento bloqueado o app funciona, só não lembra o progresso.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EXERCISES } from '../content/exercises';
import { LESSONS } from '../content/lessons';
import type { Level } from '../content/types';

const STORAGE_KEY = 'algolab.progress.v1';

export interface LessonProgress {
  completed: boolean;
  completedAt?: string;
  /** índice da pergunta -> respondeu corretamente */
  quiz: Record<number, boolean>;
}

export interface ExerciseProgress {
  traceSolved: boolean;
  attempts: number;
  solved: boolean;
  solvedInExamMode: boolean;
  bestPassed: number;
  total: number;
  hintsShown: number;
  draft?: string;
}

export interface ProgressState {
  version: 1;
  lessons: Record<string, LessonProgress>;
  exercises: Record<string, ExerciseProgress>;
  translatorSeen: string[];
}

const EMPTY: ProgressState = { version: 1, lessons: {}, exercises: {}, translatorSeen: [] };

function load(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1) return EMPTY;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function save(s: ProgressState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* armazenamento indisponível: segue sem persistir */
  }
}

export const emptyExercise = (): ExerciseProgress => ({
  traceSolved: false,
  attempts: 0,
  solved: false,
  solvedInExamMode: false,
  bestPassed: 0,
  total: 0,
  hintsShown: 0,
});

interface ProgressApi {
  state: ProgressState;
  lesson(id: string): LessonProgress;
  exercise(id: string): ExerciseProgress;
  answerQuiz(lessonId: string, q: number, correct: boolean): void;
  completeLesson(lessonId: string, done: boolean): void;
  updateExercise(id: string, patch: (p: ExerciseProgress) => ExerciseProgress): void;
  markTranslatorSeen(id: string): void;
  reset(): void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load);
  useEffect(() => save(state), [state]);

  const lesson = useCallback((id: string) => state.lessons[id] ?? { completed: false, quiz: {} }, [state]);
  const exercise = useCallback((id: string) => state.exercises[id] ?? emptyExercise(), [state]);

  const api = useMemo<ProgressApi>(
    () => ({
      state,
      lesson,
      exercise,
      answerQuiz(lessonId, q, correct) {
        setState((s) => {
          const cur = s.lessons[lessonId] ?? { completed: false, quiz: {} };
          return { ...s, lessons: { ...s.lessons, [lessonId]: { ...cur, quiz: { ...cur.quiz, [q]: correct || !!cur.quiz[q] } } } };
        });
      },
      completeLesson(lessonId, done) {
        setState((s) => {
          const cur = s.lessons[lessonId] ?? { completed: false, quiz: {} };
          return {
            ...s,
            lessons: { ...s.lessons, [lessonId]: { ...cur, completed: done, completedAt: done ? new Date().toISOString() : undefined } },
          };
        });
      },
      updateExercise(id, patch) {
        setState((s) => ({ ...s, exercises: { ...s.exercises, [id]: patch(s.exercises[id] ?? emptyExercise()) } }));
      },
      markTranslatorSeen(id) {
        setState((s) => (s.translatorSeen.includes(id) ? s : { ...s, translatorSeen: [...s.translatorSeen, id] }));
      },
      reset() {
        setState(EMPTY);
      },
    }),
    [state, lesson, exercise],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress fora do ProgressProvider');
  return v;
}

// ---------------- estatísticas derivadas ----------------

export interface LevelInfo {
  level: Level;
  name: string;
  goal: string;
}

export const LEVELS: Record<Level, { name: string; description: string }> = {
  1: { name: 'Entender e rastrear', description: 'Ler código C e prever o que ele faz.' },
  2: { name: 'Completar linhas', description: 'Preencher uma ou duas linhas que faltam.' },
  3: { name: 'Implementar funções', description: 'Escrever uma função completa a partir da assinatura.' },
  4: { name: 'Condições de exame', description: 'Implementar sem dicas, como no exame.' },
};

/** Nível atual = o primeiro patamar ainda não concluído (critério transparente, mostrado na página de progresso). */
export function computeLevel(s: ProgressState): LevelInfo {
  const ex = (id: string) => s.exercises[id] ?? emptyExercise();
  const tracesDone = EXERCISES.every((e) => ex(e.id).traceSolved);
  if (!tracesDone) return { level: 1, ...pick(1), goal: 'Responda os aquecimentos de rastreamento (nível 1) dos exercícios.' };
  const l2 = EXERCISES.filter((e) => e.level === 2);
  if (!l2.every((e) => ex(e.id).solved)) return { level: 2, ...pick(2), goal: 'Resolva os exercícios de nível 2 (completar linhas).' };
  const l3 = EXERCISES.filter((e) => e.level === 3);
  if (!l3.every((e) => ex(e.id).solved)) return { level: 3, ...pick(3), goal: 'Resolva todos os exercícios de nível 3 (função completa).' };
  return { level: 4, ...pick(4), goal: EXERCISES.some((e) => ex(e.id).solvedInExamMode) ? 'Continue praticando no modo exame.' : 'Resolva um exercício no modo exame (sem dicas).' };
}
function pick(l: Level) {
  return { name: LEVELS[l].name };
}

export function stats(s: ProgressState) {
  const lessonsDone = LESSONS.filter((l) => s.lessons[l.id]?.completed).length;
  const exercisesSolved = EXERCISES.filter((e) => s.exercises[e.id]?.solved).length;
  const tracesSolved = EXERCISES.filter((e) => s.exercises[e.id]?.traceSolved).length;
  const attempts = EXERCISES.reduce((n, e) => n + (s.exercises[e.id]?.attempts ?? 0), 0);
  return {
    lessonsDone,
    lessonsTotal: LESSONS.length,
    exercisesSolved,
    exercisesTotal: EXERCISES.length,
    tracesSolved,
    attempts,
    translatorSeen: s.translatorSeen.length,
  };
}
