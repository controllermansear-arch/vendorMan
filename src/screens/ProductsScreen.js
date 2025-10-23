import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { apiService } from '../services/api';

const ProductsScreen = ({ route, navigation }) => {
  const { comandaId, comandaNumero } = route.params;
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('todos');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const allItems = await apiService.getAllItems();
    setItems(allItems);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoria === 'todos' || item.tipo === categoria;
    return matchesSearch && matchesCategory;
  });

  const addItemToComanda = (item) => {
    navigation.navigate('AddItemComanda', {
      comandaId,
      comandaNumero,
      item
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => addItemToComanda(item)}
    >
      <Text style={styles.itemDescricao}>{item.descricao}</Text>
      <Text style={styles.itemPreco}>R$ {item.precoVenda?.toFixed(2)}</Text>
      <Text style={styles.itemTipo}>
        {item.tipo === 'produto' ? 'Produto' : 
         item.tipo === 'combo' ? 'Combo' : 'Fracionado'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar produto..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      
      <View style={styles.categorias}>
        {['todos', 'produto', 'combo', 'fracionado'].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoriaBtn,
              categoria === cat && styles.categoriaBtnActive
            ]}
            onPress={() => setCategoria(cat)}
          >
            <Text style={[
              styles.categoriaText,
              categoria === cat && styles.categoriaTextActive
            ]}>
              {cat === 'todos' ? 'Todos' :
               cat === 'produto' ? 'Produtos' :
               cat === 'combo' ? 'Combos' : 'Fracionados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => `${item.tipo}_${item.codItem}`}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  categorias: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  categoriaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  categoriaBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  categoriaText: {
    fontSize: 12,
    color: '#666'
  },
  categoriaTextActive: {
    color: 'white'
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  itemDescricao: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  itemPreco: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4
  },
  itemTipo: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase'
  }
});

export default ProductsScreen;