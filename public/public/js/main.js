document.addEventListener("DOMContentLoaded", function () {
    iniciarCarrossel();
    
    if (document.getElementById("corridas-list")) {
        carregarCorridasPublicas();
    }

    if (document.getElementById("login-form")) {
        configurarLogin();
    }

    if (document.getElementById("corridas-container")) {
        carregarCorridasPrivadas();
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

    slideInterval = setInterval(nextSlide, 3000);
    showSlide(currentSlide);

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

// -------------------- LISTAGEM PÚBLICA DE CORRIDAS --------------------
let map = null; // Mapa global

async function carregarCorridasPublicas() {
    try {
        const response = await fetch('http://localhost:3000/corridas');
        if (!response.ok) throw new Error("Erro ao carregar os dados");

        const data = await response.json();
        console.log(data);

        const tabela = document.getElementById('corridas-list');
        tabela.innerHTML = '';

        // Inicializa o mapa apenas uma vez
        if (!map) {
            map = L.map('map').setView([-23.55052, -46.633308], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
        }

        data.forEach(corrida => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${corrida.DATA}</td>
                <td>${corrida.NOME_EVENTO}</td>
                <td>${corrida.LOCAL}</td>
                <td>${corrida.PERIODO}</td>
                <td><a href="${corrida.SITE}" target="_blank">Saiba Mais</a></td>
            `;
            tabela.appendChild(row);

            if (corrida.LAT && corrida.LONG) {
                const latitude = parseFloat(corrida.LAT);
                const longitude = parseFloat(corrida.LONG);
                const marker = L.marker([latitude, longitude]).addTo(map);
                marker.bindPopup(`
                    <strong>${corrida.NOME_EVENTO}</strong><br>
                    📍 ${corrida.LOCAL}<br>
                    🗓 ${corrida.DATA} - ${corrida.PERIODO}<br>
                    <a href="${corrida.SITE}" target="_blank">Saiba Mais</a>
                `);
            }
        });

    } catch (error) {
        console.error('Erro ao buscar corridas:', error);
        alert("Erro ao carregar corridas. Tente novamente mais tarde.");
    }
}

// -------------------- LOGIN --------------------
function configurarLogin() {
    document.getElementById("login-form").addEventListener("submit", async function(event) {
        event.preventDefault(); // Evita o recarregamento da página
    
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
    
        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
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
                window.location.href = "http://127.0.0.1:5500/public/db_edit.html";
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
    document.getElementById("corrida-periodo").value = dados.PERIODO || "Manhã";
    document.getElementById("corrida-site").value = dados.SITE || "";

    document.getElementById("corrida-modal").style.display = "block";
    editandoId = dados._id || null;
}

// Fechar o modal ao clicar no "X"
document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("corrida-modal").style.display = "none";
});

// Fechar ao clicar fora do modal
window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
        document.getElementById("corrida-modal").style.display = "none";
    }
});

// Função para adicionar/editar corrida
document.getElementById("salvar-corrida").addEventListener("click", async () => {
    const nome = document.getElementById("corrida-nome").value;
    const data = document.getElementById("corrida-data").value;
    const local = document.getElementById("corrida-local").value;
    const periodo = document.getElementById("corrida-periodo").value;
    const site = document.getElementById("corrida-site").value;

    if (!nome || !data || !local || !site) {
        alert("Todos os campos são obrigatórios!");
        return;
    }

    const corrida = { NOME_EVENTO: nome, DATA: data, LOCAL: local, PERIODO: periodo, SITE: site };

    try {
        const url = editandoId ? `http://localhost:3000/corridas/${editandoId}` : "http://localhost:3000/corridas";
        const method = editandoId ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corrida)
        });

        if (response.ok) {
            document.getElementById("corrida-modal").style.display = "none";
            carregarCorridasPrivadas();
        } else {
            throw new Error("Erro ao salvar corrida.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar corrida.");
    }
});

// Atualizar botões na listagem privada
async function carregarCorridasPrivadas() {
    try {
        const response = await fetch("http://localhost:3000/corridas");
        if (!response.ok) throw new Error("Erro ao buscar dados");

        const data = await response.json();
        const container = document.getElementById("corridas-container");
        container.innerHTML = "";

        // Botão global para adicionar nova corrida
        const addButton = document.createElement("button");
        addButton.innerText = "Adicionar Nova Corrida";
        addButton.onclick = () => abrirModal("Adicionar Corrida");
        container.appendChild(addButton);

        data.forEach(corrida => {
            const div = document.createElement("div");
            div.innerHTML = `
                <p>${corrida.NOME_EVENTO} - ${corrida.DATA}</p>
                <button onclick="abrirModal('Editar Corrida', ${JSON.stringify(corrida)})">Editar</button>
                <button onclick="deletarCorrida('${corrida._id}')">Excluir</button>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao carregar corridas privadas:", error);
        alert("Erro ao carregar corridas para edição.");
    }
}

async function deletarCorrida(id) {
    if (!confirm("Tem certeza que deseja excluir?")) return;

    try {
        const response = await fetch(`http://localhost:3000/corridas/${id}`, { method: "DELETE" });
        if (response.ok) {
            carregarCorridasPrivadas();
        } else {
            throw new Error("Erro ao excluir corrida.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro ao excluir corrida.");
    }
}