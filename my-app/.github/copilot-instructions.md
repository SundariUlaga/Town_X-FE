# AI Agent Instructions for Town App

## Project Overview

This is a React-based property listing application built with Vite. The app allows users to browse, search, and filter real estate properties.

## Architecture and Data Flow

- **Frontend Framework**: React 19 with Vite for build tooling
- **UI Components**: Located in `src/components/`, following a modular structure
- **API Integration**: REST API calls handled through `src/services/api.js`
- **Routing**: Uses React Router v7 for navigation
- **State Management**: Local component state with React hooks

### Key Components

- `PropertyFeed.jsx`: Main listing component with filtering and search
- `PropertyDetails.jsx`: Individual property view
- `CreatePost.jsx`: Property creation form
- `Favourites.jsx`: Saved properties view
- `DynamicLandingPage.jsx`: Homepage with category selection

### API Integration

- Base API configured in `services/configAPI.js`
- API endpoints defined in `services/api.js`
- Environment variables used for API URL (VITE_API_URL)
- Default fallback to 'http://localhost:8024'

## Development Workflow

### Setup and Running

```bash
npm install
npm run dev     # Start development server
npm run build   # Production build
npm run preview # Preview production build
```

### Code Conventions

1. All React components use functional style with hooks
2. API calls are centralized in `services/api.js`
3. Icons use `DynamicIcon` component wrapper around `lucide-react`
4. Component state management:
   - Local state for component-specific data
   - URL state for sharable filters/searches
   - Props for parent-child communication

### Common Patterns

- Filter/Search Implementation:
  ```jsx
  // See PropertyFeed.jsx for reference
  const [filters, setFilters] = useState({
    bhkType: "",
    minPrice: "",
    maxPrice: "",
    propertyFor: "",
    furnishing: "",
    parking: false,
    amenities: [],
  });
  ```
- Error Handling:
  ```jsx
  try {
    const response = await propertyAPI.methodName();
  } catch (error) {
    console.error("Error description:", error);
    setError(error.message);
  }
  ```

## Integration Points

1. Backend API - RESTful endpoints (see `services/api.js`)
2. Environment Variables:
   - VITE_API_URL: Backend API URL

## Notes for AI Agents

- Check `vite.config.js` for build configuration
- Property filters are applied via URL params
- Error boundaries not implemented - handle errors in try/catch blocks
- Use Tailwind for styling (v4.1.14)
