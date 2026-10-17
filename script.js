const API_URL = 'https://ghibliapi.vercel.app/films';
const container = document.getElementById('filmes-container');
const statusDiv = document.getElementById('status');
const inputBusca = document.getElementById('busca');
const modal = document.getElementById('modal');
const fecharModal = document.querySelector('.fechar');

let filmes = [];
let filmeAtualId = null; // Variável para guardar o filme aberto no modal

function getImageUrl(titulo) {
  const nomeArquivo = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
  return `img/${nomeArquivo}.jpg`;
}

function renderizarFilmes(lista) {
  if (lista.length === 0) {
    container.innerHTML = '';
    statusDiv.textContent = 'Nenhum filme encontrado.';
    return;
  }
  statusDiv.textContent = '';
  container.innerHTML = lista.map(filme => {
    const imgSrc = getImageUrl(filme.title);
    return `
      <div class="card" data-id="${filme.id}">
        <img src="${imgSrc}" alt="${filme.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${filme.id}/300/450'">
        <div class="card-info">
          <h3>${filme.title}</h3>
          <p>${filme.director} • ${filme.release_date}</p>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const filme = filmes.find(f => f.id === card.dataset.id);
      if (filme) abrirModal(filme);
    });
  });
}

function abrirModal(filme) {
  filmeAtualId = filme.id; // Guarda o ID atual
  document.getElementById('modal-titulo').textContent = filme.title;
  document.getElementById('modal-diretor').textContent = filme.director;
  document.getElementById('modal-roteirista').textContent = filme.producer || 'Não informado';
  document.getElementById('modal-ano').textContent = filme.release_date;
  document.getElementById('modal-sinopse').textContent = filme.description || 'Sinopse não disponível.';
  modal.style.display = 'flex';
}

function fecharModalHandler() {
  modal.style.display = 'none';
}

async function carregarFilmes() {
  try {
    statusDiv.textContent = 'Carregando filmes...';
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
    filmes = await resposta.json();
    filmes.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    renderizarFilmes(filmes);
  } catch (erro) {
    console.error(erro);
    statusDiv.textContent = 'Não foi possível carregar os filmes. Tente novamente mais tarde.';
    container.innerHTML = '';
  }
}

function filtrarFilmes(termo) {
  if (!termo.trim()) { renderizarFilmes(filmes); return; }
  const filtrados = filmes.filter(f => f.title.toLowerCase().includes(termo.toLowerCase()));
  renderizarFilmes(filtrados);
}

// --- LÓGICA DE FAVORITOS ---

window.addEventListener("supabase-ready", async () => {
  await carregarFavoritos();
});

async function carregarFavoritos() {
  const containerFavoritos = document.getElementById("favoritos-container");
  containerFavoritos.innerHTML = "<p>Carregando favoritos...</p>";

  const favoritos = await window.supabaseHelpers.listarFavoritos();

  if (favoritos.length === 0) {
    containerFavoritos.innerHTML = "<p>Nenhum filme favoritado ainda.</p>";
    return;
  }

  containerFavoritos.innerHTML = favoritos.map(fav => `
    <div class="favorito-item">
      <span>${fav.titulo_filme}</span>
      <button class="btn-remover" data-id="${fav.id}">Excluir</button>
    </div>
  `).join("");

  containerFavoritos.querySelectorAll(".btn-remover").forEach(btn => {
    btn.addEventListener("click", async () => {
      await window.supabaseHelpers.removerFavorito(btn.dataset.id);
      await carregarFavoritos();
    });
  });
}

async function favoritarFilmeAtual() {
  const filme = filmes.find(f => f.id === filmeAtualId);
  if (!filme) return;

  const btn = document.getElementById("btn-favoritar");
  btn.textContent = "Salvando...";
  btn.disabled = true;

  const sucesso = await window.supabaseHelpers.salvarFavorito(
    filme.title,
    { ghibli_id: filme.id, director: filme.director }
  );

  if (sucesso) {
    await carregarFavoritos();
    alert("Filme adicionado aos favoritos!");
    fecharModalHandler(); // Fecha o modal após salvar
  } else {
    alert("Erro ao salvar favorito. Verifique as configurações do Supabase.");
  }

  btn.textContent = "❤️ Adicionar aos Favoritos";
  btn.disabled = false;
}

// Event Listeners
inputBusca.addEventListener('input', (e) => filtrarFilmes(e.target.value));
document.getElementById('btn-favoritar').addEventListener('click', favoritarFilmeAtual);
fecharModal.addEventListener('click', fecharModalHandler);
modal.addEventListener('click', (e) => { if (e.target === modal) fecharModalHandler(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModalHandler(); });

// Inicialização
carregarFilmes();
