/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://example.com',
  generateRobotsTxt: true,
  exclude: [
    '/api/*',
    '/server-sitemap.xml',
    '/admin/*',
    '/_not-found',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://example.com/server-sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api',
          '/admin',
        ],
      },
    ],
  },
  generateIndexSitemap: false,
}
