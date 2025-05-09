document.addEventListener("DOMContentLoaded", function () {
  iniciarCarrossel();

  if (document.getElementById("corridas-list")) {
    console.log("✅ corridas-list encontrado, carregando corridas...");
    carregarCorridasPublicas();
  } else {
    console.warn("⚠️ corridas-list não encontrado. Pular carregarCorridasPublicas.");
  }  

  if (document.getElementById("login-form")) {
    configurarLogin();
  }

  if (document.getElementById("corridas-container")) {
    carregarCorridas();
  }

  if (document.getElementById("search-bar")) {
    configurarBarraDePesquisa();
  }
});

// -------------------- CARROSSEL --------------------
function iniciarCarrossel() {
  const slides = document.querySelectorAll(".carousel-slide");
  const prevButton = document.querySelector(".carousel-prev");
  const nextButton = document.querySelector(".carousel-next");
  let currentSlide = 0;
  let slideInterval = null;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.display = i === index ? "block" : "none";
    });
  }

  function resetSlideInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 3000);
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  function prevSlide() {
    currentSlide = (currentSlide === 0) ? slides.length - 1 : currentSlide - 1;
    showSlide(currentSlide);
  }

  if (slides.length > 0) {
    showSlide(currentSlide);
    slideInterval = setInterval(nextSlide, 3000);
  }

  if (prevButton && nextButton) {
    prevButton.addEventListener("click", () => {
      prevSlide();
      resetSlideInterval();
    });

    nextButton.addEventListener("click", () => {
      nextSlide();
      resetSlideInterval();
    });
  }
}

// -------------------- CARREGAR BANNERS PARA O CARROSSEL --------------------
async function carregarBannersCarrossel() {
  const container = document.querySelector(".carousel-container");
  if (!container) return;

  try {
    const response = await fetch("http://localhost:3000/api/banners");
    const banners = await response.json();

    if (!banners.length) {
      container.innerHTML = `<p style="text-align:center;">Nenhuma imagem disponível.</p>`;
      return;
    }

    const slidesHtml = banners.map(b => `
      <div class="carousel-slide">
        <a href="${b.link}" target="_blank">
          <img src="http://localhost:3000${b.url}" alt="${b.alt || ''}">
        </a>
      </div>
    `).join('');    

    const controlsHtml = `
      <div class="carousel-controls">
        <button class="carousel-prev">&#10094;</button>
        <button class="carousel-next">&#10095;</button>
      </div>
    `;

    container.innerHTML = slidesHtml + controlsHtml;

    iniciarCarrossel(); // Chama aqui após inserir slides e botões
  } catch (error) {
    console.error("Erro ao carregar banners no carrossel:", error);
    container.innerHTML = `<p>Erro ao carregar imagens do carrossel.</p>`;
  }
}

// -------------------- AO CARREGAR A PÁGINA --------------------
document.addEventListener("DOMContentLoaded", () => {
  // Só carrega se existir o container do carrossel
  if (document.querySelector(".carousel-container")) {
    carregarBannersCarrossel();
  }
});

// -------------------- LISTAGEM PÚBLICA DE CORRIDAS --------------------
let map = null;
let todasCorridas = [];

