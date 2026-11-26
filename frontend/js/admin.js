const API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';

function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('/api/')) return `${API_BASE}${url}`;
  return url;
}

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function getToken() {
  return localStorage.getItem('admin_token') || '';
}

function setToken(token) {
  if (token) localStorage.setItem('admin_token', token);
  else localStorage.removeItem('admin_token');
}

async function apiFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showDashboard(username) {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  dashboardView.classList.add('flex');
  document.getElementById('adminUserLabel').textContent = username || 'admin';
  loadDashboard();
}

function showLogin() {
  dashboardView.classList.add('hidden');
  dashboardView.classList.remove('flex');
  loginView.classList.remove('hidden');
}

async function checkAuth() {
  try {
    const me = await apiFetch('/api/auth/me');
    if (me.authenticated) showDashboard(me.username);
    else showLogin();
  } catch {
    showLogin();
  }
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const body = Object.fromEntries(new FormData(loginForm).entries());
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.token) setToken(res.token);
    showDashboard(res.username);
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  setToken('');
  showLogin();
});

// Tabs switching
document.querySelectorAll('#adminTabs .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#adminTabs .tab-btn').forEach((b) => {
      b.classList.remove('bg-limebrand', 'font-semibold');
      b.classList.add('bg-white', 'font-medium', 'border', 'border-neutral-200');
    });
    btn.classList.add('bg-limebrand', 'font-semibold');
    btn.classList.remove('bg-white', 'font-medium', 'border', 'border-neutral-200');

    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
  });
});

async function loadDashboard() {
  try {
    const data = await apiFetch('/api/admin/dashboard');
    document.getElementById('statProjects').textContent = data.stats.projects;
    document.getElementById('statBlogs').textContent = data.stats.blogs;
    document.getElementById('statComments').textContent = data.stats.comments;
    document.getElementById('statUnread').textContent = data.stats.unreadContacts;

    renderProjects(data.projects || []);
    renderBlogs(data.blogs || []);
    renderAlbumsAndPhotos(data.albums || [], data.photos || []);
    renderComments(data.comments || []);
    renderContacts(data.contacts || []);
    fillSettings(data.settings || {});
  } catch (err) {
    if (err.message.includes('Authentication') || err.message.includes('session')) {
      showLogin();
    }
  }
}

function renderProjects(items) {
  const el = document.getElementById('adminProjectsList');
  if (!items.length) {
    el.innerHTML = `<div class="bg-white rounded-3xl p-8 text-center text-muted">No projects yet.</div>`;
    return;
  }
  el.innerHTML = items
    .map(
      (p) => `
      <div class="bg-white rounded-3xl p-5 border border-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" class="w-20 h-16 rounded-2xl object-cover bg-surface shrink-0" />
          <div>
            <span class="inline-block px-3 py-0.5 rounded-full bg-surface text-xs font-semibold text-ink mb-1">${escapeHtml(p.category)}</span>
            <h3 class="text-lg font-bold text-ink">${escapeHtml(p.title)}</h3>
          </div>
        </div>
        <button onclick="deleteProject('${p._id}')" class="h-9 px-4 rounded-full bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition">Delete</button>
      </div>`
    )
    .join('');
}

function renderBlogs(items) {
  const el = document.getElementById('adminBlogsList');
  if (!items.length) {
    el.innerHTML = `<div class="bg-white rounded-3xl p-8 text-center text-muted">No blog posts yet.</div>`;
    return;
  }
  el.innerHTML = items
    .map(
      (b) => `
      <div class="bg-white rounded-3xl p-5 border border-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <img src="${escapeHtml(b.image)}" alt="${escapeHtml(b.title)}" class="w-20 h-16 rounded-2xl object-cover bg-surface shrink-0" />
          <div>
            <p class="text-xs text-muted">${escapeHtml(b.dateLabel || 'Recent')}</p>
            <h3 class="text-lg font-bold text-ink">${escapeHtml(b.title)}</h3>
          </div>
        </div>
        <button onclick="deleteBlog('${b._id}')" class="h-9 px-4 rounded-full bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition">Delete</button>
      </div>`
    )
    .join('');
}

