// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  COMANDAS: '@vendorMan:comandas',
  ITENS: '@vendorMan:itens',
  SYNC_DATA: '@vendorMan:syncData'
};

// ===== FUNÇÕES BÁSICAS DE STORAGE =====
export const salvarDados = async (key, data) => {
  try {
    const jsonData = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonData);
    console.log(`💾 Dados salvos em ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar dados em ${key}:`, error);
    throw error;
  }
};

export const carregarDados = async (key) => {
  try {
    const jsonData = await AsyncStorage.getItem(key);
    if (jsonData) {
      const data = JSON.parse(jsonData);
      console.log(`📂 Dados carregados de ${key}:`, Array.isArray(data) ? `${data.length} itens` : 'objeto');
      return data;
    }
    console.log(`📂 Nenhum dado encontrado em ${key}`);
    return null;
  } catch (error) {
    console.error(`❌ Erro ao carregar dados de ${key}:`, error);
    throw error;
  }
};

// ===== FUNÇÕES DE COMANDAS =====
export const getComandas = async () => {
  try {
    const comandas = await carregarDados(STORAGE_KEYS.COMANDAS);
    return comandas || [];
  } catch (error) {
    console.error('❌ Erro ao carregar comandas:', error);
    return [];
  }
};

export const getComanda = async (comandaId) => {
  try {
    console.log(`🔍 Buscando comanda: ${comandaId}`);
    
    if (!comandaId) {
      console.warn('⚠️ ID da comanda não fornecido');
      return null;
    }
    
    const comandas = await getComandas();
    const comandaEncontrada = comandas.find(c => c.id === comandaId);
    
    if (!comandaEncontrada) {
      console.warn(`⚠️ Comanda ${comandaId} não encontrada`);
      return null;
    }
    
    console.log(`✅ Comanda encontrada:`, {
      id: comandaEncontrada.id,
      numero: comandaEncontrada.numero,
      status: comandaEncontrada.status,
      itens: comandaEncontrada.itens?.length || 0
    });
    
    return comandaEncontrada;
  } catch (error) {
    console.error(`❌ Erro ao buscar comanda ${comandaId}:`, error);
    return null;
  }
};

export const salvarComandas = async (comandas) => {
  try {
    await salvarDados(STORAGE_KEYS.COMANDAS, comandas);
    console.log(`✅ ${comandas.length} comandas salvas`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar comandas:', error);
    throw error;
  }
};

export const criarComanda = async (numero) => {
  try {
    const comandas = await getComandas();
    const novaComanda = {
      id: Date.now().toString(),
      numero: numero.toString(),
      status: 'aberta',
      dataAbertura: new Date().toISOString(),
      itens: [],
      total: 0
    };
    
    comandas.push(novaComanda);
    await salvarComandas(comandas);
    
    console.log(`✅ Nova comanda criada:`, novaComanda);
    return novaComanda;
  } catch (error) {
    console.error('❌ Erro ao criar comanda:', error);
    throw error;
  }
};

export const adicionarItemComanda = async (comandaId, itemData) => {
  try {
    console.log(`➕ Tentando adicionar item à comanda ${comandaId}:`, itemData);
    
    if (!comandaId || !itemData) {
      throw new Error('Dados insuficientes para adicionar item');
    }
    
    const comandas = await getComandas();
    const comandaIndex = comandas.findIndex(c => c.id === comandaId);
    
    if (comandaIndex === -1) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }
    
    const novoItem = {
      id: Date.now().toString(),
      ...itemData,
      dataAdicao: new Date().toISOString()
    };
    
    // Inicializa array de itens se não existir
    if (!comandas[comandaIndex].itens) {
      comandas[comandaIndex].itens = [];
    }
    
    comandas[comandaIndex].itens.push(novoItem);
    
    // Atualiza total da comanda
    comandas[comandaIndex].total = comandas[comandaIndex].itens.reduce((total, item) => {
      return total + (item.preco * item.quantidade);
    }, 0);
    
    await salvarComandas(comandas);
    console.log(`✅ Item adicionado com sucesso à comanda ${comandaId}`);
    
    return comandas[comandaIndex];
  } catch (error) {
    console.error(`❌ Erro ao adicionar item à comanda ${comandaId}:`, error);
    throw error;
  }
};

export const fecharComanda = async (comandaId) => {
  try {
    console.log(`📦 Iniciando fechamento da comanda: ${comandaId}`);
    
    if (!comandaId) {
      throw new Error('ID da comanda não fornecido');
    }
    
    const comanda = await getComanda(comandaId);
    if (!comanda) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }
    
    if (comanda.status === 'fechada') {
      console.warn(`⚠️ Comanda ${comandaId} já está fechada`);
      return comanda;
    }
    
    const comandas = await getComandas();
    const comandaIndex = comandas.findIndex(c => c.id === comandaId);
    
    if (comandaIndex === -1) {
      throw new Error(`Comanda ${comandaId} não encontrada para fechamento`);
    }
    
    // Calcula total final
    const total = comandas[comandaIndex].itens?.reduce((sum, item) => {
      return sum + (item.preco * item.quantidade);
    }, 0) || 0;
    
    // Atualiza comanda
    comandas[comandaIndex].status = 'fechada';
    comandas[comandaIndex].dataFechamento = new Date().toISOString();
    comandas[comandaIndex].total = total;
    
    await salvarComandas(comandas);
    
    const comandaFechada = comandas[comandaIndex];
    console.log(`✅ Comanda fechada com sucesso:`, {
      id: comandaFechada.id,
      numero: comandaFechada.numero,
      total: comandaFechada.total,
      itens: comandaFechada.itens?.length || 0
    });
    
    return comandaFechada;
  } catch (error) {
    console.error(`❌ Erro ao fechar comanda ${comandaId}:`, error);
    throw error;
  }
};

