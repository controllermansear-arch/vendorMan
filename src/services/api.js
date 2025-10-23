import { universalStorage } from './storage';

const API_BASE_URL = 'https://us-central1-vendorman-d66fd.cloudfunctions.net/api';

const STORAGE_KEYS = {
  PRODUCTS: 'vendorman_products_data',
  COMBOS: 'vendorman_combos_data',
  FRACIONADOS: 'vendorman_fracionados_data',
  COMANDA: 'vendorman_comandas_data',
  ESTOQUE: 'vendorman_estoque_data',
  CONFIG: 'vendorman_config_data',
  LAST_SYNC: 'vendorman_last_sync'
};

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

export const apiService = {
  // Sincronizar dados iniciais - ATUALIZADO
  async syncInitialData() {
    try {
      console.log('🔄 Iniciando sincronização...');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Dados recebidos do servidor:', {
        produtos: data.products?.length || 0,
        combos: data.combos?.length || 0,
        fracionados: data.fracionados?.length || 0
      });
      
      // Salvar usando storage universal
      await universalStorage.setItem(STORAGE_KEYS.PRODUCTS, data.products || []);
      await universalStorage.setItem(STORAGE_KEYS.COMBOS, data.combos || []);
      await universalStorage.setItem(STORAGE_KEYS.FRACIONADOS, data.fracionados || []);
      
      // Salvar timestamp da última sincronização
      await universalStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now());
      
      console.log('✅ Dados sincronizados com sucesso');
      return data;
    } catch (error) {
      console.log('❌ Erro na sincronização:', error.message);
      // Retorna dados locais em caso de erro
      return await this.getLocalData();
    }
  },

  // Verificar se precisa sincronizar (cache de 5 minutos)
  async needsSync() {
    try {
      const lastSync = await universalStorage.getItem(STORAGE_KEYS.LAST_SYNC, 0);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      return (now - lastSync) > fiveMinutes;
    } catch (error) {
      console.log('❌ Erro ao verificar necessidade de sync:', error);
      return true; // Em caso de erro, força sincronização
    }
  },

  // Buscar dados locais - ATUALIZADO
  async getLocalData() {
    try {
      const [products, combos, fracionados] = await Promise.all([
        universalStorage.getArray(STORAGE_KEYS.PRODUCTS),
        universalStorage.getArray(STORAGE_KEYS.COMBOS),
        universalStorage.getArray(STORAGE_KEYS.FRACIONADOS)
      ]);

      const data = {
        products: products,
        combos: combos,
        fracionados: fracionados
      };

      console.log('📊 Dados locais carregados:', {
        produtos: data.products.length,
        combos: data.combos.length,
        fracionados: data.fracionados.length
      });

      return data;
    } catch (error) {
      console.log('❌ Erro ao buscar dados locais:', error);
      return { products: [], combos: [], fracionados: [] };
    }
  },

  // Inicializar dados do servidor
  async initializeFromServer() {
    try {
      console.log('🚀 Inicializando dados do servidor...');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/admin/init-collections`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Resposta da inicialização:', result);
      
      // Após inicializar no servidor, sincroniza os dados
      await this.syncInitialData();
      
      return result;
    } catch (error) {
      console.log('❌ Erro na inicialização do servidor:', error);
      throw error;
    }
  },

  // Buscar todos os itens para venda - ATUALIZADO
  async getAllItems() {
    try {
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

      const todosItens = [...produtosFormatados, ...combosFormatados, ...fracionadosFormatados];
      console.log('🛍️ Itens disponíveis:', todosItens.length);
      
      return todosItens;
    } catch (error) {
      console.log('❌ Erro ao carregar itens:', error);
      return [];
    }
  },

  // Salvar comanda localmente - ATUALIZADO
  async saveComandaLocal(comanda) {
    try {
      const comandas = await universalStorage.getArray(STORAGE_KEYS.COMANDA);
      
      const index = comandas.findIndex(c => c._id === comanda._id);
      if (index >= 0) {
        comandas[index] = comanda;
        console.log('📝 Comanda atualizada:', comanda.numero);
      } else {
        comandas.push(comanda);
        console.log('🆕 Nova comanda criada:', comanda.numero);
      }
      
      await universalStorage.setItem(STORAGE_KEYS.COMANDA, comandas);
      return true;
    } catch (error) {
      console.log('❌ Erro ao salvar comanda local:', error);
      return false;
    }
  },

  // Buscar comanda por ID - ATUALIZADO
  async getComandaById(comandaId) {
    try {
      const comandas = await this.getComandasLocais();
      const comanda = comandas.find(c => c._id === comandaId) || null;
      console.log('🔍 Comanda encontrada:', comanda ? comanda.numero : 'não encontrada');
      return comanda;
    } catch (error) {
      console.log('❌ Erro ao buscar comanda:', error);
      return null;
    }
  },

  // Buscar comandas locais - ATUALIZADO
  async getComandasLocais() {
    try {
      const comandas = await universalStorage.getArray(STORAGE_KEYS.COMANDA);
      console.log('📋 Comandas locais:', comandas.length);
      return comandas;
    } catch (error) {
      console.log('❌ Erro ao buscar comandas locais:', error);
      return [];
    }
  },

async adicionarItemComanda(comandaId, item, pedidoIndex = 0) {
  try {
    console.log('➕ Tentando adicionar item:', {
      comandaId,
      pedidoIndex,
      item: item.descricao,
      quantidade: item.quantidade
    });

    const comandas = await this.getComandasLocais();
    const comandaIndex = comandas.findIndex(c => c._id === comandaId);
    
    if (comandaIndex === -1) {
      throw new Error('Comanda não encontrada');
    }

    // Verificar se o pedido existe
    if (!comandas[comandaIndex].pedidos || !comandas[comandaIndex].pedidos[pedidoIndex]) {
      throw new Error('Pedido não encontrado');
    }

    // Calcular preços
    const precoUnitario = item.precoVenda || item.preco || 0;
    const precoTotal = precoUnitario * item.quantidade;

    const novoItem = {
      tipo: item.tipo,
      codItem: item.codItem,
      descricao: item.descricao,
      quantidade: item.quantidade,
      precoUnitario: precoUnitario,
      precoTotal: precoTotal
    };

    console.log('📦 Novo item criado:', novoItem);

    // Adicionar item ao pedido específico
    comandas[comandaIndex].pedidos[pedidoIndex].itens.push(novoItem);

    // Atualizar total da comanda
    comandas[comandaIndex].total = this.calcularTotalComanda(comandas[comandaIndex]);
    comandas[comandaIndex].sincronizado = false;

    console.log('💾 Salvando comanda atualizada...');
    await universalStorage.setItem(STORAGE_KEYS.COMANDA, comandas);
    
    console.log('✅ Item adicionado com sucesso ao pedido', pedidoIndex);
    return comandas[comandaIndex];
  } catch (error) {
    console.log('❌ Erro ao adicionar item:', error);
    throw error;
  }
},


  // Calcular total da comanda
  calcularTotalComanda(comanda) {
    if (!comanda.pedidos || comanda.pedidos.length === 0) {
      return 0;
    }
    
    let total = 0;
    comanda.pedidos.forEach(pedido => {
      pedido.itens.forEach(item => {
        total += item.precoTotal || 0;
      });
    });
    
    return total;
  },

async removerItemComanda(comandaId, pedidoIndex, itemIndex) {
  try {
    const comandas = await this.getComandasLocais();
    const comandaIndex = comandas.findIndex(c => c._id === comandaId);
    
    if (comandaIndex === -1) {
      throw new Error('Comanda não encontrada');
    }

    // Verificar se o pedido existe
    if (!comandas[comandaIndex].pedidos || !comandas[comandaIndex].pedidos[pedidoIndex]) {
      throw new Error('Pedido não encontrado');
    }

    // Remover item do pedido específico
    if (comandas[comandaIndex].pedidos[pedidoIndex].itens.length > itemIndex) {
      const itemRemovido = comandas[comandaIndex].pedidos[pedidoIndex].itens[itemIndex];
      comandas[comandaIndex].pedidos[pedidoIndex].itens.splice(itemIndex, 1);
      
      console.log('➖ Item removido do pedido', pedidoIndex, ':', itemRemovido.descricao);
      
      // Atualizar total
      comandas[comandaIndex].total = this.calcularTotalComanda(comandas[comandaIndex]);
      comandas[comandaIndex].sincronizado = false;

      await universalStorage.setItem(STORAGE_KEYS.COMANDA, comandas);
      return comandas[comandaIndex];
    }
    
    return comandas[comandaIndex];
  } catch (error) {
    console.log('❌ Erro ao remover item:', error);
    throw error;
  }
},
  // Sincronizar comandas pendentes - ATUALIZADO
  async syncPendingData() {
    try {
      console.log('🔄 Iniciando sincronização de comandas...');
      
      const comandas = await this.getComandasLocais();
      const comandasPendentes = comandas.filter(c => !c.sincronizado && c.status === 'fechada');
      
      console.log('📤 Comandas pendentes para sincronizar:', comandasPendentes.length);
      
      if (comandasPendentes.length === 0) {
        return { success: true, message: 'Nada para sincronizar' };
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comandas: comandasPendentes
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resposta da sincronização:', result);
        
        // Marcar comandas como sincronizadas
        const comandasAtualizadas = comandas.map(c => ({
          ...c,
          sincronizado: comandasPendentes.some(v => v._id === c._id) ? true : c.sincronizado
        }));
        
        await universalStorage.setItem(STORAGE_KEYS.COMANDA, comandasAtualizadas);
        
        console.log('✅ Sincronização concluída com sucesso');
        
        return { 
          success: true, 
          message: result.message || 'Sincronização concluída',
          details: result
        };
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.log('❌ Erro na sincronização:', error.message);
      return { 
        success: false, 
        message: error.name === 'AbortError' ? 'Timeout na sincronização' : `Erro: ${error.message}` 
      };
    }
  },

  // Fechar comanda - ATUALIZADO
  async fecharComanda(comandaId, formaPagamento, usuario) {
    try {
      const comandas = await this.getComandasLocais();
      const comandaIndex = comandas.findIndex(c => c._id === comandaId);
      
      if (comandaIndex === -1) {
        throw new Error('Comanda não encontrada');
      }

      console.log('🔒 Fechando comanda:', {
        numero: comandas[comandaIndex].numero,
        formaPagamento,
        usuario
      });

      // Atualizar comanda
      comandas[comandaIndex].status = 'fechada';
      comandas[comandaIndex].formaPagamento = formaPagamento;
      comandas[comandaIndex].dataFechamento = new Date().toISOString();
      comandas[comandaIndex].sincronizado = false;

      await universalStorage.setItem(STORAGE_KEYS.COMANDA, comandas);
      
      console.log('✅ Comanda fechada com sucesso');
      
      return comandas[comandaIndex];
    } catch (error) {
      console.log('❌ Erro ao fechar comanda:', error);
      throw error;
    }
  },


  async excluirPedido(comandaId, pedidoIndex) {
  try {
    const comandas = await this.getComandasLocais();
    const comandaIndex = comandas.findIndex(c => c._id === comandaId);
    
    if (comandaIndex === -1) {
      throw new Error('Comanda não encontrada');
    }

    // Verificar se o pedido existe
    if (!comandas[comandaIndex].pedidos || !comandas[comandaIndex].pedidos[pedidoIndex]) {
      throw new Error('Pedido não encontrado');
    }

    // Remover o pedido
    const pedidoRemovido = comandas[comandaIndex].pedidos.splice(pedidoIndex, 1)[0];
    
    console.log('🗑️ Pedido excluído:', pedidoRemovido);

    // Reorganizar números dos pedidos restantes
    comandas[comandaIndex].pedidos.forEach((pedido, index) => {
      pedido.numero = index + 1;
    });

    // Atualizar total
    comandas[comandaIndex].total = this.calcularTotalComanda(comandas[comandaIndex]);
    comandas[comandaIndex].sincronizado = false;

    await universalStorage.setItem(STORAGE_KEYS.COMANDA, comandas);
    return comandas[comandaIndex];
  } catch (error) {
    console.log('❌ Erro ao excluir pedido:', error);
    throw error;
  }
},

async reabrirPedido(comandaId, pedidoIndex) {
  try {
    const comandas = await this.getComandasLocais();
    const comandaIndex = comandas.findIndex(c => c._id === comandaId);
    
    if (comandaIndex === -1) {
      throw new Error('Comanda não encontrada');
    }

    if (!comandas[comandaIndex].pedidos || !comandas[comandaIndex].pedidos[pedidoIndex]) {
      throw new Error('Pedido não encontrado');
    }

    // Reabrir o pedido
    comandas[comandaIndex].pedidos[pedidoIndex].status = 'aberto';
    comandas[comandaIndex].pedidos[pedidoIndex].dataFechamento = null;
    comandas[comandaIndex].sincronizado = false;

    await universalStorage.setItem(STORAGE_KEYS.COMANDA, comandas);
    console.log('✅ Pedido reaberto:', pedidoIndex);
    return comandas[comandaIndex];
  } catch (error) {
    console.log('❌ Erro ao reabrir pedido:', error);
    throw error;
  }
},

async fecharPedido(comandaId, pedidoIndex) {
  try {
    const comandas = await this.getComandasLocais();
    const comandaIndex = comandas.findIndex(c => c._id === comandaId);
    
    if (comandaIndex === -1) {
      throw new Error('Comanda não encontrada');
    }

    if (!comandas[comandaIndex].pedidos || !comandas[comandaIndex].pedidos[pedidoIndex]) {
      throw new Error('Pedido não encontrado');
    }

    // Fechar o pedido
    comandas[comandaIndex].pedidos[pedidoIndex].status = 'fechado';
    comandas[comandaIndex].pedidos[pedidoIndex].dataFechamento = new Date().toISOString();
    comandas[comandaIndex].sincronizado = false;

    await universalStorage.setItem(STORAGE_KEYS.COMANDA, comandas);
    console.log('✅ Pedido fechado:', pedidoIndex);
    return comandas[comandaIndex];
  } catch (error) {
    console.log('❌ Erro ao fechar pedido:', error);
    throw error;
  }
},

  // Verificar status do servidor
  async checkServerStatus() {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
      if (response.ok) {
        const status = await response.json();
        console.log('🌐 Status do servidor:', status);
        return status;
      } else {
        throw new Error('Servidor não está respondendo adequadamente');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar status do servidor:', error);
      throw error;
    }
  },

  // Métodos de utilidade para debug
  async debugStorage() {
    try {
      const keys = await universalStorage.getAllKeys();
      const storageInfo = {};
      
      for (const key of keys) {
        if (key.startsWith('vendorman_')) {
          const value = await universalStorage.getItem(key);
          storageInfo[key] = {
            type: Array.isArray(value) ? 'array' : typeof value,
            length: Array.isArray(value) ? value.length : 'N/A',
            sample: Array.isArray(value) && value.length > 0 ? value[0] : value
          };
        }
      }
      
      console.log('🐛 Debug Storage:', storageInfo);
      return storageInfo;
    } catch (error) {
      console.log('❌ Erro no debug storage:', error);
      return {};
    }
  },
calcularTotalComanda(comanda) {
  if (!comanda.pedidos || comanda.pedidos.length === 0) {
    return 0;
  }
  
  let total = 0;
  comanda.pedidos.forEach(pedido => {
    if (pedido.itens) {
      pedido.itens.forEach(item => {
        total += item.precoTotal || 0;
      });
    }
  });
  
  return total;
},
  // Limpar todos os dados (para desenvolvimento)
  async clearAllData() {
    try {
      const keys = await universalStorage.getAllKeys();
      const vendorKeys = keys.filter(key => key.startsWith('vendorman_'));
      
      for (const key of vendorKeys) {
        await universalStorage.removeItem(key);
      }
      
      console.log('🗑️ Todos os dados limpos');
      return true;
    } catch (error) {
      console.log('❌ Erro ao limpar dados:', error);
      return false;
    }
  }
};