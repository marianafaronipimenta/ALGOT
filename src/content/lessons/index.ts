import type { Lesson } from '../types';
import { lesson1, lesson2, lesson3, lesson4 } from './part1';
import { lesson5, lesson6, lesson7, lesson8 } from './part2';

export const LESSONS: Lesson[] = [lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7, lesson8];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
