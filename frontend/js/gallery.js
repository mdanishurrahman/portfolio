const GALLERY_API = window.location.port === '5000' ? '' : 'http://localhost:5000';

function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('/api/')) return `${GALLERY_API}${url}`;
  return url;
}

let allAlbums = [];
let allPhotos = [];
let activeAlbumId = null;
let lightboxIndex = 0;

function gEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyProfile(profile) {
  if (!profile) return;
  if (profile.avatarUrl) document.getElementById('profileAvatar').src = resolveMediaUrl(profile.avatarUrl);
  if (profile.fullName) document.getElementById('profileFullName').textContent = profile.fullName;
  if (profile.handle) document.getElementById('profileHandle').textContent = profile.handle;
  if (profile.roleTitle) document.getElementById('profileRole').textContent = profile.roleTitle;
  if (profile.location) document.getElementById('profileLocation').textContent = profile.location;
  if (profile.profileBio) document.getElementById('profileBio').textContent = profile.profileBio;
  if (profile.availabilityText) {
    document.getElementById('profileAvailability').innerHTML =
      `<span class="w-2 h-2 rounded-full bg-limebrand"></span> ${gEscape(profile.availabilityText)}`;
  }
  if (profile.socialLinks) {
    if (profile.socialLinks.dribbble) document.getElementById('socialDribbble').href = profile.socialLinks.dribbble;
    if (profile.socialLinks.linkedin) document.getElementById('socialLinkedIn').href = profile.socialLinks.linkedin;
    if (profile.socialLinks.github) document.getElementById('socialGithub').href = profile.socialLinks.github;
  }
}

function renderAlbums() {
  const grid = document.getElementById('albumsGrid');
  if (!grid) return;
  if (!allAlbums.length) {
    grid.innerHTML = `<div class="col-span-full bg-surface rounded-3xl p-8 text-center text-muted">No albums created yet.</div>`;
    return;
  }

  grid.innerHTML = allAlbums
    .map((album) => {
      const count = allPhotos.filter((p) => (p.albumId?._id || p.albumId) === album._id).length;
      const isSelected = activeAlbumId === album._id;
      return `
        <article
          onclick="selectAlbum('${album._id}')"
          class="relative h-64 rounded-3xl overflow-hidden cursor-pointer group border-2 transition ${isSelected ? 'border-limebrand shadow-xl' : 'border-transparent'}"
        >
          <img src="${gEscape(resolveMediaUrl(album.coverImage))}" alt="${gEscape(album.title)}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
          <div class="absolute inset-0" style="background: linear-gradient(rgba(10,11,10,0.05) 0%, rgba(10,11,10,0.82) 100%);"></div>
          <div class="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
            ${count} ${count === 1 ? 'Photo' : 'Photos'}
          </div>
          <div class="absolute bottom-5 left-5 right-5 text-white">
            <span class="text-xs font-semibold text-limebrand uppercase tracking-wider">${gEscape(album.category)}</span>
            <h3 class="text-2xl font-bold leading-tight mt-0.5">${gEscape(album.title)}</h3>
            ${album.description ? `<p class="text-xs text-white/75 mt-1 line-clamp-1">${gEscape(album.description)}</p>` : ''}
          </div>
        </article>`;
    })
    .join('');
}

function getVisiblePhotos() {
  if (!activeAlbumId) return allPhotos;
  return allPhotos.filter((p) => (p.albumId?._id || p.albumId) === activeAlbumId);
}

function renderPhotos() {
  const grid = document.getElementById('photosGrid');
  const badge = document.getElementById('photoCountBadge');
  const heading = document.getElementById('galleryHeading');
  const visible = getVisiblePhotos();

  if (badge) badge.textContent = `${visible.length} ${visible.length === 1 ? 'Photo' : 'Photos'}`;
  if (heading) {
    const album = allAlbums.find((a) => a._id === activeAlbumId);
    heading.textContent = album ? `${album.title}` : 'Photo Gallery';
  }

  if (!visible.length) {
    grid.innerHTML = `<div class="col-span-full bg-surface rounded-3xl p-10 text-center text-muted">No photos in this album yet.</div>`;
    return;
  }

  grid.innerHTML = visible
    .map(
      (p, idx) => `
      <article
        onclick="openLightbox(${idx})"
        class="relative h-80 rounded-3xl overflow-hidden cursor-pointer group bg-surface"
      >
        <img src="${gEscape(resolveMediaUrl(p.imageUrl))}" alt="${gEscape(p.title)}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300" style="background: linear-gradient(rgba(10,11,10,0) 35%, rgba(10,11,10,0.8) 100%);"></div>
        <div class="absolute bottom-5 left-5 right-5 text-white opacity-0 group-hover:opacity-100 transition duration-300">
          <h3 class="text-lg font-bold leading-snug">${gEscape(p.title)}</h3>
          ${p.caption ? `<p class="text-xs text-white/80 mt-0.5">${gEscape(p.caption)}</p>` : ''}
        </div>
      </article>`
    )
    .join('');
}

window.selectAlbum = function (id) {
  activeAlbumId = activeAlbumId === id ? null : id;
  renderAlbums();
  renderPhotos();
};

document.getElementById('showAllPhotosBtn')?.addEventListener('click', () => {
  activeAlbumId = null;
  renderAlbums();
  renderPhotos();
});

// Lightbox
const lightbox = document.getElementById('lightboxModal');
window.openLightbox = function (idx) {
  const visible = getVisiblePhotos();
  if (!visible.length) return;
  lightboxIndex = (idx + visible.length) % visible.length;
  const item = visible[lightboxIndex];
  document.getElementById('lightboxImg').src = resolveMediaUrl(item.imageUrl);
  document.getElementById('lightboxTitle').textContent = item.title || '';
  document.getElementById('lightboxCaption').textContent = item.caption || '';
  lightbox.classList.remove('hidden');
  lightbox.classList.add('flex');
};

document.getElementById('closeLightbox')?.addEventListener('click', () => {
  lightbox.classList.add('hidden');
  lightbox.classList.remove('flex');
});
document.getElementById('prevLightbox')?.addEventListener('click', () => window.openLightbox(lightboxIndex - 1));
document.getElementById('nextLightbox')?.addEventListener('click', () => window.openLightbox(lightboxIndex + 1));
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
  }
});

async function loadGallery() {
  try {
    const res = await fetch(`${GALLERY_API}/api/public/gallery`);
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    allAlbums = data.albums || [];
    allPhotos = data.photos || [];
    applyProfile(data.profile);
    renderAlbums();
    renderPhotos();
  } catch {
    // Fallback if backend is offline
    allAlbums = [
      { _id: '1', title: 'UI & Product Shots', category: 'Design', description: 'Interface concepts & mockups', coverImage: 'assets/81fdc9d3431a5af6.png' },
      { _id: '2', title: 'Studio & Workspace', category: 'Lifestyle', description: 'Behind-the-scenes snapshots', coverImage: 'assets/17ae2ac91d8715a7.jpg' },
    ];
    allPhotos = [
      { albumId: '1', title: 'Voltgear EV Dashboard', caption: 'Dark mode telemetry interface', imageUrl: 'assets/81fdc9d3431a5af6.png' },
      { albumId: '1', title: 'Minimal Brand System', caption: 'Editorial typography study', imageUrl: 'assets/503c70a35aac3f59.png' },
      { albumId: '2', title: 'Creative Direction', caption: 'Morning design sprint', imageUrl: 'assets/17ae2ac91d8715a7.jpg' },
    ];
    renderAlbums();
    renderPhotos();
  }
}

loadGallery();
