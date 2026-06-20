# Video Learning Interface

A beautiful, modern video learning platform UI for e-learning applications featuring university computer science courses and Grade 12 mathematics.

## Features

### 🎥 Video Library Page
- **Responsive Grid Layout**: 3 columns on desktop, 2 on tablet, 1 on mobile
- **Advanced Search**: Search by video title, course name, or teacher
- **Category Filters**: 11 categories with color-coded badges
- **Sort Options**: Newest, Most Popular, Recommended
- **Multiple Tabs**:
  - All Videos
  - Continue Watching
  - Recommended For You
  - New Releases
- **Course Progress Tracking**: Visual progress bars for enrolled courses

### 🎬 Video Player Page
- **Large Video Player**: Full-width responsive video area
- **Course Navigation**: Previous/Next lesson buttons
- **Sidebar Playlist**: Complete course content with progress indicators
- **Lesson Materials**: Downloadable resources (PDFs, code examples)
- **Related Videos**: Contextual recommendations
- **Progress Tracking**: Visual indicators for completed, current, and locked lessons

### 🎨 Video Card Design
- **Premium Thumbnails**: High-quality academic-style images
- **Play Icon Overlay**: Appears on hover with smooth animation
- **Duration Badge**: Visible time indicator
- **Status Badges**: New, Popular, Recommended, Completed, Locked
- **Category Badge**: Color-coded lesson number
- **Teacher Info**: Avatar and name
- **View Count**: Engagement metrics
- **Hover Effects**: Smooth scale and shadow transitions

## Components

### VideosPage
Main video library interface with search, filters, and grid layout.

```tsx
import { VideosPage } from '@/components/videos';

function App() {
  return <VideosPage />;
}
```

### VideoPlayerPage
Full video player experience with course navigation and materials.

```tsx
import { VideoPlayerPage } from '@/components/videos';

function App() {
  return <VideoPlayerPage />;
}
```

### VideoCard
Reusable video card component for displaying video information.

```tsx
import { VideoCard } from '@/components/videos';
import { mockVideos } from '@/components/videos';

function MyComponent() {
  return (
    <VideoCard 
      video={mockVideos[0]} 
      onClick={() => console.log('Video clicked')}
    />
  );
}
```

### VideosDemo
Complete demo showcasing both library and player views.

```tsx
import { VideosDemo } from '@/components/videos';

function App() {
  return <VideosDemo />;
}
```

## Mock Data

### Categories (11 total)
- Data Structures & Algorithms (Blue)
- Web Development (Green)
- CS Fundamentals (Purple)
- Database Systems (Amber)
- Networking (Cyan)
- Grade 12 Algebra (Rose)
- Calculus (Indigo)
- Trigonometry (Pink)
- Statistics (Orange)
- Programming Basics (Emerald)

### Courses (11 total)
1. Data Structures and Algorithms
2. Algorithms and Complexity
3. Modern Web Development
4. Object-Oriented Programming
5. Database Design and SQL
6. Computer Networks
7. Grade 12 Math: Algebra
8. Grade 12 Math: Calculus
9. Grade 12 Math: Trigonometry
10. Grade 12 Math: Statistics
11. Python Programming Basics

### Videos (24 total)
Each video includes:
- Unique ID
- Title and description
- Thumbnail URL (Unsplash academic images)
- Duration
- Course association
- Teacher information
- Category
- Lesson number and total lessons
- View count
- Status flags (new, popular, recommended, completed, locked)
- Upload date

## Design System

### Colors
- **Primary**: Blue (#3B82F6) - Main actions and highlights
- **Success**: Green (#10B981) - Completed, new items
- **Warning**: Amber (#F59E0B) - Important notices
- **Error**: Red (#EF4444) - Popular items
- **Category Colors**: Blue, Green, Purple, Amber, Cyan, Rose, Indigo, Pink, Orange, Emerald

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Readable slate colors
- **Labels**: Medium weight for emphasis

### Spacing
- **Cards**: Consistent 6-unit gap in grid
- **Padding**: 4-6 units for card content
- **Margins**: 8-unit sections

### Shadows
- **Cards**: Subtle shadow, enhanced on hover
- **Overlays**: Smooth transitions

## Responsive Breakpoints

- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3 columns)

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast text
- Focus indicators
- Alt text for images

## Integration Guide

### 1. Add to Router
```tsx
import { VideosPage, VideoPlayerPage } from '@/components/videos';

// In your router configuration
{
  path: '/videos',
  element: <VideosPage />
},
{
  path: '/videos/:id',
  element: <VideoPlayerPage />
}
```

### 2. Add to Sidebar Navigation
```tsx
import { Video } from 'lucide-react';

// In your sidebar
<SidebarItem href="/videos" icon={Video}>
  Videos
</SidebarItem>
```

### 3. Connect to Backend
Replace mock data with API calls:

```tsx
// video-data.ts
export async function fetchVideos() {
  const response = await fetch('/api/videos');
  return response.json();
}

export async function fetchCourses() {
  const response = await fetch('/api/courses');
  return response.json();
}
```

### 4. Add Video Player
For actual video playback, integrate a video player library:

```bash
npm install react-player
# or
npm install video.js
```

## Customization

### Change Category Colors
Edit the `getCategoryColor` function in `video-card.tsx` and `video-player-page.tsx`.

### Modify Grid Layout
Adjust the grid classes in `videos-page.tsx`:
```tsx
// Current: 3 columns on desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// 4 columns on desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
```

### Update Thumbnail Sources
Replace Unsplash URLs in `video-data.ts` with your own image URLs or upload service.

## Performance Tips

1. **Lazy Load Images**: Add loading="lazy" to img tags
2. **Virtualize Long Lists**: Use react-window for large video lists
3. **Optimize Thumbnails**: Serve WebP format with fallbacks
4. **Cache API Responses**: Use React Query or SWR
5. **Pagination**: Load videos in batches

## Future Enhancements

- [ ] Video bookmarking
- [ ] Playback speed control
- [ ] Subtitle support
- [ ] Video quality selection
- [ ] Watch history
- [ ] Video notes and timestamps
- [ ] Social sharing
- [ ] Video ratings and reviews
- [ ] Playlist creation
- [ ] Offline download support

## License

This component is part of the e-learning platform project.
