// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
mobileMenuBtn?.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
  mobileMenu.classList.toggle('flex');
});

// Services Accordion
document.querySelectorAll('#servicesAccordion .accordion-item').forEach((item) => {
  item.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    document.querySelectorAll('#servicesAccordion .accordion-item').forEach((el) => el.classList.remove('is-open'));
    if (!isOpen) item.classList.add('is-open');
  });
});

// FAQ Accordion
document.querySelectorAll('#faqAccordion .accordion-item').forEach((item) => {
  item.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    document.querySelectorAll('#faqAccordion .accordion-item').forEach((el) => {
      el.classList.remove('is-open', 'rounded-3xl');
      el.classList.add('rounded-full');
      const icon = el.querySelector('.faq-icon');
      if (icon) icon.src = 'assets/f260b86a448d4dad.svg';
    });
    if (!isOpen) {
      item.classList.add('is-open', 'rounded-3xl');
      item.classList.remove('rounded-full');
      const icon = item.querySelector('.faq-icon');
      if (icon) icon.src = 'assets/d8a51fc2e0d86163.svg';
    }
  });
});

// Testimonials Carousel
const track = document.getElementById('testimonialTrack');
document.getElementById('prevTestimonial')?.addEventListener('click', () => {
  track?.scrollBy({ left: -652, behavior: 'smooth' });
});
document.getElementById('nextTestimonial')?.addEventListener('click', () => {
  track?.scrollBy({ left: 652, behavior: 'smooth' });
});

// Stat Counter Animation
const counters = document.querySelectorAll('.counter');
if (counters.length) {
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => observer.observe(c));
}

// Load More button (for Portfolio & Blog)
const loadMoreBtn = document.getElementById('loadMoreBtn');
loadMoreBtn?.addEventListener('click', () => {
  const targetSel = loadMoreBtn.dataset.target;
  const container = targetSel ? document.querySelector(targetSel) : document;
  container?.querySelectorAll('.load-more-item.hidden').forEach((el) => {
    el.classList.remove('hidden');
  });
  loadMoreBtn.classList.add('hidden');
});

// Contact Modal
const contactModal = document.getElementById('contactModal');
window.openContactModal = function () {
  if (!contactModal) return;
  contactModal.classList.remove('hidden');
  contactModal.classList.add('flex');
};
window.closeContactModal = function () {
  if (!contactModal) return;
  contactModal.classList.add('hidden');
  contactModal.classList.remove('flex');
};
contactModal?.addEventListener('click', (e) => {
  if (e.target === contactModal) window.closeContactModal();
});

// Contact Form submission (wired for Node.js/Express/MongoDB API)
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('contactStatus');
  const formData = Object.fromEntries(new FormData(e.target).entries());
  status.classList.remove('hidden', 'text-red-600', 'text-green-600');
  status.textContent = 'Sending...';

  try {
    const res = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Server error');
    status.classList.add('text-green-600');
    status.textContent = 'Message sent successfully!';
    e.target.reset();
  } catch {
    status.classList.add('text-red-600');
    status.textContent = 'Backend not connected yet (expected POST http://localhost:5000/api/contact).';
  }
});

// ==================== VISITOR COMMENTS (API + LocalStorage fallback) ====================
const commentsList = document.getElementById('commentsList');
const commentCount = document.getElementById('commentCount');
const commentForm = document.getElementById('commentForm');
const commentStatus = document.getElementById('commentStatus');

