const BLOG_API_BASE = window.location.port === '5000' ? '' : 'http://localhost:5000';

const DEFAULT_POSTS = [
  {
    slug: '14-common-design-misconceptions',
    title: '14 common design misconceptions',
    dateLabel: 'Aug 14, 2024',
    readTime: '6 min read',
    image: 'assets/e4624c39bf40e035.jpg',
    excerpt: 'Great design is not just how something looks — it is how effortlessly people understand and use it.',
    paragraphs: [
      'Many teams treat visual polish as a final coat of paint rather than a foundational part of product architecture. When design is brought in early, it eliminates friction, clarifies user flows, and reduces engineering rework.',
      'Another common myth is that minimalism means removing features. True minimalism removes visual noise while keeping every essential action obvious and accessible.',
      'Consistency across typography, spacing, and interactive feedback builds trust faster than flashy animations. Focus on clarity first, then layer subtle delight.',
    ],
  },
  {
    slug: 'how-to-move-from-freelance-design-agency',
    title: 'How to move from freelance design agency',
    dateLabel: 'Aug 10, 2024',
    readTime: '5 min read',
    image: 'assets/61c327cf20f82355.png',
    excerpt: 'Transitioning from solo freelancing to running a focused studio requires repeatable systems.',
    paragraphs: [
      'As a solo freelancer, your bottleneck is always your own calendar. Scaling into a studio starts by documenting your discovery, wireframing, and handoff processes so collaborators can plug in seamlessly.',
      'Productized service tiers and clear milestone communication help clients feel confident while protecting your team from scope creep.',
    ],
  },
  {
    slug: '10-things-nobody-told-you-a-web-designer',
    title: '10 things nobody told you a web designer',
    dateLabel: 'Aug 05, 2024',
    readTime: '7 min read',
    image: 'assets/7193ef1466721270.png',
    excerpt: 'Real-world lessons on client communication, accessibility, and shipping fast.',
    paragraphs: [
      'Half of great web design happens in conversations before you ever open Figma. Asking the right business questions saves weeks of revisions later.',
      'Real content always breaks placeholder layouts — design with actual copy, edge-case names, and responsive breakpoints from day one.',
    ],
  },
  {
    slug: '5-web-design-blogs-you-should-be-reading',
    title: '5 web design blogs you should be reading',
    dateLabel: 'Jul 28, 2024',
    readTime: '4 min read',
    image: 'assets/3fc374ad35d47a34.png',
    excerpt: 'Stay sharp with curated publications covering UI systems, motion, and frontend craft.',
    paragraphs: [
      'Keeping up with modern web craft means balancing visual inspiration with deep technical understanding of CSS, typography, and performance.',
      'Make a habit of dissecting one great live site every week to see how spacing, contrast, and micro-interactions work together.',
    ],
  },
  {
    slug: 'balancing-design-creativity-with-efficiency',
    title: 'Balancing design creativity with efficiency',
    dateLabel: 'Jul 20, 2024',
    readTime: '5 min read',
    image: 'assets/859a033036432a65.png',
    excerpt: 'How design systems free up time for bold creative direction.',
    paragraphs: [
      'Reusable tokens and component libraries do not limit creativity — they automate repetitive decisions so you can spend more energy on storytelling and custom interactions.',
    ],
  },
  {
    slug: 'find-all-everything-from-design-to-freelancing',
    title: 'Find all everything from design to freelancing',
    dateLabel: 'Jul 12, 2024',
    readTime: '6 min read',
    image: 'assets/16ddb3e6aa162d0e.png',
    excerpt: 'A practical roadmap for building a sustainable creative career.',
    paragraphs: [
      'Building a strong portfolio is about showing how you think through problems, not just posting pretty screenshots. Explain the goal, constraints, and measurable outcome for every case study.',
    ],
  },
  {
    slug: 'webflow-freelancer-to-agency-owner-path',
    title: 'Webflow freelancer to agency owner path',
    dateLabel: 'Jul 04, 2024',
    readTime: '5 min read',
    image: 'assets/59f3ad7c7b9169b7.png',
    excerpt: 'Turning no-code speed into a high-margin digital agency.',
    paragraphs: [
      'Modern visual development tools let small teams ship production sites in days instead of months. Pair fast execution with strong UX strategy to stand out.',
    ],
  },
  {
    slug: 'design-trends-you-should-follow-for-next-project',
    title: 'Design trends you should follow for next project',
    dateLabel: 'Jun 26, 2024',
    readTime: '4 min read',
    image: 'assets/df019dac73248bee.jpg',
    excerpt: 'Bento grids, high-contrast typography, and purposeful motion.',
    paragraphs: [
      'The best trends are rooted in usability: structured bento layouts, bold editorial type, and tactile micro-interactions that guide user attention naturally.',
    ],
  },
];

