import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
interface SearchFilters {
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
    address: string;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  category?: string[];
  features?: string[];
  transmission?: string[];
  fuelType?: string[];
  seatingCapacity?: number[];
  rating?: number;
  sortBy?: 'price' | 'rating' | 'distance' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: string;
  resultCount: number;
}

interface QuickFilter {
  id: string;
  name: string;
  filters: SearchFilters;
  isActive: boolean;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  recentSearches: SearchHistory[];
  savedSearches: SearchHistory[];
  quickFilters: QuickFilter[];
  suggestions: string[];
  isSearching: boolean;
  lastSearchTimestamp: number | null;
}

// Initial state
const initialState: SearchState = {
  query: '',
  filters: {},
  recentSearches: [],
  savedSearches: [],
  quickFilters: [
    {
      id: 'nearby',
      name: 'Nearby',
      filters: { sortBy: 'distance', sortOrder: 'asc' },
      isActive: false,
    },
    {
      id: 'budget',
      name: 'Budget Friendly',
      filters: { 
        priceRange: { min: 0, max: 30 }, 
        sortBy: 'price', 
        sortOrder: 'asc' 
      },
      isActive: false,
    },
    {
      id: 'luxury',
      name: 'Luxury',
      filters: { 
        category: ['luxury'], 
        rating: 4,
        sortBy: 'rating', 
        sortOrder: 'desc' 
      },
      isActive: false,
    },
    {
      id: 'eco-friendly',
      name: 'Eco-Friendly',
      filters: { 
        fuelType: ['hybrid', 'electric'],
        sortBy: 'rating',
        sortOrder: 'desc'
      },
      isActive: false,
    },
  ],
  suggestions: [],
  isSearching: false,
  lastSearchTimestamp: null,
};

// Search slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
      state.quickFilters.forEach(filter => {
        filter.isActive = false;
      });
    },
    resetSearch: (state) => {
      state.query = '';
      state.filters = {};
      state.quickFilters.forEach(filter => {
        filter.isActive = false;
      });
      state.suggestions = [];
    },
    addToRecentSearches: (state, action: PayloadAction<{
      query: string;
      filters: SearchFilters;
      resultCount: number;
    }>) => {
      const { query, filters, resultCount } = action.payload;
      
      // Remove existing search with same query
      state.recentSearches = state.recentSearches.filter(s => s.query !== query);
      
      // Add new search to beginning
      state.recentSearches.unshift({
        id: Date.now().toString(),
        query,
        filters,
        timestamp: new Date().toISOString(),
        resultCount,
      });
      
      // Keep only last 10 searches
      state.recentSearches = state.recentSearches.slice(0, 10);
      state.lastSearchTimestamp = Date.now();
    },
    removeFromRecentSearches: (state, action: PayloadAction<string>) => {
      state.recentSearches = state.recentSearches.filter(s => s.id !== action.payload);
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    saveSearch: (state, action: PayloadAction<SearchHistory>) => {
      const existingIndex = state.savedSearches.findIndex(s => s.id === action.payload.id);
      if (existingIndex !== -1) {
        state.savedSearches[existingIndex] = action.payload;
      } else {
        state.savedSearches.push(action.payload);
      }
    },
    removeSavedSearch: (state, action: PayloadAction<string>) => {
      state.savedSearches = state.savedSearches.filter(s => s.id !== action.payload);
    },
    toggleQuickFilter: (state, action: PayloadAction<string>) => {
      const filter = state.quickFilters.find(f => f.id === action.payload);
      if (filter) {
        filter.isActive = !filter.isActive;
        
        if (filter.isActive) {
          // Apply filter
          state.filters = { ...state.filters, ...filter.filters };
        } else {
          // Remove filter (simplified - in real app you'd need more complex logic)
          const filterKeys = Object.keys(filter.filters) as (keyof SearchFilters)[];
          filterKeys.forEach(key => {
            delete state.filters[key];
          });
        }
      }
    },
    setQuickFilters: (state, action: PayloadAction<QuickFilter[]>) => {
      state.quickFilters = action.payload;
    },
    setSuggestions: (state, action: PayloadAction<string[]>) => {
      state.suggestions = action.payload;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    setLocation: (state, action: PayloadAction<{
      latitude: number;
      longitude: number;
      address: string;
      radius?: number;
    }>) => {
      state.filters.location = {
        ...action.payload,
        radius: action.payload.radius || 10,
      };
    },
    setDateRange: (state, action: PayloadAction<{
      startDate: string;
      endDate: string;
    }>) => {
      state.filters.dateRange = action.payload;
    },
    setPriceRange: (state, action: PayloadAction<{
      min: number;
      max: number;
    }>) => {
      state.filters.priceRange = action.payload;
    },
    toggleCategory: (state, action: PayloadAction<string>) => {
      if (!state.filters.category) {
        state.filters.category = [];
      }
      
      const category = action.payload;
      const index = state.filters.category.indexOf(category);
      
      if (index !== -1) {
        state.filters.category.splice(index, 1);
      } else {
        state.filters.category.push(category);
      }
      
      // Remove category filter if empty
      if (state.filters.category.length === 0) {
        delete state.filters.category;
      }
    },
    toggleFeature: (state, action: PayloadAction<string>) => {
      if (!state.filters.features) {
        state.filters.features = [];
      }
      
      const feature = action.payload;
      const index = state.filters.features.indexOf(feature);
      
      if (index !== -1) {
        state.filters.features.splice(index, 1);
      } else {
        state.filters.features.push(feature);
      }
      
      // Remove features filter if empty
      if (state.filters.features.length === 0) {
        delete state.filters.features;
      }
    },
    setSortBy: (state, action: PayloadAction<{
      sortBy: SearchFilters['sortBy'];
      sortOrder: SearchFilters['sortOrder'];
    }>) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
    },
  },
});

// Selectors
export const selectSearchQuery = (state: { search: SearchState }) => state.search.query;
export const selectSearchFilters = (state: { search: SearchState }) => state.search.filters;
export const selectRecentSearches = (state: { search: SearchState }) => state.search.recentSearches;
export const selectSavedSearches = (state: { search: SearchState }) => state.search.savedSearches;
export const selectQuickFilters = (state: { search: SearchState }) => state.search.quickFilters;
export const selectSearchSuggestions = (state: { search: SearchState }) => state.search.suggestions;
export const selectIsSearching = (state: { search: SearchState }) => state.search.isSearching;

// Derived selectors
export const selectActiveQuickFilters = (state: { search: SearchState }) =>
  state.search.quickFilters.filter(f => f.isActive);

export const selectHasActiveFilters = (state: { search: SearchState }) => {
  const filters = state.search.filters;
  return Object.keys(filters).length > 0 || 
         state.search.quickFilters.some(f => f.isActive);
};

export const selectSearchState = (state: { search: SearchState }) => ({
  query: state.search.query,
  filters: state.search.filters,
  hasActiveFilters: Object.keys(state.search.filters).length > 0 || 
                   state.search.quickFilters.some(f => f.isActive),
});

// Actions
export const {
  setQuery,
  setFilters,
  clearFilters,
  resetSearch,
  addToRecentSearches,
  removeFromRecentSearches,
  clearRecentSearches,
  saveSearch,
  removeSavedSearch,
  toggleQuickFilter,
  setQuickFilters,
  setSuggestions,
  clearSuggestions,
  setSearching,
  setLocation,
  setDateRange,
  setPriceRange,
  toggleCategory,
  toggleFeature,
  setSortBy,
} = searchSlice.actions;

// Reducer
export default searchSlice.reducer;