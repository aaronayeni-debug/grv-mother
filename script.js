/* -------------------------------------------------------------
   SUPABASE CONFIGURATION (commented out — replaced by Xano)
   ------------------------------------------------------------- */
// const SUPABASE_URL = 'https://wetkmmfvmabfqseiiysk.supabase.co';
// const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGttbWZ2bWFiZnFzZWlpeXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODIxMzYsImV4cCI6MjA5MTc1ODEzNn0.zE0oqqVSu8Pztc7yzugnBsX_OAB8uS5GY7k5fSd5gKM';
// let supabaseClient = null;
// if (window.supabase) {
//   try {
//     supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
//   } catch (err) {
//     console.error('Failed to initialize Supabase client:', err);
//   }
// }

/* -------------------------------------------------------------
   XANO CONFIGURATION
   ------------------------------------------------------------- */
const XANO_GET_URL  = 'https://x8ki-letl-twmt.n7.xano.io/api:eL8dfiNx/grvmom1';
const XANO_POST_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:eL8dfiNx/grvmom';

/* -------------------------------------------------------------
   STATE
   ------------------------------------------------------------- */
let allTributes = [];
let currentPage = 1;
const itemsPerPage = 10;

// Generate a simple session ID so one browser = one candle
function getSessionId() {
  let sid = localStorage.getItem('session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('session_id', sid);
  }
  return sid;
}

let galleryData = [];
let activeGalleryData = [];
let currentLightboxIndex = 0;
let currentGalleryPage = 1;
const itemsPerGalleryPage = 21;

/* -------------------------------------------------------------
   INIT
   ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadTributes();
  initVirtualCandle();
  initAudioPlayer();
  initTabs();
  initCharCounter();
  initFormSubmit();
  initScrollSpy();
  initShareLinks();
  initGallery();
  initBioSliders();

  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox-modal');
    if (lightbox.style.display === 'flex') {
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowRight') changeLightboxImage(1);
      if (e.key === 'ArrowLeft')  changeLightboxImage(-1);
    }
  });
});

/* -------------------------------------------------------------
   TRIBUTES — LOAD & RENDER
   ------------------------------------------------------------- */
async function loadTributes() {
  const loadingEl = document.getElementById('tributes-loading');
  const listEl    = document.getElementById('tributes-list');
  const paginEl   = document.getElementById('tributes-pagination');

  loadingEl.style.display = 'block';
  listEl.innerHTML = '';
  paginEl.classList.add('hidden');

  // ── Xano GET ──
  try {
    const res  = await fetch(XANO_GET_URL);
    const data = await res.json();
    // Sort newest first (created_at is ms timestamp from Xano)
    allTributes = Array.isArray(data)
      ? data.sort((a, b) => b.created_at - a.created_at)
      : [];
  } catch (err) {
    console.error('Xano fetch failed:', err);
    allTributes = [];
  }

  // ── Supabase GET (commented out) ──
  // if (supabaseClient) {
  //   try {
  //     const { data, error } = await supabaseClient
  //       .from('tributes').select('*').order('created_at', { ascending: false });
  //     if (error) throw error;
  //     allTributes = data || [];
  //   } catch (err) { allTributes = []; }
  // }

  loadingEl.style.display = 'none';
  renderTributes();
}

