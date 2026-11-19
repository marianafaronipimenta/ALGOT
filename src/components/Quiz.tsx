import { useId, useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { RichText } from './RichText';

export interface QuizItemProps {
  prompt: string;
  code?: string;
  options: string[];
  correct: number;
  explanation: string;
  /** Já respondida corretamente antes (progresso salvo). */
  solvedBefore?: boolean;
  onAnswer: (correct: boolean) => void;
  index?: number;
}

/** Pergunta de múltipla escolha com feedback imediato e nova tentativa. */
export function QuizItem({ prompt, code, options, correct, explanation, solvedBefore, onAnswer, index }: QuizItemProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState(0);
  const name = useId();
  const answered = picked !== null;
  const isRight = picked === correct;

  return (
    <fieldset className={`quiz-item${answered ? (isRight ? ' right' : ' wrong') : ''}`}>
      <legend>
        {index !== undefined && <span className="qnum">Q{index + 1}</span>}
        <RichText text={prompt} />
        {solvedBefore && !answered && <span className="badge ok small">já acertou</span>}
      </legend>
      {code && <CodeBlock code={code} compact />}
      <div className="options">
        {options.map((o, i) => (
          <label key={i} className={`option${answered && i === picked ? (isRight ? ' right' : ' wrong') : ''}${answered && isRight && i === correct ? ' right' : ''}`}>
            <input
              type="radio"
              name={name}
              checked={picked === i}
              onChange={() => {
                setPicked(i);
                if (i !== correct) setWrong((w) => w + 1);
                onAnswer(i === correct);
              }}
            />
            <span>
              <RichText text={o} />
            </span>
          </label>
        ))}
      </div>
      <div aria-live="polite">
        {answered && (
          <div className={`feedback ${isRight ? 'ok' : 'bad'}`}>
            <strong>{isRight ? 'Correto.' : 'Ainda não.'}</strong>{' '}
            {isRight ? (
              <RichText text={explanation} />
            ) : wrong >= 2 ? (
              <>
                A resposta certa é a opção {correct + 1}. <RichText text={explanation} />
              </>
            ) : (
              'Releia o código com calma e tente outra opção.'
            )}
          </div>
        )}
      </div>
    </fieldset>
  );
}
