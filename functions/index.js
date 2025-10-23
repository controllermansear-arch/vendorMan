const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors({ origin: true }));

// Middleware para parsear JSON - CORREÇÃO DO ERRO 411
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Conexão com MongoDB Atlas
const mongoURI = process.env.MONGO_URI;

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true
};

mongoose.connect(mongoURI, mongooseOptions)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas');
  })
  .catch((error) => {
    console.error('❌ Erro na conexão MongoDB:', error);
  });

// Eventos de conexão
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erro na conexão Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado');
});

// Models (mantidos iguais)
const ProductSchema = new mongoose.Schema({
  codInt: { type: Number, required: true, unique: true },
  descricao: { type: String, required: true },
  preco: { type: Number, required: true },
  familia: { type: String },
  ativo: { type: Boolean, default: true },
  tipo: { type: String, enum: ['produto', 'fracionado'], default: 'produto' }
});

const ComboSchema = new mongoose.Schema({
  codCombo: { type: String, required: true, unique: true },
  descricao: { type: String, required: true },
  precoCombo: { type: Number, required: true },
  produtosCombo: [{
    codInt: { type: Number, required: true },
    descricao: { type: String, required: true },
    quantidadeCombo: { type: Number, required: true }
  }],
  ativo: { type: Boolean, default: true }
});

const FracionadoSchema = new mongoose.Schema({
  codFracionado: { type: String, required: true, unique: true },
  descricao: { type: String, required: true },
  codInt: { type: Number, required: true },
  preco: { type: Number, required: true },
  quantidadeFracionado: { type: Number, required: true },
  unidadeMedida: { type: String, required: true },
  ativo: { type: Boolean, default: true }
});

const EstoqueSchema = new mongoose.Schema({
  codInt: { type: Number, required: true },
  tipoItem: { type: String, enum: ['produto', 'fracionado'], required: true },
  descricao: { type: String, required: true },
  movimentacoes: [{
    tipo: { type: String, enum: ['entrada', 'saida'], required: true },
    quantidade: { type: Number, required: true },
    motivo: { type: String, required: true },
    data: { type: Date, default: Date.now },
    comanda: { type: mongoose.Schema.Types.ObjectId, ref: 'Comanda' },
    usuario: { type: String, required: true }
  }],
  saldoAtual: { type: Number, default: 0 },
  ultimaAtualizacao: { type: Date, default: Date.now }
});

const ComandaSchema = new mongoose.Schema({
  numero: { type: Number, required: true },
  nomeCliente: { type: String },
  operador: { type: String, required: true },
  pedidos: [{
    itens: [{
      tipo: { type: String, enum: ['produto', 'combo', 'fracionado'], required: true },
      codItem: { type: String, required: true },
      descricao: { type: String, required: true },
      quantidade: { type: Number, required: true },
      precoUnitario: { type: Number, required: true },
      precoTotal: { type: Number, required: true }
    }],
    data: { type: Date, default: Date.now },
    status: { type: String, default: 'aberto' }
  }],
  status: { type: String, default: 'aberta' },
  formaPagamento: { type: String },
  total: { type: Number, default: 0 },
  dataAbertura: { type: Date, default: Date.now },
  dataFechamento: { type: Date },
  sincronizado: { type: Boolean, default: false }
});

const FluxoCaixaSchema = new mongoose.Schema({
  data: { type: Date, default: Date.now },
  comandas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comanda' }],
  totalVendas: { type: Number, default: 0 },
  formasPagamento: {
    dinheiro: { type: Number, default: 0 },
    cartao: { type: Number, default: 0 },
    pix: { type: Number, default: 0 }
  },
  sincronizado: { type: Boolean, default: false }
});

const Product = mongoose.model('Product', ProductSchema);
const Combo = mongoose.model('Combo', ComboSchema);
const Fracionado = mongoose.model('Fracionado', FracionadoSchema);
const Estoque = mongoose.model('Estoque', EstoqueSchema);
const Comanda = mongoose.model('Comanda', ComandaSchema);
const FluxoCaixa = mongoose.model('FluxoCaixa', FluxoCaixaSchema);

