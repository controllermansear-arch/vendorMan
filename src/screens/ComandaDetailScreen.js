import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  TextInput,
  Modal,
  SectionList
} from 'react-native';
import { apiService } from '../services/api';

const ComandaDetailScreen = ({ route, navigation }) => {
  const { comandaId } = route.params;
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProdutos, setShowProdutos] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [categorias, setCategorias] = useState({});
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [pedidoAtualIndex, setPedidoAtualIndex] = useState(0);
  const [showSenhaSupervisor, setShowSenhaSupervisor] = useState(false);
  const [senhaSupervisor, setSenhaSupervisor] = useState('');

  // Senha do supervisor (em produção, isso deve vir de configuração/API)
  const SENHA_SUPERVISOR = '123456';

  useEffect(() => {
    loadComanda();
    loadProdutos();
  }, [comandaId]);

  const loadComanda = async () => {
    try {
      const comandaData = await apiService.getComandaById(comandaId);
      setComanda(comandaData);
      
      // Se não há pedidos, criar o primeiro
      if (!comandaData.pedidos || comandaData.pedidos.length === 0) {
        await criarNovoPedido();
      }
    } catch (error) {
      console.log('Erro ao carregar comanda:', error);
      Alert.alert('Erro', 'Não foi possível carregar a comanda');
    } finally {
      setLoading(false);
    }
  };

  const criarNovoPedido = async () => {
    try {
      const novoPedido = {
        itens: [],
        data: new Date().toISOString(),
        status: 'aberto',
        numero: (comanda?.pedidos?.length || 0) + 1
      };

      const comandaAtualizada = {
        ...comanda,
        pedidos: [...(comanda?.pedidos || []), novoPedido]
      };

      await apiService.saveComandaLocal(comandaAtualizada);
      setComanda(comandaAtualizada);
      setPedidoAtualIndex(comandaAtualizada.pedidos.length - 1);
      
      return comandaAtualizada;
    } catch (error) {
      console.log('Erro ao criar novo pedido:', error);
      throw error;
    }
  };

  const loadProdutos = async () => {
    try {
      const todosItens = await apiService.getAllItems();
      setProdutos(todosItens);
      
      const categoriasAgrupadas = {};
      todosItens.forEach(item => {
        const categoria = item.familia || 'Geral';
        if (!categoriasAgrupadas[categoria]) {
          categoriasAgrupadas[categoria] = [];
        }
        categoriasAgrupadas[categoria].push(item);
      });
      setCategorias(categoriasAgrupadas);
    } catch (error) {
      console.log('Erro ao carregar produtos:', error);
    }
  };

  const handleSelecionarProduto = (produto) => {
    setProdutoSelecionado(produto);
    setQuantidade(1);
  };

  const handleConfirmarAdicao = async () => {
    if (!produtoSelecionado) return;

    try {
      const itemComQuantidade = {
        ...produtoSelecionado,
        quantidade: quantidade
      };

      await apiService.adicionarItemComanda(comandaId, itemComQuantidade, pedidoAtualIndex);
      await loadComanda();
      setProdutoSelecionado(null);
      setShowProdutos(false);
      Alert.alert('Sucesso', `${quantidade}x ${produtoSelecionado.descricao} adicionado ao pedido!`);
    } catch (error) {
      console.log('Erro ao adicionar item:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o item');
    }
  };

  const handleRemoverItem = async (pedidoIndex, itemIndex) => {
    Alert.alert(
      'Remover Item',
      'Deseja remover este item do pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removerItemComanda(comandaId, pedidoIndex, itemIndex);
              await loadComanda();
              Alert.alert('Sucesso', 'Item removido do pedido');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o item');
            }
          }
        }
      ]
    );
  };

  const handleExcluirPedido = (pedidoIndex) => {
    setShowSenhaSupervisor(true);
    // Guarda o índice do pedido a ser excluído
    setPedidoAtualIndex(pedidoIndex);
  };

  const confirmarExclusaoPedido = async () => {
    if (senhaSupervisor !== SENHA_SUPERVISOR) {
      Alert.alert('Erro', 'Senha do supervisor incorreta');
      setSenhaSupervisor('');
      return;
    }

    try {
      await apiService.excluirPedido(comandaId, pedidoAtualIndex);
      await loadComanda();
      setShowSenhaSupervisor(false);
      setSenhaSupervisor('');
      Alert.alert('Sucesso', 'Pedido excluído com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o pedido');
    }
  };

  const handleFecharPedido = async (pedidoIndex) => {
    try {
      await apiService.fecharPedido(comandaId, pedidoIndex);
      await loadComanda();
      Alert.alert('Sucesso', 'Pedido fechado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fechar o pedido');
    }
  };

  const handleReabrirPedido = async (pedidoIndex) => {
    try {
      await apiService.reabrirPedido(comandaId, pedidoIndex);
      await loadComanda();
      Alert.alert('Sucesso', 'Pedido reaberto com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reabrir o pedido');
    }
  };

  const handleNovoPedido = async () => {
    try {
      await criarNovoPedido();
      Alert.alert('Sucesso', 'Novo pedido criado');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar novo pedido');
    }
  };

  const handleFecharComanda = () => {
    // Verificar se todos os pedidos estão fechados
    const todosPedidosFechados = comanda?.pedidos?.every(pedido => pedido.status === 'fechado');
    
    if (!todosPedidosFechados) {
      Alert.alert(
        'Atenção', 
        'Todos os pedidos devem estar fechados antes de fechar a comanda. Deseja fechar todos os pedidos abertos agora?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Fechar Todos', 
            onPress: async () => {
              try {
                // Fechar todos os pedidos abertos
                for (let i = 0; i < comanda.pedidos.length; i++) {
                  if (comanda.pedidos[i].status === 'aberto') {
                    await apiService.fecharPedido(comandaId, i);
                  }
                }
                await loadComanda();
                navigation.navigate('FecharComanda', { comandaId });
              } catch (error) {
                Alert.alert('Erro', 'Não foi possível fechar os pedidos');
              }
            }
          }
        ]
      );
    } else {
      navigation.navigate('FecharComanda', { comandaId });
    }
  };

  const aumentarQuantidade = () => {
    setQuantidade(quantidade + 1);
  };

  const diminuirQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(quantidade - 1);
    }
  };

  const calcularTotalItem = () => {
    if (!produtoSelecionado) return 0;
    return (produtoSelecionado.precoVenda || 0) * quantidade;
  };

  const calcularTotalPedido = (pedido) => {
    if (!pedido.itens || pedido.itens.length === 0) return 0;
    return pedido.itens.reduce((total, item) => total + (item.precoTotal || 0), 0);
  };

  const calcularTotalComanda = () => {
    if (!comanda?.pedidos) return 0;
    return comanda.pedidos.reduce((total, pedido) => total + calcularTotalPedido(pedido), 0);
  };

  const produtosFiltrados = searchText 
    ? produtos.filter(produto => 
        produto.descricao.toLowerCase().includes(searchText.toLowerCase()) ||
        (produto.familia && produto.familia.toLowerCase().includes(searchText.toLowerCase()))
      )
    : produtos;

  const categoriasFiltradas = {};
  Object.keys(categorias).forEach(categoria => {
    const produtosCategoria = categorias[categoria].filter(produto =>
      produto.descricao.toLowerCase().includes(searchText.toLowerCase()) ||
      (produto.familia && produto.familia.toLowerCase().includes(searchText.toLowerCase()))
    );
    if (produtosCategoria.length > 0) {
      categoriasFiltradas[categoria] = produtosCategoria;
    }
  });

  const renderProdutoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.produtoItem}
      onPress={() => handleSelecionarProduto(item)}
    >
      <View style={styles.produtoInfo}>
        <Text style={styles.produtoDescricao}>{item.descricao}</Text>
        <Text style={styles.produtoPreco}>R$ {item.precoVenda?.toFixed(2)}</Text>
      </View>
      <Text style={styles.produtoTipo}>{item.tipo}</Text>
    </TouchableOpacity>
  );

  const renderCategoriaSection = ({ section: { title, data } }) => (
    <View>
      <Text style={styles.categoriaTitle}>{title}</Text>
      {data.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.produtoItem}
          onPress={() => handleSelecionarProduto(item)}
        >
          <View style={styles.produtoInfo}>
            <Text style={styles.produtoDescricao}>{item.descricao}</Text>
            <Text style={styles.produtoPreco}>R$ {item.precoVenda?.toFixed(2)}</Text>
          </View>
          <Text style={styles.produtoTipo}>{item.tipo}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderItemPedido = ({ item, index }, pedidoIndex) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemDescricao}>{item.descricao}</Text>
        {comanda.pedidos[pedidoIndex].status === 'aberto' && (
          <TouchableOpacity
            style={styles.removerButton}
            onPress={() => handleRemoverItem(pedidoIndex, index)}
          >
            <Text style={styles.removerButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemQuantidade}>Qtd: {item.quantidade}</Text>
        <Text style={styles.itemPrecoUnit}>R$ {item.precoUnitario?.toFixed(2)} un</Text>
        <Text style={styles.itemPrecoTotal}>R$ {item.precoTotal?.toFixed(2)}</Text>
      </View>
      
      <Text style={styles.itemTipo}>{item.tipo}</Text>
    </View>
  );

  const renderPedido = (pedido, pedidoIndex) => (
    <View key={pedidoIndex} style={[
      styles.pedidoContainer,
      pedido.status === 'fechado' && styles.pedidoFechado
    ]}>
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoNumero}>Pedido #{pedido.numero || pedidoIndex + 1}</Text>
          <Text style={[
            styles.pedidoStatus,
            pedido.status === 'fechado' ? styles.statusFechado : styles.statusAberto
          ]}>
            {pedido.status === 'fechado' ? '✅ FECHADO' : '🟢 ABERTO'}
          </Text>
        </View>
        
        <View style={styles.pedidoActions}>
          {pedido.status === 'aberto' ? (
            <>
              <TouchableOpacity
                style={styles.fecharPedidoButton}
                onPress={() => handleFecharPedido(pedidoIndex)}
              >
                <Text style={styles.fecharPedidoText}>Fechar Pedido</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.excluirPedidoButton}
                onPress={() => handleExcluirPedido(pedidoIndex)}
              >
                <Text style={styles.excluirPedidoText}>🗑️</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.reabrirPedidoButton}
              onPress={() => handleReabrirPedido(pedidoIndex)}
            >
              <Text style={styles.reabrirPedidoText}>Reabrir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.pedidoContent}>
        {pedido.itens && pedido.itens.length > 0 ? (
          <FlatList
            data={pedido.itens}
            renderItem={(props) => renderItemPedido(props, pedidoIndex)}
            keyExtractor={(item, index) => `${pedidoIndex}-${index}`}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.pedidoVazio}>Nenhum item neste pedido</Text>
        )}
        
        <View style={styles.totalPedido}>
          <Text style={styles.totalPedidoLabel}>Total do Pedido:</Text>
          <Text style={styles.totalPedidoValor}>R$ {calcularTotalPedido(pedido).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando comanda...</Text>
      </View>
    );
  }

  if (!comanda) {
    return (
      <View style={styles.errorContainer}>
        <Text>Comanda não encontrada</Text>
      </View>
    );
  }

  const sectionData = Object.keys(categoriasFiltradas).map(categoria => ({
    title: categoria,
    data: categoriasFiltradas[categoria]
  }));

  const pedidosAbertos = comanda.pedidos?.filter(p => p.status === 'aberto') || [];
  const todosPedidosFechados = comanda.pedidos?.every(pedido => pedido.status === 'fechado');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.comandaNumero}>Comanda #{comanda.numero}</Text>
          <Text style={styles.comandaStatus}>{comanda.status}</Text>
        </View>
        
        <View style={styles.clienteInfo}>
          <Text style={styles.clienteNome}>
            {comanda.nomeCliente || 'Cliente não identificado'}
          </Text>
          <Text style={styles.operador}>Operador: {comanda.operador}</Text>
        </View>
      </View>

      {/* Resumo do Pedido */}
      <View style={styles.resumoContainer}>
        <View style={styles.resumoHeader}>
          <Text style={styles.resumoTitle}>Resumo da Comanda</Text>
          <Text style={styles.resumoItens}>
            {comanda.pedidos?.length || 0} pedido(s)
          </Text>
        </View>
        
        <View style={styles.resumoValores}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Total:</Text>
            <Text style={styles.resumoTotal}>R$ {calcularTotalComanda().toFixed(2)}</Text>
          </View>
          <View style={styles.resumoStatus}>
            <Text style={styles.resumoStatusText}>
              Status: {todosPedidosFechados ? 'Pronta para fechar' : 'Em andamento'}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Pedidos */}
      <View style={styles.pedidosContainer}>
        <View style={styles.pedidosHeader}>
          <Text style={styles.pedidosTitle}>Pedidos</Text>
          {pedidosAbertos.length > 0 && (
            <TouchableOpacity
              style={styles.novoPedidoButton}
              onPress={handleNovoPedido}
            >
              <Text style={styles.novoPedidoText}>+ Novo Pedido</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.pedidosList}>
          {comanda.pedidos?.map((pedido, index) => renderPedido(pedido, index))}
        </ScrollView>
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionsContainer}>
        {pedidosAbertos.length > 0 && (
          <TouchableOpacity
            style={styles.adicionarButton}
            onPress={() => setShowProdutos(true)}
          >
            <Text style={styles.adicionarButtonText}>+ Adicionar Produtos</Text>
          </TouchableOpacity>
        )}

        {todosPedidosFechados && (
          <TouchableOpacity
            style={styles.fecharButton}
            onPress={handleFecharComanda}
          >
            <Text style={styles.fecharButtonText}>💰 Fechar Comanda</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de Produtos */}
      <Modal
        visible={showProdutos}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => {
                setShowProdutos(false);
                setProdutoSelecionado(null);
              }}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {produtoSelecionado ? 'Selecionar Quantidade' : 'Selecionar Produtos'}
            </Text>
            <View style={styles.modalCloseButton} />
          </View>

          {!produtoSelecionado ? (
            <>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar produtos..."
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              <SectionList
                sections={sectionData}
                renderItem={renderCategoriaSection}
                renderSectionHeader={({ section: { title } }) => (
                  <Text style={styles.categoriaTitle}>{title}</Text>
                )}
                keyExtractor={(item, index) => index.toString()}
                style={styles.produtosList}
                stickySectionHeadersEnabled={true}
              />
            </>
          ) : (
            <View style={styles.quantidadeContainer}>
              <View style={styles.produtoSelecionadoCard}>
                <Text style={styles.produtoSelecionadoNome}>
                  {produtoSelecionado.descricao}
                </Text>
                <Text style={styles.produtoSelecionadoPreco}>
                  R$ {produtoSelecionado.precoVenda?.toFixed(2)} un
                </Text>
                <Text style={styles.produtoSelecionadoTipo}>
                  {produtoSelecionado.tipo}
                </Text>
              </View>

              <View style={styles.quantidadeControls}>
                <Text style={styles.quantidadeLabel}>Quantidade:</Text>
                
                <View style={styles.quantidadeSelector}>
                  <TouchableOpacity
                    style={styles.quantidadeButton}
                    onPress={diminuirQuantidade}
                    disabled={quantidade <= 1}
                  >
                    <Text style={[
                      styles.quantidadeButtonText,
                      quantidade <= 1 && styles.quantidadeButtonDisabled
                    ]}>-</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.quantidadeDisplay}>
                    <Text style={styles.quantidadeValue}>{quantidade}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.quantidadeButton}
                    onPress={aumentarQuantidade}
                  >
                    <Text style={styles.quantidadeButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.quantidadeInfo}>
                  <Text style={styles.quantidadeInfoText}>
                    Valor unitário: R$ {produtoSelecionado.precoVenda?.toFixed(2)}
                  </Text>
                  <Text style={styles.quantidadeInfoText}>
                    Total do item: R$ {calcularTotalItem().toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.quantidadeActions}>
                <TouchableOpacity
                  style={styles.cancelarButton}
                  onPress={() => setProdutoSelecionado(null)}
                >
                  <Text style={styles.cancelarButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.confirmarButton}
                  onPress={handleConfirmarAdicao}
                >
                  <Text style={styles.confirmarButtonText}>
                    Adicionar ({quantidade}x) - R$ {calcularTotalItem().toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal Senha Supervisor */}
      <Modal
        visible={showSenhaSupervisor}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.senhaModalOverlay}>
          <View style={styles.senhaModalContent}>
            <Text style={styles.senhaModalTitle}>Senha do Supervisor</Text>
            <Text style={styles.senhaModalText}>
              Digite a senha do supervisor para excluir o pedido:
            </Text>
            
            <TextInput
              style={styles.senhaInput}
              placeholder="Senha do supervisor"
              secureTextEntry={true}
              value={senhaSupervisor}
              onChangeText={setSenhaSupervisor}
              autoFocus={true}
            />
            
            <View style={styles.senhaModalButtons}>
              <TouchableOpacity
                style={styles.senhaCancelarButton}
                onPress={() => {
                  setShowSenhaSupervisor(false);
                  setSenhaSupervisor('');
                }}
              >
                <Text style={styles.senhaCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.senhaConfirmarButton}
                onPress={confirmarExclusaoPedido}
              >
                <Text style={styles.senhaConfirmarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ... (os styles continuam iguais, apenas adicione os novos styles para pedidos)

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  comandaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  comandaStatus: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '500',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clienteInfo: {
    marginTop: 5,
  },
  clienteNome: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  operador: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  resumoContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resumoItens: {
    fontSize: 14,
    color: '#666',
  },
  resumoValores: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 16,
    color: '#666',
  },
  resumoTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  resumoStatus: {
    marginTop: 8,
  },
  resumoStatusText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  pedidosContainer: {
    flex: 1,
    margin: 16,
  },
  pedidosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pedidosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  novoPedidoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  novoPedidoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  pedidosList: {
    flex: 1,
  },
  pedidoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  pedidoFechado: {
    opacity: 0.8,
    backgroundColor: '#f8f9fa',
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  pedidoInfo: {
    flex: 1,
  },
  pedidoNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pedidoStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusAberto: {
    color: '#34C759',
  },
  statusFechado: {
    color: '#FF9500',
  },
  pedidoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fecharPedidoButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fecharPedidoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  excluirPedidoButton: {
    backgroundColor: '#FF3B30',
    padding: 6,
    borderRadius: 6,
  },
  excluirPedidoText: {
    color: 'white',
    fontSize: 12,
  },
  reabrirPedidoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reabrirPedidoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  pedidoContent: {
    padding: 16,
  },
  pedidoVazio: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  totalPedido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalPedidoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalPedidoValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemDescricao: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  removerButton: {
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQuantidade: {
    fontSize: 12,
    color: '#666',
  },
  itemPrecoUnit: {
    fontSize: 12,
    color: '#666',
  },
  itemPrecoTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  itemTipo: {
    fontSize: 10,
    color: '#999',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  adicionarButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  adicionarButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fecharButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  fecharButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal de Senha Supervisor
  senhaModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  senhaModalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  senhaModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  senhaModalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  senhaInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  senhaModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  senhaCancelarButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  senhaCancelarText: {
    color: '#666',
    fontWeight: '500',
  },
  senhaConfirmarButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  senhaConfirmarText: {
    color: 'white',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  comandaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  comandaStatus: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '500',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clienteInfo: {
    marginTop: 5,
  },
  clienteNome: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  operador: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  resumoContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resumoItens: {
    fontSize: 14,
    color: '#666',
  },
  resumoValores: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 16,
    color: '#666',
  },
  resumoValor: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resumoTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itensContainer: {
    flex: 1,
    margin: 16,
  },
  itensList: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemDescricao: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  removerButton: {
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemQuantidade: {
    fontSize: 14,
    color: '#666',
  },
  itemPrecoUnit: {
    fontSize: 14,
    color: '#666',
  },
  itemPrecoTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemTipo: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  actionsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  adicionarButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  adicionarButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fecharButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  fecharButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  produtosList: {
    flex: 1,
  },
  categoriaTitle: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  produtoItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  produtoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  produtoDescricao: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  produtoPreco: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  produtoTipo: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  // Tela de Quantidade
  quantidadeContainer: {
    flex: 1,
    padding: 20,
  },
  produtoSelecionadoCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  produtoSelecionadoNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  produtoSelecionadoPreco: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  produtoSelecionadoTipo: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  quantidadeControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  quantidadeLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
    color: '#333',
  },
  quantidadeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantidadeButton: {
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  quantidadeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quantidadeButtonDisabled: {
    color: '#ccc',
  },
  quantidadeDisplay: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  quantidadeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  quantidadeInfo: {
    alignItems: 'center',
  },
  quantidadeInfoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  quantidadeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelarButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelarButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmarButton: {
    flex: 2,
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ComandaDetailScreen;