const DEFAULT_COMMENTS = [
  {
    name: 'Sarah Jenkins',
    role: 'Product Manager',
    comment: 'Super clean portfolio! The layout and micro-interactions feel really thoughtful and modern.',
    createdAt: '2026-11-24T10:30:00Z',
  },
  {
    name: 'Arif Rahman',
    role: 'Full Stack Developer',
    comment: 'Love the dark hero contrast with the lime accent. Voltgear EV Tracking case study looks awesome!',
    createdAt: '2026-11-25T15:45:00Z',
  },
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getInitials(name) {
  return (name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Just now';
  }
}

function getLocalComments() {
  try {
    const saved = JSON.parse(localStorage.getItem('portfolio_comments') || 'null');
    return Array.isArray(saved) ? saved : DEFAULT_COMMENTS;
  } catch {
    return DEFAULT_COMMENTS;
  }
}

function renderComments(items) {
  if (!commentsList) return;
  if (commentCount) {
    commentCount.textContent = `${items.length} ${items.length === 1 ? 'Comment' : 'Comments'}`;
  }
  if (!items.length) {
    commentsList.innerHTML = `<div class="bg-surface rounded-3xl p-8 text-center text-muted">No comments yet. Be the first to leave one!</div>`;
    return;
  }
  commentsList.innerHTML = items
    .map(
      (item) => `
      <article class="bg-surface rounded-3xl p-6 sm:p-8 flex flex-col gap-4 border border-neutral-200/60">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-full bg-ink text-limebrand font-bold text-sm flex items-center justify-center shrink-0">
              ${escapeHtml(getInitials(item.name))}
            </div>
            <div>
              <h4 class="text-base font-bold text-ink leading-tight">${escapeHtml(item.name)}</h4>
              <p class="text-xs text-muted">${escapeHtml(item.role || 'Visitor')}</p>
            </div>
          </div>
          <span class="text-xs text-mutedlight">${escapeHtml(formatDate(item.createdAt))}</span>
        </div>
        <p class="text-base text-ink/90 leading-relaxed">${escapeHtml(item.comment)}</p>
      </article>`
    )
    .join('');
}

async function loadComments() {
  if (!commentsList) return;
  try {
    const res = await fetch('http://localhost:5000/api/comments');
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    renderComments(Array.isArray(data) ? data : data.comments || []);
  } catch {
    renderComments(getLocalComments());
  }
}

commentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(commentForm).entries());
  const newItem = {
    name: formData.name.trim(),
    role: (formData.role || '').trim() || 'Visitor',
    comment: formData.comment.trim(),
    createdAt: new Date().toISOString(),
  };

  commentStatus.classList.remove('hidden', 'text-limebrand', 'text-red-400');
  commentStatus.textContent = 'Posting...';

  try {
    const res = await fetch('http://localhost:5000/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429 || res.status === 400) {
      commentStatus.classList.add('text-red-400');
      commentStatus.textContent = data.error || 'Rate limit exceeded. Please wait before commenting again.';
      return;
    }
    if (!res.ok) throw new Error('API error');
    commentStatus.classList.add('text-limebrand');
    commentStatus.textContent = 'Comment posted!';
    commentForm.reset();
    loadComments();

// ==================== USER LOGIN / REGISTRATION SYSTEM ====================
const PUBLIC_API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('portfolio_user') || 'null');
  } catch {
    return null;
  }
}

function setSavedUser(user, token) {
  if (user && token) {
    localStorage.setItem('portfolio_user', JSON.stringify(user));
    localStorage.setItem('user_token', token);
  } else {
    localStorage.removeItem('portfolio_user');
    localStorage.removeItem('user_token');
  }
  updateUserNavUI();
}

function updateUserNavUI() {
  const btn = document.getElementById('userAuthBtn');
  const user = getSavedUser();
  if (btn) {
    if (user) {
      btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-limebrand"></span><span>${escapeHtml(user.name.split(' ')[0])}</span>`;
      btn.title = `Signed in as ${user.email}`;
    } else {
      btn.innerHTML = `<span>Login</span>`;
      btn.title = 'Sign in or Create Account';
    }
  }
  // Auto-fill comment name if logged in
  const commentNameInput = document.querySelector('#commentForm input[name="name"]');
  if (commentNameInput && user && !commentNameInput.value) {
    commentNameInput.value = user.name;
  }
}

