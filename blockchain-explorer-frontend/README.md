# Blockchain Explorer Frontend

A modern, responsive blockchain explorer for Bitcoin (BTC) and Ethereum (ETH) built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🔍 **Universal Search** - Search by block hash, transaction hash, or wallet address
- ⛓️ **Multi-Chain Support** - Bitcoin and Ethereum blockchains
- 📊 **Real-Time Updates** - Dashboard updates every 15 seconds
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Modern UI** - Clean interface with Tailwind CSS
- ⚡ **Fast Performance** - Built with Next.js 14 App Router and React Query

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Utilities**: date-fns, clsx

## Prerequisites

- Node.js 18 or higher
- Running blockchain indexer backend (see backend README)

## Installation

1. **Clone or navigate to the frontend directory**

```bash
cd blockchain-explorer-frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3001` (or next available port).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
blockchain-explorer-frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home/Dashboard page
│   ├── blocks/[chain]/[hash]/    # Block details page
│   ├── transactions/[chain]/[hash]/ # Transaction details page
│   └── address/[chain]/[address]/ # Address details page
├── components/                   # React components
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   └── Footer.tsx
│   ├── shared/                   # Shared UI components
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── Pagination.tsx
│   │   ├── CopyButton.tsx
│   │   └── StatsCard.tsx
│   └── Providers.tsx             # React Query provider
├── lib/                          # Utilities and hooks
│   ├── api.ts                    # API client
│   ├── utils.ts                  # Helper functions
│   └── hooks/                    # Custom React hooks
│       ├── useStatus.ts
│       ├── useBlocks.ts
│       ├── useTransactions.ts
│       └── useAddress.ts
├── types/                        # TypeScript types
│   └── api.ts
└── public/                       # Static assets
```

## Features & Usage

### Dashboard

The home page displays:
- Latest block information for BTC and ETH
- Sync status for both chains
- Real-time updates every 15 seconds
- Quick start guide

### Search

Use the search bar in the header to find:
- **Blocks** - Enter block hash
- **Transactions** - Enter transaction hash
- **Addresses** - Enter wallet address

Select BTC or ETH before searching.

### Block Details

View comprehensive block information:
- Block height and hash
- Timestamp
- Previous/parent block
- Transaction count
- Difficulty (BTC) or Gas usage (ETH)
- Miner address (ETH)

### Transaction Details

View transaction information:
- Transaction hash
- Block information
- Timestamp
- From/To addresses (ETH)
- Value transferred
- Gas usage (ETH)
- Transaction fee
- Status (ETH)

### Address Details

View wallet information:
- Address with copy functionality
- Current balance (ETH)
- Total transaction count
- Paginated transaction history
- Transaction details in table format

## API Integration

The frontend connects to the blockchain indexer backend API:

### Endpoints Used

**Bitcoin:**
- `GET /api/btc/blocks/:blockHash`
- `GET /api/btc/transactions/:txHash`
- `GET /api/btc/addresses/:address/transactions`

**Ethereum:**
- `GET /api/eth/blocks/:blockHash`
- `GET /api/eth/transactions/:txHash`
- `GET /api/eth/addresses/:address/transactions`
- `GET /api/eth/addresses/:address/balance`

**Status:**
- `GET /api/status`

### Configuration

Set the backend URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- ESLint for code linting
- TypeScript for type safety
- Prettier (recommended) for code formatting

## Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

Features adapt based on screen size:
- Collapsible navigation
- Responsive tables
- Mobile-optimized cards
- Touch-friendly buttons

## Performance Optimizations

- **React Query** caching and automatic refetching
- **Next.js** server-side rendering and static generation
- **Code splitting** for faster page loads
- **Optimized images** and assets
- **Lazy loading** for components

## Error Handling

The application handles:
- Network errors with retry functionality
- Invalid search inputs with user feedback
- Missing data with appropriate messages
- Loading states for all async operations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Backend Connection Issues

If you see "Failed to load blockchain status":

1. Ensure the backend is running: `npm start` in backend directory
2. Check the API URL in `.env.local`
3. Verify CORS is enabled on the backend
4. Check browser console for errors

### Build Errors

If you encounter build errors:

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Port Conflicts

If port 3000 is in use:

```bash
# Use a different port
PORT=3001 npm run dev
```

## License

MIT
