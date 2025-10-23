import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, Text, ActivityIndicator, Platform } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ComandasScreen from './src/screens/ComandasScreen';
import ComandaDetailScreen from './src/screens/ComandaDetailScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import AddItemComandaScreen from './src/screens/AddItemComandaScreen';
import FecharComandaScreen from './src/screens/FecharComandaScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import SyncScreen from './src/screens/SyncScreen';
import InitScreen from './src/screens/InitScreen';

// Services
import { apiService } from './src/services/api';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsInitialization, setNeedsInitialization] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Inicializando aplicativo...');
      console.log('📱 Plataforma:', Platform.OS);
      
      // Verificar se existem dados locais
      const data = await apiService.getLocalData();
      const hasData = data.products.length > 0 || data.combos.length > 0 || data.fracionados.length > 0;
      
      console.log('📊 Dados locais encontrados:', {
        produtos: data.products.length,
        combos: data.combos.length,
        fracionados: data.fracionados.length,
        precisaInicializacao: !hasData
      });

      if (!hasData) {
        setNeedsInitialization(true);
      } else {
        // Se há dados, tentar sincronizar (mas não bloquear se falhar)
        try {
          const precisaSync = await apiService.needsSync();
          if (precisaSync) {
            console.log('🔄 Precisa sincronizar, iniciando sync...');
            await apiService.syncInitialData();
          } else {
            console.log('✅ Dados atualizados, usando cache');
          }
        } catch (syncError) {
          console.log('⚠️ Sincronização falhou, usando dados locais:', syncError);
        }
      }

      setStorageReady(true);
    } catch (error) {
      console.log('❌ Erro na inicialização:', error);
      setNeedsInitialization(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Inicializando aplicativo...</Text>
        <Text style={styles.platformText}>
          Plataforma: {Platform.OS}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#007AFF" barStyle="light-content" />
      <Stack.Navigator
        initialRouteName={needsInitialization ? "Init" : "Home"}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Init" 
          component={InitScreen}
          options={{ 
            title: 'Configuração Inicial',
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Gestão de Comandas' }}
        />
        <Stack.Screen 
          name="Comandas" 
          component={ComandasScreen}
          options={{ title: 'Comandas' }}
        />
        <Stack.Screen 
          name="ComandaDetail" 
          component={ComandaDetailScreen}
          options={{ title: 'Detalhes da Comanda' }}
        />
        <Stack.Screen 
          name="Products" 
          component={ProductsScreen}
          options={{ title: 'Selecionar Produtos' }}
        />
        <Stack.Screen 
          name="AddItemComanda" 
          component={AddItemComandaScreen}
          options={{ title: 'Adicionar Item' }}
        />
        <Stack.Screen 
          name="FecharComanda" 
          component={FecharComandaScreen}
          options={{ title: 'Fechar Comanda' }}
        />
        <Stack.Screen 
          name="Config" 
          component={ConfigScreen}
          options={{ title: 'Configurações' }}
        />
        <Stack.Screen 
          name="Sync" 
          component={SyncScreen}
          options={{ title: 'Sincronização' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  platformText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
};