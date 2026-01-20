import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://qozzxdrjwjskmwmxscqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvenp4ZHJqd2pza213bXhzY3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODkyNjgsImV4cCI6MjA4MTU2NTI2OH0.3C_4cTXacx0Gf8eRtBYp2uaNZ61OE4SEEOUTDSW4P98'
const supabase = createClient(supabaseUrl, supabaseKey)

const params = new URLSearchParams(window.location.search)
const clienteId = params.get('cliente')

const mainMenu = document.getElementById('mainMenu')
const chipsTrack = document.getElementById('categoryChips')
const searchInput = document.getElementById('searchInput')
const clearSearch = document.getElementById('clearSearch')

const modal = document.getElementById('dishModal')
const modalTitle = document.getElementById('modalTitle')
const modalPrice = document.getElementById('modalPrice')
const modalDesc = document.getElementById('modalDesc')
const modalAllergens = document.getElementById('modalAllergens')

let CATEGORIAS = []
let PLATOS = []
let activeCategoryId = 'all'
let currentQuery = ''

function normalize(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function formatPrice(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return `${n.toFixed(2)}€`
}

function safeText(s) {
  return (s ?? '').toString()
}

function setLoading(state) {
  if (!state) return
  mainMenu.innerHTML = '<div class="loading">Cargando carta...</div>'
}

function setError(msg) {
  mainMenu.innerHTML = `<div class="empty-message">${msg}</div>`
}

function buildChip({ id, label, active = false, skeleton = false }) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = `chip${active ? ' chip--active' : ''}${skeleton ? ' chip--skeleton' : ''}`
  btn.textContent = label
  if (!skeleton) {
    btn.dataset.categoryId = id
    btn.addEventListener('click', () => {
      activeCategoryId = id
      highlightActiveChip()
      scrollToCategory(id)
      // si hay búsqueda activa, mantenemos filtrado
      renderMenu()
    })
  }
  return btn
}

function highlightActiveChip() {
  document.querySelectorAll('.chip[data-category-id]').forEach(chip => {
    const isActive = chip.dataset.categoryId === activeCategoryId
    chip.classList.toggle('chip--active', isActive)
    chip.setAttribute('aria-current', isActive ? 'true' : 'false')
  })
}

function scrollToCategory(id) {
  if (id === 'all') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const el = document.getElementById(`cat-${id}`)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 16
  window.scrollTo({ top: y, behavior: 'smooth' })
}

function openModal(plato) {
  modalTitle.textContent = safeText(plato.plato)
  modalPrice.textContent = plato.precio ? formatPrice(plato.precio) : ''
  modalDesc.textContent = safeText(plato.descripcion)

  modalAllergens.innerHTML = ''
  const alergs = Array.isArray(plato.alergenos) ? plato.alergenos : []
  if (alergs.length === 0) {
    modalAllergens.innerHTML = '<span class="tag">Sin alérgenos</span>'
  } else {
    alergs.forEach(a => {
      const img = document.createElement('img')
      img.src = `alergenos/${a}.svg`
      img.alt = a
      img.title = a.replace('_', ' ')
      modalAllergens.appendChild(img)
    })
  }

  modal.classList.add('modal--open')
  modal.setAttribute('aria-hidden', 'false')
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  modal.classList.remove('modal--open')
  modal.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
}

modal.addEventListener('click', (e) => {
  const target = e.target
  if (target?.dataset?.close === 'true') closeModal()
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
    closeModal()
  }
})

function passesSearch(plato, qNorm) {
  if (!qNorm) return true
  const name = normalize(plato.plato)
  const desc = normalize(plato.descripcion)
  return name.includes(qNorm) || desc.includes(qNorm)
}

function getVisibleCategorias() {
  const qNorm = normalize(currentQuery)

  // Filtrado por categoría activa + búsqueda
  if (activeCategoryId !== 'all') {
    const cat = CATEGORIAS.find(c => String(c.id) === String(activeCategoryId))
    if (!cat) return []
    const platosCat = PLATOS.filter(p => String(p.categoria_id) === String(cat.id))
      .filter(p => passesSearch(p, qNorm))

    return platosCat.length ? [{ ...cat, __platos: platosCat }] : []
  }

  // Todas: solo categorías que tengan platos (y que pasen búsqueda)
  return CATEGORIAS
    .map(cat => {
      const platosCat = PLATOS.filter(p => String(p.categoria_id) === String(cat.id))
        .filter(p => passesSearch(p, qNorm))
      return { ...cat, __platos: platosCat }
    })
    .filter(cat => cat.__platos && cat.__platos.length)
}