function ensureUserAuthModal() {
  if (document.getElementById('userAuthModal')) return;
  const modal = document.createElement('div');
  modal.id = 'userAuthModal';
  modal.className = 'hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-ink text-white rounded-4xl max-w-md w-full p-8 relative shadow-2xl border border-white/10">
      <button onclick="closeUserAuthModal()" class="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center text-white hover:bg-neutral-700 transition" aria-label="Close">✕</button>

      <!-- Logged-out View -->
      <div id="userAuthFormsWrap">
        <div class="flex items-center gap-2 mb-6">
          <button id="userTabLogin" onclick="switchUserAuthTab('login')" class="h-9 px-5 rounded-full bg-limebrand text-ink text-sm font-semibold transition">Login</button>
          <button id="userTabRegister" onclick="switchUserAuthTab('register')" class="h-9 px-5 rounded-full bg-[#1C1C1C] text-white/80 text-sm font-medium transition hover:bg-neutral-800">Sign Up</button>
        </div>

        <!-- Login Form -->
        <form id="userLoginForm" class="flex flex-col gap-4">
          <h3 class="text-2xl font-bold">Welcome back</h3>
          <input type="email" name="email" required placeholder="Email address" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <input type="password" name="password" required placeholder="Password" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <button type="submit" class="h-12 rounded-full bg-limebrand text-ink font-semibold hover:brightness-95 transition mt-1">Sign In</button>
        </form>

        <!-- Register Form -->
        <form id="userRegisterForm" class="hidden flex-col gap-4">
          <h3 class="text-2xl font-bold">Create an account</h3>
          <input type="text" name="name" required placeholder="Full Name" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <input type="email" name="email" required placeholder="Email address" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <input type="password" name="password" required minlength="6" placeholder="Password (min 6 chars)" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <button type="submit" class="h-12 rounded-full bg-limebrand text-ink font-semibold hover:brightness-95 transition mt-1">Create Account</button>
        </form>

        <p id="userAuthStatus" class="text-xs text-center hidden mt-4"></p>
      </div>

      <!-- Logged-in Account View -->
      <div id="userAccountWrap" class="hidden flex-col gap-4">
        <p class="text-xs font-semibold text-limebrand uppercase tracking-wider">Signed In</p>
        <h3 id="userAccountName" class="text-2xl font-bold"></h3>
        <p id="userAccountEmail" class="text-sm text-white/70 -mt-2"></p>
        <button id="userLogoutBtn" class="h-11 rounded-full bg-red-500/20 text-red-300 font-semibold hover:bg-red-500/30 transition mt-4">Logout</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) window.closeUserAuthModal();
  });

  document.getElementById('userLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = document.getElementById('userAuthStatus');
    const body = Object.fromEntries(new FormData(e.target).entries());
    st.className = 'text-xs text-center mt-4 text-white/70';
    st.textContent = 'Signing in...';
    st.classList.remove('hidden');
    try {
      const res = await fetch(`${PUBLIC_API_BASE}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setSavedUser(data.user, data.token);
      window.closeUserAuthModal();
    } catch (err) {
      st.className = 'text-xs text-center mt-4 text-red-400';
      st.textContent = err.message;
    }
  });

  document.getElementById('userRegisterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = document.getElementById('userAuthStatus');
    const body = Object.fromEntries(new FormData(e.target).entries());
    st.className = 'text-xs text-center mt-4 text-white/70';
    st.textContent = 'Creating account...';
    st.classList.remove('hidden');
    try {
      const res = await fetch(`${PUBLIC_API_BASE}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSavedUser(data.user, data.token);
      window.closeUserAuthModal();
    } catch (err) {
      st.className = 'text-xs text-center mt-4 text-red-400';
      st.textContent = err.message;
    }
  });

  document.getElementById('userLogoutBtn').addEventListener('click', async () => {
    await fetch(`${PUBLIC_API_BASE}/api/user/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setSavedUser(null, null);
    window.closeUserAuthModal();
  });
}

window.switchUserAuthTab = function (tab) {
  const loginForm = document.getElementById('userLoginForm');
  const regForm = document.getElementById('userRegisterForm');
  const tLogin = document.getElementById('userTabLogin');
  const tReg = document.getElementById('userTabRegister');
  document.getElementById('userAuthStatus')?.classList.add('hidden');
  if (tab === 'register') {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    regForm.classList.add('flex');
    tReg.className = 'h-9 px-5 rounded-full bg-limebrand text-ink text-sm font-semibold transition';
    tLogin.className = 'h-9 px-5 rounded-full bg-[#1C1C1C] text-white/80 text-sm font-medium transition hover:bg-neutral-800';
  } else {
    regForm.classList.add('hidden');
    regForm.classList.remove('flex');
    loginForm.classList.remove('hidden');
    tLogin.className = 'h-9 px-5 rounded-full bg-limebrand text-ink text-sm font-semibold transition';
    tReg.className = 'h-9 px-5 rounded-full bg-[#1C1C1C] text-white/80 text-sm font-medium transition hover:bg-neutral-800';
  }
};

window.openUserAuthModal = function () {
  ensureUserAuthModal();
  const modal = document.getElementById('userAuthModal');
  const user = getSavedUser();
  const formsWrap = document.getElementById('userAuthFormsWrap');
  const acctWrap = document.getElementById('userAccountWrap');
  if (user) {
    formsWrap.classList.add('hidden');
    acctWrap.classList.remove('hidden');
    acctWrap.classList.add('flex');
    document.getElementById('userAccountName').textContent = user.name;
    document.getElementById('userAccountEmail').textContent = user.email;
  } else {
    acctWrap.classList.add('hidden');
    acctWrap.classList.remove('flex');
    formsWrap.classList.remove('hidden');
  }
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.closeUserAuthModal = function () {
  const modal = document.getElementById('userAuthModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

updateUserNavUI();
  } catch {
    const updated = [newItem, ...getLocalComments()];
    localStorage.setItem('portfolio_comments', JSON.stringify(updated));
    renderComments(updated);
    commentStatus.classList.add('text-limebrand');
    commentStatus.textContent = 'Comment posted locally (backend offline).';
    commentForm.reset();
  }
});

loadComments();

// ==================== USER LOGIN / REGISTRATION SYSTEM ====================
const PUBLIC_API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('portfolio_user') || 'null');
  } catch {
    return null;
  }
}

function setSavedUser(user, token) {
  if (user && token) {
    localStorage.setItem('portfolio_user', JSON.stringify(user));
    localStorage.setItem('user_token', token);
  } else {
    localStorage.removeItem('portfolio_user');
    localStorage.removeItem('user_token');
  }
  updateUserNavUI();
}

function updateUserNavUI() {
  const btn = document.getElementById('userAuthBtn');
  const user = getSavedUser();
  if (btn) {
    if (user) {
      btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-limebrand"></span><span>${escapeHtml(user.name.split(' ')[0])}</span>`;
      btn.title = `Signed in as ${user.email}`;
    } else {
      btn.innerHTML = `<span>Login</span>`;
      btn.title = 'Sign in or Create Account';
    }
  }
  // Auto-fill comment name if logged in
  const commentNameInput = document.querySelector('#commentForm input[name="name"]');
  if (commentNameInput && user && !commentNameInput.value) {
    commentNameInput.value = user.name;
  }
}