// Função para atualizar estoque (mantida igual)
const atualizarEstoque = async (itens, comandaId, usuario, tipoMovimento = 'saida') => {
  for (const item of itens) {
    let quantidadeMovimentar = item.quantidade;
    let codInt = item.codItem;
    let descricao = item.descricao;

    if (item.tipo === 'combo') {
      const combo = await Combo.findOne({ codCombo: item.codItem });
      if (combo) {
        for (const produtoCombo of combo.produtosCombo) {
          await Estoque.findOneAndUpdate(
            { codInt: produtoCombo.codInt },
            {
              $push: {
                movimentacoes: {
                  tipo: tipoMovimento,
                  quantidade: produtoCombo.quantidadeCombo * quantidadeMovimentar,
                  motivo: `Venda combo: ${combo.descricao}`,
                  comanda: comandaId,
                  usuario: usuario
                }
              },
              $inc: { saldoAtual: tipoMovimento === 'entrada' ? 
                (produtoCombo.quantidadeCombo * quantidadeMovimentar) : 
                -(produtoCombo.quantidadeCombo * quantidadeMovimentar) },
              $set: { 
                descricao: produtoCombo.descricao,
                ultimaAtualizacao: new Date()
              }
            },
            { upsert: true, new: true }
          );
        }
      }
      continue;
    }

    if (item.tipo === 'fracionado') {
      const fracionado = await Fracionado.findOne({ codFracionado: item.codItem });
      if (fracionado) {
        codInt = fracionado.codInt;
        descricao = fracionado.descricao;
        quantidadeMovimentar = item.quantidade * fracionado.quantidadeFracionado;
      }
    }

    await Estoque.findOneAndUpdate(
      { codInt: codInt },
      {
        $push: {
          movimentacoes: {
            tipo: tipoMovimento,
            quantidade: quantidadeMovimentar,
            motivo: `Venda: ${descricao}`,
            comanda: comandaId,
            usuario: usuario
          }
        },
        $inc: { saldoAtual: tipoMovimento === 'entrada' ? quantidadeMovimentar : -quantidadeMovimentar },
        $set: { 
          descricao: descricao,
          tipoItem: item.tipo === 'fracionado' ? 'fracionado' : 'produto',
          ultimaAtualizacao: new Date()
        }
      },
      { upsert: true, new: true }
    );
  }
};

