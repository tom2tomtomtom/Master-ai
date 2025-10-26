# Tech Stack

> Created: 2024-08-04
> Environment: Development → Production
> Solo Development Optimized

## Frontend Stack
**Next.js 15.4.5** - React framework with App Router
- **React 18.3.1** - Component library with latest features
- **TypeScript 5.7.2** - Type safety and developer experience
- **Tailwind CSS 3.4.17** - Utility-first styling system
- **Radix UI Components** - Accessible headless UI primitives
  - Dialog, Dropdown Menu, Tabs, Slot components
- **Headless UI + Hero Icons** - Additional component library
- **Lucide React** - Modern icon system
- **Class Variance Authority + clsx** - Dynamic styling utilities

## Backend & Database
**PostgreSQL Database** - Production-ready relational database
- **Prisma 6.13.0** - Type-safe ORM and database toolkit
- **Database Features:**
  - User management with subscription tiers
  - Learning content and progress tracking
  - Team/organization management
  - Certification and assessment system
  - Payment integration ready (Stripe)

## Authentication & Security
**NextAuth.js 4.24.10** - Complete authentication solution
- **Prisma Adapter** - Database session management
- **Providers Configured:**
  - Credentials (email/password with bcrypt hashing)
  - Google OAuth (environment-based)
  - GitHub OAuth (environment-based)
- **bcryptjs 2.4.3** - Password hashing and validation

## UI/UX Components
**Established Design System:**
- Custom Button component with variants
- Tailwind-based responsive layouts
- Professional landing page with pricing tiers
- Mobile-first responsive design approach
- Color scheme: Blue/Purple gradient branding

## Development Tools
**Code Quality & Standards:**
- ESLint 8.57.1 with Next.js config
- TypeScript strict mode enabled
- Path aliases (@/* for src imports)
- PostCSS with Tailwind integration

## Data Visualization
**Recharts 2.15.0** - React charting library for analytics dashboards

## Deployment & Infrastructure
**Preferred Platforms:** Vercel (primary) or Railway (alternative)
- **Next.js Deployment**: Optimized for Vercel platform
- **Database**: PostgreSQL (can use Vercel Postgres or Railway)
- **Environment**: Production-ready configuration
- **CDN**: Automatic with Vercel deployment
- **SSL**: Automatic HTTPS handling

## Key Dependencies & Versions
```json
{
  "next": "15.4.5",
  "react": "18.3.1",
  "typescript": "5.7.2",
  "prisma": "6.13.0",
  "@prisma/client": "6.13.0",
  "next-auth": "4.24.10",
  "tailwindcss": "3.4.17",
  "@radix-ui/react-*": "Latest stable",
  "bcryptjs": "2.4.3"
}
```

## Development Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - Code linting

## Architecture Decisions
**Database Strategy:** PostgreSQL for reliability and complex queries
**Styling Approach:** Tailwind for rapid development and consistency
**Component Strategy:** Radix UI for accessibility, custom components for brand
**Authentication:** NextAuth.js for OAuth + custom credentials
**Type Safety:** Full TypeScript coverage with strict mode

## Solo Developer Optimizations
- Pre-built UI components for rapid development
- Type-safe database operations with Prisma
- Automatic authentication handling
- Responsive design system ready for use
- Production deployment ready with minimal configuration