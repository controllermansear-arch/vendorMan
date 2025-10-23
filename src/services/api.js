import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const STORAGE_KEYS = {
  PRODUCTS: 'products_data',
  COMBOS: 'combos_data',
  FRACIONADOS: 'fracionados_data',
  COMANDA: 'comandas_data',
  ESTOQUE: 'estoque_data'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função auxiliar para timeout
const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Função para validar JSON
const safeJsonParse = (jsonString, defaultValue = []) => {
  try {
    if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
      return defaultValue;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.log('Erro ao parsear JSON:', error);
    return defaultValue;
  }
};

export const apiService = {
  // Sincronizar dados iniciais
  async syncInitialData() {
    try {
      const cacheKey = 'last_sync';
      const lastSync = await AsyncStorage.getItem(cacheKey);
      const now = Date.now();
      
      // Só sincroniza se passou mais de 5 minutos da última sincronização
      if (lastSync && (now - parseInt(lastSync)) < CACHE_DURATION) {
        console.log('Usando cache de dados...');
        return await this.getLocalData();
      }
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products || []));
      await AsyncStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(data.combos || []));
      await AsyncStorage.setItem(STORAGE_KEYS.FRACIONADOS, JSON.stringify(data.fracionados || []));
      await AsyncStorage.setItem(cacheKey, now.toString());
      
      console.log('Dados sincronizados com sucesso');
      return data;
    } catch (error) {
      console.log('Erro na sincronização, usando dados locais:', error);
      return await this.getLocalData();
    }
  },

  // Buscar dados locais - CORRIGIDO
  async getLocalData() {
    try {
      const [products, combos, fracionados] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.COMBOS),
        AsyncStorage.getItem(STORAGE_KEYS.FRACIONADOS)
      ]);

      return {
        products: safeJsonParse(products, []),
        combos: safeJsonParse(combos, []),
        fracionados: safeJsonParse(fracionados, [])
      };
    } catch (error) {
      console.log('Erro ao buscar dados locais:', error);
      return { products: [], combos: [], fracionados: [] };
    }
  },

  // Inicializar dados do servidor - NOVA FUNÇÃO
  async initializeFromServer() {
    try {
      console.log('Inicializando dados do servidor...');
      
      // Tenta primeiro via GET (mais simples)
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/init-collections`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Resposta da inicialização:', result);
      
      // Após inicializar no servidor, sincroniza os dados
      await this.syncInitialData();
      
      return result;
    } catch (error) {
      console.log('Erro na inicialização do servidor:', error);
      throw error;
    }
  },

  // Buscar todos os itens para venda
  async getAllItems() {
    const data = await this.getLocalData();
    
    const produtosFormatados = data.products.map(p => ({
      ...p,
      tipo: 'produto',
      codItem: p.codInt.toString(),
      precoVenda: p.preco
    }));

    const combosFormatados = data.combos.map(c => ({
      ...c,
      tipo: 'combo',
      codItem: c.codCombo,
      precoVenda: c.precoCombo,
      descricao: c.descricao
    }));

    const fracionadosFormatados = data.fracionados.map(f => ({
      ...f,
      tipo: 'fracionado',
      codItem: f.codFracionado,
      precoVenda: f.preco || 0,
      descricao: f.descricao
    }));

    return [...produtosFormatados, ...combosFormatados, ...fracionadosFormatados];
  },

  // Salvar comanda localmente
  async saveComandaLocal(comanda) {
    try {
      const comandasExistentes = await AsyncStorage.getItem(STORAGE_KEYS.COMANDA);
      const comandas = safeJsonParse(comandasExistentes, []);
      
      const index = comandas.findIndex(c => c._id === comanda._id);
      if (index >= 0) {
        comandas[index] = comanda;
      } else {
        comandas.push(comanda);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.COMANDA, JSON.stringify(comandas));
      return true;
    } catch (error) {
      console.log('Erro ao salvar comanda local:', error);
      return false;
    }
  },

  // Buscar comandas locais
  async getComandasLocais() {
    try {
      const comandas = await AsyncStorage.getItem(STORAGE_KEYS.COMANDA);
      return safeJsonParse(comandas, []);
    } catch (error) {
      console.log('Erro ao buscar comandas locais:', error);
      return [];
    }
  },

  // Sincronizar comandas pendentes
  async syncPendingData() {
    try {
      const comandas = await this.getComandasLocais();
      const comandasPendentes = comandas.filter(c => !c.sincronizado && c.status === 'fechada');
      
      if (comandasPendentes.length === 0) {
        return { success: true, message: 'Nada para sincronizar' };
      }

      // Validar dados antes do envio
      const comandasValidas = comandasPendentes.filter(comanda => 
        comanda.numero && comanda.operador && comanda.total >= 0
      );

      if (comandasValidas.length !== comandasPendentes.length) {
        console.warn('Algumas comandas foram filtradas por dados inválidos');
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comandas: comandasValidas
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Marcar comandas como sincronizadas
        const comandasAtualizadas = comandas.map(c => ({
          ...c,
          sincronizado: comandasValidas.some(v => v._id === c._id) ? true : c.sincronizado
        }));
        
        await AsyncStorage.setItem(STORAGE_KEYS.COMANDA, JSON.stringify(comandasAtualizadas));
        
        return { 
          success: true, 
          message: result.message || 'Sincronização concluída',
          details: result
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log('Erro na sincronização:', error);
      return { 
        success: false, 
        message: error.name === 'AbortError' ? 'Timeout na sincronização' : 'Erro de conexão' 
      };
    }
  },

  // Fechar comanda no servidor
  async fecharComanda(comandaId, formaPagamento, usuario) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/comandas/${comandaId}/fechar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formaPagamento,
          usuario
        })
      });

      if (response.ok) {
        const comandaFechada = await response.json();
        
        // Atualizar localmente
        await this.saveComandaLocal({
          ...comandaFechada,
          sincronizado: true
        });
        
        return comandaFechada;
      } else {
        throw new Error('Erro ao fechar comanda');
      }
    } catch (error) {
      console.log('Erro ao fechar comanda online, salvando local:', error);
      // Salvar localmente para sincronização posterior
      const comandas = await this.getComandasLocais();
      const comandaIndex = comandas.findIndex(c => c._id === comandaId);
      
      if (comandaIndex >= 0) {
        comandas[comandaIndex].status = 'fechada';
        comandas[comandaIndex].formaPagamento = formaPagamento;
        comandas[comandaIndex].dataFechamento = new Date().toISOString();
        comandas[comandaIndex].sincronizado = false;
        
        await AsyncStorage.setItem(STORAGE_KEYS.COMANDA, JSON.stringify(comandas));
        return comandas[comandaIndex];
      }
      
      throw error;
    }
  },

  // Verificar status do servidor
  async checkServerStatus() {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Servidor não está respondendo adequadamente');
      }
    } catch (error) {
      console.log('Erro ao verificar status do servidor:', error);
      throw error;
    }
  }
};