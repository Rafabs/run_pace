const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware para permitir requisições de qualquer origem (CORS)
app.use(cors());

// Middleware para aceitar JSON no corpo das requisições
app.use(express.json());

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/run_pace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.log('Erro de conexão com o MongoDB:', err));

// Definir o modelo para a coleção 'corridas'
const Corrida = mongoose.model('Corrida', new mongoose.Schema({
  DATA: String,
  PERIODO: String,
  NOME_EVENTO: String,
  DISTANCIA: String,
  MEDALHA: String,
  INFANTIL: String,
  LOCAL: String,
  MODALIDADE: String,
  VALOR: String,
  SITE: String
}));

// Rota para obter todas as corridas
app.get('/corridas', async (req, res) => {
    try {
      const corridas = await mongoose.connection.db.collection('corridas').find().toArray();
      console.log(corridas); // Adicionando o log aqui para ver as corridas no console
      res.json(corridas); 
    } catch (err) {
      console.error('Erro ao buscar corridas:', err);  // Log do erro
      res.status(500).send('Erro ao buscar corridas');
    }
  });
  

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});