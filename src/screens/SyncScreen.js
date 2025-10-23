import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { apiService } from '../services/api';

const SyncScreen = ({ navigation }) => {
  const [syncStatus, setSyncStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const handleSyncProducts = async () => {
    setLoading(true);
    setSyncStatus('Sincronizando produtos...');
    
    try {
      const result = await apiService.syncInitialData();
      setSyncStatus('✅ Produtos sincronizados com sucesso!');
      setLastSync(new Date().toLocaleString());
      
      Alert.alert('Sucesso', `Sincronização concluída!\n\nProdutos: ${result.products?.length || 0}\nCombos: ${result.combos?.length || 0}\nFracionados: ${result.fracionados?.length || 0}`);
    } catch (error) {
      setSyncStatus('❌ Erro na sincronização');
      Alert.alert('Erro', 'Não foi possível sincronizar os produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncComandas = async () => {
    setLoading(true);
    setSyncStatus('Sincronizando comandas...');
    
    try {
      const result = await apiService.syncPendingData();
      
      if (result.success) {
        setSyncStatus('✅ Comandas sincronizadas com sucesso!');
        setLastSync(new Date().toLocaleString());
        Alert.alert('Sucesso', result.message);
      } else {
        setSyncStatus('❌ ' + result.message);
        Alert.alert('Aviso', result.message);
      }
    } catch (error) {
      setSyncStatus('❌ Erro na sincronização');
      Alert.alert('Erro', 'Não foi possível sincronizar as comandas');
    } finally {
      setLoading(false);
    }
  };

  const handleFullSync = async () => {
    setLoading(true);
    setSyncStatus('Sincronização completa iniciada...');
    
    try {
      // Sincronizar produtos primeiro
      await apiService.syncInitialData();
      setSyncStatus('Produtos OK, sincronizando comandas...');
      
      // Depois comandas
      const result = await apiService.syncPendingData();
      
      if (result.success) {
        setSyncStatus('✅ Sincronização completa concluída!');
        setLastSync(new Date().toLocaleString());
        Alert.alert('Sucesso', 'Sincronização completa realizada com sucesso!');
      } else {
        setSyncStatus('⚠️ ' + result.message);
        Alert.alert('Aviso', result.message);
      }
    } catch (error) {
      setSyncStatus('❌ Erro na sincronização completa');
      Alert.alert('Erro', 'Não foi possível completar a sincronização');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sincronização</Text>
        <Text style={styles.subtitle}>Sincronize dados com o servidor</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status</Text>
          <Text style={styles.statusText}>{syncStatus || 'Pronto para sincronizar'}</Text>
          {lastSync && (
            <Text style={styles.lastSync}>
              Última sincronização: {lastSync}
            </Text>
          )}
        </View>

        {/* Botões de Sincronização */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.syncButton, styles.productsButton]}
            onPress={handleSyncProducts}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.syncButtonText}>🔄 Sincronizar Produtos</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.syncButton, styles.comandasButton]}
            onPress={handleSyncComandas}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.syncButtonText}>📋 Sincronizar Comandas</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.syncButton, styles.fullSyncButton]}
            onPress={handleFullSync}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.syncButtonText}>🚀 Sincronização Completa</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Informações */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>O que cada sincronização faz:</Text>
          <Text style={styles.infoItem}>• <Text style={styles.infoBold}>Produtos:</Text> Atualiza lista de produtos, combos e fracionados</Text>
          <Text style={styles.infoItem}>• <Text style={styles.infoBold}>Comandas:</Text> Envia comandas fechadas para o servidor</Text>
          <Text style={styles.infoItem}>• <Text style={styles.infoBold}>Completa:</Text> Executa ambas as sincronizações</Text>
        </View>
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
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  lastSync: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  buttonsContainer: {
    marginBottom: 16,
  },
  syncButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productsButton: {
    backgroundColor: '#FF9500',
  },
  comandasButton: {
    backgroundColor: '#34C759',
  },
  fullSyncButton: {
    backgroundColor: '#007AFF',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default SyncScreen;