// Middleware para log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/admin/status', async (req, res) => {
  try {
    const productsCount = await Product.countDocuments();
    const combosCount = await Combo.countDocuments();
    const fracionadosCount = await Fracionado.countDocuments();
    
    res.json({
      status: 'online',
      collections: {
        products: productsCount,
        combos: combosCount,
        fracionados: fracionadosCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ ativo: true });
    const combos = await Combo.find({ ativo: true });
    const fracionados = await Fracionado.find({ ativo: true });
    
    res.json({
      products,
      combos,
      fracionados
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/estoque', async (req, res) => {
  try {
    const estoque = await Estoque.find({});
    res.json(estoque);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/comandas', async (req, res) => {
  try {
    const comanda = new Comanda(req.body);
    await comanda.save();
    res.json(comanda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/comandas/:id/fechar', async (req, res) => {
  try {
    const { formaPagamento, usuario } = req.body;
    const comanda = await Comanda.findById(req.params.id);
    
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda não encontrada' });
    }

    let total = 0;
    comanda.pedidos.forEach(pedido => {
      pedido.itens.forEach(item => {
        total += item.precoTotal;
      });
    });

    const todosItens = comanda.pedidos.flatMap(pedido => pedido.itens);
    await atualizarEstoque(todosItens, comanda._id, usuario, 'saida');

    comanda.status = 'fechada';
    comanda.formaPagamento = formaPagamento;
    comanda.total = total;
    comanda.dataFechamento = new Date();
    
    await comanda.save();
    res.json(comanda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/estoque/entrada', async (req, res) => {
  try {
    const { codInt, quantidade, motivo, usuario } = req.body;
    
    const produto = await Product.findOne({ codInt });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const estoque = await Estoque.findOneAndUpdate(
      { codInt },
      {
        $push: {
          movimentacoes: {
            tipo: 'entrada',
            quantidade: quantidade,
            motivo: motivo,
            usuario: usuario
          }
        },
        $inc: { saldoAtual: quantidade },
        $set: { 
          descricao: produto.descricao,
          tipoItem: 'produto',
          ultimaAtualizacao: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.json(estoque);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sync', async (req, res) => {
  try {
    const { comandas, fluxoCaixa } = req.body;
    
    const comandasValidas = comandas.filter(comanda => 
      comanda.numero && comanda.operador && comanda.total >= 0
    );

    for (const comandaData of comandasValidas) {
      await Comanda.findByIdAndUpdate(comandaData._id, comandaData, { upsert: true });
    }
    
    if (fluxoCaixa) {
      await FluxoCaixa.findByIdAndUpdate(fluxoCaixa._id, fluxoCaixa, { upsert: true });
    }
    
    res.json({ 
      message: 'Sincronização realizada com sucesso',
      comandasProcessadas: comandasValidas.length,
      comandasInvalidas: comandas.length - comandasValidas.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para inicializar collections - CORRIGIDA PARA POST VAZIO
app.post('/admin/init-collections', async (req, res) => {
  try {
    console.log('Inicializando collections via POST...');
    
    // Dados de exemplo para produtos
    const produtosExemplo = [
      {
        codInt: 1001,
        descricao: "AGUA MINERAL 200ML",
        preco: 7.45,
        familia: "BEBIDAS",
        ativo: true,
        tipo: "produto"
      },
      {
        codInt: 1002,
        descricao: "REFRIGERANTE COCA-COLA LATA",
        preco: 8.50,
        familia: "BEBIDAS",
        ativo: true,
        tipo: "produto"
      },
      {
        codInt: 1003,
        descricao: "CERVEJA HEINEKEN 600ML",
        preco: 15.90,
        familia: "BEBIDAS",
        ativo: true,
        tipo: "produto"
      },
      {
        codInt: 1004,
        descricao: "ESPETINHO DE CARNE",
        preco: 12.00,
        familia: "ALIMENTOS",
        ativo: true,
        tipo: "produto"
      },
      {
        codInt: 1005,
        descricao: "PORÇÃO DE BATATA FRITA",
        preco: 25.00,
        familia: "ALIMENTOS",
        ativo: true,
        tipo: "produto"
      },
      {
        codInt: 1006,
        descricao: "SUCO NATURAL LARANJA 300ML",
        preco: 10.00,
        familia: "BEBIDAS",
        ativo: true,
        tipo: "produto"
      }
    ];

    // Inserir produtos
    let produtosInseridos = 0;
    for (const produto of produtosExemplo) {
      await Product.findOneAndUpdate(
        { codInt: produto.codInt },
        produto,
        { upsert: true, new: true }
      );
      produtosInseridos++;
    }

    // Dados de exemplo para combos
    const combosExemplo = [
      {
        codCombo: "COMBO01",
        descricao: "COMBO CERVEJA + ESPETINHO",
        precoCombo: 30.00,
        produtosCombo: [
          {
            codInt: 1003,
            descricao: "CERVEJA HEINEKEN 600ML",
            quantidadeCombo: 1
          },
          {
            codInt: 1004,
            descricao: "ESPETINHO DE CARNE",
            quantidadeCombo: 1
          }
        ],
        ativo: true
      },
      {
        codCombo: "COMBO02",
        descricao: "COMBO REFRI + BATATA",
        precoCombo: 30.00,
        produtosCombo: [
          {
            codInt: 1002,
            descricao: "REFRIGERANTE COCA-COLA LATA",
            quantidadeCombo: 1
          },
          {
            codInt: 1005,
            descricao: "PORÇÃO DE BATATA FRITA",
            quantidadeCombo: 1
          }
        ],
        ativo: true
      }
    ];

    // Inserir combos
    let combosInseridos = 0;
    for (const combo of combosExemplo) {
      await Combo.findOneAndUpdate(
        { codCombo: combo.codCombo },
        combo,
        { upsert: true, new: true }
      );
      combosInseridos++;
    }

    // Dados de exemplo para fracionados
    const fracionadosExemplo = [
      {
        codFracionado: "FRAC01",
        descricao: "VODKA ORLOFF DOSE",
        codInt: 2001,
        preco: 12.00,
        quantidadeFracionado: 0.075,
        unidadeMedida: "L",
        ativo: true
      },
      {
        codFracionado: "FRAC02",
        descricao: "WHISKY JOHNNIE WALKER DOSE",
        codInt: 2002,
        preco: 18.00,
        quantidadeFracionado: 0.075,
        unidadeMedida: "L",
        ativo: true
      }
    ];

    // Inserir fracionados
    let fracionadosInseridos = 0;
    for (const fracionado of fracionadosExemplo) {
      await Fracionado.findOneAndUpdate(
        { codFracionado: fracionado.codFracionado },
        fracionado,
        { upsert: true, new: true }
      );
      fracionadosInseridos++;
    }

    console.log('Collections inicializadas com sucesso via POST');
    
    res.json({ 
      success: true, 
      message: 'Collections inicializadas com dados de exemplo via POST',
      data: {
        produtos: produtosInseridos,
        combos: combosInseridos,
        fracionados: fracionadosInseridos
      }
    });

  } catch (error) {
    console.error('Erro ao inicializar collections via POST:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Rota GET para inicializar collections (mantida)
app.get('/admin/init-collections', async (req, res) => {
  try {
    console.log('Inicializando collections via GET...');
    
    const produtosExemplo = [
      {
        codInt: 1001,
        descricao: "AGUA MINERAL 200ML",
        preco: 7.45,
        familia: "BEBIDAS",
        ativo: true,
        tipo: "produto"
      },
      {
        codInt: 1002,
        descricao: "REFRIGERANTE COCA-COLA LATA",
        preco: 8.50,
        familia: "BEBIDAS",
        ativo: true,
        tipo: "produto"
      }
    ];

    for (const produto of produtosExemplo) {
      await Product.findOneAndUpdate(
        { codInt: produto.codInt },
        produto,
        { upsert: true, new: true }
      );
    }

    res.json({ 
      success: true, 
      message: 'Collections inicializadas via GET',
      data: {
        produtos: produtosExemplo.length
      }
    });

  } catch (error) {
    console.error('Erro ao inicializar collections via GET:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

exports.api = functions.https.onRequest(app);