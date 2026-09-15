import { create } from 'zustand';
import type { Character, InventoryItem, AbilityItem, AttributeValue } from '@/types';
import { db, DEFAULT_CHARACTER } from '@/core/db';
import { validateCharacter } from '@/core/engine/schemaValidation';
import { recalculateAllAttributes } from '@/core/engine/formulaHooks';
import { useAppStore } from '@/core/store/appStore';

interface CharacterState {
  characters: Character[];
  activeCharacterId: string | null;
  isLoading: boolean;

  loadCharacters: () => Promise<void>;
  selectCharacter: (id: string | null) => void;
  updateAttribute: (attrId: string, value: AttributeValue) => void;
  saveActiveCharacter: () => Promise<boolean>;
  createNewCharacter: (systemId: string, campaignId?: string) => Promise<string>;
  deleteCharacter: (id: string) => Promise<void>;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  removeInventoryItem: (itemId: string) => void;
  toggleEquipItem: (itemId: string) => void;

  addAbility: (ability: Omit<AbilityItem, 'id'>) => void;
  removeAbility: (abilityId: string) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [DEFAULT_CHARACTER],
  activeCharacterId: DEFAULT_CHARACTER.id,
  isLoading: false,

  loadCharacters: async () => {
    set({ isLoading: true });
    try {
      const all = await db.characters.toArray();
      if (all.length > 0) {
        set({ characters: all });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar personagens';
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Fichas',
        message: msg,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  selectCharacter: (id) => {
    set({ activeCharacterId: id });
  },

  updateAttribute: (attrId, value) => {
    const { characters, activeCharacterId } = get();
    const charIndex = characters.findIndex((c) => c.id === activeCharacterId);
    if (charIndex === -1) return;

    const char = characters[charIndex];
    const system = useAppStore.getState().systems.find((s) => s.id === char.systemId);

    const updatedRaw = {
      ...char.attributes,
      [attrId]: value,
    };

    // Auto-recalculate derived attributes using the engine (arithmetic & hooks)
    const { values: finalAttributes, errors } = system
      ? recalculateAllAttributes(system.attributes, updatedRaw)
      : { values: updatedRaw, errors: {} };

    // If formula error occurred, notify user
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstError = errors[errorKeys[0]];
      useAppStore.getState().addToast({
        type: 'warning',
        title: 'Aviso de Fórmula',
        message: firstError,
        duration: 3000,
      });
    }

    const updatedChar: Character = {
      ...char,
      attributes: finalAttributes,
      updatedAt: Date.now(),
    };

    const newCharacters = [...characters];
    newCharacters[charIndex] = updatedChar;
    set({ characters: newCharacters });

    // Debounced or direct auto-save to Dexie
    db.characters.put(updatedChar).catch(console.error);
  },

  saveActiveCharacter: async () => {
    const { characters, activeCharacterId } = get();
    const char = characters.find((c) => c.id === activeCharacterId);
    if (!char) return false;

    // Validate with Zod
    const validation = validateCharacter(char);
    if (!validation.success) {
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Ficha Inválida',
        message: validation.errors.join(', '),
      });
      return false;
    }

    try {
      await db.characters.put(char);
      useAppStore.getState().addToast({
        type: 'success',
        title: 'Ficha Salva',
        message: `${char.name} foi salvo com sucesso.`,
      });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao persistir personagem';
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Erro de Banco',
        message: msg,
      });
      return false;
    }
  },

  createNewCharacter: async (systemId, campaignId) => {
    const system = useAppStore.getState().systems.find((s) => s.id === systemId);
    const initialAttrs: Record<string, AttributeValue> = {};

    if (system) {
      for (const attr of system.attributes) {
        initialAttrs[attr.id] = attr.defaultValue;
      }
    }

    const newChar: Character = {
      id: `char-${Date.now()}`,
      systemId,
      campaignId,
      name: 'Novo Aventureiro',
      type: 'pc',
      avatarUrl: '',
      bio: '',
      attributes: initialAttrs,
      inventory: [],
      abilities: [],
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.characters.add(newChar);
    set((state) => ({
      characters: [newChar, ...state.characters],
      activeCharacterId: newChar.id,
    }));

    useAppStore.getState().addToast({
      type: 'success',
      title: 'Personagem Criado',
      message: 'Nova ficha inicializada pronta para edição.',
    });

    return newChar.id;
  },

  deleteCharacter: async (id) => {
    try {
      await db.characters.delete(id);
      set((state) => {
        const nextList = state.characters.filter((c) => c.id !== id);
        return {
          characters: nextList,
          activeCharacterId: nextList.length > 0 ? nextList[0].id : null,
        };
      });
      useAppStore.getState().addToast({
        type: 'info',
        title: 'Personagem Removido',
        message: 'A ficha foi excluída da base local.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao deletar';
      useAppStore.getState().addToast({
        type: 'error',
        title: 'Erro',
        message: msg,
      });
    }
  },

  addInventoryItem: (item) => {
    const { characters, activeCharacterId } = get();
    const charIndex = characters.findIndex((c) => c.id === activeCharacterId);
    if (charIndex === -1) return;

    const char = characters[charIndex];
    const newItem: InventoryItem = {
      ...item,
      id: `item-${Date.now()}`,
    };

    const updatedChar: Character = {
      ...char,
      inventory: [...char.inventory, newItem],
      updatedAt: Date.now(),
    };

    const newCharacters = [...characters];
    newCharacters[charIndex] = updatedChar;
    set({ characters: newCharacters });
    db.characters.put(updatedChar).catch(console.error);
  },

  removeInventoryItem: (itemId) => {
    const { characters, activeCharacterId } = get();
    const charIndex = characters.findIndex((c) => c.id === activeCharacterId);
    if (charIndex === -1) return;

    const char = characters[charIndex];
    const updatedChar: Character = {
      ...char,
      inventory: char.inventory.filter((i) => i.id !== itemId),
      updatedAt: Date.now(),
    };

    const newCharacters = [...characters];
    newCharacters[charIndex] = updatedChar;
    set({ characters: newCharacters });
    db.characters.put(updatedChar).catch(console.error);
  },

  toggleEquipItem: (itemId) => {
    const { characters, activeCharacterId } = get();
    const charIndex = characters.findIndex((c) => c.id === activeCharacterId);
    if (charIndex === -1) return;

    const char = characters[charIndex];
    const updatedChar: Character = {
      ...char,
      inventory: char.inventory.map((item) =>
        item.id === itemId ? { ...item, equipped: !item.equipped } : item
      ),
      updatedAt: Date.now(),
    };

    const newCharacters = [...characters];
    newCharacters[charIndex] = updatedChar;
    set({ characters: newCharacters });
    db.characters.put(updatedChar).catch(console.error);
  },

  addAbility: (ability) => {
    const { characters, activeCharacterId } = get();
    const charIndex = characters.findIndex((c) => c.id === activeCharacterId);
    if (charIndex === -1) return;

    const char = characters[charIndex];
    const newAbility: AbilityItem = {
      ...ability,
      id: `skill-${Date.now()}`,
    };

    const updatedChar: Character = {
      ...char,
      abilities: [...char.abilities, newAbility],
      updatedAt: Date.now(),
    };

    const newCharacters = [...characters];
    newCharacters[charIndex] = updatedChar;
    set({ characters: newCharacters });
    db.characters.put(updatedChar).catch(console.error);
  },

  removeAbility: (abilityId) => {
    const { characters, activeCharacterId } = get();
    const charIndex = characters.findIndex((c) => c.id === activeCharacterId);
    if (charIndex === -1) return;

    const char = characters[charIndex];
    const updatedChar: Character = {
      ...char,
      abilities: char.abilities.filter((a) => a.id !== abilityId),
      updatedAt: Date.now(),
    };

    const newCharacters = [...characters];
    newCharacters[charIndex] = updatedChar;
    set({ characters: newCharacters });
    db.characters.put(updatedChar).catch(console.error);
  },
}));
