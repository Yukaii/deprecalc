# DeprecCalc - Phone Depreciation Cost Calculator

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, build, and test the repository:
- Install pnpm globally: `npm install -g pnpm`
- Install dependencies: `pnpm install` -- takes 13 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Build application: `pnpm run build` -- takes 18 seconds. NEVER CANCEL. Set timeout to 45+ seconds.
- Run linting: `pnpm run lint` -- takes 3 seconds after initial setup. First run may take 5+ minutes to configure ESLint. NEVER CANCEL initial setup. Set timeout to 10+ minutes for first run, 30+ seconds for subsequent runs.

### Run the application:
- ALWAYS run the bootstrapping steps first.
- Development server: `pnpm run dev` -- starts in 1.3 seconds, available at http://localhost:3000
- Production server: `pnpm run build && pnpm run start` -- production ready in 280ms after build

### Prerequisites:
- Node.js 20.19.5+ (verified working version)
- pnpm package manager (install with `npm install -g pnpm`)
- No additional system dependencies required

## Validation

### Manual Validation Requirements:
ALWAYS manually validate any new code changes by testing complete user scenarios:

1. **iPhone Calculator Workflow**:
   - Navigate to http://localhost:3000
   - Verify "iPhone" button is selected by default
   - Click "購買二手機" (Buy Used Phone) if not already selected
   - Click any iPhone model (e.g., "iPhone 15")
   - Verify price updates in "二手購入價格" field (e.g., to 16000 for iPhone 15)
   - Verify calculation results update automatically in right panel showing:
     - Total cost (總持有成本)
     - Monthly cost (月均成本)  
     - Estimated price after years (預估 X 年後市價)
     - Net resale amount (賣出後實得金額)

2. **Android Calculator Workflow**:
   - Click "Android" phone type button
   - Verify Android models appear (Galaxy S24, Galaxy S23, Pixel 8, etc.)
   - Click any model's "標準版" or "Pro/Ultra" button
   - Verify price updates and calculations refresh
   - Verify depreciation rates shown (e.g., "年折舊 60.0%")

3. **Interactive Features**:
   - Test platform fee quick-set buttons (露天拍賣, 蝦皮購物, etc.)
   - Test depreciation model buttons (階段式折舊, 指數折舊, 線性折舊)
   - Test preset scenario buttons at bottom
   - Verify all number inputs accept values and trigger recalculation

4. **Theme Toggle**:
   - Test the theme toggle button (top right) switches between light/dark modes

### Build and Test Validation:
- ALWAYS run `pnpm run build` after making code changes to ensure no build errors
- ALWAYS run `pnpm run lint` and fix any linting errors before committing
- Lint commonly reports TypeScript issues in app/page.tsx - these are expected and should be addressed

### CI/Build Validation:
- No GitHub Actions workflows currently exist
- The application builds successfully with static optimization
- All pages are pre-rendered as static content
- Build produces optimized bundles (~105 KB first load JS)

## Common Tasks

The following are outputs from frequently run commands. Reference them instead of viewing, searching, or running bash commands to save time.

### Repository Structure
```
/home/runner/work/deprecalc/deprecalc/
├── .git/
├── .gitignore
├── .eslintrc.json          # ESLint configuration (created during setup)
├── README.md              # Basic project info and v0.app integration
├── app/
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main calculator page (1,219 lines)
├── components/
│   ├── theme-provider.tsx # Theme context provider
│   ├── theme-toggle.tsx   # Theme toggle component
│   └── ui/               # Radix UI components
├── components.json        # Shadcn/ui configuration
├── lib/                   # Utility functions
├── next.config.mjs       # Next.js configuration
├── package.json          # Dependencies and scripts
├── pnpm-lock.yaml       # Package lock file
├── postcss.config.mjs   # PostCSS configuration
├── public/              # Static assets
├── styles/              # Additional styles
└── tsconfig.json        # TypeScript configuration
```

### Key Files to Know:
- **app/page.tsx**: Main calculator logic (1,219 lines) - contains all phone models, pricing data, and calculation functions
- **package.json**: Scripts are `dev`, `build`, `start`, `lint`
- **next.config.mjs**: Disables ESLint/TypeScript checks during build, enables image optimization
- **components/ui/**: Radix UI components for forms, cards, buttons, inputs
- No test files exist - this project has no testing infrastructure

### Package.json Scripts:
```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "lint": "next lint", 
    "start": "next start"
  }
}
```

### Dependencies:
- **Framework**: Next.js 14.2.16 with React 18
- **Styling**: Tailwind CSS v4 with various Radix UI components
- **Package Manager**: pnpm (uses pnpm-lock.yaml)
- **TypeScript**: Version 5.0.2 with strict configuration

## Project Context

### What This Application Does:
DeprecCalc is a phone depreciation cost calculator that helps users calculate the real ownership cost of iPhone and Android phones over time, including:
- Purchase price vs resale value
- Platform fees (露天拍賣, 蝦皮, etc.)
- Maintenance costs (battery replacement, yearly maintenance)
- Different depreciation models (exponential, linear, tiered)
- Trade-in vs marketplace selling options

### Business Logic Location:
All calculator logic is in `app/page.tsx`:
- `priceAfterYearsExp()`, `priceAfterYearsLinear()`, `priceAfterYearsTiered()` - depreciation calculations
- `totalCostHold()` - main cost calculation function  
- `iPhoneModels[]`, `androidModels[]` - phone pricing and depreciation data
- Platform fee presets and depreciation rate presets

### Common Changes:
- **Adding new phone models**: Update `iPhoneModels[]` or `androidModels[]` arrays in app/page.tsx
- **Updating pricing**: Modify `basePrice`, `usedBasePrice` values in model arrays
- **UI changes**: Modify JSX in app/page.tsx or components in components/ui/
- **Styling**: Edit Tailwind classes or globals.css
- **Always check app/page.tsx after making changes to phone model data**

### External Integration:
- Built with v0.app and syncs automatically
- Deployed on Vercel
- Links to GitHub repository in footer
- Uses Vercel Analytics (may show loading errors in dev)

## Troubleshooting

### Common Issues:
- **ESLint setup**: First `pnpm run lint` takes 5+ minutes to install and configure ESLint
- **TypeScript warnings**: Expected warnings about unused functions and `any` types in app/page.tsx
- **Vercel Analytics errors**: Normal in development, ignore "Failed to load resource" console errors
- **Build caching**: No build cache configured - builds are always clean (18 seconds)

### Development Workflow:
1. Make changes to code
2. Test in development server: `pnpm run dev`
3. Validate manually using the scenarios above
4. Run `pnpm run build` to ensure no build errors
5. Run `pnpm run lint` and fix any new issues
6. Test production build: `pnpm run start`

### Performance Notes:
- Static site generation - all pages pre-rendered
- First load JS: 87.1 KB shared, 105 KB total for main page
- Development server hot reload works instantly
- Production builds are fully optimized