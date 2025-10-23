import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { getComanda, fecharComanda, getComandas } from '../services/api';

const FecharComandaScreen = ({ route, navigation }) => {
  const { comandaId } = route.params || {};
  
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechando, setFechando] = useState(false);
  const [comandas, setComandas] = useState([]);

  useEffect(() => {
    carregarDados();
  }, [comandaId]);

  const carregarDados = async () => {
    try {
      if (!comandaId) {
        console.error('❌ ID da comanda não fornecido');
        Alert.alert('Erro', 'ID da comanda não encontrado');
        navigation.goBack();
        return;
      }

      // Carrega todas as comandas primeiro
      const todasComandas = await getComandas();
      setComandas(todasComandas);
      console.log(`📋 Total de comandas carregadas: ${todasComandas.length}`);

      // Busca a comanda específica
      const comandaData = await getComanda(comandaId);
      
      if (!comandaData) {
        console.error(`❌ Comanda ${comandaId} não encontrada`);
        Alert.alert('Erro', 'Comanda não encontrada');
        navigation.goBack();
        return;
      }

      console.log(`✅ Comanda carregada:`, {
        id: comandaData.id,
        numero: comandaData.numero,
        status: comandaData.status,
        itens: comandaData.itens?.length || 0
      });

      setComanda(comandaData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Falha ao carregar dados da comanda');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = () => {
    if (!comanda?.itens) return 0;
    return comanda.itens.reduce((total, item) => {
      return total + (item.preco * item.quantidade);
    }, 0);
  };

  const handleFecharComanda = async () => {
    if (!comanda) return;

    Alert.alert(
      'Fechar Comanda',
      `Deseja fechar a comanda #${comanda.numero}? Total: R$ ${calcularTotal().toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Fechar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setFechando(true);
              console.log(`🚀 Iniciando fechamento da comanda: ${comanda.id}`);
              
              const comandaFechada = await fecharComanda(comanda.id);
              
              if (comandaFechada) {
                console.log('✅ Comanda fechada com sucesso:', comandaFechada);
                Alert.alert(
                  'Sucesso', 
                  `Comanda #${comanda.numero} fechada com sucesso!\nTotal: R$ ${calcularTotal().toFixed(2)}`,
                  [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
                );
              } else {
                throw new Error('Falha ao fechar comanda');
              }
            } catch (error) {
              console.error('❌ Erro ao fechar comanda:', error);
              Alert.alert('Erro', 'Falha ao fechar a comanda. Tente novamente.');
            } finally {
              setFechando(false);
            }
          }
        }
      ]
    );
  };

  const handleReabrirComanda = () => {
    if (!comanda) return;

    Alert.alert(
      'Reabrir Comanda',
      `Deseja reabrir a comanda #${comanda.numero}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reabrir', 
          onPress: async () => {
            try {
              setFechando(true);
              const comandasAtualizadas = comandas.map(c => 
                c.id === comanda.id ? { ...c, status: 'aberta' } : c
              );
              
              // Aqui você precisaria implementar a função reabrirComanda no API
              // await reabrirComanda(comanda.id);
              
              setComanda({ ...comanda, status: 'aberta' });
              Alert.alert('Sucesso', 'Comanda reaberta com sucesso!');
            } catch (error) {
              console.error('Erro ao reabrir comanda:', error);
              Alert.alert('Erro', 'Falha ao reabrir a comanda.');
            } finally {
              setFechando(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando comanda...</Text>
      </View>
    );
  }

  if (!comanda) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Comanda não encontrada</Text>
        <Text style={styles.errorMessage}>
          A comanda solicitada não foi encontrada ou foi removida.
        </Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = calcularTotal();
  const isFechada = comanda.status === 'fechada';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comanda #{comanda.numero || 'N/A'}</Text>
        <View style={[styles.statusBadge, isFechada ? styles.statusFechada : styles.statusAberta]}>
          <Text style={styles.statusText}>
            {isFechada ? 'FECHADA' : 'ABERTA'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Informações da Comanda */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número:</Text>
            <Text style={styles.infoValue}>#{comanda.numero}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValue}>
              {isFechada ? 'Fechada' : 'Aberta'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Itens:</Text>
            <Text style={styles.infoValue}>{comanda.itens?.length || 0}</Text>
          </View>
        </View>

        {/* Itens da Comanda */}
        {comanda.itens && comanda.itens.length > 0 ? (
          <View style={styles.itensSection}>
            <Text style={styles.sectionTitle}>Itens</Text>
            {comanda.itens.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNome}>{item.nome}</Text>
                  <Text style={styles.itemDetails}>
                    {item.quantidade} x R$ {item.preco?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  R$ {(item.quantidade * (item.preco || 0)).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>Nenhum item na comanda</Text>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
      </ScrollView>

      {/* Botões de Ação */}
      <View style={styles.footer}>
        {!isFechada ? (
          <TouchableOpacity 
            style={[styles.button, styles.fecharButton]}
            onPress={handleFecharComanda}
            disabled={fechando}
          >
            {fechando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                Fechar Comanda - R$ {total.toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.reabrirButton]}
            onPress={handleReabrirComanda}
            disabled={fechando}
          >
            {fechando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Reabrir Comanda</Text>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.voltarButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, styles.voltarButtonText]}>Voltar</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusAberta: {
    backgroundColor: '#4CAF50',
  },
  statusFechada: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itensSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  emptySection: {
    backgroundColor: '#FFF',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
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
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fecharButton: {
    backgroundColor: '#4CAF50',
  },
  reabrirButton: {
    backgroundColor: '#FF9800',
  },
  voltarButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  voltarButtonText: {
    color: '#007AFF',
  },
});

export default FecharComandaScreen;