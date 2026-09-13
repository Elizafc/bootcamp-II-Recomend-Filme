// URL da API
const API_URL = 'https://ghibliapi.vercel.app/films';

// Elementos DOM
const container = document.getElementById('filmes-container');
const statusDiv = document.getElementById('status');
const inputBusca = document.getElementById('busca');
const modal = document.getElementById('modal');
const modalTitulo = document.getElementById('modal-titulo');
const modalDiretor = document.getElementById('modal-diretor');
const modalRoteirista = document.getElementById('modal-roteirista');
const modalAno = document.getElementById('modal-ano');
const modalSinopse = document.getElementById('modal-sinopse');
const fecharModal = document.querySelector('.fechar');

// Estado
let filmes = []; // guarda todos os filmes carregados

// Função para construir a URL da imagem (assumindo que as imagens estão na pasta img/)
function getImageUrl(titulo) {
  // Normaliza o título: minúsculo, remove acentos, substitui espaços por hífen
  const nomeArquivo = titulo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9 ]/g, '') // remove caracteres especiais
    .replace(/\s+/g, '-');
  return `img/${nomeArquivo}.jpg`;
}

// Renderiza os cards (recebe uma lista de filmes)
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

  // Adiciona evento de clique em cada card (delegação)
  container.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const filme = filmes.find(f => f.id === id);
      if (filme) abrirModal(filme);
    });
  });
}

// Abre o modal com os detalhes do filme
function abrirModal(filme) {
  modalTitulo.textContent = filme.title;
  modalDiretor.textContent = filme.director;
  modalRoteirista.textContent = filme.producer || 'Não informado';
  modalAno.textContent = filme.release_date;
  modalSinopse.textContent = filme.description || 'Sinopse não disponível.';
  modal.style.display = 'flex';
}

// Fecha o modal
function fecharModalHandler() {
  modal.style.display = 'none';
}

// Carregar dados da API
async function carregarFilmes() {
  try {
    statusDiv.textContent = 'Carregando filmes...';
    const resposta = await fetch(API_URL);
    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }
    filmes = await resposta.json();
    // Ordena por data de lançamento (opcional)
    filmes.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    renderizarFilmes(filmes);
  } catch (erro) {
    console.error(erro);
    statusDiv.textContent = 'Não foi possível carregar os filmes. Tente novamente mais tarde.';
    container.innerHTML = '';
  }
}

// Filtrar filmes pelo título (case insensitive)
function filtrarFilmes(termo) {
  if (!termo.trim()) {
    renderizarFilmes(filmes);
    return;
  }
  const filtrados = filmes.filter(filme =>
    filme.title.toLowerCase().includes(termo.toLowerCase())
  );
  renderizarFilmes(filtrados);
}

// Event Listeners
inputBusca.addEventListener('input', (e) => {
  filtrarFilmes(e.target.value);
});

fecharModal.addEventListener('click', fecharModalHandler);
modal.addEventListener('click', (e) => {
  if (e.target === modal) fecharModalHandler();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModalHandler();
});

// Inicialização
carregarFilmes();
