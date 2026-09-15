import React, { useState } from 'react';
import type { SystemDefinition, AttributeDefinition, ResourceDefinition, SkillDefinition, DiceMacro } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Plus, Trash2, Shield, Heart, Dices, BookOpen, Sparkles } from 'lucide-react';

export interface SystemEditorVisualProps {
  system: SystemDefinition;
  onChange: (updated: SystemDefinition) => void;
}

export const SystemEditorVisual: React.FC<SystemEditorVisualProps> = ({ system, onChange }) => {
  // New attribute form state
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrId, setNewAttrId] = useState('');
  const [newAttrType, setNewAttrType] = useState<AttributeDefinition['type']>('number');
  const [newAttrFormula, setNewAttrFormula] = useState('');
  const [newAttrCategory, setNewAttrCategory] = useState('Atributos');

  // New resource form state
  const [newResName, setNewResName] = useState('');
  const [newResId, setNewResId] = useState('');
  const [newResFormula, setNewResFormula] = useState('10');
  const [newResType, setNewResType] = useState<ResourceDefinition['type']>('bar');

  // New skill form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillAttr, setNewSkillAttr] = useState(system.attributes[0]?.id || '');

  // New macro form state
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroExpr, setNewMacroExpr] = useState('1d20');

  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;
    const finalId = newAttrId.trim() || newAttrName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newAttr: AttributeDefinition = {
      id: finalId,
      name: newAttrName.trim(),
      type: newAttrType,
      category: newAttrCategory.trim() || 'Atributos',
      defaultValue: newAttrType === 'number' ? 10 : 0,
      formula: newAttrType === 'derived' ? newAttrFormula.trim() : undefined,
    };

    onChange({
      ...system,
      attributes: [...system.attributes, newAttr],
      updatedAt: Date.now(),
    });

    setNewAttrName('');
    setNewAttrId('');
    setNewAttrFormula('');
  };

  const handleRemoveAttribute = (id: string) => {
    onChange({
      ...system,
      attributes: system.attributes.filter((a) => a.id !== id),
      updatedAt: Date.now(),
    });
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim()) return;
    const finalId = newResId.trim() || newResName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newRes: ResourceDefinition = {
      id: finalId,
      name: newResName.trim(),
      maxFormula: newResFormula.trim() || 10,
      defaultValue: 10,
      color: '#ef4444',
      type: newResType,
    };

    const currentResources = system.resources || [];
    onChange({
      ...system,
      resources: [...currentResources, newRes],
      updatedAt: Date.now(),
    });

    setNewResName('');
    setNewResId('');
    setNewResFormula('10');
  };

  const handleRemoveResource = (id: string) => {
    onChange({
      ...system,
      resources: (system.resources || []).filter((r) => r.id !== id),
      updatedAt: Date.now(),
    });
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const finalId = newSkillName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newSkill: SkillDefinition = {
      id: finalId,
      name: newSkillName.trim(),
      baseAttribute: newSkillAttr,
      type: 'proficiency',
    };

    const currentSkills = system.skills || [];
    onChange({
      ...system,
      skills: [...currentSkills, newSkill],
      updatedAt: Date.now(),
    });

    setNewSkillName('');
  };

  const handleRemoveSkill = (id: string) => {
    onChange({
      ...system,
      skills: (system.skills || []).filter((s) => s.id !== id),
      updatedAt: Date.now(),
    });
  };

  const handleAddMacro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMacroName.trim() || !newMacroExpr.trim()) return;

    const newMacro: DiceMacro = {
      id: `macro-${Date.now()}`,
      name: newMacroName.trim(),
      expression: newMacroExpr.trim(),
    };

    const currentMacros = system.diceMacros || [];
    onChange({
      ...system,
      diceMacros: [...currentMacros, newMacro],
      updatedAt: Date.now(),
    });

    setNewMacroName('');
    setNewMacroExpr('1d20');
  };

  const handleRemoveMacro = (id: string) => {
    onChange({
      ...system,
      diceMacros: (system.diceMacros || []).filter((m) => m.id !== id),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic System Details Form */}
      <Card className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> Dados Gerais do Sistema
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Nome do Sistema"
            value={system.name}
            onChange={(e) => onChange({ ...system, name: e.target.value, updatedAt: Date.now() })}
          />
          <Input
            label="Autor"
            value={system.author}
            onChange={(e) => onChange({ ...system, author: e.target.value, updatedAt: Date.now() })}
          />
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Convenção de Rolagem
            </label>
            <select
              value={system.rollConvention}
              onChange={(e) =>
                onChange({
                  ...system,
                  rollConvention: e.target.value as SystemDefinition['rollConvention'],
                  updatedAt: Date.now(),
                })
              }
              className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border-focus"
            >
              <option value="d20">D20 (D&D, Tormenta20, Ordem)</option>
              <option value="d100">D100 Percentual (Call of Cthulhu)</option>
              <option value="pool">Dice Pool (Vampiro V5)</option>
              <option value="ladder">Escada de Adjetivos (Fate 4dF)</option>
              <option value="custom">Customizado</option>
            </select>
          </div>
        </div>

        <Textarea
          label="Descrição do Sistema"
          rows={2}
          value={system.description}
          onChange={(e) =>
            onChange({ ...system, description: e.target.value, updatedAt: Date.now() })
          }
        />
      </Card>

      {/* Attributes Visual Section */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-accent" />
            Atributos & Derivados ({system.attributes.length})
          </h3>
        </div>

        {/* Form to add attribute */}
        <form onSubmit={handleAddAttribute} className="p-3 bg-bg-tertiary rounded-lg border border-border-subtle grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            placeholder="Nome (ex: Destreza)"
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            className="bg-bg-elevated border border-border-default rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
          />
          <input
            placeholder="ID (ex: dex)"
            value={newAttrId}
            onChange={(e) => setNewAttrId(e.target.value)}
            className="bg-bg-elevated border border-border-default rounded px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none"
          />
          <select
            value={newAttrType}
            onChange={(e) => setNewAttrType(e.target.value as AttributeDefinition['type'])}
            className="bg-bg-elevated border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
          >
            <option value="number">Número Inteiro</option>
            <option value="derived">Derivado (Fórmula/Hook)</option>
            <option value="percent">Percentual (0-100)</option>
            <option value="ladder">Escada Fate</option>
            <option value="boolean">Booleano</option>
          </select>
          {newAttrType === 'derived' ? (
            <input
              placeholder="Fórmula (ex: floor((str-10)/2))"
              value={newAttrFormula}
              onChange={(e) => setNewAttrFormula(e.target.value)}
              className="bg-bg-elevated border border-border-default rounded px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none"
            />
          ) : (
            <input
              placeholder="Categoria (ex: Atributos)"
              value={newAttrCategory}
              onChange={(e) => setNewAttrCategory(e.target.value)}
              className="bg-bg-elevated border border-border-default rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
            />
          )}
          <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
            Adicionar
          </Button>
        </form>

        {/* Existing attributes list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {system.attributes.map((attr) => (
            <div
              key={attr.id}
              className="p-2.5 rounded bg-bg-tertiary border border-border-subtle flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-text-primary block">{attr.name}</span>
                <span className="text-[10px] text-text-muted font-mono">
                  {attr.id} • {attr.type}
                  {attr.formula ? ` = ${attr.formula}` : ''}
                </span>
              </div>
              <button
                onClick={() => handleRemoveAttribute(attr.id)}
                className="text-text-muted hover:text-status-danger transition-colors p-1"
                aria-label="Deletar atributo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Resources & Health Bars Section */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-status-danger" />
            Recursos & Barras ({system.resources?.length || 0})
          </h3>
        </div>

        <form onSubmit={handleAddResource} className="p-3 bg-bg-tertiary rounded-lg border border-border-subtle grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            placeholder="Nome (ex: Mana)"
            value={newResName}
            onChange={(e) => setNewResName(e.target.value)}
            className="bg-bg-elevated border border-border-default rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
          />
          <input
            placeholder="Fórmula Max (ex: int * 2)"
            value={newResFormula}
            onChange={(e) => setNewResFormula(e.target.value)}
            className="bg-bg-elevated border border-border-default rounded px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none"
          />
          <select
            value={newResType}
            onChange={(e) => setNewResType(e.target.value as ResourceDefinition['type'])}
            className="bg-bg-elevated border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
          >
            <option value="bar">Barra de Progresso</option>
            <option value="slots">Slots / Caixas</option>
            <option value="pool">Pool de Pontos</option>
            <option value="checkbox">Checkbox Única</option>
          </select>
          <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
            Adicionar Recurso
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(system.resources || []).map((res) => (
            <div
              key={res.id}
              className="p-2.5 rounded bg-bg-tertiary border border-border-subtle flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-text-primary block">{res.name}</span>
                <span className="text-[10px] text-text-muted font-mono">
                  Max: {String(res.maxFormula)} ({res.type})
                </span>
              </div>
              <button
                onClick={() => handleRemoveResource(res.id)}
                className="text-text-muted hover:text-status-danger transition-colors p-1"
                aria-label="Deletar recurso"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Skills & Dice Macros Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              Perícias ({system.skills?.length || 0})
            </h3>
          </div>

          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              placeholder="Nome da perícia..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 bg-bg-tertiary border border-border-default rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
            />
            <select
              value={newSkillAttr}
              onChange={(e) => setNewSkillAttr(e.target.value)}
              className="bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
            >
              {system.attributes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
              Add
            </Button>
          </form>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {(system.skills || []).map((skill) => (
              <div
                key={skill.id}
                className="p-1.5 rounded bg-bg-tertiary border border-border-subtle flex items-center justify-between text-xs"
              >
                <span>{skill.name} ({skill.baseAttribute || 'Sem base'})</span>
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="text-text-muted hover:text-status-danger p-0.5"
                  aria-label="Deletar perícia"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Dice Macros */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Dices className="w-3.5 h-3.5 text-accent" />
              Macros Rápidas ({system.diceMacros?.length || 0})
            </h3>
          </div>

          <form onSubmit={handleAddMacro} className="flex gap-2">
            <input
              placeholder="Nome da macro..."
              value={newMacroName}
              onChange={(e) => setNewMacroName(e.target.value)}
              className="flex-1 bg-bg-tertiary border border-border-default rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
            />
            <input
              placeholder="Expressão (ex: 1d20+5)"
              value={newMacroExpr}
              onChange={(e) => setNewMacroExpr(e.target.value)}
              className="w-32 bg-bg-tertiary border border-border-default rounded px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none"
            />
            <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
              Add
            </Button>
          </form>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {(system.diceMacros || []).map((macro) => (
              <div
                key={macro.id}
                className="p-1.5 rounded bg-bg-tertiary border border-border-subtle flex items-center justify-between text-xs"
              >
                <span>{macro.name}: <code className="text-accent">{macro.expression}</code></span>
                <button
                  onClick={() => handleRemoveMacro(macro.id)}
                  className="text-text-muted hover:text-status-danger p-0.5"
                  aria-label="Deletar macro"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