function renderComments(items) {
  const el = document.getElementById('adminCommentsList');
  if (!items.length) {
    el.innerHTML = `<div class="text-center text-muted py-6">No visitor comments yet.</div>`;
    return;
  }
  el.innerHTML = items
    .map(
      (c) => `
      <div class="bg-surface rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold text-ink">${escapeHtml(c.name)}</span>
            <span class="text-xs text-muted">(${escapeHtml(c.role || 'Visitor')})</span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.approved !== false ? 'bg-limebrand text-ink' : 'bg-neutral-300 text-ink'}">
              ${c.approved !== false ? 'Visible' : 'Hidden'}
            </span>
          </div>
          <p class="text-sm text-ink/90">${escapeHtml(c.comment)}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="toggleComment('${c._id}', ${c.approved === false})" class="h-9 px-4 rounded-full bg-white border border-neutral-200 text-xs font-semibold hover:bg-neutral-100 transition">
            ${c.approved !== false ? 'Hide' : 'Approve'}
          </button>
          <button onclick="deleteComment('${c._id}')" class="h-9 px-4 rounded-full bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition">Delete</button>
        </div>
      </div>`
    )
    .join('');
}

function renderContacts(items) {
  const el = document.getElementById('adminContactsList');
  if (!items.length) {
    el.innerHTML = `<div class="text-center text-muted py-6">No contact messages yet.</div>`;
    return;
  }
  el.innerHTML = items
    .map(
      (m) => `
      <div class="bg-surface rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <span class="font-bold text-ink">${escapeHtml(m.name)}</span>
            <a href="mailto:${escapeHtml(m.email)}" class="text-xs text-muted underline">${escapeHtml(m.email)}</a>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${m.status === 'unread' ? 'bg-limebrand text-ink' : 'bg-neutral-200 text-ink'}">
              ${escapeHtml(m.status || 'unread')}
            </span>
          </div>
          <p class="text-sm text-ink/90">${escapeHtml(m.message)}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${m.status === 'unread' ? `<button onclick="markContactRead('${m._id}')" class="h-9 px-4 rounded-full bg-white border border-neutral-200 text-xs font-semibold hover:bg-neutral-100 transition">Mark Read</button>` : ''}
          <button onclick="deleteContact('${m._id}')" class="h-9 px-4 rounded-full bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition">Delete</button>
        </div>
      </div>`
    )
    .join('');
}

function fillSettings(s) {
  const form = document.getElementById('settingsForm');
  if (!form || !s) return;
  [
    'fullName',
    'handle',
    'roleTitle',
    'location',
    'profileBio',
    'avatarUrl',
    'greeting',
    'headlineLine1',
    'headlineLine2',
    'heroBio',
    'email',
    'yearsExp',
    'happyClients',
    'countries',
  ].forEach((k) => {
    if (form.elements[k] && s[k] !== undefined) form.elements[k].value = s[k];
  });
  if (s.avatarUrl) {
    const prev = document.getElementById('adminAvatarPreview');
    if (prev) prev.src = s.avatarUrl;
  }
}