function resolveImg(url) {
  if (!url) return 'assets/e4624c39bf40e035.jpg';
  if (url.startsWith('/api/')) return `${BLOG_API_BASE}${url}`;
  return url;
}

function escapePostHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderArticle(post, related) {
  document.title = `${post.title} — Blog`;
  document.getElementById('postTitle').textContent = post.title;
  document.getElementById('postDate').textContent = post.dateLabel || 'Recent';
  document.getElementById('postReadTime').textContent = post.readTime || '5 min read';
  document.getElementById('postImage').src = resolveImg(post.image);
  document.getElementById('postImage').alt = post.title;

  const bodyEl = document.getElementById('postBody');
  const paragraphs = post.paragraphs || (post.content ? post.content.split(/\n+/) : [post.excerpt || '']);
  bodyEl.innerHTML = `
    ${post.excerpt ? `<p class="text-xl sm:text-2xl font-semibold text-ink leading-snug">${escapePostHtml(post.excerpt)}</p>` : ''}
    ${paragraphs.map((p) => `<p class="text-muted">${escapePostHtml(p)}</p>`).join('')}
    <div class="bg-surface rounded-3xl p-7 mt-4 border-l-4 border-limebrand">
      <p class="text-sm font-bold text-ink uppercase tracking-wider mb-2">Key Takeaway</p>
      <p class="text-base text-muted">Great digital products balance clean visual hierarchy, fast performance, and thoughtful user experience.</p>
    </div>
  `;

  const relEl = document.getElementById('relatedPostsGrid');
  relEl.innerHTML = (related || [])
    .slice(0, 3)
    .map((r) => {
      const slug = r.slug || r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const href = r._id ? `blog-post.html?id=${r._id}` : `blog-post.html?slug=${encodeURIComponent(slug)}`;
      return `
        <a href="${href}" class="relative h-[340px] rounded-3xl overflow-hidden group block">
          <img src="${escapePostHtml(resolveImg(r.image))}" alt="${escapePostHtml(r.title)}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
          <div class="absolute inset-0" style="background: linear-gradient(rgba(10,11,10,0) 0%, rgba(10,11,10,0.78) 100%);"></div>
          <div class="absolute bottom-6 left-6 right-6 text-white">
            <h3 class="text-xl font-semibold leading-snug">${escapePostHtml(r.title)}</h3>
          </div>
        </a>`;
    })
    .join('');
}

async function initBlogPost() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get('id') || params.get('slug') || DEFAULT_POSTS[0].slug;

  try {
    const res = await fetch(`${BLOG_API_BASE}/api/public/blogs/${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error('Not found in API');
    const data = await res.json();
    const fallbackMatch = DEFAULT_POSTS.find((p) => p.title.toLowerCase() === data.post.title.toLowerCase());
    const mergedPost = { ...fallbackMatch, ...data.post };
    renderArticle(mergedPost, data.related);
  } catch {
    const post = DEFAULT_POSTS.find((p) => p.slug === key) || DEFAULT_POSTS[0];
    const related = DEFAULT_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);
    renderArticle(post, related);
  }
}

initBlogPost();