function ensureUserAuthModal() {
  if (document.getElementById('userAuthModal')) return;
  const modal = document.createElement('div');
  modal.id = 'userAuthModal';
  modal.className = 'hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-ink text-white rounded-4xl max-w-md w-full p-8 relative shadow-2xl border border-white/10">
      <button onclick="closeUserAuthModal()" class="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center text-white hover:bg-neutral-700 transition" aria-label="Close">✕</button>

      <!-- Logged-out View -->
      <div id="userAuthFormsWrap">
        <div class="flex items-center gap-2 mb-6">
          <button id="userTabLogin" onclick="switchUserAuthTab('login')" class="h-9 px-5 rounded-full bg-limebrand text-ink text-sm font-semibold transition">Login</button>
          <button id="userTabRegister" onclick="switchUserAuthTab('register')" class="h-9 px-5 rounded-full bg-[#1C1C1C] text-white/80 text-sm font-medium transition hover:bg-neutral-800">Sign Up</button>
        </div>

        <!-- Login Form -->
        <form id="userLoginForm" class="flex flex-col gap-4">
          <h3 class="text-2xl font-bold">Welcome back</h3>
          <input type="email" name="email" required placeholder="Email address" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <input type="password" name="password" required placeholder="Password" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <button type="submit" class="h-12 rounded-full bg-limebrand text-ink font-semibold hover:brightness-95 transition mt-1">Sign In</button>
        </form>

        <!-- Register Form -->
        <form id="userRegisterForm" class="hidden flex-col gap-4">
          <h3 class="text-2xl font-bold">Create an account</h3>
          <input type="text" name="name" required placeholder="Full Name" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <input type="email" name="email" required placeholder="Email address" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <input type="password" name="password" required minlength="6" placeholder="Password (min 6 chars)" class="h-12 px-4 rounded-2xl bg-[#1C1C1C] border border-white/10 text-white placeholder-white/40 focus:border-limebrand outline-none" />
          <button type="submit" class="h-12 rounded-full bg-limebrand text-ink font-semibold hover:brightness-95 transition mt-1">Create Account</button>
        </form>

        <p id="userAuthStatus" class="text-xs text-center hidden mt-4"></p>
      </div>

      <!-- Logged-in Account View -->
      <div id="userAccountWrap" class="hidden flex-col gap-4">
        <p class="text-xs font-semibold text-limebrand uppercase tracking-wider">Signed In</p>
        <h3 id="userAccountName" class="text-2xl font-bold"></h3>
        <p id="userAccountEmail" class="text-sm text-white/70 -mt-2"></p>
        <button id="userLogoutBtn" class="h-11 rounded-full bg-red-500/20 text-red-300 font-semibold hover:bg-red-500/30 transition mt-4">Logout</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) window.closeUserAuthModal();
  });

  document.getElementById('userLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = document.getElementById('userAuthStatus');
    const body = Object.fromEntries(new FormData(e.target).entries());
    st.className = 'text-xs text-center mt-4 text-white/70';
    st.textContent = 'Signing in...';
    st.classList.remove('hidden');
    try {
      const res = await fetch(`${PUBLIC_API_BASE}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setSavedUser(data.user, data.token);
      window.closeUserAuthModal();
    } catch (err) {
      st.className = 'text-xs text-center mt-4 text-red-400';
      st.textContent = err.message;
    }
  });

  document.getElementById('userRegisterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const st = document.getElementById('userAuthStatus');
    const body = Object.fromEntries(new FormData(e.target).entries());
    st.className = 'text-xs text-center mt-4 text-white/70';
    st.textContent = 'Creating account...';
    st.classList.remove('hidden');
    try {
      const res = await fetch(`${PUBLIC_API_BASE}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSavedUser(data.user, data.token);
      window.closeUserAuthModal();
    } catch (err) {
      st.className = 'text-xs text-center mt-4 text-red-400';
      st.textContent = err.message;
    }
  });

  document.getElementById('userLogoutBtn').addEventListener('click', async () => {
    await fetch(`${PUBLIC_API_BASE}/api/user/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setSavedUser(null, null);
    window.closeUserAuthModal();
  });
}

window.switchUserAuthTab = function (tab) {
  const loginForm = document.getElementById('userLoginForm');
  const regForm = document.getElementById('userRegisterForm');
  const tLogin = document.getElementById('userTabLogin');
  const tReg = document.getElementById('userTabRegister');
  document.getElementById('userAuthStatus')?.classList.add('hidden');
  if (tab === 'register') {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    regForm.classList.add('flex');
    tReg.className = 'h-9 px-5 rounded-full bg-limebrand text-ink text-sm font-semibold transition';
    tLogin.className = 'h-9 px-5 rounded-full bg-[#1C1C1C] text-white/80 text-sm font-medium transition hover:bg-neutral-800';
  } else {
    regForm.classList.add('hidden');
    regForm.classList.remove('flex');
    loginForm.classList.remove('hidden');
    tLogin.className = 'h-9 px-5 rounded-full bg-limebrand text-ink text-sm font-semibold transition';
    tReg.className = 'h-9 px-5 rounded-full bg-[#1C1C1C] text-white/80 text-sm font-medium transition hover:bg-neutral-800';
  }
};

window.openUserAuthModal = function () {
  ensureUserAuthModal();
  const modal = document.getElementById('userAuthModal');
  const user = getSavedUser();
  const formsWrap = document.getElementById('userAuthFormsWrap');
  const acctWrap = document.getElementById('userAccountWrap');
  if (user) {
    formsWrap.classList.add('hidden');
    acctWrap.classList.remove('hidden');
    acctWrap.classList.add('flex');
    document.getElementById('userAccountName').textContent = user.name;
    document.getElementById('userAccountEmail').textContent = user.email;
  } else {
    acctWrap.classList.add('hidden');
    acctWrap.classList.remove('flex');
    formsWrap.classList.remove('hidden');
  }
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.closeUserAuthModal = function () {
  const modal = document.getElementById('userAuthModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

updateUserNavUI();

