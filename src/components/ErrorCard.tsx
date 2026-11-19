import type { EngineError } from '../engine/runner';
import { ERROR_CATALOG } from '../content/errorCatalog';
import { RichText } from './RichText';

/** Mostra um erro do simulador com explicação acessível (ou só o essencial, no modo exame). */
export function ErrorCard({ error, tip, examMode, compile, brief }: { error: EngineError; tip?: string; examMode?: boolean; compile?: boolean; brief?: boolean }) {
  const info = ERROR_CATALOG[error.code];
  return (
    <div className={`error-card${compile ? ' compile' : ''}`} role="alert">
      <div className="ec-head">
        <span className="ec-code">{error.code}</span>
        <strong>{info?.title ?? 'Erro'}</strong>
        {error.line > 0 && <span className="ec-line">linha {error.line}</span>}
      </div>
      <p className="ec-msg">{error.message}</p>
      {brief && !examMode && <p className="ec-real">Mesma explicação do primeiro teste com este erro, acima.</p>}
      {!examMode && !brief && info && (
        <dl className="ec-explain">
          <dt>O que significa</dt>
          <dd>
            <RichText text={info.meaning} />
          </dd>
          <dt>Como corrigir</dt>
          <dd>
            <RichText text={info.fix} />
          </dd>
          {tip && (
            <>
              <dt>Neste exercício</dt>
              <dd>
                <RichText text={tip} />
              </dd>
            </>
          )}
          {info.realC && (
            <>
              <dt>Num ambiente C real</dt>
              <dd className="mono">{info.realC}</dd>
            </>
          )}
        </dl>
      )}
      {examMode && info?.realC && <p className="ec-real mono">{info.realC}</p>}
    </div>
  );
}
