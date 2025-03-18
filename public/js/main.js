document.addEventListener("DOMContentLoaded", function () {
    const slides = document.querySelectorAll(".carousel-slide");
    const prevButton = document.querySelector(".carousel-prev");
    const nextButton = document.querySelector(".carousel-next");
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? "block" : "none";
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide === 0) ? slides.length - 1 : currentSlide - 1;
        showSlide(currentSlide);
    }

    let slideInterval = setInterval(nextSlide, 3000); // Troca de banner a cada 3 segundos

    showSlide(currentSlide);

    prevButton.addEventListener("click", function () {
        clearInterval(slideInterval); // Para o autoplay ao clicar
        prevSlide();
        slideInterval = setInterval(nextSlide, 3000); // Reinicia o autoplay
    });

    nextButton.addEventListener("click", function () {
        clearInterval(slideInterval); // Para o autoplay ao clicar
        nextSlide();
        slideInterval = setInterval(nextSlide, 3000); // Reinicia o autoplay
    });
});

window.onload = async function() {
    try {
        const response = await fetch('http://localhost:3000/corridas');
        const data = await response.json();

        console.log(data); // Verifica os dados recebidos no console

        // Atualiza a tabela
        const tabela = document.getElementById('corridas-list');
        tabela.innerHTML = ''; // Limpa a tabela antes de preencher

        // Inicializa o mapa centralizado em SP
        const map = L.map('map').setView([-23.55052, -46.633308], 10); 

        // Adiciona um mapa base (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        data.forEach(corrida => {
            // Atualiza a tabela
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${corrida.DATA}</td>
                <td>${corrida.NOME_EVENTO}</td>
                <td>${corrida.LOCAL}</td>
                <td>${corrida.PERIODO}</td>
                <td><a href="${corrida.SITE}" target="_blank">Saiba Mais</a></td>
            `;
            tabela.appendChild(row);

            // Verifica se LAT e LONG existem antes de criar o marcador
            if (corrida.LAT && corrida.LONG) {
                const latitude = parseFloat(corrida.LAT);
                const longitude = parseFloat(corrida.LONG);

                // Adiciona um marcador no mapa
                const marker = L.marker([latitude, longitude]).addTo(map);

                // Adiciona um popup com informações
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
    }
};