// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { getComandas, criarComanda, sincronizarDados, getItens } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [novoNumero, setNovoNumero] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [comandasData, itensData] = await Promise.all([
        getComandas(),
        getItens()
      ]);
      setComandas(comandasData);
      console.log('📊 Dados carregados:', {
        comandas: comandasData.length,
        itens: itensData.length
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleNovaComanda = async (numero) => {
    try {
      const numeroComanda = numero || (comandas.length + 1).toString().padStart(3, '0');
      const novaComanda = await criarComanda(numeroComanda);
      
      Alert.alert('Sucesso', `Comanda #${novaComanda.numero} criada!`);
      carregarDados();
      setModalVisible(false);
      setNovoNumero('');
      
    } catch (error) {
      console.error('❌ Erro ao criar comanda:', error);
      Alert.alert('Erro', 'Falha ao criar comanda');
    }
  };

  const handleSincronizar = async () => {
    try {
      await sincronizarDados();
      await carregarDados();
      Alert.alert('Sucesso', 'Dados sincronizados!');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      Alert.alert('Aviso', 'Sincronização falhou, mas você pode continuar offline');
    }
  };

  const handleConfiguracao = () => {
    navigation.navigate('Configuracao');
  };

  const renderComanda = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.comandaCard,
        item.status === 'fechada' && styles.comandaFechada
      ]}
      onPress={() => navigation.navigate('FecharComanda', { comandaId: item.id })}
    >
      <View style={styles.comandaHeader}>
        <Text style={styles.comandaNumero}>#{item.numero}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'fechada' ? styles.statusFechada : styles.statusAberta
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'fechada' ? 'FECHADA' : 'ABERTA'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.comandaItens}>
        📦 Itens: {item.itens?.length || 0}
      </Text>
      <Text style={styles.comandaTotal}>
        💰 Total: R$ {item.total?.toFixed(2) || '0.00'}
      </Text>
      
      {item.dataAbertura && (
        <Text style={styles.comandaData}>
          🕒 Aberta em: {new Date(item.dataAbertura).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>VendorMan</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.configButton} onPress={handleConfiguracao}>
            <Text style={styles.configButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.syncButton} onPress={handleSincronizar}>
            <Text style={styles.syncButtonText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Comanda</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{comandas.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {comandas.filter(c => c.status === 'aberta').length}
          </Text>
          <Text style={styles.statLabel}>Abertas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {comandas.filter(c => c.status === 'fechada').length}
          </Text>
          <Text style={styles.statLabel}>Fechadas</Text>
        </View>
      </View>

      {/* Lista de Comandas */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando comandas...</Text>
        </View>
      ) : (
        <FlatList
          data={comandas}
          renderItem={renderComanda}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma comanda encontrada</Text>
              <TouchableOpacity 
                style={styles.emptyButton} 
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.emptyButtonText}>Criar Primeira Comanda</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal Nova Comanda */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Comanda</Text>
            
            <Text style={styles.modalLabel}>Número da Comanda:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 001"
              value={novoNumero}
              onChangeText={setNovoNumero}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={() => handleNovaComanda(novoNumero)}
              >
                <Text style={styles.confirmButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  configButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  configButtonText: {
    fontSize: 18,
  },
  syncButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  syncButtonText: {
    fontSize: 18,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  comandaCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comandaFechada: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  comandaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comandaNumero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAberta: {
    backgroundColor: '#4CAF50',
  },
  statusFechada: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  comandaItens: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  comandaTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  comandaData: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default HomeScreen;