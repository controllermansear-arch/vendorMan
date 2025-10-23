// src/screens/InitScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { getComandas, getItens, sincronizarDados, inicializarDados } from '../services/api';

const InitScreen = ({ navigation }) => {
  const [status, setStatus] = useState('Inicializando...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      setStatus('Verificando dados locais...');
      setProgress(20);

      // Tenta inicializar os dados
      const appData = await inicializarDados();
      
      setStatus('Dados locais carregados');
      setProgress(60);
      console.log('✅ Dados locais verificados:', {
        comandas: appData.comandas.length,
        itens: appData.itens.length
      });

      setStatus('Sincronizando dados...');
      setProgress(80);

      // Tenta sincronizar (mas não bloqueia se falhar)
      try {
        const syncResult = await sincronizarDados();
        console.log('✅ Sincronização bem-sucedida:', syncResult);
        setStatus('Sincronização concluída!');
      } catch (syncError) {
        console.warn('⚠️ Sincronização falhou, continuando offline:', syncError);
        setStatus('Modo offline ativado');
      }

      setProgress(100);
      setStatus('Aplicativo pronto!');
      
      // Aguarda um pouco para mostrar a tela de inicialização
      setTimeout(() => {
        setCanContinue(true);
      }, 1000);

    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      setError(error.message);
      setStatus('Erro na inicialização');
      setCanContinue(true); // Permite continuar mesmo com erro
    }
  };

  const handleContinue = () => {
    // Navega para a tela principal
    navigation.replace('Home');
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setCanContinue(false);
    checkDatabaseStatus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>VendorMan</Text>
        <Text style={styles.subtitle}>Sistema de Gerenciamento</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <Text style={styles.statusText}>{status}</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Erro na Inicialização</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Text style={styles.errorHelp}>
              Você pode tentar novamente ou continuar em modo offline.
            </Text>
          </View>
        )}

        {!canContinue ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
        ) : (
          <View style={styles.buttonContainer}>
            {error && (
              <TouchableOpacity 
                style={[styles.button, styles.retryButton]} 
                onPress={handleRetry}
              >
                <Text style={styles.buttonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.continueButton]} 
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>
                {error ? 'Continuar Offline' : 'Entrar no Sistema'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Versão 1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  progressText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statusText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loading: {
    marginTop: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorTitle: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
  },
  errorHelp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#FFF',
  },
  retryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButtonText: {
    color: '#007AFF',
  },
  retryButtonText: {
    color: '#FFF',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});

export default InitScreen;