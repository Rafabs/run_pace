const express = require("express");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "public", "images", "banners");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Conexão com o banco
const client = new MongoClient("mongodb://localhost:27017");
let db;

client.connect().then(() => {
  db = client.db("run_pace");
  console.log("🧠 Conectado à base de dados [run_pace]");
}).catch(console.error);

// Rota para listar banners
router.get("/", async (req, res) => {
  const banners = await db.collection("banners").find().toArray();
  res.json(banners);
});

// Rota para adicionar banner
router.post("/", upload.single("image"), async (req, res) => {
  const { alt } = req.body;
  const filename = req.file.filename;

  const banner = {
    url: `/public/images/banners/${filename}`,
    alt,
    criado_em: new Date()
  };

  await db.collection("banners").insertOne(banner);
  res.status(201).json({ message: "Banner inserido com sucesso!", banner });
});

// Rota para deletar banner
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const banner = await db.collection("banners").findOne({ _id: new ObjectId(id) });

  if (banner) {
    const filepath = path.join(__dirname, "..", banner.url);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  await db.collection("banners").deleteOne({ _id: new ObjectId(id) });
  res.json({ message: "Banner excluído com sucesso" });
});

module.exports = router;
