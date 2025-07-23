# Skeleton Loading Components

This folder contains a comprehensive skeleton loading system that provides smooth loading states across the Island Rides application.

## 🎯 Purpose

Skeleton screens improve perceived performance by showing users a preview of content while data loads, reducing bounce rates and improving user experience.

## 📁 Component Structure

### Base Components
- **`SkeletonBase`** - Core shimmer animation component with configurable dimensions and timing

### Screen-Specific Skeletons
- **`VehicleCardSkeleton`** - For vehicle listings and search results
- **`SearchResultsSkeleton`** - Complete search results page with header and filters
- **`VehicleDetailSkeleton`** - Full vehicle detail page with gallery and booking bar

### Feature-Specific Skeletons
- **`VehicleReviewsSkeleton`** - Review sections with configurable review count
- **`ProfileSkeleton`** - User profiles with avatar, stats, and menu items
- **`BookingsSkeleton`** - Booking lists with vehicle info and booking details
- **`SavedSearchesSkeleton`** - Saved searches with statistics
- **`OwnerDashboardSkeleton`** - Dashboard metrics, charts, and quick actions
- **`VehiclePerformanceSkeleton`** - Vehicle performance cards and analytics
- **`VerificationSkeleton`** - Document verification status and upload sections

## 🚀 Usage Examples

### Basic Usage
```tsx
import { VehicleCardSkeleton, SKELETON_CONFIGS } from '../components/skeletons';

const SearchScreen = () => {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <VehicleCardSkeleton compact={false} />;
  }
  
  return <VehicleResults />;
};
```

### With Configurations
```tsx
import { SearchResultsSkeleton, SKELETON_CONFIGS } from '../components/skeletons';

const SearchResults = () => {
  const config = SKELETON_CONFIGS.search;
  
  return (
    <SearchResultsSkeleton 
      itemCount={config.itemCount}
      compact={config.compact}
      showHeader={true}
    />
  );
};
```

### Multiple Items
```tsx
// Show 8 skeleton cards for search results
{Array.from({ length: 8 }, (_, index) => (
  <VehicleCardSkeleton key={index} compact={true} />
))}
```

## ⚙️ Configuration Options

The `SKELETON_CONFIGS` object provides pre-configured settings:

```tsx
// Available configurations
SKELETON_CONFIGS.search      // Search results (6 items, 1500ms animation)
SKELETON_CONFIGS.reviews     // Reviews (3 items, 1400ms animation)
SKELETON_CONFIGS.dashboard   // Dashboard (4 metrics, 1600ms animation)
SKELETON_CONFIGS.profile     // Profile (6 menu items, 1300ms animation)
SKELETON_CONFIGS.bookings    // Bookings (5 items, 1400ms animation)
```

## 🎨 Animation System

All skeletons use a **shimmer effect** with:
- **Linear translation** from left to right
- **Configurable duration** (800ms - 2500ms)
- **Smooth easing** for natural movement
- **Infinite repeat** until content loads

### Loading Duration Guidelines
```tsx
LOADING_DURATIONS.fast    // 800ms  - Quick API calls
LOADING_DURATIONS.normal  // 1500ms - Standard loading  
LOADING_DURATIONS.slow    // 2500ms - Heavy data processing
```

## 🎯 Best Practices

### 1. Match Real Content Structure
Skeleton shapes should closely match the actual content layout:
```tsx
// ✅ Good - matches real vehicle card structure
<VehicleCardSkeleton compact={isCompactView} />

// ❌ Bad - generic placeholder that doesn't match
<GenericLoader />
```

### 2. Use Appropriate Timing
```tsx
// ✅ Quick API calls
<SkeletonBase animationDuration={LOADING_DURATIONS.fast} />

// ✅ Heavy data processing
<SkeletonBase animationDuration={LOADING_DURATIONS.slow} />
```

### 3. Progressive Loading
Show skeletons immediately, don't wait:
```tsx
// ✅ Show skeleton immediately
const [loading, setLoading] = useState(true);

// ❌ Delay showing skeleton
const [loading, setLoading] = useState(false);
setTimeout(() => setLoading(true), 100);
```

### 4. Consistent Patterns
Use the same skeleton for the same content type:
```tsx
// ✅ Consistent across all vehicle lists
<VehicleCardSkeleton compact={isListView} />
```

## 🔧 Customization

### Creating New Skeletons
1. Extend `SkeletonBase` for core functionality
2. Match the real component's layout structure
3. Use consistent spacing and sizing
4. Add to the index.ts exports

### Animation Customization
```tsx
<SkeletonBase
  width="100%"
  height={200}
  borderRadius={8}
  animationDuration={1200}
/>
```

## 📱 Platform Considerations

- **iOS**: Smooth 60fps animations with spring physics
- **Android**: Optimized for various performance levels
- **Web**: Fallback support for older browsers

## 🧪 Testing

When testing skeleton components:
1. Verify animations run smoothly at 60fps
2. Check layout matches real content dimensions
3. Test with various screen sizes
4. Validate accessibility with screen readers

## 📈 Performance Impact

- **Animations run on UI thread** (React Native Reanimated)
- **Minimal re-renders** with shared values
- **Optimized for 60fps** on mid-range devices
- **~2KB bundle impact** per skeleton component