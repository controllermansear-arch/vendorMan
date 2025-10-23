import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  StatusBar 
} from 'react-native';
import { apiService } from '../services/api';
import { printerService } from '../services/printerService';

const HomeScreen = ({ navigation }) => {
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [totalVendasHoje, setTotalVendasHoje] = useState(0);

  useEffect(() => {
    loadComandasAbertas();
    loadTotalVendas();
  }, []);

  const loadComandasAbertas = async () => {
    const comandas = await apiService.getComandasLocais();
    const abertas = comandas.filter(c => c.status === 'aberta');
    setComandasAbertas(abertas);
  };

  const loadTotalVendas = async () => {
    const comandas = await apiService.getComandasLocais();
    const hoje = new Date().toDateString();
    const vendasHoje = comandas
      .filter(c => c.status === 'fechada' && new Date(c.dataFechamento).toDateString() === hoje)
      .reduce((sum, c) => sum + c.total, 0);
    setTotalVendasHoje(vendasHoje);
  };

  const novaComanda = () => {
    Alert.prompt(
      'Nova Comanda',
      'Digite o número da comanda (1-99):',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: async (numero) => {
            const num = parseInt(numero);
            if (num >= 1 && num <= 99) {
              await criarComanda(num);
            } else {
              Alert.alert('Erro', 'Número deve ser entre 1 e 99');
            }
          }
        }
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  const criarComanda = async (numero) => {
    try {
      const comandas = await apiService.getComandasLocais();
      const comandaExistente = comandas.find(c => c.numero === numero && c.status === 'aberta');
      
      if (comandaExistente) {
        Alert.alert('Atenção', `Comanda ${numero} já está aberta`);
        return;
      }

      const novaComanda = {
        _id: `comanda_${Date.now()}`,
        numero: numero,
        nomeCliente: '',
        operador: '',
        pedidos: [],
        status: 'aberta',
        total: 0,
        dataAbertura: new Date().toISOString(),
        sincronizado: false
      };

      await apiService.saveComandaLocal(novaComanda);
      navigation.navigate('ComandaDetail', { comandaId: novaComanda._id });
      
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar comanda: ' + error.message);
    }
  };

  const gerenciarComandas = () => {
    navigation.navigate('Comandas');
  };

  const sincronizarDados = async () => {
    navigation.navigate('Sync');
  };

  const configurarApp = () => {
    navigation.navigate('Config');
  };

  const testarImpressora = async () => {
    try {
      const devices = await printerService.getPairedDevices();
      if (devices.length === 0) {
        Alert.alert('Atenção', 'Nenhuma impressora pareada encontrada');
        return;
      }

      // Conectar com a primeira impressora encontrada
      const connected = await printerService.connectToPrinter(devices[0].address);
      if (connected) {
        Alert.alert('Sucesso', 'Impressora conectada com sucesso!');
      } else {
        Alert.alert('Erro', 'Falha ao conectar com impressora');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao testar impressora: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#007AFF" barStyle="light-content" />
      
      {/* Cards de Resumo */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>{comandasAbertas.length}</Text>
          <Text style={styles.cardLabel}>Comandas Abertas</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardNumber}>R$ {totalVendasHoje.toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Vendas Hoje</Text>
        </View>
      </View>

      {/* Ações Principais */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={novaComanda}>
          <Text style={styles.actionButtonText}>Nova Comanda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={gerenciarComandas}>
          <Text style={styles.actionButtonText}>Gerenciar Comandas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={sincronizarDados}>
          <Text style={styles.actionButtonText}>Sincronizar Dados</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={testarImpressora}>
          <Text style={styles.actionButtonText}>Testar Impressora</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={configurarApp}>
          <Text style={styles.actionButtonText}>Configurações</Text>
        </TouchableOpacity>
      </View>

      {/* Comandas Abertas Recentes */}
      {comandasAbertas.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Comandas Abertas</Text>
          {comandasAbertas.slice(0, 5).map(comanda => (
            <TouchableOpacity 
              key={comanda._id}
              style={styles.comandaItem}
              onPress={() => navigation.navigate('ComandaDetail', { comandaId: comanda._id })}
            >
              <Text style={styles.comandaNumero}>#{comanda.numero}</Text>
              <Text style={styles.comandaCliente}>
                {comanda.nomeCliente || 'Cliente não informado'}
              </Text>
              <Text style={styles.comandaPedidos}>
                {comanda.pedidos.length} pedido(s)
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  comandaItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  comandaNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  comandaCliente: {
    flex: 1,
    marginLeft: 12,
    color: '#666',
  },
  comandaPedidos: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;