async function carregarCorridasPublicas() {
  const tabela = document.getElementById("corridas-list");
  if (!tabela) {
    console.warn("⚠️ Elemento #corridas-list não encontrado. Corridas não serão carregadas.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/corridas");
    if (!response.ok) throw new Error("Erro ao carregar os dados");

    const data = await response.json();
    todasCorridas = data;

    tabela.innerHTML = "";

    if (!map) {
      map = L.map("map").setView([-23.55052, -46.633308], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
    }

    const markers = L.markerClusterGroup();

    data.forEach((corrida) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatarDataParaBR(corrida.DATA)}</td>
        <td>${corrida.NOME_EVENTO}</td>
        <td>${corrida.LOCAL}</td>
        <td>${corrida.PERIODO}</td>
        <td>${corrida.PUBLICO}</td>
        <td>${corrida.MEDALHA}</td>
        <td>${corrida.TIPO}</td>
        <td><a href="${corrida.SITE}" target="_blank">Saiba Mais</a></td>
      `;
      tabela.appendChild(row);

      if (corrida.LAT && corrida.LONG) {
        const marker = L.marker([parseFloat(corrida.LAT), parseFloat(corrida.LONG)]);
        marker.bindPopup(`
          <strong>${corrida.NOME_EVENTO}</strong><br>
          📍 ${corrida.LOCAL}<br>
          🗓 ${corrida.DATA} - ${corrida.PERIODO} - ${corrida.PUBLICO}<br>
          <a href="${corrida.SITE}" target="_blank">Saiba Mais</a>
        `);
        markers.addLayer(marker);
      }
    });

    map.addLayer(markers);

  } catch (error) {
    console.error("Erro ao carregar corridas:", error);
    alert("Erro ao carregar corridas. Tente novamente mais tarde.");
  }
}

// -------------------- CONFIGURAÇÃO DA BARRA DE PESQUISA --------------------
function configurarBarraDePesquisa() {
  const searchBar = document.getElementById("search-bar");
  searchBar.addEventListener("input", filtrarCorridas);
}

function filtrarCorridas() {
  const filtro = document.getElementById("search-bar").value.toLowerCase();
  const tabela = document.getElementById("corridas-list");
  tabela.innerHTML = "";

  const corridasFiltradas = todasCorridas.filter((corrida) =>
    corrida.NOME_EVENTO.toLowerCase().includes(filtro)
  );

  // Atualiza a tabela com corridas filtradas
  corridasFiltradas.forEach((corrida) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${formatarDataParaBR(corrida.DATA)}</td>
            <td>${corrida.NOME_EVENTO}</td>
            <td>${corrida.LOCAL}</td>
            <td>${corrida.PERIODO}</td>
            <td>${corrida.PUBLICO}</td>
            <td>${corrida.MEDALHA}</td>
            <td>${corrida.TIPO}</td>
            <td><a href="${corrida.SITE}" target="_blank">Saiba Mais</a></td>
        `;
    row.addEventListener("click", () => {
      if (corrida.LAT && corrida.LONG) {
        const latitude = parseFloat(corrida.LAT);
        const longitude = parseFloat(corrida.LONG);
        map.setView([latitude, longitude], 14); // Centraliza no ponto filtrado
      }
    });
    tabela.appendChild(row);
  });

  if (corridasFiltradas.length === 0) {
    tabela.innerHTML = `<tr><td colspan="8">Nenhuma corrida encontrada.</td></tr>`;
  }
}

// -------------------- LOGIN --------------------
function configurarLogin() {
  document
    .getElementById("login-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault(); // Evita o recarregamento da página

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("http://localhost:3000/login", {
          //(AJUSTAR QUANDO FOR LANÇAR*******)
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro na resposta do servidor:", errorText);
          alert(errorText || "Erro desconhecido ao fazer login.");
          return;
        }

        const data = await response.json(); // Converte para JSON

        if (response.ok) {
          console.log("Dados do servidor:", data);
          window.location.href = "http://127.0.0.1:5500/public/db_edit.html"; //(AJUSTAR QUANDO FOR LANÇAR*******)
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Resposta inválida do servidor:", error);
        alert("Erro inesperado no servidor. Tente novamente mais tarde.");
        return;
      }
    });
}

// -------------------- LISTAGEM PRIVADA PARA EDIÇÃO --------------------
let editandoId = null;

// Função para exibir o modal
function abrirModal(titulo, dados = {}) {
  document.getElementById("modal-title").innerText = titulo;
  document.getElementById("corrida-nome").value = dados.NOME_EVENTO || "";
  document.getElementById("corrida-data").value = dados.DATA || "";
  document.getElementById("corrida-local").value = dados.LOCAL || "";
  document.getElementById("corrida-lat").value = dados.LAT || "";
  document.getElementById("corrida-long").value = dados.LONG || "";
  document.getElementById("corrida-periodo").value = dados.PERIODO || "Manhã";
  document.getElementById("corrida-publico").value = dados.PUBLICO || "Adulto";
  document.getElementById("corrida-publico").value = dados.MEDALHA || "Sim";
  document.getElementById("corrida-tipo").value = dados.TIPO || "";
  document.getElementById("corrida-site").value = dados.SITE || "";

  document.getElementById("corrida-modal").style.display = "block";
  editandoId = dados._id || null; // Salva o ID para edição
}

document.addEventListener("DOMContentLoaded", function () {
  const closeButton = document.querySelector(".close");
  if (closeButton) {
    closeButton.addEventListener("click", fecharModal);
  }
});

window.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal")) {
    fecharModal();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const salvarCorridaBtn = document.getElementById("salvar-corrida");
  if (salvarCorridaBtn) {
    salvarCorridaBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      console.log("Botão salvar clicado!");
      await salvarCorrida();
    });
  } else {
    console.error("Botão 'salvar-corrida' não encontrado no DOM.");
  }
});

// Função para renderizar corridas na lista
function renderizarCorridas(corridas) {
  const listaCorridas = document.getElementById("listaCorridas");
  if (!listaCorridas) {
    console.error("Elemento #listaCorridas não encontrado no HTML!");
    return;
  }

  listaCorridas.innerHTML = ""; // Limpa a lista antes de adicionar os eventos
  corridas.sort((a, b) => new Date(a.DATA) - new Date(b.DATA)); // Exibe em ordem crescente de eventos

  corridas.forEach((corrida) => {
    const item = document.createElement("li");
    item.innerHTML = `
            <strong>${corrida.NOME_EVENTO}</strong><br>
            Data: ${formatarDataParaBR(corrida.DATA)}<br>
            Local: ${corrida.LOCAL}<br>
            Período: ${corrida.PERIODO}<br>
            <button onclick="excluirCorrida('${
              corrida._id
            }')">🗑 Excluir</button>
            <hr>
        `;
    listaCorridas.appendChild(item);
  });

  console.log("Corridas renderizadas na página.");
}

// Função para carregar todas as corridas
async function carregarCorridas() {
  try {
      const resposta = await fetch("http://localhost:3000/corridas");
      if (!resposta.ok) throw new Error("Erro ao buscar corridas");

      let corridas = await resposta.json();

      corridas.sort((a, b) => new Date(a.DATA) - new Date(b.DATA));

      const tabela = document.querySelector("#tabelaCorridas tbody");
      tabela.innerHTML = ""; // Limpa tabela

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

async function carregarCorridasIndex() {
    const resposta = await fetch("http://localhost:3000/corridas");
    const corridas = await resposta.json();
  
    // Ordena por data crescente
    corridas.sort((a, b) => new Date(a.DATA) - new Date(b.DATA));
  
    const tbody = document.getElementById("corridas-list");
    if (!tbody) return; 
  
    tbody.innerHTML = "";
  
    corridas.forEach(corrida => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatarDataParaBR(corrida.DATA)}</td>
        <td>${corrida.NOME_EVENTO}</td>
        <td>${corrida.LOCAL}</td>
        <td>${corrida.PERIODO}</td>
        <td>${
          corrida.PUBLICO === "Adulto e Infantil"
            ? "🧍🧒"
            : corrida.PUBLICO === "Infantil"
            ? "🧒"
            : "🧍"
        }</td>
        <td>${
          corrida.MEDALHA === "Sim"
            ? "🏅"
            : "❌"
        }</td>        
        <td>${corrida.TIPO}</td>
        <td><a href="${corrida.SITE}" target="_blank">Saiba Mais</a></td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  window.onload = carregarCorridasIndex;
  
// Função para excluir uma corrida
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

    if (!response.ok) {
      throw new Error("Erro ao excluir corrida");
    }

    console.log("Corrida excluída com sucesso!");
    await carregarCorridas(); // Atualiza a lista de corridas após exclusão
  } catch (error) {
    console.error("Erro ao excluir corrida:", error);
  }
}

// Abrir modal para adicionar nova corrida
function abrirModalAdicionar() {
  document.getElementById("modal-title").innerText = "Adicionar Nova Corrida";
  document.getElementById("corrida-id").value = "";
  document.getElementById("corrida-nome").value = "";
  document.getElementById("corrida-data").value = "";
  document.getElementById("corrida-local").value = "";
  document.getElementById("corrida-periodo").value = "Manhã";
  document.getElementById("corrida-publico").value = "Adulto";
  document.getElementById("corrida-medalha").value = "Sim";
  document.getElementById("corrida-site").value = "";
  document.getElementById("corrida-lat").value = "";
  document.getElementById("corrida-long").value = "";
  document.getElementById("corrida-tipo").value = "";
  document.getElementById("excluir-corrida").style.display = "none";

  document.getElementById("corrida-modal").style.display = "block";
}

// Abrir modal para editar corrida existente
async function abrirModalEditar(id) {
  document.getElementById("corrida-id").value = id; // Armazena o ID no campo oculto
  console.log(`Rota /corridas/${id} chamada com ID: ${id}`);
  try {
    const resposta = await fetch(`http://localhost:3000/corridas/${id}`); //(AJUSTAR QUANDO FOR LANÇAR*******)
    if (!resposta.ok) throw new Error("Erro ao buscar detalhes da corrida");

    const corrida = await resposta.json();
    document.getElementById("modal-title").innerText = "Editar Corrida";
    document.getElementById("corrida-id").value = corrida._id;
    document.getElementById("corrida-nome").value = corrida.NOME_EVENTO;
    document.getElementById("corrida-data").value = corrida.DATA
      ? corrida.DATA.split("T")[0]
      : "";
    document.getElementById("corrida-local").value = corrida.LOCAL;
    document.getElementById("corrida-periodo").value = corrida.PERIODO;
    document.getElementById("corrida-publico").value = corrida.PUBLICO;
    document.getElementById("corrida-medalha").value = corrida.MEDALHA;
    document.getElementById("corrida-site").value = corrida.SITE;
    document.getElementById("corrida-lat").value = corrida.LAT || "";
    document.getElementById("corrida-long").value = corrida.LONG || "";
    document.getElementById("corrida-tipo").value = corrida.TIPO || "";
    document.getElementById("excluir-corrida").style.display = "inline-block";

    document.getElementById("corrida-modal").style.display = "block";
  } catch (error) {
    console.error("Erro ao carregar corrida para edição:", error);
    alert("Erro ao carregar detalhes da corrida.");
  }
}

// Fechar modal
function fecharModal() {
  document.getElementById("corrida-modal").style.display = "none";
}

// Converte dd/mm/aaaa -> yyyy-mm-dd (se vier de input customizado)
function formatarDataParaBR(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

// Salvar ou editar corrida
async function salvarCorrida() {
  const id = document.getElementById("corrida-id").value;
  const lat = document.getElementById("corrida-lat").value.trim();
  const long = document.getElementById("corrida-long").value.trim();
  const dataBr = document.getElementById("corrida-data").value;

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
    ? `http://localhost:3000/corridas/${id}` //(AJUSTAR QUANDO FOR LANÇAR*******)
    : `http://localhost:3000/corridas`; //(AJUSTAR QUANDO FOR LANÇAR*******)

  const metodo = id ? "PUT" : "POST";

  try {
    console.log(`Enviando requisição ${metodo} para ${url}`);

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

// Carregar as corridas ao inicializar a página
document.addEventListener("DOMContentLoaded", carregarCorridas);
