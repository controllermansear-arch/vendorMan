import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  Switch
} from 'react-native';
import { printerService } from '../services/printerService';
import { authService } from '../services/authService';

const ConfigScreen = ({ navigation }) => {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);
  const [operatorName, setOperatorName] = useState('');

  useEffect(() => {
    loadPairedDevices();
    loadSettings();
  }, []);

  const loadPairedDevices = async () => {
    const devices = await printerService.getPairedDevices();
    setPairedDevices(devices);
  };

  const loadSettings = async () => {
    // Carregar configurações salvas (exemplo)
    // const savedAutoPrint = await AsyncStorage.getItem('auto_print');
    // setAutoPrint(savedAutoPrint !== 'false');
  };


  const testPrinter = async () => {
    try {
      Alert.alert('Teste', 'Testando impressão na maquineta GetNet...');

      const success = await printerService.testPrint();

      if (success) {
        Alert.alert('Sucesso', 'Impressão testada com sucesso na maquineta GetNet!');
      } else {
        Alert.alert('Erro', 'Falha ao testar impressão');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao testar impressão: ' + error.message);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 4 caracteres');
      return;
    }

    const result = await authService.changeSupervisorPassword(currentPassword, newPassword);

    if (result.success) {
      Alert.alert('Sucesso', result.message);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const saveSettings = async () => {
    // Salvar configurações
    // await AsyncStorage.setItem('auto_print', autoPrint.toString());
    // await AsyncStorage.setItem('operator_name', operatorName);

    Alert.alert('Sucesso', 'Configurações salvas!');
  };

  const exportData = async () => {
    Alert.alert(
      'Exportar Dados',
      'Esta funcionalidade exportará todos os dados para backup.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Exportar',
          onPress: () => {
            // Implementar exportação
            Alert.alert('Sucesso', 'Dados exportados com sucesso!');
          }
        }
      ]
    );
  };

  const clearData = async () => {
    Alert.prompt(
      'Limpar Dados',
      'Digite "CONFIRMAR" para apagar todos os dados locais:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: (text) => {
            if (text === 'CONFIRMAR') {
              // Implementar limpeza de dados
              Alert.alert('Sucesso', 'Dados locais apagados!');
            } else {
              Alert.alert('Erro', 'Texto de confirmação incorreto');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      {/* Configurações de Impressora */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Impressora</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Impressora Selecionada</Text>
          <Text style={styles.settingValue}>
            {selectedPrinter ? selectedPrinter.name : 'Nenhuma'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPrinterModal(true)}
        >
          <Text style={styles.buttonText}>Selecionar Impressora</Text>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Impressão Automática</Text>
          <Switch
            value={autoPrint}
            onValueChange={setAutoPrint}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoPrint ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Configurações de Segurança */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segurança</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPasswordModal(true)}
        >
          <Text style={styles.buttonText}>Alterar Senha do Supervisor</Text>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Nome do Operador Padrão</Text>
          <TextInput
            style={styles.textInput}
            value={operatorName}
            onChangeText={setOperatorName}
            placeholder="Digite seu nome"
          />
        </View>
      </View>

      {/* Gerenciamento de Dados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciamento de Dados</Text>

        <TouchableOpacity
          style={[styles.button, styles.exportButton]}
          onPress={exportData}
        >
          <Text style={styles.buttonText}>Exportar Dados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearData}
        >
          <Text style={styles.buttonText}>Limpar Dados Locais</Text>
        </TouchableOpacity>
      </View>

      {/* Informações do App */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versão do App:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Desenvolvido para:</Text>
          <Text style={styles.infoValue}>GetStore</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={saveSettings}
      >
        <Text style={styles.buttonText}>Salvar Configurações</Text>
      </TouchableOpacity>

      {/* Modal Seleção de Impressora */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Impressora GetNet</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Status da Maquineta</Text>
          <Text style={styles.settingValue}>✅ Integrada</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={testPrinter}
        >
          <Text style={styles.buttonText}>Testar Impressão</Text>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Impressão Automática</Text>
          <Switch
            value={autoPrint}
            onValueChange={setAutoPrint}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoPrint ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Modal Alterar Senha */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Senha do Supervisor</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Senha atual"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <TextInput
              style={styles.textInput}
              placeholder="Nova senha"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={styles.textInput}
              placeholder="Confirmar nova senha"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={changePassword}
              >
                <Text style={styles.modalButtonText}>Alterar</Text>
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  exportButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#5856D6',
    marginTop: 8,
  },
  buttonText: {
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
    fontWeight: 'bold',
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  noDevicesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  devicesList: {
    maxHeight: 300,
  },
  deviceItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#666',
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
  refreshButton: {
    backgroundColor: '#FF9500',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ConfigScreen;