function renderChips() {
  chipsTrack.innerHTML = ''

  chipsTrack.appendChild(buildChip({ id: 'all', label: 'Todo', active: activeCategoryId === 'all' }))

  CATEGORIAS.forEach(cat => {
    const hasPlatos = PLATOS.some(p => String(p.categoria_id) === String(cat.id))
    if (!hasPlatos) return
    chipsTrack.appendChild(buildChip({ id: String(cat.id), label: cat.nombre, active: String(cat.id) === String(activeCategoryId) }))
  })

  highlightActiveChip()
}

function renderMenu() {
  const visibleCats = getVisibleCategorias()

  mainMenu.innerHTML = ''

  if (!visibleCats.length) {
    if (!CATEGORIAS.length) {
      mainMenu.innerHTML = '<div class="empty-message">Esta carta aún no tiene contenido.</div>'
    } else {
      mainMenu.innerHTML = '<div class="empty-message">No hay resultados con ese filtro.</div>'
    }
    return
  }

  visibleCats.forEach(cat => {
    const section = document.createElement('section')
    section.className = 'menu-section'
    section.id = `cat-${cat.id}`

    const h2 = document.createElement('h2')
    h2.className = 'section-title'
    h2.textContent = cat.nombre

    const list = document.createElement('div')
    list.className = 'dish-list'

    cat.__platos.forEach(plato => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'dish-card'
      btn.addEventListener('click', () => openModal(plato))

      const left = document.createElement('div')
      left.className = 'dish-card__left'

      const name = document.createElement('div')
      name.className = 'dish-card__name'
      name.textContent = plato.plato

      const desc = document.createElement('div')
      desc.className = 'dish-card__desc'
      desc.textContent = plato.descripcion || ''

      left.appendChild(name)
      if (plato.descripcion) left.appendChild(desc)

      const right = document.createElement('div')
      right.className = 'dish-card__right'

      const price = document.createElement('div')
      price.className = 'dish-card__price'
      price.textContent = plato.precio ? formatPrice(plato.precio) : ''

      const allergens = document.createElement('div')
      allergens.className = 'dish-card__allergens'

      const alergs = Array.isArray(plato.alergenos) ? plato.alergenos : []
      alergs.slice(0, 6).forEach(a => {
        const img = document.createElement('img')
        img.src = `alergenos/${a}.svg`
        img.alt = a
        img.title = a.replace('_', ' ')
        allergens.appendChild(img)
      })

      right.appendChild(allergens)
      right.appendChild(price)

      btn.appendChild(left)
      btn.appendChild(right)

      list.appendChild(btn)
    })

    section.appendChild(h2)
    section.appendChild(list)
    mainMenu.appendChild(section)
  })
}

function wireSearch() {
  clearSearch.addEventListener('click', () => {
    searchInput.value = ''
    currentQuery = ''
    clearSearch.disabled = true
    renderMenu()
  })

  const onInput = () => {
    currentQuery = searchInput.value
    clearSearch.disabled = !currentQuery
    renderMenu()
  }

  searchInput.addEventListener('input', onInput)
  clearSearch.disabled = true
}

async function cargarCarta() {
  setLoading(true)

  if (!clienteId) {
    setError('URL inválida. Falta el parámetro "cliente".')
    return
  }

  try {
    const { data: categorias, error: catError } = await supabase
      .from('Categorias')
      .select('*')
      .eq('user_id', clienteId)
      .eq('activa', true)
      .order('orden', { ascending: true })

    if (catError) throw catError

    const { data: platos, error: platosError } = await supabase
      .from('Menu')
      .select('*')
      .eq('user_id', clienteId)
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (platosError) throw platosError

    CATEGORIAS = Array.isArray(categorias) ? categorias : []
    PLATOS = Array.isArray(platos) ? platos : []

    // Pintar chips + menu
    renderChips()
    renderMenu()

    // Resaltar chip activo al hacer scroll (ligero)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (!visible.length) return
        // el más alto (arriba)
        const top = visible.sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        const id = top.target.id?.replace('cat-', '')
        if (id && activeCategoryId === 'all') {
          // solo auto-resaltar cuando estás en modo "Todo"
          document.querySelectorAll('.chip').forEach(ch => ch.classList.remove('chip--active'))
          const chip = document.querySelector(`.chip[data-category-id="${id}"]`)
          if (chip) chip.classList.add('chip--active')
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0.01 }
    )

    document.querySelectorAll('.menu-section').forEach(sec => observer.observe(sec))

  } catch (error) {
    console.error('Error cargando carta:', error)
    setError(`Error al cargar la carta: ${error.message}`)
  }
}

wireSearch()

if (clienteId) {
  cargarCarta()
} else {
  setError('URL inválida. Agrega ?cliente=TU_USER_ID a la URL')
}
