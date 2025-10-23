// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import InitScreen from './src/screens/InitScreen';
import HomeScreen from './src/screens/HomeScreen';
import FecharComandaScreen from './src/screens/FecharComandaScreen';
import EditarItemScreen from './src/screens/EditarItemScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import { inicializarDados, sincronizarDados } from './src/services/api';
import { carregarConfiguracoes } from './src/services/configService';

const Stack = createNativeStackNavigator();

export default function App() {
  const [appInitialized, setAppInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

const initializeApp = async () => {
  try {
    console.log('🚀 Inicializando aplicativo...');
    console.log('📱 Plataforma: web');

    // Pequeno delay para mostrar a tela de loading
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Carrega configurações primeiro
    const config = await carregarConfiguracoes();
    console.log('⚙️ Configurações carregadas:', config.operador);

    // Inicializar dados do app
    const appData = await inicializarDados();
    console.log('📊 Dados locais inicializados:', {
      comandas: appData.comandas.length,
      itens: appData.itens.length
    });

    // Sincronizar dados (se necessário) - não bloqueia se falhar
    try {
      const syncResult = await sincronizarDados();
      console.log('✅ Sincronização concluída:', syncResult);
    } catch (syncError) {
      console.warn('⚠️ Sincronização falhou, continuando com dados locais:', syncError);
    }

    setAppInitialized(true);
    console.log('🎯 Aplicativo inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    setInitializationError(error.message);
    // Mesmo com erro, deixamos o app continuar para não travar
    setAppInitialized(true);
  } finally {
    setIsLoading(false);
  }
};

  // Se ainda está inicializando, mostra tela de inicialização
  if (!appInitialized) {
    return <InitScreen />;
  }

  // Se houve erro na inicialização, mostra erro mas permite continuar
  if (initializationError) {
    console.warn('⚠️ App iniciando com erros, mas permitindo continuar...');
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
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
            name="Home"
            component={HomeScreen}
            options={{ title: 'VendorMan - Comandas' }}
          />
          <Stack.Screen
            name="FecharComanda"
            component={FecharComandaScreen}
            options={{ title: 'Fechar Comanda' }}
          />
          <Stack.Screen
            name="EditarItem"
            component={EditarItemScreen}
            options={{ title: 'Produto' }}
          />
          <Stack.Screen
            name="Configuracao"
            component={ConfigScreen}
            options={{ title: 'Configurações' }}
          />
          {/* Adicione outras screens aqui */}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}