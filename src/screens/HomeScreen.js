import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { apiService } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNovaComanda, setShowNovaComanda] = useState(false);
  const [novaComandaData, setNovaComandaData] = useState({
    numero: '',
    nomeCliente: '',
    operador: 'Operador'
  });

  useEffect(() => {
    loadComandas();
  }, []);

  const loadComandas = async () => {
    try {
      const comandasData = await apiService.getComandasLocais();
      const comandasAbertas = comandasData.filter(c => c.status === 'aberta');
      setComandas(comandasAbertas);
    } catch (error) {
      console.log('Erro ao carregar comandas:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNumeroComanda = () => {
    const ultimoNumero = comandas.length > 0 
      ? Math.max(...comandas.map(c => c.numero))
      : 0;
    return ultimoNumero + 1;
  };

  const handleNovaComanda = () => {
    const numero = generateNumeroComanda();
    setNovaComandaData({
      numero: numero.toString(),
      nomeCliente: '',
      operador: 'Operador'
    });
    setShowNovaComanda(true);
  };

  const criarNovaComanda = async () => {
    if (!novaComandaData.numero || !novaComandaData.operador) {
      Alert.alert('Erro', 'Número e operador são obrigatórios');
      return;
    }

    try {
      const novaComanda = {
        _id: Date.now().toString(), // ID temporário
        numero: parseInt(novaComandaData.numero),
        nomeCliente: novaComandaData.nomeCliente || '',
        operador: novaComandaData.operador,
        pedidos: [],
        status: 'aberta',
        total: 0,
        dataAbertura: new Date().toISOString(),
        sincronizado: false
      };

      // Salvar localmente
      await apiService.saveComandaLocal(novaComanda);
      
      // Recarregar lista
      await loadComandas();
      
      // Fechar modal
      setShowNovaComanda(false);
      
      // Navegar para a nova comanda
      navigation.navigate('ComandaDetail', { comandaId: novaComanda._id });
      
      Alert.alert('Sucesso', 'Comanda criada com sucesso!');
      
    } catch (error) {
      console.log('Erro ao criar comanda:', error);
      Alert.alert('Erro', 'Não foi possível criar a comanda');
    }
  };

  const renderComandaItem = (comanda) => (
    <TouchableOpacity
      key={comanda._id}
      style={styles.comandaItem}
      onPress={() => navigation.navigate('ComandaDetail', { comandaId: comanda._id })}
    >
      <View style={styles.comandaHeader}>
        <Text style={styles.comandaNumero}>#{comanda.numero}</Text>
        <Text style={styles.comandaStatus}>{comanda.status}</Text>
      </View>
      
      <View style={styles.comandaInfo}>
        <Text style={styles.clienteNome}>
          {comanda.nomeCliente || 'Cliente não identificado'}
        </Text>
        <Text style={styles.operador}>Operador: {comanda.operador}</Text>
      </View>
      
      <View style={styles.comandaFooter}>
        <Text style={styles.total}>
          Total: R$ {comanda.total?.toFixed(2) || '0.00'}
        </Text>
        <Text style={styles.itensCount}>
          {comanda.pedidos?.reduce((acc, pedido) => acc + pedido.itens.length, 0) || 0} itens
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando comandas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestão de Comandas</Text>
        <Text style={styles.subtitle}>
          {comandas.length} comanda(s) aberta(s)
        </Text>
      </View>

      {/* Botão Nova Comanda */}
      <TouchableOpacity
        style={styles.novaComandaButton}
        onPress={handleNovaComanda}
      >
        <Text style={styles.novaComandaButtonText}>+ Nova Comanda</Text>
      </TouchableOpacity>

      {/* Lista de Comandas */}
      <ScrollView style={styles.comandasList}>
        {comandas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhuma comanda aberta
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Clique em "Nova Comanda" para começar
            </Text>
          </View>
        ) : (
          comandas.map(renderComandaItem)
        )}
      </ScrollView>

      {/* Modal Nova Comanda */}
      {showNovaComanda && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Comanda</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número da Comanda</Text>
              <TextInput
                style={styles.input}
                value={novaComandaData.numero}
                onChangeText={(text) => setNovaComandaData({...novaComandaData, numero: text})}
                keyboardType="numeric"
                placeholder="Número automático"
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Cliente (Opcional)</Text>
              <TextInput
                style={styles.input}
                value={novaComandaData.nomeCliente}
                onChangeText={(text) => setNovaComandaData({...novaComandaData, nomeCliente: text})}
                placeholder="Digite o nome do cliente"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Operador *</Text>
              <TextInput
                style={styles.input}
                value={novaComandaData.operador}
                onChangeText={(text) => setNovaComandaData({...novaComandaData, operador: text})}
                placeholder="Seu nome"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNovaComanda(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={criarNovaComanda}
              >
                <Text style={styles.confirmButtonText}>Criar Comanda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Menu Inferior */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Sync')}
        >
          <Text style={styles.menuText}>🔄 Sincronizar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Config')}
        >
          <Text style={styles.menuText}>⚙️ Configurações</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  novaComandaButton: {
    backgroundColor: '#34C759',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  novaComandaButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  comandasList: {
    flex: 1,
    padding: 16,
  },
  comandaItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  comandaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comandaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  comandaStatus: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  comandaInfo: {
    marginBottom: 8,
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  operador: {
    fontSize: 14,
    color: '#666',
  },
  comandaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itensCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  bottomMenu: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  menuText: {
    fontSize: 14,
    color: '#007AFF',
  },
});

export default HomeScreen;