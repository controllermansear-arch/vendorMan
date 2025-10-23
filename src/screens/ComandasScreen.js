import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  TextInput 
} from 'react-native';
import { apiService } from '../services/api';

const ComandasScreen = ({ navigation }) => {
  const [comandas, setComandas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('todas'); // todas, abertas, fechadas

  useEffect(() => {
    loadComandas();
  }, []);

  const loadComandas = async () => {
    const comandasData = await apiService.getComandasLocais();
    setComandas(comandasData);
  };

  const filteredComandas = comandas.filter(comanda => {
    const matchesSearch = comanda.numero.toString().includes(searchTerm) || 
                         comanda.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'todas' || 
                         (filter === 'abertas' && comanda.status === 'aberta') ||
                         (filter === 'fechadas' && comanda.status === 'fechada');
    return matchesSearch && matchesFilter;
  });

  const abrirComanda = (comandaId) => {
    navigation.navigate('ComandaDetail', { comandaId });
  };

  const fecharComanda = (comanda) => {
    navigation.navigate('FecharComanda', { comanda });
  };

  const excluirComanda = (comanda) => {
    if (comanda.status === 'aberta') {
      Alert.alert(
        'Atenção',
        `Deseja realmente excluir a comanda #${comanda.numero}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Excluir', 
            style: 'destructive',
            onPress: () => confirmarExclusao(comanda)
          }
        ]
      );
    } else {
      Alert.alert('Atenção', 'Apenas comandas abertas podem ser excluídas');
    }
  };

  const confirmarExclusao = async (comanda) => {
    try {
      const comandasAtualizadas = comandas.filter(c => c._id !== comanda._id);
      await apiService.saveComandaLocal(comandasAtualizadas);
      setComandas(comandasAtualizadas);
      Alert.alert('Sucesso', 'Comanda excluída com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao excluir comanda: ' + error.message);
    }
  };

  const renderComanda = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.comandaCard,
        item.status === 'fechada' && styles.comandaFechada
      ]}
      onPress={() => abrirComanda(item._id)}
    >
      <View style={styles.comandaHeader}>
        <Text style={styles.comandaNumero}>#{item.numero}</Text>
        <Text style={[
          styles.comandaStatus,
          item.status === 'aberta' ? styles.statusAberta : styles.statusFechada
        ]}>
          {item.status === 'aberta' ? 'ABERTA' : 'FECHADA'}
        </Text>
      </View>

      <Text style={styles.comandaCliente}>
        {item.nomeCliente || 'Cliente não informado'}
      </Text>

      <View style={styles.comandaInfo}>
        <Text style={styles.comandaPedidos}>
          {item.pedidos.length} pedido(s)
        </Text>
        <Text style={styles.comandaTotal}>
          R$ {item.total.toFixed(2)}
        </Text>
      </View>

      <View style={styles.comandaActions}>
        {item.status === 'aberta' ? (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => abrirComanda(item._id)}
            >
              <Text style={styles.actionButtonText}>Abrir</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.fecharButton]}
              onPress={() => fecharComanda(item)}
            >
              <Text style={styles.actionButtonText}>Fechar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.excluirButton]}
              onPress={() => excluirComanda(item)}
            >
              <Text style={styles.actionButtonText}>Excluir</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.comandaFechadaText}>
            Fechada em {new Date(item.dataFechamento).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por número ou cliente..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <View style={styles.filterContainer}>
        {['todas', 'abertas', 'fechadas'].map(filtro => (
          <TouchableOpacity
            key={filtro}
            style={[
              styles.filterButton,
              filter === filtro && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filtro)}
          >
            <Text style={[
              styles.filterText,
              filter === filtro && styles.filterTextActive
            ]}>
              {filtro === 'todas' ? 'Todas' :
               filtro === 'abertas' ? 'Abertas' : 'Fechadas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredComandas}
        renderItem={renderComanda}
        keyExtractor={item => item._id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  comandaCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  comandaStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAberta: {
    backgroundColor: '#E8F5E8',
    color: '#2E7D32',
  },
  statusFechada: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
  },
  comandaCliente: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  comandaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  comandaPedidos: {
    fontSize: 12,
    color: '#999',
  },
  comandaTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  comandaActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    marginLeft: 8,
  },
  fecharButton: {
    backgroundColor: '#FF9500',
  },
  excluirButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  comandaFechadaText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ComandasScreen;