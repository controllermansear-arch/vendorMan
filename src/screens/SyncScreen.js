import React, { useState, useEffect } from 'react';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [syncStats, setSyncStats] = useState({
    comandasPendentes: 0,
    produtosLocais: 0,
    ultimaAtualizacao: null
  });

  useEffect(() => {
    loadSyncInfo();
  }, []);

  const loadSyncInfo = async () => {
    const comandas = await apiService.getComandasLocais();
    const data = await apiService.getLocalData();
    
    const comandasPendentes = comandas.filter(c => !c.sincronizado).length;
    const produtosLocais = data.products.length + data.combos.length + data.fracionados.length;
    
    setSyncStats({
      comandasPendentes,
      produtosLocais,
      ultimaAtualizacao: new Date().toISOString()
    });
  };

  const syncData = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncStatus('Iniciando sincronização...');

    try {
      // Sincronizar dados iniciais (produtos, combos, fracionados)
      setSyncStatus('Sincronizando catálogo...');
      await apiService.syncInitialData();

      // Sincronizar comandas pendentes
      setSyncStatus('Sincronizando vendas...');
      const syncResult = await apiService.syncPendingData();

      if (syncResult.success) {
        setSyncStatus('Sincronização concluída!');
        Alert.alert('Sucesso', syncResult.message);
      } else {
        setSyncStatus('Erro na sincronização');
        Alert.alert('Atenção', syncResult.message);
      }

    } catch (error) {
      setSyncStatus('Erro na sincronização');
      Alert.alert('Erro', 'Falha na sincronização: ' + error.message);
    } finally {
      setIsSyncing(false);
      loadSyncInfo();
    }
  };

  const forceSyncCatalog = async () => {
    Alert.alert(
      'Forçar Atualização',
      'Isso irá atualizar todos os produtos, combos e preços. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Atualizar', 
          onPress: async () => {
            setIsSyncing(true);
            setSyncStatus('Forçando atualização do catálogo...');
            
            try {
              await apiService.syncInitialData();
              setSyncStatus('Catálogo atualizado com sucesso!');
              Alert.alert('Sucesso', 'Catálogo atualizado!');
              loadSyncInfo();
            } catch (error) {
              setSyncStatus('Erro na atualização');
              Alert.alert('Erro', 'Falha ao atualizar catálogo');
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
  };

  const viewPendingComandas = async () => {
    const comandas = await apiService.getComandasLocais();
    const pendentes = comandas.filter(c => !c.sincronizado);
    
    if (pendentes.length === 0) {
      Alert.alert('Info', 'Não há comandas pendentes para sincronizar');
      return;
    }

    Alert.alert(
      'Comandas Pendentes',
      `Existem ${pendentes.length} comandas aguardando sincronização:\n\n` +
      pendentes.map(c => `• Comanda #${c.numero} - R$ ${c.total.toFixed(2)}`).join('\n'),
      [{ text: 'OK' }]
    );
  };

  const getSyncStatusColor = () => {
    if (isSyncing) return '#FF9500';
    if (syncStats.comandasPendentes > 0) return '#FF3B30';
    return '#34C759';
  };

  const getSyncStatusText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (syncStats.comandasPendentes > 0) return 'Pendente';
    return 'Sincronizado';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sincronização de Dados</Text>

      {/* Status da Sincronização */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Status da Sincronização</Text>
          <View style={[styles.statusBadge, { backgroundColor: getSyncStatusColor() }]}>
            <Text style={styles.statusBadgeText}>{getSyncStatusText()}</Text>
          </View>
        </View>

        {isSyncing && (
          <View style={styles.syncProgress}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.syncStatusText}>{syncStatus}</Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{syncStats.comandasPendentes}</Text>
            <Text style={styles.statLabel}>Comandas Pendentes</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{syncStats.produtosLocais}</Text>
            <Text style={styles.statLabel}>Itens no Catálogo</Text>
          </View>
        </View>

        {syncStats.ultimaAtualizacao && (
          <Text style={styles.lastSyncText}>
            Última verificação: {new Date(syncStats.ultimaAtualizacao).toLocaleString('pt-BR')}
          </Text>
        )}
      </View>

      {/* Ações de Sincronização */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, isSyncing && styles.disabledButton]}
          onPress={syncData}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.actionButtonText}>Sincronizar Agora</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={forceSyncCatalog}
          disabled={isSyncing}
        >
          <Text style={styles.actionButtonText}>Forçar Atualização do Catálogo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.infoButton]}
          onPress={viewPendingComandas}
        >
          <Text style={styles.actionButtonText}>Ver Comandas Pendentes</Text>
        </TouchableOpacity>
      </View>

      {/* Informações de Conexão */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações da Conexão</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Modo Operação:</Text>
          <Text style={styles.infoValue}>Híbrido (Online/Offline)</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dados Offline:</Text>
          <Text style={styles.infoValue}>Armazenados Localmente</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sincronização:</Text>
          <Text style={styles.infoValue}>Automática ao Conectar</Text>
        </View>
      </View>

      {/* Dicas */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Dicas</Text>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipText}>
            • Sincronize regularmente para manter os preços atualizados
          </Text>
        </View>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipText}>
            • Comandas pendentes são enviadas automaticamente quando houver internet
          </Text>
        </View>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipText}>
            • Você pode trabalhar offline normalmente
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  syncProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#FFF9E6',
    borderRadius: 6,
  },
  syncStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#E67E22',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#007AFF',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  secondaryButton: {
    backgroundColor: '#FF9500',
  },
  infoButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
});

export default SyncScreen;