function renderTributes() {
  const listEl  = document.getElementById('tributes-list');
  const paginEl = document.getElementById('tributes-pagination');
  listEl.innerHTML = '';

  if (allTributes.length === 0) {
    listEl.innerHTML = '<div class="tributes-loading"><p>No tributes yet. Be the first to share a memory.</p></div>';
    return;
  }

  if (allTributes.length > itemsPerPage) {
    paginEl.classList.remove('hidden');
    updatePaginationControls();
  } else {
    paginEl.classList.add('hidden');
  }

  const start = (currentPage - 1) * itemsPerPage;

  allTributes.slice(start, start + itemsPerPage).forEach((tribute, pageIndex) => {
    const card     = document.createElement('article');
    card.className = 'tribute-card';

    // "New" badge only if the tribute was submitted within the last 24 hours
    const ageMs  = Date.now() - new Date(tribute.created_at).getTime();
    const badge  = ageMs < 24 * 60 * 60 * 1000 ? '<span class="tribute-new-badge">New</span>' : '';

    // Timestamp formatting
    const dateObj  = new Date(tribute.created_at);
    // e.g. "1:24 PM"
    const timeStr  = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    // e.g. "July, 15, 2026"
    const dateStr  = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    card.innerHTML = `
      <!-- Underlay watermarks inside the card itself -->
      <div class="tribute-card-bg" aria-hidden="true">
        <img src="assets/Dove.svg" class="tribute-card-dove" alt="">
        <svg class="tribute-card-ethereal" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <line x1="200" y1="60" x2="200" y2="340" stroke="#b39268" stroke-width="4"/>
          <line x1="120" y1="150" x2="280" y2="150" stroke="#b39268" stroke-width="4"/>
          <ellipse cx="200" cy="200" rx="130" ry="130" stroke="#b39268" stroke-width="2.5" fill="none"/>
          <ellipse cx="200" cy="200" rx="95" ry="95" stroke="#b39268" stroke-width="1.5" fill="none"/>
        </svg>
      </div>

      <div class="tribute-card-header">
        <div class="tribute-header-left">
          ${badge}
        </div>
        <img class="tribute-flower-img" src="assets/flower.svg" alt="Flower accent" aria-hidden="true">
      </div>

      <div class="tribute-body-meta">
        <div class="tribute-author-block">
          <h4 class="tribute-author">${escapeHTML(tribute.name)}</h4>
          <span class="tribute-relation">${escapeHTML(tribute.relation)}</span>
        </div>
        <div class="tribute-timestamp-block">
          <span class="tribute-date-str">${dateStr}</span>
          <span class="tribute-time-str">${timeStr}</span>
        </div>
      </div>

      <p class="tribute-text">${escapeHTML(tribute.tribute)}</p>
    `;

    listEl.appendChild(card);
  });
}


function updatePaginationControls() {
  const prevBtn      = document.getElementById('prev-page-btn');
  const nextBtn      = document.getElementById('next-page-btn');
  const pageIndicator = document.getElementById('page-indicator');
  const totalPages   = Math.ceil(allTributes.length / itemsPerPage);

  pageIndicator.innerText = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;

  prevBtn.onclick = () => { if (currentPage > 1)          { currentPage--; renderTributes(); document.getElementById('tributes').scrollIntoView({ behavior: 'smooth' }); } };
  nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTributes(); document.getElementById('tributes').scrollIntoView({ behavior: 'smooth' }); } };
}

/* -------------------------------------------------------------
   VIRTUAL CANDLE — Xano-backed
   GET  https://x8ki-letl-twmt.n7.xano.io/api:eL8dfiNx/candle1  → { candle: <n> }
   POST https://x8ki-letl-twmt.n7.xano.io/api:eL8dfiNx/candle   → records click
   ------------------------------------------------------------- */
const XANO_CANDLE_GET  = 'https://x8ki-letl-twmt.n7.xano.io/api:eL8dfiNx/candle1';
const XANO_CANDLE_POST = 'https://x8ki-letl-twmt.n7.xano.io/api:eL8dfiNx/candle';

