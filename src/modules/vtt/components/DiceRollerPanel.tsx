import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/core/store/appStore';
import { DiceRoller } from '@/core/dice/roller';
import { db } from '@/core/db';
import type { RollRecord } from '@/types';
import type { RollResult, DiePoolResult, SingleDieResult } from '@/core/dice/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dices,
  Play,
  RotateCcw,
  Sparkles,
  History,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';

export const DiceRollerPanel: React.FC = () => {
  const systems = useAppStore((state) => state.systems);
  const activeSystemId = useAppStore((state) => state.activeSystemId);
  const addToast = useAppStore((state) => state.addToast);

  const activeSystem = systems.find((s) => s.id === activeSystemId) || systems[0];

  const [expression, setExpression] = useState('1d20 + 5');
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [history, setHistory] = useState<RollRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRollingAnim, setIsRollingAnim] = useState(false);

  // Load rolls history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const records = await db.rolls.orderBy('createdAt').reverse().limit(50).toArray();
        setHistory(records);
      } catch (err) {
        console.error('Falha ao carregar histórico de rolagens', err);
      }
    };
    loadHistory();
  }, []);

  const handleRoll = async (exprToRoll?: string, label?: string) => {
    const finalExpr = (exprToRoll || expression).trim();
    if (!finalExpr) return;

    try {
      setIsRollingAnim(true);
      const roller = new DiceRoller();
      const result = roller.roll(finalExpr, {
        label: label || 'Rolagem Manual',
        systemId: activeSystem.id,
      });

      setLastRoll(result);

      // Create persistent record
      const detailStr = result.dice
        .map((d) => `[${d.rolls.map((r) => r.rolled + (r.discarded ? '(d)' : '')).join(', ')}]`)
        .join(' ');

      const record: RollRecord = {
        id: result.id,
        expression: result.expression,
        total: result.total,
        detail: detailStr,
        label: result.label,
        createdAt: result.createdAt,
      };

      await db.rolls.put(record);
      setHistory((prev) => [record, ...prev.slice(0, 49)]);

      setTimeout(() => setIsRollingAnim(false), 250);
    } catch (err) {
      setIsRollingAnim(false);
      const msg = err instanceof Error ? err.message : 'Fórmula de dados inválida';
      addToast({
        type: 'error',
        title: 'Erro de Rolagem',
        message: msg,
      });
    }
  };

  const handleClearHistory = async () => {
    try {
      await db.rolls.clear();
      setHistory([]);
      addToast({
        type: 'info',
        title: 'Histórico Limpo',
        message: 'Todas as rolagens salvas foram apagadas.',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (rec: RollRecord) => {
    const text = `${rec.label ? `[${rec.label}] ` : ''}${rec.expression} = **${rec.total}** (${rec.detail})`;
    navigator.clipboard.writeText(text);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const quickDice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', '4dF'];

  return (
    <Card className="flex flex-col h-full bg-bg-secondary border border-border-default shadow-card p-4 space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/20 text-accent">
            <Dices className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Rolador de Dados
            </h3>
            <span className="text-[10px] text-text-muted">
              Motor Recursive Descent • {activeSystem.name}
            </span>
          </div>
        </div>

        <Badge variant="primary" className="text-[10px]">
          {activeSystem.rollConvention.toUpperCase()}
        </Badge>
      </div>

      {/* Input de Expressão Livre */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRoll();
        }}
        className="flex gap-2"
      >
        <input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Ex: 3d6+2, 2d20kh1, 6d10cs>=8, 4dF+2"
          className="flex-1 bg-bg-tertiary border border-border-default rounded-md px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-border-focus"
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          icon={<Play className="w-3.5 h-3.5" />}
        >
          Rolar
        </Button>
      </form>

      {/* Botões de Dados Rápidos */}
      <div className="grid grid-cols-4 gap-1.5">
        {quickDice.map((d) => (
          <button
            key={d}
            onClick={() => handleRoll(`1${d}`, `Dado ${d}`)}
            className="px-2 py-1.5 rounded bg-bg-tertiary hover:bg-bg-elevated border border-border-subtle text-xs font-mono font-bold text-text-secondary hover:text-text-primary transition-all active:scale-95"
          >
            {d}
          </button>
        ))}
      </div>

      {/* Macros do Sistema Ativo */}
      {activeSystem.diceMacros && activeSystem.diceMacros.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
            Macros de {activeSystem.name}
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {activeSystem.diceMacros.map((macro) => (
              <button
                key={macro.id}
                onClick={() => handleRoll(macro.expression, macro.name)}
                className="p-1.5 rounded bg-bg-tertiary/70 hover:bg-accent/20 border border-border-subtle hover:border-accent/40 text-[11px] text-left truncate text-text-secondary hover:text-accent font-medium transition-all"
                title={`${macro.name}: ${macro.expression}`}
              >
                {macro.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Destaque do Resultado Atual */}
      {lastRoll && (
        <div
          className={`p-3 rounded-lg bg-bg-tertiary border border-accent/40 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
            isRollingAnim ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>{lastRoll.label || lastRoll.expression}</span>
          </div>

          <div className="text-3xl font-black font-mono text-accent tracking-tight">
            {lastRoll.total}
          </div>

          <div className="text-[11px] font-mono text-text-secondary mt-1 flex flex-wrap gap-1 justify-center max-w-full">
            {lastRoll.dice.map((pool: DiePoolResult, idx: number) => (
              <span key={idx} className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle">
                {pool.expression}: [
                {pool.rolls.map((r: SingleDieResult, rIdx: number) => (
                  <span
                    key={rIdx}
                    className={`mx-0.5 ${
                      r.discarded
                        ? 'line-through text-text-muted opacity-50'
                        : r.isCritSuccess
                        ? 'text-status-success font-bold'
                        : r.isCritFailure
                        ? 'text-status-danger font-bold'
                        : ''
                    }`}
                  >
                    {r.rolled}
                  </span>
                ))}
                ]
              </span>
            ))}
          </div>

          {lastRoll.successes !== undefined && (
            <div className="mt-2 text-xs font-semibold text-status-success">
              ★ {lastRoll.successes} Sucesso{lastRoll.successes !== 1 ? 's' : ''}
              {lastRoll.failures ? ` • ${lastRoll.failures} Falha(s)` : ''}
            </div>
          )}
        </div>
      )}

      {/* Histórico Persistente */}
      <div className="flex-1 flex flex-col min-h-0 space-y-2 border-t border-border-subtle pt-3">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="flex items-center gap-1 font-semibold uppercase text-[10px]">
            <History className="w-3 h-3" /> Histórico ({history.length})
          </span>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[10px] text-text-muted hover:text-status-danger transition-colors p-0.5"
              title="Limpar histórico"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-text-muted">
              Nenhuma rolagem recente.
            </div>
          ) : (
            history.map((rec) => (
              <div
                key={rec.id}
                className="p-2 rounded bg-bg-tertiary/60 border border-border-subtle flex items-center justify-between gap-2 text-xs hover:border-border-default transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-text-primary font-mono">{rec.expression}</span>
                    {rec.label && (
                      <span className="text-[10px] text-text-muted truncate">({rec.label})</span>
                    )}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono truncate">{rec.detail}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-accent text-sm">{rec.total}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRoll(rec.expression, rec.label)}
                      className="p-1 hover:text-accent text-text-muted"
                      title="Re-rolar"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCopy(rec)}
                      className="p-1 hover:text-accent text-text-muted"
                      title="Copiar resultado"
                    >
                      {copiedId === rec.id ? (
                        <Check className="w-3 h-3 text-status-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};
