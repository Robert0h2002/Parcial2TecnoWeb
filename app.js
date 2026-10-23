 
const API_KEY = 'ade1706c651735f930986e8e948a5214'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');


// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();


// ############################################################################
// #                                                                          #
// #                          TU CÓDIGO AQUÍ                    #
// #                                                                          #
// ############################################################################

const obtenerSeries = async () => {
    const url = `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`HTTP error! status: ${respuesta.status}`);
    }
    const datos = await respuesta.json();
    return datos.results;
};

const crearTarjeta = (serie) => {
    const { id, name, first_air_date, vote_average, poster_path } = serie;
    const año = first_air_date ? first_air_date.split('-')[0] : 'N/A';
    const imagen = poster_path ? `${IMAGE_URL}${poster_path}` : '';
    const rating = vote_average ? vote_average.toFixed(1) : 'N/A';
    return `
        <article class="serie-card" data-id="${id}">
            <div class="serie-card__poster">
                <img class="serie-card__image" src="${imagen}" alt="${name}">
                <span class="serie-card__rating">⭐ ${rating}</span>
            </div>
            <div class="serie-card__content">
                <h3 class="serie-card__title">${name}</h3>
                <p class="serie-card__year">📅 ${año}</p>
            </div>
        </article>
    `;
};

const mostrarSeries = (series) => {
    seriesGrid.innerHTML = series.map(crearTarjeta).join('');
    resultsCount.textContent = `${series.length} resultados`;
};

const manejarError = (error) => {
    console.error('❌ Error:', error.message);
    if (error.message.includes('401')) {
        mostrarError('API Key inválida');
    } else {
        mostrarError('Error de conexión');
    }
};

const iniciar = async () => {
    try {
        mostrarLoading();
        const series = await obtenerSeries();
        ocultarLoading();
        resultsTitle.textContent = 'Series Populares';
        mostrarSeries(series);
    } catch (error) {
        manejarError(error);
    }
};

iniciar();

const buscarSeries = async (texto) => {
    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(texto)}&language=es-ES`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`HTTP error! status: ${respuesta.status}`);
    }
    const datos = await respuesta.json();
    return datos.results;
};

let timeout;

searchInput.addEventListener('input', () => {
    clearTimeout(timeout);
    const texto = searchInput.value.trim();
    timeout = setTimeout(async () => {
        if (texto === '') {
            iniciar();
            return;
        }
        try {
            mostrarLoading();
            const series = await buscarSeries(texto);
            ocultarLoading();
            resultsTitle.textContent = `Resultados para "${texto}"`;
            mostrarSeries(series);
        } catch (error) {
            manejarError(error);
        }
    }, 500);
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    iniciar();
});

const obtenerDetalle = async (id) => {
    const url = `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`HTTP error! status: ${respuesta.status}`);
    }
    const datos = await respuesta.json();
    return datos;
};

const mostrarDetalle = (serie) => {
    const { name, first_air_date, overview, number_of_seasons, number_of_episodes, genres, status } = serie;
    const año = first_air_date ? first_air_date.split('-')[0] : 'N/A';
    const generos = genres.map((genero) => genero.name).join(', ');
    modalBody.innerHTML = `
        <h2 class="modal__title">${name}</h2>
        <p class="modal__subtitle">📅 ${año}</p>
        <div class="modal__info">
            <span>📺 ${number_of_seasons} temporadas</span>
            <span>🎬 ${number_of_episodes} episodios</span>
            <span>📌 ${status}</span>
        </div>
        <p><strong>Géneros:</strong> ${generos || 'N/A'}</p>
        <p class="modal__overview">${overview || 'Sin sinopsis disponible'}</p>
    `;
    modal.classList.add('modal--show');
};

const cerrarModal = () => {
    modal.classList.remove('modal--show');
};

seriesGrid.addEventListener('click', async (event) => {
    const tarjeta = event.target.closest('.serie-card');
    if (!tarjeta) return;
    try {
        const serie = await obtenerDetalle(tarjeta.dataset.id);
        mostrarDetalle(serie);
    } catch (error) {
        manejarError(error);
    }
});

modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);

retryBtn.addEventListener('click', iniciar);
