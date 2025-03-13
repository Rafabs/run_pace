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