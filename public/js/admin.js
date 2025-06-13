// admin.js - Funções administrativas (somente para db_edit.html)

let editandoId = null;

// Modal -------------------------------------
function abrirModal(titulo, dados = {}) {
  document.getElementById("modal-title").innerText = titulo;
  document.getElementById("corrida-nome").value = dados.NOME_EVENTO || "";
  document.getElementById("corrida-data").value = dados.DATA || "";
  document.getElementById("corrida-local").value = dados.LOCAL || "";
  document.getElementById("corrida-lat").value = dados.LAT || "";
  document.getElementById("corrida-long").value = dados.LONG || "";
  document.getElementById("corrida-periodo").value = dados.PERIODO || "Manhã";
  document.getElementById("corrida-publico").value = dados.PUBLICO || "Adulto";
  document.getElementById("corrida-medalha").value = dados.MEDALHA || "Sim";
  document.getElementById("corrida-tipo").value = dados.TIPO || "";
  document.getElementById("corrida-site").value = dados.SITE || "";

  document.getElementById("corrida-modal").style.display = "block";
  editandoId = dados._id || null;
}

function fecharModal() {
  document.getElementById("corrida-modal").style.display = "none";
}

// CRUD ---------------------------------------
async function carregarCorridas() {
  try {
    const resposta = await fetch("http://localhost:3000/corridas");
    if (!resposta.ok) throw new Error("Erro ao buscar corridas");

    let corridas = await resposta.json();
    corridas.sort((a, b) => new Date(a.DATA) - new Date(b.DATA));

    const tabela = document.querySelector("#tabelaCorridas tbody");
    tabela.innerHTML = "";

    corridas.forEach(corrida => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${corrida.NOME_EVENTO}</td>
        <td>${formatarDataParaBR(corrida.DATA)}</td>
        <td>${corrida.LOCAL}</td>
        <td>${corrida.PERIODO}</td>
        <td><button onclick="excluirCorrida('${corrida._id}')">Excluir</button></td>
      `;
      tabela.appendChild(row);
    });
  } catch (erro) {
    console.error("Erro ao carregar corridas:", erro);
  }
}

async function salvarCorrida() {
  const id = document.getElementById("corrida-id").value;
  const lat = document.getElementById("corrida-lat").value.trim();
  const long = document.getElementById("corrida-long").value.trim();

  const corrida = {
    NOME_EVENTO: document.getElementById("corrida-nome").value,
    DATA: document.getElementById("corrida-data").value,
    LOCAL: document.getElementById("corrida-local").value,
    PERIODO: document.getElementById("corrida-periodo").value,
    PUBLICO: document.getElementById("corrida-publico").value,
    MEDALHA: document.getElementById("corrida-medalha").value,
    SITE: document.getElementById("corrida-site").value,
    LAT: lat !== "" ? parseFloat(lat) : null,
    LONG: long !== "" ? parseFloat(long) : null,
    TIPO: document.getElementById("corrida-tipo").value,
  };

  const url = id
    ? `http://localhost:3000/corridas/${id}`
    : `http://localhost:3000/corridas`;

  const metodo = id ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corrida),
    });

    if (!resposta.ok) throw new Error("Erro ao salvar corrida");

    console.log("Corrida salva com sucesso!");
    carregarCorridas();
    fecharModal();
  } catch (erro) {
    console.error("Erro ao salvar corrida:", erro);
  }
}

async function excluirCorrida(id) {
  try {
    console.log("Tentando excluir corrida com ID:", id);
    const response = await fetch(`http://localhost:3000/corridas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) throw new Error("Erro ao excluir corrida");

    console.log("Corrida excluída com sucesso!");
    await carregarCorridas();
  } catch (error) {
    console.error("Erro ao excluir corrida:", error);
  }
}

async function abrirModalEditar(id) {
  try {
    const resposta = await fetch(`http://localhost:3000/corridas/${id}`);
    if (!resposta.ok) throw new Error("Erro ao buscar detalhes da corrida");

    const corrida = await resposta.json();
    abrirModal("Editar Corrida", corrida);
  } catch (error) {
    console.error("Erro ao carregar corrida para edição:", error);
    alert("Erro ao carregar detalhes da corrida.");
  }
}

function abrirModalAdicionar() {
  abrirModal("Adicionar Nova Corrida");
}

function formatarDataParaBR(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const closeButton = document.querySelector(".close");
  if (closeButton) {
    closeButton.addEventListener("click", fecharModal);
  }

  const salvarCorridaBtn = document.getElementById("salvar-corrida");
  if (salvarCorridaBtn) {
    salvarCorridaBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      await salvarCorrida();
    });
  }

  carregarCorridas();
});