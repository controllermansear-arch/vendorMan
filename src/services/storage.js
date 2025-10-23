// Sistema de Storage compatível com React Native e Web
import { Platform } from 'react-native';

class UniversalStorage {
  constructor() {
    this.isReactNative = Platform.OS !== 'web';
    this.initStorage();
  }

  async initStorage() {
    if (this.isReactNative) {
      // React Native - usa AsyncStorage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        this.storage = AsyncStorage;
      } catch (error) {
        console.error('AsyncStorage não disponível:', error);
        this.fallbackToMemory();
      }
    } else {
      // Web - usa localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        this.storage = {
          setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
          getItem: (key) => Promise.resolve(localStorage.getItem(key)),
          removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
          clear: () => Promise.resolve(localStorage.clear()),
          getAllKeys: () => Promise.resolve(Object.keys(localStorage)),
        };
      } else {
        this.fallbackToMemory();
      }
    }
  }

  fallbackToMemory() {
    console.warn('Usando storage em memória (fallback)');
    const memoryStorage = {};
    this.storage = {
      setItem: (key, value) => {
        memoryStorage[key] = value;
        return Promise.resolve();
      },
      getItem: (key) => Promise.resolve(memoryStorage[key] || null),
      removeItem: (key) => {
        delete memoryStorage[key];
        return Promise.resolve();
      },
      clear: () => {
        Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
        return Promise.resolve();
      },
      getAllKeys: () => Promise.resolve(Object.keys(memoryStorage)),
    };
  }

  async setItem(key, value) {
    try {
      await this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no storage:', error);
      return false;
    }
  }

  async getItem(key, defaultValue = null) {
    try {
      const value = await this.storage.getItem(key);
      if (value === null || value === undefined) {
        return defaultValue;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error('Erro ao ler do storage:', error);
      return defaultValue;
    }
  }

  async removeItem(key) {
    try {
      await this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do storage:', error);
      return false;
    }
  }

  async clear() {
    try {
      await this.storage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
      return false;
    }
  }

  async getAllKeys() {
    try {
      return await this.storage.getAllKeys();
    } catch (error) {
      console.error('Erro ao obter chaves do storage:', error);
      return [];
    }
  }

  // Método específico para arrays (mais comum no nosso uso)
  async getArray(key, defaultValue = []) {
    const value = await this.getItem(key, defaultValue);
    return Array.isArray(value) ? value : defaultValue;
  }

  // Método para adicionar item a um array
  async pushToArray(key, item) {
    const array = await this.getArray(key);
    array.push(item);
    return await this.setItem(key, array);
  }

  // Método para remover item de um array
  async removeFromArray(key, predicate) {
    const array = await this.getArray(key);
    const newArray = array.filter((item, index) => !predicate(item, index));
    return await this.setItem(key, newArray);
  }

  // Método para atualizar item em um array
  async updateInArray(key, predicate, updates) {
    const array = await this.getArray(key);
    const index = array.findIndex(predicate);
    if (index !== -1) {
      array[index] = { ...array[index], ...updates };
      return await this.setItem(key, array);
    }
    return false;
  }
}

// Exporta uma instância única (Singleton)
export const universalStorage = new UniversalStorage();

// Exporta a classe também para testes
export { UniversalStorage };