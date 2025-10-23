// src/screens/EditarItemScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Picker
} from 'react-native';
import { getItens, salvarItens } from '../services/api';

const EditarItemScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const isEditando = !!item;

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('Bebidas');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  const categorias = ['Bebidas', 'Salgados', 'Doces', 'Lanches', 'Outros'];

  useEffect(() => {
    if (isEditando) {
      setNome(item.nome || '');
      setPreco(item.preco?.toString() || '');
      setCategoria(item.categoria || 'Bebidas');
      setDescricao(item.descricao || '');
    }
    
    navigation.setOptions({
      title: isEditando ? 'Editar Produto' : 'Novo Produto'
    });
  }, [item, isEditando]);

  const validarDados = () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome do produto');
      return false;
    }
    
    if (!preco || parseFloat(preco) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um preço válido');
      return false;
    }
    
    return true;
  };

  const handleSalvar = async () => {
    if (!validarDados()) return;

    try {
      setLoading(true);
      
      const itens = await getItens();
      const novoItem = {
        id: isEditando ? item.id : Date.now().toString(),
        nome: nome.trim(),
        preco: parseFloat(preco),
        categoria,
        descricao: descricao.trim(),
        dataCriacao: isEditando ? item.dataCriacao : new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };

      let novosItens;
      if (isEditando) {
        novosItens = itens.map(i => i.id === item.id ? novoItem : i);
      } else {
        novosItens = [...itens, novoItem];
      }

      await salvarItens(novosItens);
      
      Alert.alert(
        'Sucesso', 
        `Produto ${isEditando ? 'atualizado' : 'cadastrado'} com sucesso!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      Alert.alert('Erro', 'Falha ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = () => {
    if (!isEditando) return;

    Alert.alert(
      'Excluir Produto',
      `Tem certeza que deseja excluir "${item.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const itens = await getItens();
              const novosItens = itens.filter(i => i.id !== item.id);
              await salvarItens(novosItens);
              
              Alert.alert('Sucesso', 'Produto excluído com sucesso!');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir produto');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Nome */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Produto *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Café Expresso"
            value={nome}
            onChangeText={setNome}
            maxLength={50}
          />
        </View>

        {/* Preço */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preço (R$) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 5.00"
            value={preco}
            onChangeText={setPreco}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Categoria */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoria}
              onValueChange={setCategoria}
              style={styles.picker}
            >
              {categorias.map(cat => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição do produto..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={handleSalvar}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Salvando...' : (isEditando ? 'Atualizar' : 'Cadastrar')}
            </Text>
          </TouchableOpacity>

          {isEditando && (
            <TouchableOpacity 
              style={[styles.button, styles.deleteButton]}
              onPress={handleExcluir}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>Excluir Produto</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditarItemScreen;