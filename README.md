# MOKA Garut Website

Official-style web presence for **Paguyuban Mojang Jajaka Kabupaten Garut**, built to present the organization, flagship programs, news, and recruitment information in a modern responsive interface.

## Project highlights

- Responsive, image-led landing experience for a cultural and youth organization
- Program showcase for Paguyuban Mojang Jajaka Kabupaten Garut
- Dynamic news cards populated from external article metadata
- Recruitment call-to-action for Pasanggiri Mojang Jajaka
- Smooth scrolling and motion-focused interaction design
- Reusable component system for cards, carousel, typography, and navigation

## Stack

- **Next.js 15**
- **React 19 + TypeScript**
- **Tailwind CSS 4**
- **Prisma**
- **Cheerio** for external metadata parsing
- **Motion / Lenis** for interaction and smooth scrolling
- **Radix UI** primitives

## Application flow

```text
External news sources
        │
        ▼
Metadata parser
        │
        ▼
Next.js application
 ├─ Hero / organization identity
 ├─ Programs
 ├─ News & updates
 └─ Recruitment CTA
```

## Local development

```bash
npm install
npm run dev
```

The application is a project for **Paguyuban Mojang Jajaka Kabupaten Garut** and is maintained as part of my web engineering portfolio.

## Developer

[Adi Haditya Nursyam](https://github.com/soezyxstt)
