const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: process.env.SESSION_SECRET || "seuSegredo",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // cookie: { secure: process.env.NODE_ENV === "production" } << Quando em produção
}));
const cors = require("cors");
app.use(cors({
    origin: "http://127.0.0.1:5500", // Requisições do frontend (AJUSTAR QUANDO FOR LANÇAR*******) 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    allowedHeaders: ["Content-Type", "Authorization"], 
    credentials: true
}));

const uri = "mongodb://localhost:27017"; //(AJUSTAR QUANDO FOR LANÇAR*******) 
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
      await client.connect();
      db = client.db("run_pace");
      console.log("Conectado ao MongoDB");
  } catch (error) {
      console.error("Erro ao conectar ao MongoDB:", error);
      setTimeout(connectDB, 5000); 
  }
}
connectDB();

// -------------------- LOGIN --------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Tentativa de login com:", email, password);

  try {
    const user = await db.collection("usuarios").findOne({ email });
    if (!user) {
      console.log("Usuário não encontrado.");
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    const senhaValida = await bcrypt.compare(password, user.senha);
    if (senhaValida) {
      req.session.user = { id: user._id, email: user.email };
      console.log("Login bem-sucedido!");
      return res.status(200).json({ redirect: "/db_edit" });
    } else {
      console.log("Senha incorreta.");
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
});

// -------------------- MIDDLEWARE DE AUTENTICAÇÃO --------------------
function authMiddleware(req, res, next) {
  if (req.session.user) {
      return next();
  }
  
  if (req.headers.accept?.includes("application/json")) {
      return res.status(401).json({ message: "Não autorizado" });
  }
  
  res.redirect("http://127.0.0.1:5500/public/db_edit.html");
}

// -------------------- ROTA PARA A PÁGINA DE EDIÇÃO (PROTEGIDA) --------------------
app.get("/db_edit", authMiddleware, (req, res) => {
  console.log("Usuário autenticado:", req.session.user);
  res.sendFile(__dirname + "/public/db_edit.html");
});

// -------------------- ROTA PARA LISTAR CORRIDAS --------------------
app.get("/corridas", async (req, res) => {
    try {
        const corridas = await db.collection("corridas").find({}).toArray();
        res.json(corridas);
    } catch (error) {
        console.error("Erro ao buscar corridas:", error);
        res.status(500).json({ message: "Erro interno no servidor" });
    }
});

// -------------------- INSERIR CORRIDA --------------------
app.post("/corridas", async (req, res) => {
  try {
        const { NOME_EVENTO, DATA, LOCAL, PERIODO, SITE, LAT, LONG, TIPO } = req.body;

      if (!NOME_EVENTO || !DATA || !LOCAL || !PERIODO || !SITE || !LAT || !LONG || !TIPO) {
          return res.status(400).json({ message: "Todos os campos são obrigatórios." });
      }

      const novaCorrida = { NOME_EVENTO, DATA, LOCAL, PERIODO, SITE, LAT, LONG, TIPO };
      const result = await db.collection("corridas").insertOne(novaCorrida);
      
      return res.status(201).json({ 
          message: "Corrida adicionada com sucesso!",
          corrida: { _id: result.insertedId, ...novaCorrida }
      });
  } catch (error) {
      console.error("Erro ao adicionar corrida:", error);
      res.status(500).json({ message: "Erro interno ao adicionar corrida." });
  }
});

// -------------------- ATUALIZAR CORRIDA --------------------
app.put("/corridas/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID inválido" });
    }

    const { NOME_EVENTO, DATA, LOCAL, PERIODO, SITE, LAT, LONG, TIPO } = req.body;

    try {
        const resultado = await db.collection("corridas").updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { NOME_EVENTO, DATA, LOCAL, PERIODO, SITE, LAT, LONG, TIPO } 
            }
        );

        if (resultado.modifiedCount === 0) {
            return res.status(404).json({ message: "Nenhuma alteração feita ou corrida não encontrada." });
        }

        res.json({ message: "Corrida atualizada com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar corrida:", error);
        res.status(500).json({ message: "Erro interno no servidor" });
    }
});

// -------------------- EXCLUIR CORRIDA --------------------
app.delete("/corridas/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
  }

  try {
      const resultado = await db.collection("corridas").deleteOne({ _id: new ObjectId(id) });
      if (resultado.deletedCount === 0) {
          return res.status(404).json({ message: "Corrida não encontrada" });
      }

      res.json({ message: "Corrida excluída com sucesso!" });
  } catch (error) {
      console.error("Erro ao excluir corrida:", error);
      res.status(500).json({ message: "Erro interno no servidor" });
  }
});

// -------------------- BUSCAR CORRIDA POR ID --------------------
app.get("/corridas/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
  }

  try {
      const corrida = await db.collection("corridas").findOne({ _id: new ObjectId(id) });

      if (!corrida) {
          return res.status(404).json({ message: "Corrida não encontrada" });
      }

      res.json(corrida);
  } catch (error) {
      console.error("Erro ao buscar corrida:", error);
      res.status(500).json({ message: "Erro interno no servidor" });
  }
});

// -------------------- INICIAR O SERVIDOR --------------------
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});