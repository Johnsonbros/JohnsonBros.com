# Page Speed Optimization Strategy - 131 Analysis

**P3-SEO-005 | Created: 2026-01-26 | Author: 131 Agent**

---

## Problem

**Improve Core Web Vitals (LCP, CLS, INP) scores on 25 service area pages built with React 19, Vite, and Tailwind CSS that include Google Maps embeds and review widgets.**

---

## Solution 1: Image Optimization (WebP, Srcset, Lazy Loading)

### Approach
Implement comprehensive image optimization using Vite plugins that automatically generate modern image formats (WebP/AVIF) with responsive srcset attributes.

### Pros
- 30% smaller file sizes with WebP
- Build-time optimization (no runtime overhead)
- Native browser support in React 19
- Direct LCP impact

### Cons
- Build time increases 30-60 seconds
- Storage overhead 2-3x
- Initial setup complexity

### Expected Improvements
- **LCP**: 15-30% improvement
- **CLS**: 5-10% improvement

---

## Solution 2: Third-Party Script Optimization (Facade Pattern)

### Approach
Implement facade pattern (click-to-load) for Google Maps and review widgets - show static placeholder, load interactive on user click.

### Pros
- **Massive impact**: 72% TBT reduction, +10 PageSpeed score
- **Bandwidth**: 60% reduction (6.44 MB → 2.58 MB)
- **Page load**: 2.5x faster
- Only loads resources for engaged users

### Cons
- Requires one extra click for interactivity
- Two API calls (Static + JavaScript Maps)
- Maintenance of two implementations

### Example Code

```tsx
// GoogleMapFacade.tsx
import { useState } from 'react';

export function GoogleMapFacade({ address, zoom = 15 }) {
  const [isActive, setIsActive] = useState(false);

  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=${zoom}&size=600x400&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(address)}`;

  if (isActive) {
    return (
      <iframe
        src={embedUrl}
        width="600"
        height="400"
        style={{ border: 0 }}
        loading="lazy"
        title="Google Map"
      />
    );
  }

  return (
    <button
      onClick={() => setIsActive(true)}
      className="relative cursor-pointer border-0 p-0"
    >
      <img src={staticMapUrl} alt="Map preview" width="600" height="400" loading="lazy" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <span className="bg-white px-4 py-2 rounded shadow-lg">
          Click to load interactive map
        </span>
      </div>
    </button>
  );
}
```

### Expected Improvements
- **LCP**: 40-60% improvement
- **TBT**: 72% decrease
- **INP**: 30-50% improvement
- **PageSpeed**: +10 points

---

## Solution 3: React Code Splitting (Suspense, Preloading)

### Approach
Leverage React 19's Suspense and Vite's built-in code splitting with route-based chunks and intelligent preloading.

### Pros
- 50-70% smaller initial bundle
- Faster Time-to-Interactive
- Vite's automatic modulepreload
- Scales as you add pages

### Cons
- Small navigation delay (50-200ms) first visit
- Requires careful Suspense boundary placement
- More HTTP requests

### Example Code

```tsx
// App.tsx
import { lazy, Suspense } from 'react';
import { Route, Router } from 'wouter';
import Home from '@/pages/Home';

const Quincy = lazy(() => import('@/pages/service-areas/quincy'));
const Plymouth = lazy(() => import('@/pages/service-areas/plymouth'));
// ... 23 more

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Route path="/" component={Home} />
        <Route path="/service-areas/quincy" component={Quincy} />
        <Route path="/service-areas/plymouth" component={Plymouth} />
      </Suspense>
    </Router>
  );
}
```

### Expected Improvements
- **LCP**: 25-40% improvement
- **TBT**: 50-70% reduction
- **INP**: 20-35% improvement
- **Bundle**: 50-70% reduction

---

## Recommendation

### Choice: **Hybrid - Solution 2 (Facade) + Solution 3 (Code Splitting)**

### Rationale

**Primary: Solution 2 - Third-Party Facade Pattern**
- Highest ROI: 72% TBT reduction, +10 PageSpeed
- Google Maps is the heaviest asset
- 40-60% LCP improvement

**Secondary: Solution 3 - React Code Splitting**
- Scalability for 25 pages
- Prevents bundle bloat
- Built-in Vite support

**Why not Solution 1 first?**
- Lower priority (15-30% vs 40-60%)
- Can add later as incremental improvement

---

## Implementation Plan

### Phase 1 (Week 1): Third-Party Facade
1. Create `GoogleMapFacade` component
2. Apply to all 25 service area pages
3. Create review widget facade
4. Measure improvements

### Phase 2 (Week 2): Code Splitting
1. Convert imports to `React.lazy()`
2. Add Suspense boundaries
3. Implement SmartLink with prefetch
4. Configure Vite manual chunks

### Phase 3 (Week 3-4): Image Optimization
1. Install `vite-plugin-image-presets`
2. Define presets for hero/thumbnails
3. Generate WebP/AVIF variants

---

## Expected Combined Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **LCP** | ~4.5s | ~2.0s | **55% faster** |
| **TBT** | ~800ms | ~200ms | **75% reduction** |
| **INP** | ~250ms | ~120ms | **52% improvement** |
| **PageSpeed (Mobile)** | 65 | 85+ | **+20 points** |
| **Bundle Size** | 2.5 MB | 750 KB | **70% reduction** |
| **Page Weight** | 6.4 MB | 2.0 MB | **69% lighter** |

---

## Sources

- [Google Maps 100% PageSpeed](https://www.corewebvitals.io/pagespeed/google-maps-100-percent-pagespeed)
- [Third-Party Facades - Chrome Developers](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades)
- [Code Splitting in React with Vite](https://medium.com/@akashsdas_dev/code-splitting-in-react-w-vite-eae8a9c39f6e)
- [vite-plugin-image-presets](https://github.com/ElMassimo/vite-plugin-image-presets)
