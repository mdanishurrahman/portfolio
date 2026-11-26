const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'main' },
    // User Profile fields
    fullName: { type: String, default: 'Anish Rahman' },
    handle: { type: String, default: '@andro' },
    roleTitle: { type: String, default: 'Lead Product Designer & Developer' },
    location: { type: String, default: 'Manchester, UK' },
    availabilityText: { type: String, default: 'Available for work' },
    avatarUrl: { type: String, default: 'assets/3468f14f5b14d883.jpg' },
    profileBio: {
      type: String,
      default:
        'Passionate and innovative web designer and developer with over 10 years of experience crafting visually stunning, high-performing digital products.',
    },
    socialLinks: {
      dribbble: { type: String, default: '#' },
      linkedin: { type: String, default: '#' },
      twitter: { type: String, default: '#' },
      github: { type: String, default: '#' },
      instagram: { type: String, default: '#' },
    },
    // Hero & Global Copy
    greeting: { type: String, default: 'Hey 👋 I’m Andro' },
    headlineLine1: { type: String, default: 'Designer &' },
    headlineLine2: { type: String, default: 'Developer' },
    heroBio: {
      type: String,
      default: 'Lead product designer and developer based in manchester, with over 10 years of experience.',
    },
    email: { type: String, default: 'mdanishur72@gmail.com' },
    yearsExp: { type: String, default: '20' },
    happyClients: { type: String, default: '2' },
    countries: { type: String, default: '160' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
