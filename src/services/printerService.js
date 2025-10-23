import { Alert } from 'react-native';
import { apiService } from './api';
import { authService } from './authService';

// Serviço de impressão integrado com maquineta GetNet
// Usando SDK oficial ou API da GetNet

export const printerService = {
  // Verificar se a maquineta está disponível
  async checkDeviceAvailability() {
    try {
      // Em desenvolvimento, simula disponibilidade
      // Em produção, usar SDK da GetNet para verificar conexão
      return {
        available: true,
        device: 'GetNet POS Integrated',
        status: 'connected'
      };
    } catch (error) {
      console.log('Erro ao verificar dispositivo:', error);
      return {
        available: false,
        error: error.message
      };
    }
  },

  // Imprimir pedido individual via maquineta GetNet
  async printPedido(pedido, comandaNumero, nomeCliente = '') {
    try {
      console.log('Iniciando impressão na maquineta GetNet...');
      
      // Verificar se a maquineta está disponível
      const deviceStatus = await this.checkDeviceAvailability();
      if (!deviceStatus.available) {
        Alert.alert('Atenção', 'Maquineta GetNet não disponível');
        return false;
      }

      // Gerar conteúdo formatado para impressão
      const printContent = this.formatPedidoContent(pedido, comandaNumero, nomeCliente);
      
      // Em produção, aqui chamaria o SDK da GetNet:
      // await GetNetSDK.printReceipt(printContent);
      
      // Simular impressão bem-sucedida
      await this.simulatePrint(printContent);
      
      console.log('Pedido impresso com sucesso na maquineta GetNet');
      
      // Salvar log da impressão
      await this.savePrintLog('pedido', comandaNumero, printContent);
      
      return true;
    } catch (error) {
      console.log('Erro na impressão GetNet:', error);
      Alert.alert('Erro', 'Falha na impressão: ' + error.message);
      return false;
    }
  },

  // Imprimir comanda completa via maquineta GetNet
  async printComanda(comanda) {
    try {
      console.log('Iniciando impressão da comanda na maquineta GetNet...');
      
      // Verificar se a maquineta está disponível
      const deviceStatus = await this.checkDeviceAvailability();
      if (!deviceStatus.available) {
        Alert.alert('Atenção', 'Maquineta GetNet não disponível');
        return false;
      }

      // Gerar conteúdo formatado para impressão
      const printContent = this.formatComandaContent(comanda);
      
      // Em produção, aqui chamaria o SDK da GetNet:
      // await GetNetSDK.printReceipt(printContent);
      
      // Simular impressão bem-sucedida
      await this.simulatePrint(printContent);
      
      console.log('Comanda impressa com sucesso na maquineta GetNet');
      
      // Salvar log da impressão
      await this.savePrintLog('comanda', comanda.numero, printContent);
      
      return true;
    } catch (error) {
      console.log('Erro na impressão GetNet:', error);
      Alert.alert('Erro', 'Falha na impressão: ' + error.message);
      return false;
    }
  },

  // Formatar conteúdo do pedido para impressão
  formatPedidoContent(pedido, comandaNumero, nomeCliente) {
    const lines = [];
    
    // Cabeçalho
    lines.push({ text: 'PEDIDO', align: 'CENTER', bold: true, size: 'LARGE' });
    lines.push({ text: `Comanda: ${comandaNumero}`, align: 'CENTER' });
    lines.push({ text: `Cliente: ${nomeCliente || 'Não informado'}`, align: 'LEFT' });
    lines.push({ text: `Data: ${new Date().toLocaleString('pt-BR')}`, align: 'LEFT' });
    lines.push({ text: '=', align: 'CENTER' });
    lines.push({ text: 'ITENS DO PEDIDO', align: 'CENTER', bold: true });
    lines.push({ text: '=', align: 'CENTER' });
    
    // Itens
    let totalPedido = 0;
    pedido.itens.forEach(item => {
      lines.push({ text: item.descricao, align: 'LEFT' });
      lines.push({ 
        text: `${item.quantidade}x R$ ${item.precoUnitario.toFixed(2)}`, 
        align: 'LEFT' 
      });
      lines.push({ 
        text: `R$ ${item.precoTotal.toFixed(2)}`, 
        align: 'RIGHT', 
        bold: true 
      });
      lines.push({ text: '-', align: 'CENTER' });
      totalPedido += item.precoTotal;
    });
    
    // Total
    lines.push({ text: 'TOTAL DO PEDIDO', align: 'CENTER', bold: true });
    lines.push({ 
      text: `R$ ${totalPedido.toFixed(2)}`, 
      align: 'CENTER', 
      bold: true, 
      size: 'LARGE' 
    });
    
    // Rodapé
    lines.push({ text: ' ', align: 'CENTER' });
    lines.push({ text: ' ', align: 'CENTER' });
    lines.push({ text: 'Assinatura: ___________', align: 'LEFT' });
    
    return lines;
  },

  // Formatar conteúdo da comanda para impressão
  formatComandaContent(comanda) {
    const lines = [];
    
    // Cabeçalho
    lines.push({ text: 'COMANDA FECHADA', align: 'CENTER', bold: true, size: 'LARGE' });
    lines.push({ text: `Nº: ${comanda.numero}`, align: 'CENTER', bold: true });
    lines.push({ text: `Cliente: ${comanda.nomeCliente || 'Não informado'}`, align: 'LEFT' });
    lines.push({ text: `Operador: ${comanda.operador}`, align: 'LEFT' });
    lines.push({ text: `Abertura: ${new Date(comanda.dataAbertura).toLocaleString('pt-BR')}`, align: 'LEFT' });
    lines.push({ text: `Fechamento: ${new Date().toLocaleString('pt-BR')}`, align: 'LEFT' });
    lines.push({ text: '=', align: 'CENTER' });
    lines.push({ text: 'RESUMO DA COMANDA', align: 'CENTER', bold: true });
    lines.push({ text: '=', align: 'CENTER' });
    
    // Consolidar itens
    const todosItens = comanda.pedidos.flatMap(pedido => pedido.itens);
    const itensConsolidados = {};
    
    todosItens.forEach(item => {
      const key = `${item.tipo}_${item.codItem}`;
      if (!itensConsolidados[key]) {
        itensConsolidados[key] = { ...item, quantidade: 0, precoTotal: 0 };
      }
      itensConsolidados[key].quantidade += item.quantidade;
      itensConsolidados[key].precoTotal += item.precoTotal;
    });
    
    // Itens consolidados
    Object.values(itensConsolidados).forEach(item => {
      lines.push({ text: item.descricao, align: 'LEFT' });
      lines.push({ 
        text: `${item.quantidade}x R$ ${item.precoUnitario.toFixed(2)}`, 
        align: 'LEFT' 
      });
      lines.push({ 
        text: `R$ ${item.precoTotal.toFixed(2)}`, 
        align: 'RIGHT', 
        bold: true 
      });
      lines.push({ text: '-', align: 'CENTER' });
    });
    
    // Totais
    lines.push({ text: 'TOTAL GERAL', align: 'CENTER', bold: true });
    lines.push({ 
      text: `R$ ${comanda.total.toFixed(2)}`, 
      align: 'CENTER', 
      bold: true, 
      size: 'LARGE' 
    });
    
    lines.push({ text: ' ', align: 'CENTER' });
    lines.push({ 
      text: `FORMA DE PAGAMENTO: ${this.getFormaPagamentoText(comanda.formaPagamento)}`, 
      align: 'CENTER', 
      bold: true 
    });
    
    // Desconto
    if (comanda.desconto && comanda.desconto > 0) {
      lines.push({ text: ' ', align: 'CENTER' });
      lines.push({ 
        text: `DESCONTO: R$ ${comanda.desconto.toFixed(2)}`, 
        align: 'CENTER' 
      });
      lines.push({ 
        text: `TOTAL COM DESCONTO: R$ ${(comanda.total - comanda.desconto).toFixed(2)}`, 
        align: 'CENTER', 
        bold: true 
      });
    }
    
    // Rodapé
    lines.push({ text: ' ', align: 'CENTER' });
    lines.push({ text: ' ', align: 'CENTER' });
    lines.push({ text: 'Obrigado pela preferência!', align: 'CENTER' });
    
    return lines;
  },

  // Simular impressão (para desenvolvimento)
  async simulatePrint(printContent) {
    console.log('=== SIMULAÇÃO DE IMPRESSÃO GETNET ===');
    
    printContent.forEach(line => {
      let output = line.text;
      
      // Aplicar formatação
      if (line.align === 'CENTER') {
        output = output.padStart((40 + output.length) / 2).padEnd(40);
      } else if (line.align === 'RIGHT') {
        output = output.padStart(40);
      }
      
      if (line.bold) {
        output = `**${output}**`;
      }
      
      if (line.size === 'LARGE') {
        output = `[L]${output}[/L]`;
      }
      
      console.log(output);
    });
    
    console.log('=== FIM DA IMPRESSÃO ===');
    
    // Simular tempo de impressão
    await new Promise(resolve => setTimeout(resolve, 2000));
  },

  // Testar impressão na maquineta
  async testPrint() {
    try {
      console.log('Testando impressão na maquineta GetNet...');
      
      const deviceStatus = await this.checkDeviceAvailability();
      if (!deviceStatus.available) {
        Alert.alert('Atenção', 'Maquineta GetNet não disponível');
        return false;
      }

      const testContent = [
        { text: 'TESTE DE IMPRESSÃO', align: 'CENTER', bold: true, size: 'LARGE' },
        { text: 'GetStore App', align: 'CENTER', bold: true },
        { text: new Date().toLocaleString('pt-BR'), align: 'CENTER' },
        { text: '=', align: 'CENTER' },
        { text: '✅ Impressão OK', align: 'CENTER' },
        { text: '=', align: 'CENTER' },
        { text: ' ', align: 'CENTER' },
        { text: ' ', align: 'CENTER' }
      ];
      
      await this.simulatePrint(testContent);
      
      Alert.alert('Sucesso', 'Teste de impressão realizado com sucesso!');
      return true;
    } catch (error) {
      console.log('Erro no teste de impressão:', error);
      Alert.alert('Erro', 'Falha no teste de impressão: ' + error.message);
      return false;
    }
  },

  getFormaPagamentoText(forma) {
    const formas = {
      'dinheiro': 'DINHEIRO',
      'pix': 'PIX',
      'credito': 'CARTÃO CRÉDITO',
      'debito': 'CARTÃO DÉBITO',
      'vale_guia': 'VALE GUIA'
    };
    return formas[forma] || forma;
  },

  // Método para integração futura com SDK GetNet
  async initializeGetNetSDK() {
    try {
      // Em produção, inicializar SDK da GetNet
      // await GetNetSDK.initialize({
      //   apiKey: 'sua-api-key',
      //   environment: 'production'
      // });
      
      console.log('SDK GetNet inicializado (simulado)');
      return true;
    } catch (error) {
      console.log('Erro ao inicializar SDK GetNet:', error);
      return false;
    }
  },

  // Salvar log de impressão (para debug e auditoria)
  async savePrintLog(tipo, referencia, content) {
    try {
      const logEntry = {
        tipo,
        referencia,
        content,
        data: new Date().toISOString(),
        dispositivo: 'GetNet POS'
      };
      
      console.log('Log de impressão salvo:', logEntry);
      
      // Em produção, salvar no AsyncStorage ou enviar para o servidor
      // await AsyncStorage.setItem(`print_log_${Date.now()}`, JSON.stringify(logEntry));
      
      return true;
    } catch (error) {
      console.log('Erro ao salvar log de impressão:', error);
      return false;
    }
  },

  // Verificar histórico de impressões
  async getPrintHistory() {
    try {
      // Em produção, buscar do AsyncStorage ou servidor
      const history = []; // await AsyncStorage.getAllPrintLogs();
      return history;
    } catch (error) {
      console.log('Erro ao buscar histórico de impressões:', error);
      return [];
    }
  }
};