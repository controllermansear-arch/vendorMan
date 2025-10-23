// src/components/ErrorBoundary.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erro capturado pelo Error Boundary:', error);
    console.error('📋 Stack trace:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  handleResetApp = () => {
    // Aqui você pode adicionar lógica para resetar o app
    this.handleRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>😕 Ops! Algo deu errado</Text>
            
            <View style={styles.errorCard}>
              <Text style={styles.errorMessage}>
                {this.state.error?.message || 'Erro desconhecido no aplicativo'}
              </Text>
            </View>

            <Text style={styles.instruction}>
              O aplicativo encontrou um erro inesperado. 
              Você pode tentar recarregar ou reiniciar o aplicativo.
            </Text>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={this.handleRetry}
            >
              <Text style={styles.buttonText}>Tentar Novamente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={this.handleResetApp}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Reiniciar Aplicativo
              </Text>
            </TouchableOpacity>

            {/* Apenas em desenvolvimento - mostrar detalhes */}
            {__DEV__ && this.state.errorInfo && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Detalhes do Erro (Desenvolvimento):</Text>
                <ScrollView style={styles.detailsScroll}>
                  <Text style={styles.detailsText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </ScrollView>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorMessage: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    fontWeight: '500',
  },
  instruction: {
    fontSize: 15,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  detailsSection: {
    marginTop: 30,
    width: '100%',
    maxHeight: 200,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  detailsScroll: {
    backgroundColor: '#f1f3f4',
    padding: 12,
    borderRadius: 6,
  },
  detailsText: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;