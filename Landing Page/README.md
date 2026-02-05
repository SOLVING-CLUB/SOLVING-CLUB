# Modern Agency Website Design

This is a code bundle for Modern Agency Website Design. The original project is available at https://www.figma.com/design/eusVDO5jOsS0SmGK1isn33/Modern-Agency-Website-Design.

## Features

- Modern, responsive design
- Aceternity UI navbar with animated dropdowns
- Optimized for performance and mobile devices
- Service worker for offline support and caching
- Lazy loading for better performance
- Smooth scroll navigation

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

### Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # UI component library
│   │   │   └── ...
│   │   └── App.tsx         # Main app component
│   ├── styles/             # Global styles
│   └── utils/            # Utility functions
├── public/                 # Static assets
├── index.html             # HTML entry point
└── vite.config.ts         # Vite configuration
```

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- Motion (Framer Motion)
- Aceternity UI components
- Lucide React icons

## Performance Optimizations

- Lazy loading of components
- Service worker for caching
- Code splitting
- Mobile-optimized animations
- Image lazy loading

## License

See ATTRIBUTIONS.md for license information.