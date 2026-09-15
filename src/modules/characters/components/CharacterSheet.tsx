import React, { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useAppStore } from '@/core/store/appStore';
import { rollDice } from '@/core/dice/roller';
import { db } from '@/core/db';
import type { RollRecord } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Trash2,
  Shield,
  Heart,
  Sparkles,
  Backpack,
  Save,
  Activity,
  Dices,
  BookOpen,
} from 'lucide-react';

export const CharacterSheet: React.FC = () => {
  const characters = useCharacterStore((state) => state.characters);
  const activeCharacterId = useCharacterStore((state) => state.activeCharacterId);
  const updateAttribute = useCharacterStore((state) => state.updateAttribute);
  const saveActiveCharacter = useCharacterStore((state) => state.saveActiveCharacter);
  const addInventoryItem = useCharacterStore((state) => state.addInventoryItem);
  const removeInventoryItem = useCharacterStore((state) => state.removeInventoryItem);
  const toggleEquipItem = useCharacterStore((state) => state.toggleEquipItem);
  const addAbility = useCharacterStore((state) => state.addAbility);
  const removeAbility = useCharacterStore((state) => state.removeAbility);

  const systems = useAppStore((state) => state.systems);
  const addToast = useAppStore((state) => state.addToast);

  const [newItemName, setNewItemName] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillFormula, setNewSkillFormula] = useState('');

  const character = characters.find((c) => c.id === activeCharacterId);
  if (!character) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-text-muted">
        Nenhum personagem selecionado. Escolha ou crie uma ficha na lista lateral.
      </div>
    );
  }

  const system = systems.find((s) => s.id === character.systemId) || systems[0];

  // Dynamic HP resource lookup based on System Definition
  const hpResId = system.combat?.hpResource || 'hp';
  const hpCurrentVal =
    character.resources?.[hpResId]?.current ??
    character.attributes[`${hpResId}_current`] ??
    character.attributes[hpResId] ??
    character.attributes['hp_current'] ??
    20;
  const hpMaxVal =
    character.resources?.[hpResId]?.max ??
    character.attributes[`${hpResId}_max`] ??
    character.attributes['hp_max'] ??
    20;

  // Dynamic Defense stat lookup
  const defenseKey =
    system.attributes.find((a) => a.id === 'armor_class' || a.id === 'defesa')?.id || 'armor_class';
  const defenseVal = character.attributes[defenseKey] ?? 10;

  const handleRollAttribute = async (attrName: string, attrId: string) => {
    try {
      const val = Number(character.attributes[attrId]) || 0;
      let expr = '1d20';

      if (system.rollConvention === 'd100') {
        expr = '1d100';
      } else if (system.rollConvention === 'pool') {
        expr = `${Math.max(1, val)}d10cs>=6`;
      } else if (system.rollConvention === 'ladder') {
        expr = `4dF + ${val}`;
      } else {
        // d20 systems: check if there's a mod
        const modKey = `mod_${attrId}`;
        const modVal = character.attributes[modKey] !== undefined
          ? Number(character.attributes[modKey])
          : val;
        expr = modVal >= 0 ? `1d20 + ${modVal}` : `1d20 - ${Math.abs(modVal)}`;
      }

      const result = rollDice(expr, {
        label: `Teste de ${attrName}`,
        characterId: character.id,
        systemId: system.id,
      });

      const detailStr = result.dice
        .map((d) => `[${d.rolls.map((r) => r.rolled).join(', ')}]`)
        .join(' ');

      const record: RollRecord = {
        id: result.id,
        characterId: character.id,
        characterName: character.name,
        expression: result.expression,
        total: result.total,
        detail: detailStr,
        label: result.label,
        createdAt: result.createdAt,
      };

      await db.rolls.put(record);

      addToast({
        type: 'success',
        title: `Rolagem: ${attrName}`,
        message: `${result.expression} ➔ Total: ${result.total}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addInventoryItem({
      name: newItemName.trim(),
      quantity: 1,
      weight: 1,
      equipped: false,
      tags: ['Item'],
    });
    setNewItemName('');
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    addAbility({
      name: newSkillName.trim(),
      formula: newSkillFormula.trim() || '1d20',
      description: 'Habilidade cadastrada pelo jogador.',
    });
    setNewSkillName('');
    setNewSkillFormula('');
  };

  // Group attributes by category
  const categories: Record<string, typeof system.attributes> = {};
  for (const attr of system.attributes) {
    const cat = attr.category || 'Atributos Principais';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(attr);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Identity */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-accent">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-accent text-2xl font-bold shadow-glow">
            {system.icon || character.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary tracking-wide">
                {character.name}
              </h2>
              <Badge variant="primary">{system.name}</Badge>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{character.bio || 'Sem biografia.'}</p>
          </div>
        </div>

        {/* Quick Combat Highlights */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-tertiary px-3 py-1.5 rounded-lg border border-border-subtle">
            <Heart className="w-4 h-4 text-status-danger" />
            <div>
              <span className="text-[10px] text-text-muted block leading-none">Vida / PV</span>
              <span className="text-sm font-bold font-mono text-text-primary">
                {String(hpCurrentVal)} / {String(hpMaxVal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-bg-tertiary px-3 py-1.5 rounded-lg border border-border-subtle">
            <Shield className="w-4 h-4 text-status-info" />
            <div>
              <span className="text-[10px] text-text-muted block leading-none">
                {system.combat?.defenseStat?.name || 'Defesa'}
              </span>
              <span className="text-sm font-bold font-mono text-text-primary">
                {String(defenseVal)}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={() => saveActiveCharacter()}
          >
            Salvar Ficha
          </Button>
        </div>
      </Card>

      {/* Main Grid: Attributes & Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Dynamic System Attributes & Skills */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(categories).map(([catName, attrs]) => (
            <Card key={catName} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                  {catName}
                </h3>
                <span className="text-[11px] text-text-muted">{attrs.length} atributos</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {attrs.map((attrDef) => {
                  const currentValue = character.attributes[attrDef.id] ?? attrDef.defaultValue;
                  const isDerived = attrDef.type === 'derived';
                  const isHook = Boolean(attrDef.hookFn);

                  return (
                    <div
                      key={attrDef.id}
                      className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${
                        isDerived
                          ? 'bg-bg-tertiary/70 border-accent/30'
                          : 'bg-bg-tertiary border-border-subtle hover:border-border-default'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <button
                            onClick={() => handleRollAttribute(attrDef.name, attrDef.id)}
                            className="text-text-muted hover:text-accent transition-colors"
                            title={`Rolar teste de ${attrDef.name}`}
                          >
                            <Dices className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-medium text-text-secondary leading-tight truncate">
                            {attrDef.name}
                          </span>
                        </div>
                        {isHook ? (
                          <span
                            title="Calculado dinamicamente via Functional JS Hook em Sandbox"
                            className="text-[9px] font-mono px-1 py-0.5 rounded bg-accent/20 text-accent border border-accent/30"
                          >
                            Hook
                          </span>
                        ) : isDerived ? (
                          <span
                            title={`Calculado via fórmula aritmética: ${attrDef.formula}`}
                            className="text-[9px] font-mono px-1 py-0.5 rounded bg-status-info/20 text-status-info border border-status-info/30"
                          >
                            Fórmula
                          </span>
                        ) : null}
                      </div>

                      {isDerived ? (
                        <div className="text-xl font-bold font-mono text-accent">
                          {typeof currentValue === 'number' && currentValue > 0 && attrDef.id.endsWith('_mod')
                            ? `+${currentValue}`
                            : String(currentValue)}
                        </div>
                      ) : attrDef.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={Boolean(currentValue)}
                          onChange={(e) => updateAttribute(attrDef.id, e.target.checked)}
                          className="w-4 h-4 rounded text-accent focus:ring-border-focus"
                        />
                      ) : (
                        <input
                          type={attrDef.type === 'number' || attrDef.type === 'percent' ? 'number' : 'text'}
                          value={String(currentValue)}
                          onChange={(e) => {
                            const val =
                              attrDef.type === 'number' || attrDef.type === 'percent'
                                ? Number(e.target.value)
                                : e.target.value;
                            updateAttribute(attrDef.id, val);
                          }}
                          className="bg-bg-elevated border border-border-default rounded px-2 py-1 text-sm font-semibold font-mono text-text-primary focus:outline-none focus:border-border-focus"
                        />
                      )}

                      {attrDef.description && (
                        <p className="text-[10px] text-text-muted mt-1.5 truncate">
                          {attrDef.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          {/* Perícias do Sistema (Se existirem) */}
          {system.skills && system.skills.length > 0 && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-accent" />
                  Perícias de {system.name} ({system.skills.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {system.skills.map((skill) => {
                  return (
                    <button
                      key={skill.id}
                      onClick={() =>
                        handleRollAttribute(
                          skill.name,
                          skill.baseAttribute || 'level'
                        )
                      }
                      className="p-2 rounded bg-bg-tertiary hover:bg-bg-elevated border border-border-subtle hover:border-accent/40 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-text-primary block truncate group-hover:text-accent">
                          {skill.name}
                        </span>
                        {skill.baseAttribute && (
                          <span className="text-[10px] text-text-muted uppercase">
                            {skill.baseAttribute}
                          </span>
                        )}
                      </div>
                      <Dices className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Habilidades & Magias */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Habilidades & Ações
              </h3>
            </div>

            <form onSubmit={handleAddSkill} className="flex gap-2">
              <Input
                placeholder="Nome da habilidade ou magia"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
              />
              <Input
                placeholder="Fórmula (ex: 2d6+4)"
                value={newSkillFormula}
                onChange={(e) => setNewSkillFormula(e.target.value)}
                className="w-40"
              />
              <Button type="submit" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Adicionar
              </Button>
            </form>

            <div className="space-y-2">
              {character.abilities.map((ability) => (
                <div
                  key={ability.id}
                  className="flex items-center justify-between p-2.5 bg-bg-tertiary rounded-lg border border-border-subtle"
                >
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      {ability.name}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {ability.description || 'Sem descrição.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ability.formula && (
                      <Badge variant="info" className="font-mono">
                        {ability.formula}
                      </Badge>
                    )}
                    <button
                      onClick={() => removeAbility(ability.id)}
                      className="text-text-muted hover:text-status-danger transition-colors p-1"
                      aria-label="Remover habilidade"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Column 3: Inventory & Bio */}
        <div className="space-y-6">
          {/* Inventory */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Backpack className="w-3.5 h-3.5 text-accent" />
                Inventário & Equipamento
              </h3>
              <span className="text-[11px] text-text-muted">
                {character.inventory.reduce((acc, i) => acc + i.weight * i.quantity, 0)} kg
              </span>
            </div>

            <form onSubmit={handleAddItem} className="flex gap-2">
              <Input
                placeholder="Nome do item..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <Button type="submit" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Adicionar
              </Button>
            </form>

            <div className="space-y-2">
              {character.inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-bg-tertiary rounded-lg border border-border-subtle"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleEquipItem(item.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                        item.equipped
                          ? 'bg-status-success/20 text-status-success border border-status-success/40'
                          : 'bg-bg-elevated text-text-muted border border-border-subtle'
                      }`}
                    >
                      {item.equipped ? 'Equipado' : 'Guardado'}
                    </button>
                    <div>
                      <span className="text-xs font-medium text-text-primary block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        Qtd: {item.quantity} | Peso: {item.weight}kg
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeInventoryItem(item.id)}
                    className="text-text-muted hover:text-status-danger transition-colors p-1"
                    aria-label="Remover item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes & Bio */}
          <Card className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Anotações & Antecedentes
            </h3>
            <Textarea
              rows={4}
              value={character.notes}
              onChange={(e) => {
                updateAttribute('notes_temp', e.target.value);
                character.notes = e.target.value;
              }}
              placeholder="Anotações de campanha, objetivos, aliados..."
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
