const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config();

const authRouter = require('./routes/auth');
const userAuthRouter = require('./routes/userAuth');
const adminRouter = require('./routes/admin');
const publicRouter = require('./routes/public');
const commentsRouter = require('./routes/comments');
const contactRouter = require('./routes/contact');
const mediaRouter = require('./routes/media');

const Project = require('./models/Project');
const BlogPost = require('./models/BlogPost');
const SiteSettings = require('./models/SiteSettings');
const Album = require('./models/Album');
const Photo = require('./models/Photo');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';

app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/user', userAuthRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/media', mediaRouter);

// Serve /admin, /gallery & frontend static files
const frontendDir = path.join(__dirname, '..', 'frontend');
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(frontendDir, 'admin.html'));
});
app.get(['/gallery', '/gallery/'], (req, res) => {
  res.sendFile(path.join(frontendDir, 'gallery.html'));
});

app.use(express.static(frontendDir));

async function seedDefaultsIfEmpty() {
  const settingsCount = await SiteSettings.countDocuments({ key: 'main' });
  if (settingsCount === 0) {
    await SiteSettings.create({ key: 'main' });
  }

  const projectCount = await Project.countDocuments();
  if (projectCount === 0) {
    await Project.insertMany([
      { title: 'Voltgear EV Tracking', category: 'UiUx', image: 'assets/81fdc9d3431a5af6.png', order: 1 },
      { title: 'Camping Website Design', category: 'Website', image: 'assets/72e46ce3be6c9579.png', order: 2 },
      { title: 'Minimal - Brand Animation', category: 'Branding', image: 'assets/503c70a35aac3f59.png', order: 3 },
      { title: 'Wood E-Commerce Mobile', category: 'UiUx', image: 'assets/b92590d30d782cba.png', order: 4 },
    ]);
  }

  const blogCount = await BlogPost.countDocuments();
  if (blogCount === 0) {
    await BlogPost.insertMany([
      {
        title: '14 common design misconceptions',
        excerpt: 'Security weaknesses are critical in a network security system. Fuzzing is a common and dangerous vulnerability...',
        image: 'assets/e4624c39bf40e035.jpg',
        dateLabel: 'Aug 14, 2024',
        featured: true,
      },
      {
        title: 'How to move from freelance design agency',
        image: 'assets/61c327cf20f82355.png',
        dateLabel: 'Aug 10, 2024',
      },
      {
        title: '10 things nobody told you a web designer',
        image: 'assets/7193ef1466721270.png',
        dateLabel: 'Aug 05, 2024',
      },
      {
        title: '5 web design blogs you should be reading',
        image: 'assets/3fc374ad35d47a34.png',
        dateLabel: 'Jul 28, 2024',
      },
      {
        title: 'Balancing design creativity with efficiency',
        image: 'assets/859a033036432a65.png',
        dateLabel: 'Jul 20, 2024',
      },
      {
        title: 'Find all everything from design to freelancing',
        image: 'assets/16ddb3e6aa162d0e.png',
        dateLabel: 'Jul 12, 2024',
      },
      {
        title: 'Webflow freelancer to agency owner path',
        image: 'assets/59f3ad7c7b9169b7.png',
        dateLabel: 'Jul 04, 2024',
      },
    ]);
  }

  const albumCount = await Album.countDocuments();
  if (albumCount === 0) {
    const createdAlbums = await Album.insertMany([
      {
        title: 'UI & Product Shots',
        category: 'Design',
        description: 'Selected interface concepts, hardware mockups, and visual explorations.',
        coverImage: 'assets/81fdc9d3431a5af6.png',
        order: 1,
      },
      {
        title: 'Studio & Workspace',
        category: 'Lifestyle',
        description: 'Behind-the-scenes snapshots from Manchester studio & creative sessions.',
        coverImage: 'assets/17ae2ac91d8715a7.jpg',
        order: 2,
      },
      {
        title: 'Visual Experiments',
        category: 'Photography',
        description: '3D renders, lighting studies, and minimalist compositions.',
        coverImage: 'assets/72e46ce3be6c9579.png',
        order: 3,
      },
    ]);

    await Photo.insertMany([
      { albumId: createdAlbums[0]._id, title: 'Voltgear EV Dashboard', caption: 'Dark mode telemetry interface', imageUrl: 'assets/81fdc9d3431a5af6.png' },
      { albumId: createdAlbums[0]._id, title: 'Minimal Brand System', caption: 'Editorial typography & grid study', imageUrl: 'assets/503c70a35aac3f59.png' },
      { albumId: createdAlbums[0]._id, title: 'Wood E-Commerce Flow', caption: 'Mobile shopping experience', imageUrl: 'assets/b92590d30d782cba.png' },
      { albumId: createdAlbums[1]._id, title: 'Creative Direction', caption: 'Morning design sprint', imageUrl: 'assets/17ae2ac91d8715a7.jpg' },
      { albumId: createdAlbums[1]._id, title: 'Strategy Session', caption: 'Wireframing & product discovery', imageUrl: 'assets/da0a55a11cc80a9c.jpg' },
      { albumId: createdAlbums[2]._id, title: 'Glass Refraction Study', caption: 'Abstract 3D lighting', imageUrl: 'assets/72e46ce3be6c9579.png' },
      { albumId: createdAlbums[2]._id, title: 'Pastel Cube Render', caption: 'Soft gradient material test', imageUrl: 'assets/16ddb3e6aa162d0e.png' },
    ]);
  }
}

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDefaultsIfEmpty();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Admin Control Center: http://localhost:${PORT}/admin`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