async function initVirtualCandle() {
  const countSpan = document.getElementById('candle-count');
  const btn       = document.getElementById('light-candle-btn');
  const flame     = document.getElementById('candle-flame');

  if (!countSpan || !btn || !flame) return;

  flame.classList.add('lit');

  // ── Fetch live count from Xano ──
  try {
    const res  = await fetch(XANO_CANDLE_GET);
    const data = await res.json();
    // Xano returns [{"candle": n}] — handle both array and plain object
    const item  = Array.isArray(data) ? data[0] : data;
    const count = typeof item === 'number' ? item : (item?.candle ?? item?.count ?? 0);
    countSpan.innerText = count;
  } catch (err) {
    console.error('Could not fetch candle count:', err);
    countSpan.innerText = '—';
  }

  // ── Prevent double-lighting per browser session ──
  const alreadyLit = localStorage.getItem('user_lit_candle') === 'true';
  if (alreadyLit) {
    btn.innerHTML = '<i class="fas fa-check"></i> Candle Lit';
    btn.classList.replace('btn-outline-gold', 'btn-gold');
    btn.disabled = true;
    return;
  }

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;

    // Optimistic UI update
    const current = parseInt(countSpan.innerText, 10) || 0;
    countSpan.innerText = current + 1;
    flame.classList.add('lit');
    btn.innerHTML = '<i class="fas fa-check"></i> Candle Lit';
    btn.classList.replace('btn-outline-gold', 'btn-gold');
    createSparkEffect(btn);
    localStorage.setItem('user_lit_candle', 'true');

    // ── POST to Xano ──
    try {
      await fetch(XANO_CANDLE_POST, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      // Re-fetch authoritative count after POST
      const res   = await fetch(XANO_CANDLE_GET);
      const data  = await res.json();
      const item  = Array.isArray(data) ? data[0] : data;
      const count = typeof item === 'number' ? item : (item?.candle ?? item?.count ?? current + 1);
      countSpan.innerText = count;
    } catch (err) {
      console.error('Could not record candle:', err);
    }
  });
}

function createSparkEffect(target) {
  const rect = target.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement('div');
    Object.assign(spark.style, {
      position: 'fixed', width: '6px', height: '6px',
      backgroundColor: '#ffc83b', borderRadius: '50%',
      left: `${rect.left + rect.width / 2}px`, top: `${rect.top}px`,
      zIndex: '9999', pointerEvents: 'none', transition: 'all 0.8s ease-out'
    });
    document.body.appendChild(spark);
    const angle = Math.random() * Math.PI * 2;
    const dist  = 40 + Math.random() * 50;
    setTimeout(() => {
      spark.style.transform = `translate(${Math.cos(angle) * dist}px, ${-Math.sin(angle) * dist - 20}px)`;
      spark.style.opacity   = '0';
    }, 10);
    setTimeout(() => spark.remove(), 820);
  }
}

/* -------------------------------------------------------------
   AUDIO PLAYER — robust autoplay with correct UI states
   ------------------------------------------------------------- */
function initAudioPlayer() {
  const btn   = document.getElementById('audio-toggle-btn');
  const audio = document.getElementById('bg-audio');
  if (!audio || !btn) return;

  const icon = btn.querySelector('i');
  const text = btn.querySelector('.music-text');

  function setPlaying() {
    btn.classList.add('playing');
    icon.className = 'fas fa-pause';
    text.innerText = 'Pause';
  }

  function setPaused() {
    btn.classList.remove('playing');
    icon.className = 'fas fa-play';
    text.innerText = 'Play Music';
  }

  // ── Muted autoplay (allowed on all mobile browsers) ──
  audio.volume = 0.75;
  audio.muted  = true;

  audio.play().then(() => {
    // Playing muted — now show a nudge banner prompting unmute
    showAudioNudge();
  }).catch(() => {
    // Autoplay fully blocked — wait for any interaction
    setPaused();
  });

  // ── Nudge banner ──
  function showAudioNudge() {
    if (document.getElementById('audio-nudge')) return;
    const nudge = document.createElement('div');
    nudge.id = 'audio-nudge';
    nudge.setAttribute('role', 'status');
    nudge.innerHTML = `<i class="fas fa-music"></i> Tap anywhere to enable music`;
    document.body.appendChild(nudge);

    const dismiss = () => {
      audio.muted = false;
      setPlaying();
      nudge.classList.add('nudge-hide');
      setTimeout(() => nudge.remove(), 600);
      document.removeEventListener('click',      dismiss);
      document.removeEventListener('touchstart', dismiss);
    };
    document.addEventListener('click',      dismiss);
    document.addEventListener('touchstart', dismiss);
  }

  // ── Manual toggle button ──
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audio.muted) {
      audio.muted = false;
      document.getElementById('audio-nudge')?.remove();
    }
    if (audio.paused) {
      audio.play().then(setPlaying).catch(() => {});
    } else {
      audio.pause();
      setPaused();
    }
  });
}


/* -------------------------------------------------------------
   BIOGRAPHY TABS
   ------------------------------------------------------------- */
function initTabs() {
  const tabs  = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t  => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    });
  });
}

