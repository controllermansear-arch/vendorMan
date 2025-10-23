import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { apiService } from '../services/api';
import { printerService } from '../services/printerService';
import { authService } from '../services/authService';

const ComandaDetailScreen = ({ route, navigation }) => {
  const { comandaId } = route.params;
  const [comanda, setComanda] = useState(null);
  const [showAddPedido, setShowAddPedido] = useState(false);
  const [showEditCliente, setShowEditCliente] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [operador, setOperador] = useState('');

  useEffect(() => {
    loadComanda();
  }, [comandaId]);

  const loadComanda = async () => {
    const comandas = await apiService.getComandasLocais();
    const comandaData = comandas.find(c => c._id === comandaId);
    if (comandaData) {
      setComanda(comandaData);
      setNomeCliente(comandaData.nomeCliente || '');
      setOperador(comandaData.operador || '');
    }
  };

  const salvarComanda = async (comandaAtualizada) => {
    await apiService.saveComandaLocal(comandaAtualizada);
    setComanda(comandaAtualizada);
  };

  const adicionarPedido = () => {
    navigation.navigate('Products', { comandaId, comandaNumero: comanda.numero });
  };

  const imprimirPedido = async (pedido) => {
    try {
      const success = await printerService.printPedido(pedido, comanda.numero, comanda.nomeCliente);
      if (success) {
        Alert.alert('Sucesso', 'Pedido impresso com sucesso!');
      } else {
        Alert.alert('Erro', 'Falha ao imprimir pedido');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro na impressão: ' + error.message);
    }
  };

  const excluirPedido = async (pedidoIndex) => {
    Alert.prompt(
      'Senha do Supervisor',
      'Para excluir pedido, digite a senha:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          onPress: async (password) => {
            const isValid = await authService.validateSupervisorPassword(password);
            if (isValid) {
              const comandaAtualizada = {
                ...comanda,
                pedidos: comanda.pedidos.filter((_, index) => index !== pedidoIndex)
              };
              await salvarComanda(comandaAtualizada);
              Alert.alert('Sucesso', 'Pedido excluído!');
            } else {
              Alert.alert('Erro', 'Senha incorreta!');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const atualizarCliente = async () => {
    const comandaAtualizada = {
      ...comanda,
      nomeCliente: nomeCliente,
      operador: operador
    };
    await salvarComanda(comandaAtualizada);
    setShowEditCliente(false);
    Alert.alert('Sucesso', 'Dados atualizados!');
  };

  const fecharComanda = () => {
    navigation.navigate('FecharComanda', { comanda });
  };

  const calcularTotalComanda = () => {
    if (!comanda || !comanda.pedidos) return 0;
    return comanda.pedidos.reduce((total, pedido) => {
      return total + pedido.itens.reduce((pedidoTotal, item) => pedidoTotal + item.precoTotal, 0);
    }, 0);
  };

  const renderPedido = ({ item, index }) => (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <Text style={styles.pedidoData}>
          {new Date(item.data).toLocaleString()}
        </Text>
        <View style={styles.pedidoActions}>
          <TouchableOpacity 
            style={styles.imprimirBtn}
            onPress={() => imprimirPedido(item)}
          >
            <Text style={styles.imprimirText}>Imprimir</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.excluirBtn}
            onPress={() => excluirPedido(index)}
          >
            <Text style={styles.excluirText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={item.itens}
        renderItem={({ item: itemPedido }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemDescricao}>{itemPedido.descricao}</Text>
            <Text style={styles.itemQuantidade}>{itemPedido.quantidade}x</Text>
            <Text style={styles.itemPreco}>R$ {itemPedido.precoTotal.toFixed(2)}</Text>
          </View>
        )}
        keyExtractor={(item, idx) => `item_${idx}`}
      />

      <Text style={styles.pedidoTotal}>
        Total do Pedido: R$ {item.itens.reduce((sum, item) => sum + item.precoTotal, 0).toFixed(2)}
      </Text>
    </View>
  );

  if (!comanda) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header da Comanda */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.comandaNumero}>Comanda #{comanda.numero}</Text>
          <Text style={styles.comandaStatus}>
            Status: {comanda.status === 'aberta' ? '🟢 ABERTA' : '🔴 FECHADA'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setShowEditCliente(true)}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Informações do Cliente */}
      <View style={styles.infoCard}>
        <Text style={styles.clienteText}>
          Cliente: {comanda.nomeCliente || 'Não informado'}
        </Text>
        <Text style={styles.operadorText}>
          Operador: {comanda.operador || 'Não informado'}
        </Text>
        <Text style={styles.dataText}>
          Aberta em: {new Date(comanda.dataAbertura).toLocaleString()}
        </Text>
      </View>

      {/* Total e Ações */}
      <View style={styles.totalSection}>
        <Text style={styles.totalText}>
          TOTAL: R$ {calcularTotalComanda().toFixed(2)}
        </Text>
        {comanda.status === 'aberta' && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={adicionarPedido}
            >
              <Text style={styles.addButtonText}>+ Novo Pedido</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.fecharButton}
              onPress={fecharComanda}
            >
              <Text style={styles.fecharButtonText}>Fechar Comanda</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Lista de Pedidos */}
      <Text style={styles.sectionTitle}>Pedidos Realizados</Text>
      {comanda.pedidos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Nenhum pedido realizado</Text>
          <Text style={styles.emptyStateSubtext}>
            Clique em "Novo Pedido" para adicionar itens
          </Text>
        </View>
      ) : (
        <FlatList
          data={comanda.pedidos}
          renderItem={renderPedido}
          keyExtractor={(item, index) => `pedido_${index}`}
          style={styles.pedidosList}
        />
      )}

      {/* Modal Editar Cliente */}
      <Modal visible={showEditCliente} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Comanda</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome do Cliente"
              value={nomeCliente}
              onChangeText={setNomeCliente}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Nome do Operador"
              value={operador}
              onChangeText={setOperador}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditCliente(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={atualizarCliente}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
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
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  comandaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  comandaStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  clienteText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  operadorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dataText: {
    fontSize: 12,
    color: '#999',
  },
  totalSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fecharButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  fecharButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  pedidosList: {
    flex: 1,
  },
  pedidoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pedidoData: {
    fontSize: 12,
    color: '#999',
  },
  pedidoActions: {
    flexDirection: 'row',
  },
  imprimirBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  imprimirText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  excluirBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  excluirText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemDescricao: {
    flex: 2,
    fontSize: 14,
  },
  itemQuantidade: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  itemPreco: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  pedidoTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 8,
    color: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ComandaDetailScreen;