function renderAlbumsAndPhotos(albums, photos) {
  const select = document.getElementById('photoAlbumSelect');
  if (select) {
    select.innerHTML = albums.length
      ? albums.map((a) => `<option value="${a._id}">${escapeHtml(a.title)}</option>`).join('')
      : `<option value="">Create an album first</option>`;
  }

  const albumsEl = document.getElementById('adminAlbumsList');
  if (albumsEl) {
    albumsEl.innerHTML = albums.length
      ? albums
          .map(
            (a) => `
          <div class="bg-surface rounded-2xl p-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <img src="${escapeHtml(a.coverImage)}" alt="${escapeHtml(a.title)}" class="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div class="min-w-0">
                <p class="text-[11px] font-semibold text-muted uppercase">${escapeHtml(a.category)}</p>
                <h4 class="font-bold text-ink truncate">${escapeHtml(a.title)}</h4>
              </div>
            </div>
            <button onclick="deleteAlbum('${a._id}')" class="h-8 px-3 rounded-full bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition shrink-0">Delete</button>
          </div>`
          )
          .join('')
      : `<div class="col-span-full text-muted text-sm">No albums yet.</div>`;
  }

  const photosEl = document.getElementById('adminPhotosList');
  if (photosEl) {
    photosEl.innerHTML = photos.length
      ? photos
          .map(
            (p) => `
          <div class="bg-surface rounded-2xl overflow-hidden flex flex-col">
            <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title)}" class="w-full h-36 object-cover" />
            <div class="p-3 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="text-xs font-bold text-ink truncate">${escapeHtml(p.title)}</p>
                <p class="text-[11px] text-muted truncate">${escapeHtml(p.albumId?.title || '')}</p>
              </div>
              <button onclick="deletePhoto('${p._id}')" class="h-7 px-2.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 shrink-0">Delete</button>
            </div>
          </div>`
          )
          .join('')
      : `<div class="col-span-full text-muted text-sm">No photos uploaded yet.</div>`;
  }
}

// Generic file upload handler for Admin forms
document.querySelectorAll('.upload-input').forEach((input) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetId = input.dataset.uploadTarget;
    const previewId = input.dataset.preview;
    const fd = new FormData();
    fd.append('image', file);
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const fullUrl = resolveMediaUrl(data.url);
      if (targetId && document.getElementById(targetId)) {
        document.getElementById(targetId).value = fullUrl;
      }
      if (previewId && document.getElementById(previewId)) {
        document.getElementById(previewId).src = fullUrl;
      }
    } catch (err) {
      alert(err.message);
    }
  });
});

document.getElementById('addAlbumForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target).entries());
  await apiFetch('/api/admin/albums', { method: 'POST', body: JSON.stringify(body) });
  e.target.reset();
  loadDashboard();
});

document.getElementById('addPhotoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target).entries());
  await apiFetch('/api/admin/photos', { method: 'POST', body: JSON.stringify(body) });
  e.target.reset();
  loadDashboard();
});

window.deleteAlbum = async (id) => {
  await apiFetch(`/api/admin/albums/${id}`, { method: 'DELETE' });
  loadDashboard();
};
window.deletePhoto = async (id) => {
  await apiFetch(`/api/admin/photos/${id}`, { method: 'DELETE' });
  loadDashboard();
};

document.getElementById('addProjectForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target).entries());
  await apiFetch('/api/admin/projects', { method: 'POST', body: JSON.stringify(body) });
  e.target.reset();
  loadDashboard();
});

document.getElementById('addBlogForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target).entries());
  await apiFetch('/api/admin/blogs', { method: 'POST', body: JSON.stringify(body) });
  e.target.reset();
  loadDashboard();
});

document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('settingsStatus');
  const body = Object.fromEntries(new FormData(e.target).entries());
  await apiFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(body) });
  status.textContent = 'Settings saved!';
  status.className = 'text-sm font-medium text-green-600';
  status.classList.remove('hidden');
  setTimeout(() => status.classList.add('hidden'), 2500);
});

window.deleteProject = async (id) => {
  await apiFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
  loadDashboard();
};
window.deleteBlog = async (id) => {
  await apiFetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
  loadDashboard();
};
window.toggleComment = async (id, approved) => {
  await apiFetch(`/api/admin/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ approved }) });
  loadDashboard();
};
window.deleteComment = async (id) => {
  await apiFetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
  loadDashboard();
};
window.markContactRead = async (id) => {
  await apiFetch(`/api/admin/contacts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'read' }) });
  loadDashboard();
};
window.deleteContact = async (id) => {
  await apiFetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
  loadDashboard();
};

checkAuth();
