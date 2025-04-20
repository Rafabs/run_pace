document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3000/api/banners";
  const form = document.getElementById("form-banner");
  const input = document.getElementById("banner-input");
  const bannerList = document.getElementById("banner-list");

  if (form && input) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const file = input.files[0];
      const altText = document.getElementById("banner-alt").value.trim();
      const linkUrl = document.getElementById("banner-link").value.trim();

      if (!file || !altText || !linkUrl) return alert("Preencha todos os campos.");

      const formData = new FormData();
      formData.append("imagem", file);
      formData.append("alt", altText);
      formData.append("link", linkUrl); 

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        if (!response.ok) throw new Error("Erro ao enviar imagem");
        alert("Banner enviado com sucesso!");
        input.value = "";
        document.getElementById("banner-alt").value = "";
        document.getElementById("banner-link").value = "";
        carregarBanners();
      } catch (err) {
        console.error("Erro ao enviar:", err);
        alert("Falha ao enviar banner.");
      }
    });
  }

  async function carregarBanners() {
    const bannerList = document.getElementById("banner-list");
  
    if (!bannerList) return;
  
    try {
      const response = await fetch("http://localhost:3000/api/banners");
      const banners = await response.json();
  
      bannerList.innerHTML = "";
  
      banners.forEach((banner) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <a href="${banner.link}" target="_blank">
            <img src="http://localhost:3000${banner.url}" alt="${banner.alt}">
          </a>
          <p>${banner.alt}</p>
          <p>${banner.link}</p>
          <button class="btn-excluir" data-id="${banner._id}">Excluir</button>
        `;
        bannerList.appendChild(li);
  
        const excluirBtn = li.querySelector(".btn-excluir");
        excluirBtn.addEventListener("click", async () => {
          const confirmar = confirm("Tem certeza que deseja excluir este banner?");
          if (!confirmar) return;
  
          try {
            const res = await fetch(`http://localhost:3000/api/banners/${banner._id}`, {
              method: "DELETE",
            });
            if (!res.ok) throw new Error("Erro ao excluir");
            alert("Banner excluído com sucesso!");
            carregarBanners();
          } catch (err) {
            console.error("Erro ao excluir banner:", err);
            alert(`Erro ao excluir banner: ${err.message}`);
          }
        });
      });
    } catch (err) {
      console.error("Erro ao carregar banners:", err);
    }
  }  

  carregarBanners();
});