import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/core/store/appStore';
import { SystemEditorVisual } from './SystemEditorVisual';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { executeSandboxHook, evaluateArithmeticExpression } from '@/core/engine/formulaHooks';
import { validateJSONString, validateSystemDefinition } from '@/core/engine/schemaValidation';
import { rollDice } from '@/core/dice/roller';
import type { SystemDefinition } from '@/types';
import {
  Cpu,
  Play,
  CheckCircle2,
  FileJson,
  Sparkles,
  Dices,
  Shield,
  Heart,
  Copy,
  Plus,
  Download,
  Upload,
  Sliders,
} from 'lucide-react';

export const SystemBuilder: React.FC = () => {
  const systems = useAppStore((state) => state.systems);
  const activeSystemId = useAppStore((state) => state.activeSystemId);
  const setActiveSystemId = useAppStore((state) => state.setActiveSystemId);
  const saveSystem = useAppStore((state) => state.saveSystem);
  const addToast = useAppStore((state) => state.addToast);

  const activeSystem = systems.find((s) => s.id === activeSystemId) || systems[0];

  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'sandbox'>('visual');

  // Live Formula / Hook Sandbox Tester State
  const [testAttributes, setTestAttributes] = useState<string>(
    JSON.stringify({ level: 5, str: 16, dex: 14, con: 13, agi: 3, vig: 2, nex: 20 }, null, 2)
  );
  const [testFormula, setTestFormula] = useState<string>('floor((str - 10) / 2)');
  const [testHook, setTestHook] = useState<string>(
    `// Teste de Hook em Sandbox Puro\nconst lvl = Number(attr.level) || 1;\nif (lvl >= 5) return 3;\nreturn 2;`
  );
  const [testDiceExpr, setTestDiceExpr] = useState<string>('1d20 + 5');
  const [sandboxResult, setSandboxResult] = useState<string | null>(null);

  // JSON Raw Editor State
  const [rawJson, setRawJson] = useState<string>(
    JSON.stringify(activeSystem, null, 2)
  );

  // Update raw JSON when active system changes
  useEffect(() => {
    setRawJson(JSON.stringify(activeSystem, null, 2));
  }, [activeSystem]);

  const handleDuplicateSystem = async () => {
    const clone: SystemDefinition = {
      ...activeSystem,
      id: `${activeSystem.id}-copy-${Date.now().toString(36).substring(2, 5)}`,
      name: `${activeSystem.name} (Homebrew)`,
      builtin: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const success = await saveSystem(clone);
    if (success) {
      setActiveSystemId(clone.id);
      addToast({
        type: 'success',
        title: 'Sistema Duplicado',
        message: `Criada cópia homebrew "${clone.name}".`,
      });
    }
  };

  const handleCreateNewSystem = async () => {
    const newSys: SystemDefinition = {
      id: `sys-custom-${Date.now()}`,
      name: 'Novo Sistema Customizado',
      version: '1.0.0',
      author: 'Criador ARCANA',
      description: 'Sistema criado do zero através do Editor Visual.',
      builtin: false,
      rollConvention: 'd20',
      attributes: [
        { id: 'str', name: 'Força', type: 'number', category: 'Atributos', defaultValue: 10 },
        { id: 'dex', name: 'Destreza', type: 'number', category: 'Atributos', defaultValue: 10 },
        {
          id: 'defesa',
          name: 'Defesa',
          type: 'derived',
          category: 'Combate',
          defaultValue: 10,
          formula: '10 + floor((dex - 10) / 2)',
        },
      ],
      resources: [
        { id: 'hp', name: 'Pontos de Vida', maxFormula: '20', defaultValue: 20, type: 'bar' },
      ],
      diceMacros: [
        { id: 'd20', name: 'Rolagem d20', expression: '1d20' },
      ],
      rollPresets: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const success = await saveSystem(newSys);
    if (success) {
      setActiveSystemId(newSys.id);
      setActiveTab('visual');
    }
  };

  const handleExportSystem = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeSystem, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeSystem.id}-preset.arcana.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      type: 'info',
      title: 'Sistema Exportado',
      message: `Arquivo ${activeSystem.id}-preset.arcana.json baixado.`,
    });
  };

  const handleImportSystem = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const res = validateJSONString(content, validateSystemDefinition);
        if (!res.success) {
          addToast({
            type: 'error',
            title: 'JSON Inválido (Zod)',
            message: res.errors.slice(0, 3).join(' | '),
          });
          return;
        }

        await saveSystem(res.data);
        setActiveSystemId(res.data.id);
      };
      reader.readAsText(file);
    };
    input.click();
  };

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

  const handleTestDice = () => {
    try {
      const res = rollDice(testDiceExpr);
      setSandboxResult(
        `Rolagem [${res.expression}]: Total = ${res.total} (Dados: ${res.dice
          .map((d) => `[${d.rolls.map((r) => r.rolled).join(', ')}]`)
          .join(', ')})`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Expressão de dados inválida';
      setSandboxResult(`Erro nos Dados: ${msg}`);
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
        message: `Schema Zod verificado: "${result.data.name}" salvo com sucesso.`,
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header and System Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            Editor de Sistemas & Motor de Regras
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Personalização 100% livre: crie novos sistemas, altere fórmulas, adicione atributos e teste na sandbox.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeSystemId}
            onChange={(e) => setActiveSystemId(e.target.value)}
            className="bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-border-focus"
          >
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.rollConvention.toUpperCase()})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleDuplicateSystem}
            icon={<Copy className="w-3.5 h-3.5" />}
            title="Criar cópia homebrew do sistema ativo"
          >
            Duplicar
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateNewSystem}
            icon={<Plus className="w-3.5 h-3.5" />}
            title="Criar novo sistema do zero"
          >
            Novo Sistema
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportSystem}
            icon={<Download className="w-3.5 h-3.5" />}
            title="Baixar preset em JSON"
          >
            Exportar
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleImportSystem}
            icon={<Upload className="w-3.5 h-3.5" />}
            title="Importar preset em JSON"
          >
            Importar
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <Button
          size="sm"
          variant={activeTab === 'visual' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('visual')}
          icon={<Sliders className="w-4 h-4" />}
        >
          Editor Visual
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'json' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('json')}
          icon={<FileJson className="w-4 h-4" />}
        >
          Editor JSON (Zod)
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'sandbox' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('sandbox')}
          icon={<Play className="w-4 h-4" />}
        >
          Sandbox & Fórmulas
        </Button>
      </div>

      {/* Tab 1: Visual System Editor */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          <SystemEditorVisual
            system={activeSystem}
            onChange={(updated) => {
              saveSystem(updated);
            }}
          />
        </div>
      )}

      {/* Tab 2: Raw JSON Editor with Zod Schema Validation */}
      {activeTab === 'json' && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <FileJson className="w-4 h-4 text-accent" />
                Definição do Sistema em JSON Puro
              </h3>
              <Badge variant="primary">Validação com Zod Ativa</Badge>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Edite diretamente a estrutura JSON do sistema. Qualquer campo ausente ou tipo incorreto
              será interceptado pelo validador Zod, emitindo aviso via Toast e impedindo quebras da aplicação.
            </p>

            <Textarea
              rows={24}
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
                Resetar para o Salvo
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveJson} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Validar e Salvar Sistema
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Sandbox & Formula Inspector */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sandbox Controls */}
          <Card className="space-y-4 border-l-4 border-l-accent">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Play className="w-4 h-4 text-accent" />
                Sandbox de Teste de Fórmulas & Hooks
              </h3>
              <Badge variant="primary">Ambiente Seguro</Badge>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                Atributos Simulados (JSON)
              </label>
              <Textarea
                rows={3}
                value={testAttributes}
                onChange={(e) => setTestAttributes(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                Fórmula Aritmética
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
                <span>Hook Funcional (JS Sandbox)</span>
                <span className="text-[10px] text-accent lowercase">Math & attr isolados</span>
              </label>
              <Textarea
                rows={4}
                value={testHook}
                onChange={(e) => setTestHook(e.target.value)}
                className="font-mono text-xs"
              />
              <Button size="sm" variant="primary" onClick={handleTestHook} icon={<Sparkles className="w-3.5 h-3.5" />}>
                Executar Hook na Sandbox
              </Button>
            </div>

            {/* Test Dice Expression via Dice Engine */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                Expressão do Rolador de Dados
              </label>
              <div className="flex gap-2">
                <input
                  value={testDiceExpr}
                  onChange={(e) => setTestDiceExpr(e.target.value)}
                  placeholder="Ex: 3d6+2, 2d20kh1, 6d10cs>=8, 4dF+2"
                  className="flex-1 bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-border-focus"
                />
                <Button size="sm" variant="secondary" onClick={handleTestDice} icon={<Dices className="w-3.5 h-3.5" />}>
                  Rolar
                </Button>
              </div>
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

          {/* Active System Overview */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span>{activeSystem.icon || '🛡️'}</span> {activeSystem.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">{activeSystem.description}</p>
              </div>
              <Badge variant="primary">
                {activeSystem.rollConvention.toUpperCase()}
              </Badge>
            </div>

            {/* Resources Breakdown */}
            {activeSystem.resources && activeSystem.resources.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-status-danger" /> Barras de Recursos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {activeSystem.resources.map((r) => (
                    <div key={r.id} className="p-2 rounded bg-bg-tertiary border border-border-subtle text-xs">
                      <span className="font-semibold text-text-primary block">{r.name}</span>
                      <span className="text-[10px] text-text-muted font-mono">
                        Fórmula: {String(r.maxFormula)} ({r.type})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Combat Config Breakdown */}
            {activeSystem.combat && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-accent" /> Regras de Combate
                </span>
                <div className="p-2.5 rounded bg-bg-tertiary border border-border-subtle text-xs space-y-1">
                  <div>
                    <span className="text-text-muted">Iniciativa: </span>
                    <span className="font-mono font-semibold text-text-primary">
                      {activeSystem.combat.initiativeFormula}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Recurso de Vida: </span>
                    <span className="font-mono font-semibold text-text-primary">
                      {activeSystem.combat.hpResource}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