/* -------------------------------------------------------------
   FORM
   ------------------------------------------------------------- */
function initCharCounter() {
  const textarea = document.getElementById('writer-comment');
  const counter  = document.getElementById('char-count');
  textarea.addEventListener('input', () => { counter.innerText = textarea.value.length; });
}

function initFormSubmit() {
  const form      = document.getElementById('tribute-form');
  const submitBtn = document.getElementById('submit-tribute-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

    // ── Xano field names: name, relation, tribute ──
    const payload = {
      name:    document.getElementById('writer-name').value.trim(),
      relation: document.getElementById('writer-relationship').value.trim(),
      tribute: document.getElementById('writer-comment').value.trim()
    };

    // ── Supabase POST (commented out) ──
    // const supaPayload = {
    //   name: payload.name, relationship: payload.relation,
    //   comment: payload.tribute, created_at: new Date().toISOString()
    // };
    // if (supabaseClient) {
    //   const { error } = await supabaseClient.from('tributes').insert([supaPayload]);
    // }

    let success = false;
    try {
      const res = await fetch(XANO_POST_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Xano error ${res.status}`);
      success = true;
    } catch (err) {
      console.error('Xano submit failed:', err);
    }

    if (success) {
      form.reset();
      document.getElementById('char-count').innerText = 0;
      closeTributeModal();
      await loadTributes();
      setTimeout(() => document.getElementById('tributes').scrollIntoView({ behavior: 'smooth' }), 300);
    } else {
      alert('Could not submit your tribute. Please try again.');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Tribute';
  });
}

/* -------------------------------------------------------------
   MODALS
   ------------------------------------------------------------- */
function openTributeModal()  { document.getElementById('tribute-modal').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function closeTributeModal() { document.getElementById('tribute-modal').style.display = 'none'; document.body.style.overflow = 'auto';  }

function openLightbox(index) {
  currentLightboxIndex = index;
  const img     = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  img.src           = activeGalleryData[index].src;
  caption.innerHTML = activeGalleryData[index].caption;
  document.getElementById('lightbox-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox-modal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function changeLightboxImage(dir) {
  if (activeGalleryData.length === 0) return;
  currentLightboxIndex = (currentLightboxIndex + dir + activeGalleryData.length) % activeGalleryData.length;
  document.getElementById('lightbox-img').src                   = activeGalleryData[currentLightboxIndex].src;
  document.getElementById('lightbox-caption').innerHTML = activeGalleryData[currentLightboxIndex].caption;
}

/* -------------------------------------------------------------
   DYNAMIC GALLERY & FILTERING
   ------------------------------------------------------------- */
async function initGallery() {
  const grid = document.getElementById('gallery-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const paginationContainer = document.getElementById('gallery-pagination');
  const prevBtn = document.getElementById('gallery-prev-btn');
  const nextBtn = document.getElementById('gallery-next-btn');
  const pageIndicator = document.getElementById('gallery-page-indicator');
  
  if (!grid) return;

  // Load from external json
  try {
    const res = await fetch('gallery.json');
    galleryData = await res.json();
  } catch (err) {
    console.error('Failed to load gallery.json:', err);
    galleryData = [];
  }

  activeGalleryData = [...galleryData];
  let activeFilter = 'all';

  function renderGrid() {
    grid.innerHTML = '';

    let itemsToRender;
    let start = 0;

    if (activeFilter === 'all') {
      // Paginate only for All Photos
      start = (currentGalleryPage - 1) * itemsPerGalleryPage;
      itemsToRender = activeGalleryData.slice(start, start + itemsPerGalleryPage);
    } else {
      // Show every image in a specific category
      itemsToRender = activeGalleryData;
    }

    if (itemsToRender.length === 0) {
      grid.innerHTML = '<div class="tributes-loading"><p>No photos available in this category.</p></div>';
      updatePagination();
      return;
    }

    itemsToRender.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `gallery-card frame-${item.category}`;
      const absoluteIndex = (activeFilter === 'all') ? start + idx : idx;
      card.setAttribute('onclick', `openLightbox(${absoluteIndex})`);
      card.innerHTML = `
        <div class="gallery-img-container">
          <img src="${item.src}" alt="${escapeHTML(item.caption)}" class="gallery-img" loading="lazy">
          <div class="gallery-overlay">
            <i class="fas fa-search-plus"></i>
            <span>View Image</span>
          </div>
          <span class="gallery-id-badge">
            <img src="assets/Flower 2.svg" class="gallery-flower-badge" aria-hidden="true">
            <span class="gallery-id-text">#${item.id}</span>
          </span>
        </div>
        <div class="gallery-caption">${escapeHTML(item.caption)}</div>
      `;
      grid.appendChild(card);
    });

    updatePagination();
  }

  function updatePagination() {
    // Only show pagination when viewing All Photos
    if (activeFilter !== 'all') {
      paginationContainer.classList.add('hidden');
      return;
    }
    const totalPages = Math.ceil(activeGalleryData.length / itemsPerGalleryPage);
    if (totalPages > 1) {
      paginationContainer.classList.remove('hidden');
      pageIndicator.innerText = `Page ${currentGalleryPage} of ${totalPages}`;
      prevBtn.disabled = currentGalleryPage === 1;
      nextBtn.disabled = currentGalleryPage === totalPages;
    } else {
      paginationContainer.classList.add('hidden');
    }
  }

  // Setup button handlers
  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => {
      if (currentGalleryPage > 1) {
        currentGalleryPage--;
        renderGrid();
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
      }
    };
    nextBtn.onclick = () => {
      const totalPages = Math.ceil(activeGalleryData.length / itemsPerGalleryPage);
      if (currentGalleryPage < totalPages) {
        currentGalleryPage++;
        renderGrid();
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
      }
    };
  }

  // Setup filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');

      if (activeFilter === 'all') {
        activeGalleryData = [...galleryData];
      } else {
        activeGalleryData = galleryData.filter(item => item.category === activeFilter);
      }

      currentGalleryPage = 1;
      renderGrid();
    });
  });

  renderGrid();
}

/* -------------------------------------------------------------
   BIO SLIDERS — auto-crossfade every 4s per tab
   ------------------------------------------------------------- */
function initBioSliders() {
  ['slider-early', 'slider-family', 'slider-legacy'].forEach(id => {
    const slider = document.getElementById(id);
    if (!slider) return;
    const slides = slider.querySelectorAll('.bio-slide');
    if (slides.length < 2) return;
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 5000);
  });
}

window.openTributeModal   = openTributeModal;
window.closeTributeModal  = closeTributeModal;
window.openLightbox       = openLightbox;
window.closeLightbox      = closeLightbox;
window.changeLightboxImage = changeLightboxImage;
window.initGallery        = initGallery;
window.initGallery        = initGallery;

/* -------------------------------------------------------------
   SCROLL SPY
   ------------------------------------------------------------- */
function initScrollSpy() {
  const sections  = document.querySelectorAll('section');
  const navLinks  = document.querySelectorAll('.desktop-nav .nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* -------------------------------------------------------------
   SOCIAL SHARING
   ------------------------------------------------------------- */
function initShareLinks() {
  const url  = window.location.href;
  const text = 'In Loving Memory of Nkechi Stella Rhodes-Vivour. Read her life journey and leave a tribute: ';

  document.getElementById('share-wa').href    = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + url)}`;
  document.getElementById('share-fb').href    = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  document.getElementById('share-tw').href    = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  document.getElementById('share-email').href = `mailto:?subject=${encodeURIComponent('In Loving Memory of Nkechi Stella Rhodes-Vivour')}&body=${encodeURIComponent(text + url)}`;

  const copyBtn = document.getElementById('share-copylink');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
      }).catch((err) => {
        // Fallback for older browsers
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('Link copied to clipboard!');
      });
    });
  }

  document.querySelectorAll('.share-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      const id = icon.id;
      if (url.startsWith('file://') && (id === 'share-wa' || id === 'share-fb' || id === 'share-tw')) {
        e.preventDefault();
        alert('Social sharing requires the site to be hosted online (e.g. Netlify or GitHub Pages).');
      }
    });
  });
}

function showToast(message) {
  let toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/* -------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------- */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
