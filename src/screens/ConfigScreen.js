import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { apiService } from '../services/api';

const ConfigScreen = ({ navigation }) => {
  const [debugInfo, setDebugInfo] = useState(null);

  const handleDebugStorage = async () => {
    try {
      const info = await apiService.debugStorage();
      setDebugInfo(info);
      Alert.alert('Debug', 'Informações do storage no console');
      console.log('🐛 Debug Info:', info);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter informações de debug');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Isso irá remover TODOS os dados locais (comandas, produtos, etc). Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar Tudo', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.clearAllData();
              Alert.alert('Sucesso', 'Todos os dados foram limpos. O app será reiniciado.');
              // Navegar para tela de inicialização
              navigation.reset({
                index: 0,
                routes: [{ name: 'Init' }],
              });
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar os dados');
            }
          }
        }
      ]
    );
  };

  const handleTestConnection = async () => {
    try {
      const status = await apiService.checkServerStatus();
      Alert.alert('Conexão OK', `Servidor: ${status.status}\nBanco: ${status.database}`);
    } catch (error) {
      Alert.alert('Erro de Conexão', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Gerenciar dados e conexão</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Informações do Sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Sistema</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoItem}>Plataforma: {Platform.OS}</Text>
            <Text style={styles.infoItem}>Storage: {Platform.OS === 'web' ? 'localStorage' : 'AsyncStorage'}</Text>
          </View>
        </View>

        {/* Conexão */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conexão</Text>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestConnection}
          >
            <Text style={styles.buttonText}>🔗 Testar Conexão com Servidor</Text>
          </TouchableOpacity>
        </View>

        {/* Sincronização */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sincronização</Text>
          <TouchableOpacity
            style={[styles.button, styles.syncButton]}
            onPress={() => navigation.navigate('Sync')}
          >
            <Text style={styles.buttonText}>🔄 Ir para Sincronização</Text>
          </TouchableOpacity>
        </View>

        {/* Debug */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>
          <TouchableOpacity
            style={[styles.button, styles.debugButton]}
            onPress={handleDebugStorage}
          >
            <Text style={styles.buttonText}>🐛 Debug Storage</Text>
          </TouchableOpacity>
        </View>

        {/* Dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerenciar Dados</Text>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearData}
          >
            <Text style={styles.buttonText}>🗑️ Limpar Todos os Dados</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Info */}
        {debugInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações de Debug</Text>
            <View style={styles.debugCard}>
              {Object.entries(debugInfo).map(([key, info]) => (
                <View key={key} style={styles.debugItem}>
                  <Text style={styles.debugKey}>{key}:</Text>
                  <Text style={styles.debugValue}>
                    {info.type} ({info.length} itens)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  button: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  testButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  syncButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  debugButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  clearButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  debugCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  debugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  debugKey: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  debugValue: {
    fontSize: 14,
    color: '#666',
  },
});

export default ConfigScreen;