export const reabrirComanda = async (comandaId) => {
  try {
    console.log(`🔄 Reabrindo comanda: ${comandaId}`);
    
    const comandas = await getComandas();
    const comandaIndex = comandas.findIndex(c => c.id === comandaId);
    
    if (comandaIndex === -1) {
      throw new Error(`Comanda ${comandaId} não encontrada`);
    }
    
    comandas[comandaIndex].status = 'aberta';
    comandas[comandaIndex].dataFechamento = null;
    
    await salvarComandas(comandas);
    console.log(`✅ Comanda reaberta: ${comandaId}`);
    
    return comandas[comandaIndex];
  } catch (error) {
    console.error(`❌ Erro ao reabrir comanda ${comandaId}:`, error);
    throw error;
  }
};

// ===== FUNÇÕES DE ITENS =====
export const getItens = async () => {
  try {
    const itens = await carregarDados(STORAGE_KEYS.ITENS);
    return itens || [];
  } catch (error) {
    console.error('❌ Erro ao carregar itens:', error);
    return [];
  }
};

export const salvarItens = async (itens) => {
  try {
    await salvarDados(STORAGE_KEYS.ITENS, itens);
    console.log(`✅ ${itens.length} itens salvos`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar itens:', error);
    throw error;
  }
};

// ===== SINCRONIZAÇÃO =====
export const sincronizarDados = async () => {
  try {
    console.log('🔄 Iniciando sincronização...');
    
    const [comandasLocais, itensLocais] = await Promise.all([
      getComandas(),
      getItens()
    ]);
    
    console.log('📊 Dados para sincronização:', {
      comandas: comandasLocais.length,
      itens: itensLocais.length
    });
    
    // Simular sincronização com servidor
    const syncData = {
      ultimaSincronizacao: new Date().toISOString(),
      comandas: comandasLocais.length,
      itens: itensLocais.length
    };
    
    await salvarDados(STORAGE_KEYS.SYNC_DATA, syncData);
    console.log('✅ Sincronização concluída:', syncData);
    
    return syncData;
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    throw error;
  }
};

export const getSyncStatus = async () => {
  try {
    return await carregarDados(STORAGE_KEYS.SYNC_DATA);
  } catch (error) {
    console.error('❌ Erro ao carregar status de sync:', error);
    return null;
  }
};

// ===== INICIALIZAÇÃO =====
export const inicializarDados = async () => {
  try {
    console.log('🚀 Inicializando dados do app...');
    
    const comandas = await getComandas();
    const itens = await getItens();
    
    // Se não há itens, criar alguns de exemplo
    if (itens.length === 0) {
      const itensExemplo = [
        { id: '1', nome: 'Café Expresso', preco: 5.00, categoria: 'Bebidas' },
        { id: '2', nome: 'Pão de Queijo', preco: 8.00, categoria: 'Salgados' },
        { id: '3', nome: 'Suco Natural', preco: 7.00, categoria: 'Bebidas' },
        { id: '4', nome: 'Bolo', preco: 6.50, categoria: 'Doces' },
        { id: '5', nome: 'Sanduíche', preco: 12.00, categoria: 'Salgados' },
        { id: '6', nome: 'Água Mineral', preco: 3.00, categoria: 'Bebidas' },
        { id: '7', nome: 'Refrigerante', preco: 5.50, categoria: 'Bebidas' }
      ];
      
      await salvarItens(itensExemplo);
      console.log(`✅ ${itensExemplo.length} itens de exemplo criados`);
    }
    
    // Se não há comandas, criar uma de exemplo
    if (comandas.length === 0) {
      const novaComanda = await criarComanda('001');
      console.log('✅ Comanda de exemplo criada:', novaComanda.numero);
    }
    
    console.log('🎯 Aplicativo inicializado com sucesso');
    return {
      comandas: await getComandas(),
      itens: await getItens()
    };
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    throw error;
  }
};

export default {
  // Storage
  salvarDados,
  carregarDados,
  
  // Comandas
  getComandas,
  getComanda,
  salvarComandas,
  criarComanda,
  adicionarItemComanda,
  fecharComanda,
  reabrirComanda,
  
  // Itens
  getItens,
  salvarItens,
  
  // Sincronização
  sincronizarDados,
  getSyncStatus,
  
  // Inicialização
  inicializarDados
};