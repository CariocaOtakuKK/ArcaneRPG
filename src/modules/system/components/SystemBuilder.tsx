import React, { useState } from 'react';
import { useAppStore } from '@/core/store/appStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { executeSandboxHook, evaluateArithmeticExpression } from '@/core/engine/formulaHooks';
import { validateJSONString, validateSystemDefinition } from '@/core/engine/schemaValidation';
import { Cpu, Play, CheckCircle2, FileJson, Sparkles } from 'lucide-react';

export const SystemBuilder: React.FC = () => {
  const systems = useAppStore((state) => state.systems);
  const activeSystemId = useAppStore((state) => state.activeSystemId);
  const saveSystem = useAppStore((state) => state.saveSystem);
  const addToast = useAppStore((state) => state.addToast);

  const activeSystem = systems.find((s) => s.id === activeSystemId) || systems[0];

  // Live Formula / Hook Sandbox Tester State
  const [testAttributes, setTestAttributes] = useState<string>(
    JSON.stringify({ level: 5, strength: 16, dexterity: 14, constitution: 13 }, null, 2)
  );
  const [testFormula, setTestFormula] = useState<string>('floor((strength - 10) / 2)');
  const [testHook, setTestHook] = useState<string>(
    `// Teste de Hook em Sandbox Puro\nconst lvl = Number(attr.level) || 1;\nif (lvl >= 5) return 3;\nreturn 2;`
  );
  const [sandboxResult, setSandboxResult] = useState<string | null>(null);

  // JSON Raw Editor State
  const [rawJson, setRawJson] = useState<string>(
    JSON.stringify(activeSystem, null, 2)
  );

  const handleTestArithmetic = () => {
    try {
      const parsedAttrs = JSON.parse(testAttributes);
      const res = evaluateArithmeticExpression(testFormula, parsedAttrs);
      if (res.error) {
        setSandboxResult(`Erro: ${res.error}`);
      } else {
        setSandboxResult(`Resultado Aritmético: ${res.value}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'JSON de atributos inválido';
      setSandboxResult(`Erro nos Atributos: ${msg}`);
    }
  };

  const handleTestHook = () => {
    try {
      const parsedAttrs = JSON.parse(testAttributes);
      const res = executeSandboxHook(testHook, parsedAttrs);
      if (res.error) {
        setSandboxResult(`Erro no Hook: ${res.error}`);
      } else {
        setSandboxResult(`Resultado do Hook: ${JSON.stringify(res.value)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'JSON de atributos inválido';
      setSandboxResult(`Erro nos Atributos: ${msg}`);
    }
  };

  const handleSaveJson = async () => {
    const result = validateJSONString(rawJson, validateSystemDefinition);
    if (!result.success) {
      addToast({
        type: 'error',
        title: 'Falha na Validação (Zod)',
        message: result.errors.slice(0, 3).join(' | '),
      });
      return;
    }

    const success = await saveSystem(result.data);
    if (success) {
      addToast({
        type: 'success',
        title: 'Sistema Validado & Atualizado',
        message: `Schema Zod verificado: ${result.data.name} salvo com sucesso.`,
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            Motor de Regras & Inspector de Fórmulas
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Sandbox de execução de Hooks funcionais e validação de schema Zod em tempo real.
          </p>
        </div>

        <Badge variant="primary" className="text-xs">
          Engine Sandbox Ativo
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sandbox Tester for Arithmetic & Functional Hooks */}
        <div className="space-y-6">
          <Card className="space-y-4 border-l-4 border-l-accent">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Play className="w-4 h-4 text-accent" />
                Sandbox de Teste de Fórmulas & Hooks
              </h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                Atributos Simulados (JSON)
              </label>
              <Textarea
                rows={4}
                value={testAttributes}
                onChange={(e) => setTestAttributes(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                Fórmula Aritmética Simples
              </label>
              <div className="flex gap-2">
                <input
                  value={testFormula}
                  onChange={(e) => setTestFormula(e.target.value)}
                  className="flex-1 bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-border-focus"
                />
                <Button size="sm" variant="secondary" onClick={handleTestArithmetic}>
                  Calcular
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                <span>Hook Funcional (JS Sandbox Puro)</span>
                <span className="text-[10px] text-accent lowercase">Math & attr disponíveis</span>
              </label>
              <Textarea
                rows={5}
                value={testHook}
                onChange={(e) => setTestHook(e.target.value)}
                className="font-mono text-xs"
              />
              <Button size="sm" variant="primary" onClick={handleTestHook} icon={<Sparkles className="w-3.5 h-3.5" />}>
                Executar Hook na Sandbox
              </Button>
            </div>

            {sandboxResult && (
              <div className="p-3 rounded-lg bg-bg-tertiary border border-accent/40 font-mono text-xs text-text-primary animate-in fade-in">
                <span className="text-text-muted block text-[10px] uppercase font-semibold mb-1">
                  Saída da Sandbox:
                </span>
                {sandboxResult}
              </div>
            )}
          </Card>

          {/* Active System Attributes Preview */}
          <Card className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Atributos Definidos em {activeSystem.name} ({activeSystem.attributes.length})
            </h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {activeSystem.attributes.map((attr) => (
                <div
                  key={attr.id}
                  className="p-2 bg-bg-tertiary rounded flex items-center justify-between text-xs border border-border-subtle"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{attr.name}</span>
                    <span className="text-text-muted font-mono">({attr.id})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {attr.hookFn ? (
                      <Badge variant="primary">Hook JS</Badge>
                    ) : attr.formula ? (
                      <Badge variant="info">Fórmula</Badge>
                    ) : (
                      <Badge variant="neutral">{attr.type}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* JSON Schema Validator & Editor */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <FileJson className="w-4 h-4 text-accent" />
                Editor de Definição de Sistema (Validação Zod)
              </h3>
            </div>

            <p className="text-xs text-text-secondary">
              Qualquer alteração neste JSON é validada em tempo real contra o schema Zod. Se
              houver erros de tipagem ou ausência de campos obrigatórios, o Toast de segurança é
              disparado e o app não trava.
            </p>

            <Textarea
              rows={18}
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRawJson(JSON.stringify(activeSystem, null, 2))}
              >
                Resetar JSON
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveJson} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Validar e Salvar Sistema
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
