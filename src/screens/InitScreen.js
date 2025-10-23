import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { apiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const InitScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({});
  const [hasData, setHasData] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      // Tentar buscar dados locais primeiro
      const localData = await apiService.getLocalData();
      const hasLocalData = localData.products.length > 0 || 
                          localData.combos.length > 0 || 
                          localData.fracionados.length > 0;
      
      setHasData(hasLocalData);

      // Tentar verificar status do servidor
      try {
        const response = await fetch(`${API_BASE_URL}/admin/status`);
        if (response.ok) {
          const serverStatus = await response.json();
          setStatus(serverStatus);
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (serverError) {
        console.log('Servidor offline:', serverError);
        setServerStatus('offline');
      }
    } catch (error) {
      console.log('Erro ao verificar status:', error);
      setServerStatus('error');
    }
  };

const initializeCollections = async () => {
  setIsLoading(true);
  try {
    // Usa a nova função do apiService
    const result = await apiService.initializeFromServer();
    
    Alert.alert('✅ Sucesso', result.message, [
      {
        text: 'OK',
        onPress: async () => {
          setHasData(true);
          await checkDatabaseStatus();
          
          // Navega para a Home após sucesso
          navigation.navigate('Home');
        }
      }
    ]);
    
  } catch (error) {
    console.log('Erro na inicialização:', error);
    Alert.alert(
      '❌ Erro no Servidor', 
      'Não foi possível conectar com o servidor: ' + error.message,
      [
        {
          text: 'Usar Dados Locais',
          onPress: () => loadSampleData()
        },
        {
          text: 'Tentar Novamente',
          onPress: () => initializeCollections()
        }
      ]
    );
  } finally {
    setIsLoading(false);
  }
};
  const loadSampleData = async () => {
    setIsLoading(true);
    try {
      // Dados de exemplo mais completos para uso offline
      const sampleData = {
        products: [
          {
            codInt: 1001,
            descricao: "ÁGUA MINERAL 200ML",
            preco: 7.45,
            familia: "BEBIDAS",
            ativo: true,
            tipo: "produto"
          },
          {
            codInt: 1002,
            descricao: "REFRIGERANTE COCA-COLA LATA",
            preco: 8.50,
            familia: "BEBIDAS",
            ativo: true,
            tipo: "produto"
          },
          {
            codInt: 1003,
            descricao: "CERVEJA HEINEKEN 600ML",
            preco: 15.90,
            familia: "BEBIDAS",
            ativo: true,
            tipo: "produto"
          },
          {
            codInt: 1004,
            descricao: "ESPETINHO DE CARNE",
            preco: 12.00,
            familia: "ALIMENTOS",
            ativo: true,
            tipo: "produto"
          },
          {
            codInt: 1005,
            descricao: "PORÇÃO DE BATATA FRITA",
            preco: 25.00,
            familia: "ALIMENTOS",
            ativo: true,
            tipo: "produto"
          },
          {
            codInt: 1006,
            descricao: "SUCO NATURAL LARANJA",
            preco: 10.00,
            familia: "BEBIDAS",
            ativo: true,
            tipo: "produto"
          },
          {
            codInt: 1007,
            descricao: "SANDUÍCHE NATURAL",
            preco: 18.00,
            familia: "ALIMENTOS",
            ativo: true,
            tipo: "produto"
          }
        ],
        combos: [
          {
            codCombo: "COMBO01",
            descricao: "COMBO CERVEJA + ESPETINHO",
            precoCombo: 30.00,
            produtosCombo: [
              {
                codInt: 1003,
                descricao: "CERVEJA HEINEKEN 600ML",
                quantidadeCombo: 1
              },
              {
                codInt: 1004,
                descricao: "ESPETINHO DE CARNE",
                quantidadeCombo: 1
              }
            ],
            ativo: true
          },
          {
            codCombo: "COMBO02",
            descricao: "COMBO REFRI + BATATA",
            precoCombo: 30.00,
            produtosCombo: [
              {
                codInt: 1002,
                descricao: "REFRIGERANTE COCA-COLA LATA",
                quantidadeCombo: 1
              },
              {
                codInt: 1005,
                descricao: "PORÇÃO DE BATATA FRITA",
                quantidadeCombo: 1
              }
            ],
            ativo: true
          }
        ],
        fracionados: [
          {
            codFracionado: "FRAC01",
            descricao: "VODKA ORLOFF DOSE",
            codInt: 2001,
            preco: 12.00,
            quantidadeFracionado: 0.075,
            unidadeMedida: "L",
            ativo: true
          },
          {
            codFracionado: "FRAC02",
            descricao: "WHISKY JOHNNIE WALKER DOSE",
            codInt: 2002,
            preco: 18.00,
            quantidadeFracionado: 0.075,
            unidadeMedida: "L",
            ativo: true
          },
          {
            codFracionado: "FRAC03",
            descricao: "GIN TANQUERAY DOSE",
            codInt: 2003,
            preco: 15.00,
            quantidadeFracionado: 0.075,
            unidadeMedida: "L",
            ativo: true
          }
        ]
      };

      // Salvar dados localmente
      await AsyncStorage.setItem('products_data', JSON.stringify(sampleData.products));
      await AsyncStorage.setItem('combos_data', JSON.stringify(sampleData.combos));
      await AsyncStorage.setItem('fracionados_data', JSON.stringify(sampleData.fracionados));

      Alert.alert('✅ Dados Carregados', 'Dados de exemplo carregados com sucesso!', [
        {
          text: 'Continuar',
          onPress: () => {
            setHasData(true);
            navigation.navigate('Home');
          }
        }
      ]);
      
    } catch (error) {
      Alert.alert('❌ Erro', 'Falha ao carregar dados: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToApp = () => {
    navigation.navigate('Home');
  };

  const getServerStatusText = () => {
    switch (serverStatus) {
      case 'online': return '✅ Online';
      case 'offline': return '❌ Offline';
      case 'error': return '⚠️ Erro';
      default: return '🔍 Verificando...';
    }
  };

  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'online': return '#34C759';
      case 'offline': return '#FF3B30';
      case 'error': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GetStore App</Text>
        <Text style={styles.subtitle}>Configuração Inicial</Text>
      </View>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Status do Sistema</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Servidor:</Text>
          <Text style={[styles.statusValue, { color: getServerStatusColor() }]}>
            {getServerStatusText()}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Dados Locais:</Text>
          <Text style={[styles.statusValue, { color: hasData ? '#34C759' : '#FF3B30' }]}>
            {hasData ? '✅ Carregados' : '❌ Não Encontrados'}
          </Text>
        </View>

        {status.collections && (
          <View style={styles.collectionsStatus}>
            <Text style={styles.collectionsTitle}>Collections no Servidor:</Text>
            <View style={styles.collectionItem}>
              <Text>📦 Produtos:</Text>
              <Text style={styles.collectionCount}>{status.collections.products}</Text>
            </View>
            <View style={styles.collectionItem}>
              <Text>🎁 Combos:</Text>
              <Text style={styles.collectionCount}>{status.collections.combos}</Text>
            </View>
            <View style={styles.collectionItem}>
              <Text>🥃 Fracionados:</Text>
              <Text style={styles.collectionCount}>{status.collections.fracionados}</Text>
            </View>
          </View>
        )}
      </View>

      {!hasData ? (
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Inicializar Aplicativo</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={initializeCollections}
            disabled={isLoading || serverStatus === 'offline'}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonText}>🔄 Inicializar do Servidor</Text>
                <Text style={styles.buttonSubtext}>
                  {serverStatus === 'online' 
                    ? 'Sincroniza com o banco de dados' 
                    : 'Servidor indisponível'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={loadSampleData}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>📱 Usar Dados de Exemplo</Text>
            <Text style={styles.buttonSubtext}>Para teste offline imediato</Text>
          </TouchableOpacity>

          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>💡 Recomendações:</Text>
            <Text style={styles.helpText}>• Use "Inicializar do Servidor" para ambiente de produção</Text>
            <Text style={styles.helpText}>• Use "Dados de Exemplo" para testes rápidos</Text>
            <Text style={styles.helpText}>• Você pode sincronizar depois em Configurações</Text>
          </View>
        </View>
      ) : (
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>✅ Aplicativo Pronto!</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.successButton]}
            onPress={proceedToApp}
          >
            <Text style={styles.buttonText}>🚀 Entrar no Aplicativo</Text>
            <Text style={styles.buttonSubtext}>Iniciar gestão de comandas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.outlineButton]}
            onPress={checkDatabaseStatus}
          >
            <Text style={styles.outlineButtonText}>🔄 Verificar Status Novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.warningButton]}
            onPress={() => {
              Alert.alert(
                'Recarregar Dados',
                'Isso irá substituir todos os dados atuais. Continuar?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Recarregar', 
                    style: 'destructive',
                    onPress: () => {
                      setHasData(false);
                      checkDatabaseStatus();
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>🔄 Recarregar Dados</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          GetStore App v1.0.0 • Desenvolvido para homologação
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  collectionsStatus: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  collectionsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  collectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  collectionCount: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actionsSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007AFF',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FF9500',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF3B30',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  outlineButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  helpText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default InitScreen;