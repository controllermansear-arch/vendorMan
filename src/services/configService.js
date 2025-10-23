// src/services/configService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CONFIG: '@vendorMan:config',
  OPERADOR: '@vendorMan:operador',
  SUPERVISOR_PASSWORD: '@vendorMan:supervisorPassword'
};

// Configurações padrão
const DEFAULT_CONFIG = {
  operador: 'Operador',
  supervisorPassword: '1234',
  empresa: 'Minha Empresa',
  impressora: null,
  modoDark: false
};

export const carregarConfiguracoes = async () => {
  try {
    const configJson = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
    if (configJson) {
      const config = JSON.parse(configJson);
      console.log('⚙️ Configurações carregadas');
      return { ...DEFAULT_CONFIG, ...config };
    }
    
    // Se não existe, cria com padrão
    await salvarConfiguracoes(DEFAULT_CONFIG);
    console.log('⚙️ Configurações padrão criadas');
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('❌ Erro ao carregar configurações:', error);
    return DEFAULT_CONFIG;
  }
};

export const salvarConfiguracoes = async (config) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    console.log('✅ Configurações salvas:', config);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
    return false;
  }
};

export const getOperador = async () => {
  try {
    const config = await carregarConfiguracoes();
    return config.operador || 'Operador';
  } catch (error) {
    return 'Operador';
  }
};

export const setOperador = async (nome) => {
  try {
    const config = await carregarConfiguracoes();
    config.operador = nome;
    await salvarConfiguracoes(config);
    return true;
  } catch (error) {
    console.error('❌ Erro ao definir operador:', error);
    return false;
  }
};

export const verificarSenhaSupervisor = async (senha) => {
  try {
    const config = await carregarConfiguracoes();
    return config.supervisorPassword === senha;
  } catch (error) {
    console.error('❌ Erro ao verificar senha:', error);
    return false;
  }
};

export const alterarSenhaSupervisor = async (senhaAtual, novaSenha) => {
  try {
    const config = await carregarConfiguracoes();
    
    // Verifica senha atual
    if (config.supervisorPassword !== senhaAtual) {
      throw new Error('Senha atual incorreta');
    }
    
    config.supervisorPassword = novaSenha;
    await salvarConfiguracoes(config);
    console.log('✅ Senha do supervisor alterada');
    return true;
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    throw error;
  }
};

export const resetarConfiguracoes = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CONFIG);
    console.log('✅ Configurações resetadas');
    return true;
  } catch (error) {
    console.error('❌ Erro ao resetar configurações:', error);
    return false;
  }
};

export default {
  carregarConfiguracoes,
  salvarConfiguracoes,
  getOperador,
  setOperador,
  verificarSenhaSupervisor,
  alterarSenhaSupervisor,
  resetarConfiguracoes
};