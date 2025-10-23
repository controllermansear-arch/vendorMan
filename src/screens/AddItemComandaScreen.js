import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import { apiService } from '../services/api';
import { printerService } from '../services/printerService';

const AddItemComandaScreen = ({ route, navigation }) => {
  const { comandaId, comandaNumero, item } = route.params;
  const [comanda, setComanda] = useState(null);
  const [quantidade, setQuantidade] = useState('1');
  const [precoUnitario, setPrecoUnitario] = useState(item.precoVenda || 0);

  useEffect(() => {
    loadComanda();
    setPrecoUnitario(item.precoVenda || 0);
  }, []);

  const loadComanda = async () => {
    const comandas = await apiService.getComandasLocais();
    const comandaData = comandas.find(c => c._id === comandaId);
    setComanda(comandaData);
  };

  const calcularTotal = () => {
    const qtd = parseFloat(quantidade) || 0;
    const preco = parseFloat(precoUnitario) || 0;
    return qtd * preco;
  };

  const adicionarItem = async () => {
    const qtd = parseFloat(quantidade);
    const preco = parseFloat(precoUnitario);

    if (qtd <= 0) {
      Alert.alert('Erro', 'Quantidade deve ser maior que zero');
      return;
    }

    if (preco <= 0) {
      Alert.alert('Erro', 'Preço deve ser maior que zero');
      return;
    }

    const novoItem = {
      tipo: item.tipo,
      codItem: item.codItem,
      descricao: item.descricao,
      quantidade: qtd,
      precoUnitario: preco,
      precoTotal: calcularTotal()
    };

    const novoPedido = {
      itens: [novoItem],
      data: new Date().toISOString(),
      status: 'aberto'
    };

    const comandaAtualizada = {
      ...comanda,
      pedidos: [...comanda.pedidos, novoPedido]
    };

    await apiService.saveComandaLocal(comandaAtualizada);

    // Perguntar se deseja imprimir
    Alert.alert(
      'Sucesso',
      'Item adicionado com sucesso! Deseja imprimir o pedido?',
      [
        {
          text: 'Não',
          onPress: () => navigation.goBack()
        },
        {
          text: 'Sim',
          onPress: async () => {
            await printerService.printPedido(novoPedido, comandaNumero, comanda.nomeCliente);
            navigation.goBack();
          }
        }
      ]
    );
  };

  if (!comanda) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Adicionar Item</Text>
        <Text style={styles.comandaInfo}>Comanda #{comandaNumero}</Text>
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemDescricao}>{item.descricao}</Text>
        <Text style={styles.itemTipo}>
          {item.tipo === 'produto' ? 'Produto' : 
           item.tipo === 'combo' ? 'Combo' : 'Fracionado'}
        </Text>
        <Text style={styles.itemCodigo}>Código: {item.codItem}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.input}
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
            placeholder="Quantidade"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preço Unitário (R$)</Text>
          <TextInput
            style={styles.input}
            value={precoUnitario.toString()}
            onChangeText={setPrecoUnitario}
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total do Item:</Text>
          <Text style={styles.totalValue}>R$ {calcularTotal().toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={adicionarItem}
        >
          <Text style={styles.addButtonText}>Adicionar à Comanda</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  comandaInfo: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 4,
  },
  itemInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  itemDescricao: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  itemTipo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  itemCodigo: {
    fontSize: 12,
    color: '#999',
  },
  form: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddItemComandaScreen;