// main.js - Funções públicas usadas em index.html

// Inicialização

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

  if (document.getElementById("search-bar")) {
    configurarBarraDePesquisa();
  }
});

// Carrossel ------------------------------------

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

// Banners do carrossel ---------------------------

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".carousel-container")) {
    carregarBannersCarrossel();
  }
});

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
    iniciarCarrossel();
  } catch (error) {
    console.error("Erro ao carregar banners no carrossel:", error);
    container.innerHTML = `<p>Erro ao carregar imagens do carrossel.</p>`;
  }
}

// Corridas Públicas -----------------------------

let todasCorridas = [];
let quantidadeExibida = 10;
let map;

async function carregarCorridasPublicas() {
  const tabela = document.getElementById("corridas-list");
  if (!tabela) return;

  try {
    const response = await fetch("http://localhost:3000/corridas");
    const data = await response.json();
    todasCorridas = data;
    renderizarCorridas();

    if (!map) {
      map = L.map("map").setView([-23.55052, -46.633308], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
    }

    const markers = L.markerClusterGroup();

    data.forEach(corrida => {
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

function renderizarCorridas() {
  const tabela = document.getElementById("corridas-list");
  if (!tabela) return;

  tabela.innerHTML = "";
  const exibidas = todasCorridas.slice(0, quantidadeExibida);

  exibidas.forEach((corrida) => {
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
  });
}

function atualizarQuantidadeExibida() {
  const select = document.getElementById("entries");
  quantidadeExibida = parseInt(select.value);
  renderizarCorridas();
}

// Barra de pesquisa -----------------------------

function configurarBarraDePesquisa() {
  const searchBar = document.getElementById("search-bar");
  searchBar.addEventListener("input", filtrarCorridas);
}

function filtrarCorridas() {
  const filtro = document.getElementById("search-bar").value.toLowerCase();
  const tabela = document.getElementById("corridas-list");
  const limite = parseInt(document.getElementById("entries").value) || 9999;
  tabela.innerHTML = "";

  const corridasFiltradas = todasCorridas
    .filter(c => c.NOME_EVENTO.toLowerCase().includes(filtro))
    .slice(0, limite);

  corridasFiltradas.forEach(corrida => {
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
        map.setView([latitude, longitude], 14);
      }
    });
    tabela.appendChild(row);
  });

  if (corridasFiltradas.length === 0) {
    tabela.innerHTML = `<tr><td colspan="8">Nenhuma corrida encontrada.</td></tr>`;
  }
}

// Login ------------------------------------------

function configurarLogin() {
  document.getElementById("login-form")?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("http://localhost:3000/login", {
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

      const data = await response.json();
      console.log("Dados do servidor:", data);
      window.location.href = "http://127.0.0.1:5500/public/db_edit.html";

    } catch (error) {
      console.error("Erro inesperado no servidor:", error);
      alert("Erro inesperado. Tente novamente mais tarde.");
    }
  });
}

function formatarDataParaBR(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}