// src/screens/ConfiguracaoScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch
} from 'react-native';
import { getItens, salvarItens, sincronizarDados, inicializarDados } from '../services/api';
import { 
  carregarConfiguracoes, 
  setOperador, 
  alterarSenhaSupervisor,
  verificarSenhaSupervisor,
  getOperador 
} from '../services/configService';

const ConfigScreen = ({ navigation }) => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({});
  const [modalOperadorVisible, setModalOperadorVisible] = useState(false);
  const [modalSenhaVisible, setModalSenhaVisible] = useState(false);
  const [novoOperador, setNovoOperador] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [itensData, configData] = await Promise.all([
        getItens(),
        carregarConfiguracoes()
      ]);
      setItens(itensData);
      setConfig(configData);
      setNovoOperador(configData.operador || '');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    }
  };

  const handleSalvarOperador = async () => {
    if (!novoOperador.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome do operador');
      return;
    }

    try {
      await setOperador(novoOperador.trim());
      await carregarDados();
      setModalOperadorVisible(false);
      Alert.alert('Sucesso', 'Operador atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar operador');
    }
  };

  const handleAlterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'As novas senhas não coincidem');
      return;
    }

    if (novaSenha.length < 4) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 4 caracteres');
      return;
    }

    try {
      await alterarSenhaSupervisor(senhaAtual, novaSenha);
      setModalSenhaVisible(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao alterar senha');
    }
  };

  const handleResetarDados = () => {
    Alert.alert(
      'Resetar Dados',
      'Esta ação irá resetar todos os dados do aplicativo. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await inicializarDados();
              await carregarDados();
              Alert.alert('Sucesso', 'Dados resetados com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao resetar dados');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSincronizarForcada = async () => {
    try {
      setLoading(true);
      await sincronizarDados();
      await carregarDados();
      Alert.alert('Sucesso', 'Sincronização forçada concluída!');
    } catch (error) {
      Alert.alert('Erro', 'Falha na sincronização');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarItem = () => {
    navigation.navigate('EditarItem', { item: null });
  };

  const handleEditarItem = (item) => {
    navigation.navigate('EditarItem', { item });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Seção Operador */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operador</Text>
          
          <View style={styles.configItem}>
            <View>
              <Text style={styles.configLabel}>Operador Atual</Text>
              <Text style={styles.configValue}>{config.operador || 'Operador'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setModalOperadorVisible(true)}
            >
              <Text style={styles.editButtonText}>Alterar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção Segurança */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          
          <TouchableOpacity 
            style={styles.configButton}
            onPress={() => setModalSenhaVisible(true)}
          >
            <Text style={styles.configButtonText}>🔒 Alterar Senha Supervisor</Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            A senha do supervisor é necessária para ações administrativas
          </Text>
        </View>

        {/* Seção Geral */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geral</Text>
          
          <TouchableOpacity 
            style={styles.configButton}
            onPress={handleSincronizarForcada}
            disabled={loading}
          >
            <Text style={styles.configButtonText}>
              {loading ? 'Sincronizando...' : '🔄 Sincronização Forçada'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seção Produtos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produtos ({itens.length})</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAdicionarItem}
            >
              <Text style={styles.addButtonText}>+ Novo</Text>
            </TouchableOpacity>
          </View>

          {itens.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => handleEditarItem(item)}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemNome}>{item.nome}</Text>
                <Text style={styles.itemPreco}>R$ {item.preco?.toFixed(2)}</Text>
              </View>
              <Text style={styles.itemCategoria}>{item.categoria}</Text>
            </TouchableOpacity>
          ))}

          {itens.length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={handleAdicionarItem}
              >
                <Text style={styles.emptyButtonText}>Cadastrar Primeiro Produto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seção Perigosas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administração</Text>
          
          <TouchableOpacity 
            style={[styles.configButton, styles.dangerButton]}
            onPress={handleResetarDados}
            disabled={loading}
          >
            <Text style={[styles.configButtonText, styles.dangerButtonText]}>
              🔄 Resetar Todos os Dados
            </Text>
          </TouchableOpacity>

          <Text style={styles.warningText}>
            Atenção: Esta ação não pode ser desfeita
          </Text>
        </View>

        {/* Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Versão:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Operador:</Text>
            <Text style={styles.infoValue}>{config.operador || 'Operador'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Desenvolvido por:</Text>
            <Text style={styles.infoValue}>VendorMan Team</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Alterar Operador */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalOperadorVisible}
        onRequestClose={() => setModalOperadorVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Operador</Text>
            
            <Text style={styles.modalLabel}>Nome do Operador:</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do operador"
              value={novoOperador}
              onChangeText={setNovoOperador}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalOperadorVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleSalvarOperador}
              >
                <Text style={styles.confirmButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Alterar Senha */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalSenhaVisible}
        onRequestClose={() => setModalSenhaVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Senha Supervisor</Text>
            
            <Text style={styles.modalLabel}>Senha Atual:</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite a senha atual"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              secureTextEntry
            />
            
            <Text style={styles.modalLabel}>Nova Senha:</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite a nova senha"
              value={novaSenha}
              onChangeText={setNovaSenha}
              secureTextEntry
            />
            
            <Text style={styles.modalLabel}>Confirmar Nova Senha:</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirme a nova senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalSenhaVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleAlterarSenha}
              >
                <Text style={styles.confirmButtonText}>Alterar Senha</Text>
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
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
  },
  configValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  configButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  configButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#FFF',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemPreco: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemCategoria: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptySection: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: '90%',
    maxWidth: 400,
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
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
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

export default ConfigScreen;