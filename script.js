(function(){

  /* ---------------- Config ----------------
     Los bolsos se editan directo en index.html, dentro del bloque
     "EDITA TUS BOLSOS AQUÍ ABAJO" (son etiquetas <div class="producto-dato">
     normales, no código). Este archivo solo las lee y arma la página con
     ellas — normalmente no necesitas abrirlo.
  ------------------------------------------- */
  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='100%' height='100%' fill='#F0EAE0'/><text x='50%' y='50%' font-family='sans-serif' font-size='22' fill='#B8AF9E' text-anchor='middle' dominant-baseline='middle'>Sin foto</text></svg>"
  );

  const CATEGORIES = [
    {id:'hombre', label:'Hombre'},
    {id:'mujer', label:'Mujer'},
    {id:'nina', label:'Niña'},
    {id:'nino', label:'Niño'}
  ];

  // Lee cada <div class="producto-dato"> dentro de #catalogoDatos y arma
  // la lista de bolsos a partir de sus atributos data-* y de su h3/p/img.
  function leerProductos(){
    const bloques = document.querySelectorAll('#catalogoDatos .producto-dato');
    return Array.from(bloques).map(el=>{
      const h3 = el.querySelector('h3');
      const p = el.querySelector('p');
      const img = el.querySelector('img');
      const precioLimpio = (el.dataset.precio || '0').replace(/[^\d]/g,'');
      return {
        id: el.dataset.id || '',
        categoria: (el.dataset.categoria || '').trim().toLowerCase(),
        precio: Number(precioLimpio) || 0,
        disponible: (el.dataset.disponible || '').trim().toLowerCase() === 'true',
        nombre: h3 ? h3.textContent.trim() : '',
        descripcion: p ? p.textContent.trim() : '',
        imagenSrc: img ? img.getAttribute('src') : ''
      };
    });
  }

  function leerWhatsapp(){
    const raw = document.body.dataset.whatsapp || '';
    return raw.replace(/\D/g,'');
  }

  const products = leerProductos();
  const whatsapp = leerWhatsapp();

  function money(n){
    return '$ ' + Number(n).toLocaleString('es-CO');
  }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s){ return escapeHtml(s); }

  // Si la foto no carga (no existe ese archivo todavía), muestra "Sin foto"
  // en vez de un ícono de imagen rota.
  function wireImgFallback(imgEl){
    if(!imgEl) return;
    imgEl.addEventListener('error', function onErr(){
      imgEl.removeEventListener('error', onErr);
      imgEl.src = PLACEHOLDER_IMG;
    });
  }

  /* ---------------- Rendering ---------------- */
  function applyBrandLinks(){
    const brand = document.getElementById('brandName') ? document.getElementById('brandName').textContent.trim() : 'Tienda';
    const footerBrand = document.getElementById('footerBrand');
    if(footerBrand) footerBrand.textContent = brand;
    const waLink = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent('Hola, quiero más información sobre sus bolsos.');
    const navWa = document.getElementById('navWaBtn');
    const footerWa = document.getElementById('footerWaBtn');
    if(navWa) navWa.href = waLink;
    if(footerWa) footerWa.href = waLink;
    document.title = brand + ' — Bolsos';
  }

  function renderCatalog(){
    CATEGORIES.forEach(cat=>{
      const grid = document.querySelector('[data-grid="'+cat.id+'"]');
      const countEl = document.querySelector('[data-count="'+cat.id+'"]');
      const items = products.filter(p=>p.categoria===cat.id);
      countEl.textContent = items.length + (items.length===1 ? ' bolso' : ' bolsos');
      if(items.length===0){
        grid.innerHTML = '<div class="empty-state">Todavía no hay bolsos publicados en esta categoría.</div>';
        return;
      }
      grid.innerHTML = items.map(p=>`
        <div class="card">
          <img class="card-img" src="${escapeAttr(p.imagenSrc || PLACEHOLDER_IMG)}" alt="${escapeAttr(p.nombre)}" loading="lazy">
          <div class="card-body">
            <p class="card-name">${escapeHtml(p.nombre)}</p>
            <p class="card-price">${money(p.precio)}</p>
            <span class="card-status"><span class="dot ${p.disponible?'':'off'}"></span>${p.disponible?'Disponible':'Agotado'}</span>
          </div>
          <button class="card-open" data-open="${escapeAttr(p.id)}" aria-label="Ver ${escapeAttr(p.nombre)}"></button>
        </div>
      `).join('');
      grid.querySelectorAll('.card-img').forEach(wireImgFallback);
    });
    document.querySelectorAll('[data-open]').forEach(btn=>{
      btn.addEventListener('click', ()=> openProduct(btn.getAttribute('data-open')));
    });
  }

  /* ---------------- Product modal ---------------- */
  const productOverlay = document.getElementById('productOverlay');
  const productModal = document.getElementById('productModal');

  function openProduct(id){
    const p = products.find(x=>x.id===id);
    if(!p) return;
    const catLabel = (CATEGORIES.find(c=>c.id===p.categoria)||{}).label || p.categoria;
    const message = p.disponible
      ? `Hola, me interesa el bolso "${p.nombre}" (${money(p.precio)}). ¿Me das más información?`
      : `Hola, quisiera saber si el bolso "${p.nombre}" vuelve a estar disponible.`;
    const waLink = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(message);
    productModal.innerHTML = `
      <img class="modal-img" src="${escapeAttr(p.imagenSrc || PLACEHOLDER_IMG)}" alt="${escapeAttr(p.nombre)}">
      <div class="modal-info">
        <button class="modal-close" id="closeProductBtn" aria-label="Cerrar">&times;</button>
        <p class="modal-cat">${escapeHtml(catLabel)}</p>
        <h3>${escapeHtml(p.nombre)}</h3>
        <p class="modal-price">${money(p.precio)}</p>
        <p class="modal-status"><span class="dot ${p.disponible?'':'off'}"></span>${p.disponible?'Disponible':'Agotado por ahora'}</p>
        <p class="modal-desc">${escapeHtml(p.descripcion || '')}</p>
        <a class="wa-btn" href="${waLink}" target="_blank" rel="noopener">Preguntar por WhatsApp</a>
      </div>
    `;
    wireImgFallback(productModal.querySelector('.modal-img'));
    document.getElementById('closeProductBtn').addEventListener('click', closeProduct);
    productOverlay.classList.add('open');
  }
  function closeProduct(){ productOverlay.classList.remove('open'); }
  productOverlay.addEventListener('click', e=>{ if(e.target===productOverlay) closeProduct(); });

  /* ---------------- Nav active state ---------------- */
  const navLinks = document.querySelectorAll('nav.links a');
  const sections = ['inicio','hombre','mujer','nina','nino'].map(id=>document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        navLinks.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+entry.target.id));
      }
    });
  }, {rootMargin:'-45% 0px -50% 0px'});
  sections.forEach(s=>io.observe(s));

  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Init ---------------- */
  applyBrandLinks();
  renderCatalog();

  /* ---------------- Aviso al inspeccionar el código ----------------
     IMPORTANTE: esto NO es una protección real. Cualquier navegador
     permite ver el código fuente de cualquier sitio; esto solo desanima
     a un clic accidental o casual mostrando un aviso, pero alguien con
     conocimientos técnicos puede saltárselo sin problema.
  ------------------------------------------------------------------ */
  const protectToast = document.getElementById('protectToast');
  let toastTimer = null;
  function showProtectToast(){
    if(!protectToast) return;
    protectToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> protectToast.classList.remove('show'), 2200);
  }

  document.addEventListener('contextmenu', (e)=>{
    e.preventDefault();
    showProtectToast();
  });

  document.addEventListener('keydown', (e)=>{
    const key = e.key ? e.key.toUpperCase() : '';
    const blockCombo =
      key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(key)) ||
      ((e.ctrlKey || e.metaKey) && ['U','S'].includes(key));
    if(blockCombo){
      e.preventDefault();
      showProtectToast();
    }
  });

})();
