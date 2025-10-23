import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet, Alert, ScrollView } from 'react-native';
import { apiService } from '../services/api';
import { printerService } from '../services/printerService';
import { authService } from '../services/authService';

const FecharComandaScreen = ({ route, navigation }) => {
  const { comanda } = route.params;
  const [formaPagamento, setFormaPagamento] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [desconto, setDesconto] = useState('');
  const [showDescontoModal, setShowDescontoModal] = useState(false);
  const [operador, setOperador] = useState('');

  const formasPagamento = [
    { key: 'dinheiro', label: 'Dinheiro' },
    { key: 'pix', label: 'PIX' },
    { key: 'credito', label: 'Cartão Crédito' },
    { key: 'debito', label: 'Cartão Débito' },
    { key: 'vale_guia', label: 'Vale Guia' }
  ];

  const calcularTotal = () => {
    let total = comanda.pedidos.reduce((sum, pedido) => {
      return sum + pedido.itens.reduce((pedidoSum, item) => pedidoSum + item.precoTotal, 0);
    }, 0);

    if (desconto && !isNaN(parseFloat(desconto))) {
      total -= parseFloat(desconto);
    }

    return Math.max(0, total);
  };

  const validarFormaPagamento = async (forma) => {
    if (forma === 'vale_guia' || (forma !== 'dinheiro' && desconto && parseFloat(desconto) > 0)) {
      setFormaPagamento(forma);
      setShowPasswordModal(true);
    } else {
      await finalizarFechamento(forma);
    }
  };

  const aplicarDesconto = async () => {
    if (!desconto || isNaN(parseFloat(desconto))) {
      Alert.alert('Erro', 'Digite um valor de desconto válido');
      return;
    }

    const valorDesconto = parseFloat(desconto);
    const totalOriginal = comanda.pedidos.reduce((sum, pedido) => {
      return sum + pedido.itens.reduce((pedidoSum, item) => pedidoSum + item.precoTotal, 0);
    }, 0);

    if (valorDesconto > totalOriginal * 0.3) { // Máximo 30% de desconto
      Alert.alert('Atenção', 'Desconto máximo permitido é de 30% do valor total');
      return;
    }

    setShowDescontoModal(false);
    Alert.alert('Sucesso', `Desconto de R$ ${valorDesconto.toFixed(2)} aplicado`);
  };

  const finalizarFechamento = async (formaPagamentoSelecionada = formaPagamento) => {
    if (!operador.trim()) {
      Alert.alert('Atenção', 'Informe o nome do operador');
      return;
    }

    try {
      // Atualizar comanda com desconto
      const comandaAtualizada = {
        ...comanda,
        formaPagamento: formaPagamentoSelecionada,
        total: calcularTotal(),
        desconto: parseFloat(desconto) || 0,
        status: 'fechada',
        dataFechamento: new Date().toISOString()
      };

      // Fechar comanda
      const resultado = await apiService.fecharComanda(
        comanda._id, 
        formaPagamentoSelecionada, 
        operador
      );

      // Imprimir comanda
      await printerService.printComanda(comandaAtualizada);

      Alert.alert(
        'Sucesso', 
        'Comanda fechada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );

    } catch (error) {
      Alert.alert('Erro', 'Erro ao fechar comanda: ' + error.message);
    }
  };

  const handlePasswordSubmit = async () => {
    const isValid = await authService.validateSupervisorPassword(password);
    
    if (isValid) {
      setShowPasswordModal(false);
      setPassword('');
      await finalizarFechamento();
    } else {
      Alert.alert('Erro', 'Senha do supervisor incorreta');
      setPassword('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Fechar Comanda #{comanda.numero}</Text>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Cliente: {comanda.nomeCliente || 'Não informado'}</Text>
        <Text style={styles.infoText}>Total Itens: R$ {
          comanda.pedidos.reduce((sum, pedido) => {
            return sum + pedido.itens.reduce((pedidoSum, item) => pedidoSum + item.precoTotal, 0);
          }, 0).toFixed(2)
        }</Text>
        
        {desconto && (
          <Text style={styles.infoText}>Desconto: R$ {parseFloat(desconto).toFixed(2)}</Text>
        )}
        
        <Text style={styles.totalText}>TOTAL: R$ {calcularTotal().toFixed(2)}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nome do Operador"
        value={operador}
        onChangeText={setOperador}
      />

      <TouchableOpacity 
        style={styles.descontoButton}
        onPress={() => setShowDescontoModal(true)}
      >
        <Text style={styles.descontoButtonText}>
          {desconto ? `Desconto: R$ ${desconto}` : 'Aplicar Desconto'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
      
      {formasPagamento.map(forma => (
        <TouchableOpacity
          key={forma.key}
          style={[
            styles.pagamentoButton,
            formaPagamento === forma.key && styles.pagamentoButtonSelected
          ]}
          onPress={() => validarFormaPagamento(forma.key)}
        >
          <Text style={[
            styles.pagamentoText,
            formaPagamento === forma.key && styles.pagamentoTextSelected
          ]}>
            {forma.label}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Modal para Desconto */}
      <Modal visible={showDescontoModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aplicar Desconto</Text>
            <TextInput
              style={styles.input}
              placeholder="Valor do desconto"
              keyboardType="numeric"
              value={desconto}
              onChangeText={setDesconto}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDescontoModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={aplicarDesconto}
              >
                <Text style={styles.modalButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Senha Supervisor */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Senha do Supervisor</Text>
            <Text style={styles.modalSubtitle}>
              {formaPagamento === 'vale_guia' 
                ? 'Vale Guia requer autorização' 
                : 'Desconto requer autorização'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Digite a senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setFormaPagamento('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handlePasswordSubmit}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333'
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  descontoButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  descontoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  pagamentoButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ddd'
  },
  pagamentoButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD'
  },
  pagamentoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666'
  },
  pagamentoTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4
  },
  cancelButton: {
    backgroundColor: '#FF3B30'
  },
  confirmButton: {
    backgroundColor: '#007AFF'
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});

export default FecharComandaScreen;