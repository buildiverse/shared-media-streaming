# Shared Media Streaming - Frontend

A modern React frontend application for the Shared Media Streaming platform, built with atomic design principles and following MVC/MVVM patterns.

## 🏗️ Architecture

### Atomic Design Structure

```
src/
├── ui/                    # Atomic design system
│   ├── atoms/            # Basic building blocks (Button, Input, Label)
│   ├── molecules/        # Simple combinations (FormField, MediaCard)
│   ├── organisms/        # Complex components (Navbar, MediaGrid)
│   ├── templates/        # Page layouts (DashboardLayout, AuthLayout)
│   └── pages/            # Full page components (HomePage)
├── features/              # Feature-based grouping
│   ├── auth/             # Authentication features
│   ├── dashboard/        # Dashboard features
│   └── media/            # Media management features
├── app/                   # Application setup
│   ├── providers/        # Context providers
│   ├── routes/           # Routing configuration
│   └── store/            # State management
├── services/              # API and external services
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
└── types/                 # TypeScript type definitions
```

### Design Patterns

- **Atomic Design**: Systematic approach to building design systems
- **MVC/MVVM**: Separation of concerns between data, logic, and presentation
- **Component Composition**: Reusable, composable UI components
- **Custom Hooks**: Encapsulated logic for state management

## 🚀 Features

### Core Functionality

- **User Authentication**: Login, registration, and session management
- **Media Management**: Upload, view, and manage audio/video files
- **Real-time Sync**: Collaborative viewing with Socket.IO integration
- **Responsive Design**: Mobile-first, accessible interface

### Technical Features

- **TypeScript**: Full type safety and better developer experience
- **React Router**: Client-side routing with protected routes
- **Context API**: State management without external libraries
- **Axios**: HTTP client with interceptors and error handling
- **Form Validation**: Client-side validation with error handling

## 🛠️ Technology Stack

- **Framework**: React 19 with TypeScript
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Package Manager**: npm/pnpm
- **Styling**: CSS with BEM methodology (layout only, no visual styling)

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd shared-media-streaming/apps/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Structure Guidelines

#### Atomic Design Principles

- **Atoms**: Basic HTML elements (Button, Input, Label)
- **Molecules**: Simple combinations (FormField, MediaCard)
- **Organisms**: Complex components (Navbar, MediaGrid)
- **Templates**: Page layouts (DashboardLayout, AuthLayout)
- **Pages**: Full page components (HomePage)

#### Component Guidelines

- Use TypeScript interfaces for all props
- Implement proper accessibility attributes
- Follow BEM CSS methodology
- Keep components focused and single-purpose
- Use custom hooks for complex logic

#### State Management

- Use React Context for global state (auth, user)
- Use local state for component-specific data
- Use custom hooks for reusable state logic
- Avoid prop drilling with proper context usage

### Adding New Components

1. **Create the component file** in the appropriate atomic design folder
2. **Define TypeScript interfaces** for props
3. **Implement the component** with proper accessibility
4. **Add CSS classes** following BEM methodology
5. **Create an index file** for easy imports
6. **Update the main UI index** file

### Adding New Features

1. **Create feature folder** in `src/features/`
2. **Add components, hooks, and services** as needed
3. **Update routing** in `AppRoutes.tsx`
4. **Add to navigation** if needed
5. **Update types** in `src/types/`

## 🔌 API Integration

### Backend Endpoints

The frontend is configured to work with the following backend endpoints:

- **Authentication**: `/api/auth/*`
- **Media**: `/api/media/*`
- **Users**: `/api/users/*`

### API Service

- **Base URL**: Configurable via environment variables
- **Authentication**: JWT tokens with automatic refresh
- **Error Handling**: Centralized error handling with user feedback
- **Interceptors**: Automatic token injection and refresh logic

## 🎨 Styling

### CSS Architecture

- **BEM Methodology**: Block, Element, Modifier naming convention
- **Layout-First**: CSS focuses on structure, not visual styling
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Accessibility**: Proper focus states and screen reader support

### Component Styling

- Each component has its own CSS classes
- Classes follow BEM naming convention
- No external CSS frameworks or libraries
- Minimal styling for rapid UI development

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Individual component testing
- **Integration Tests**: Feature workflow testing
- **E2E Tests**: Full user journey testing

### Running Tests

```bash
npm run test        # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach

- CSS written for mobile devices first
- Progressive enhancement for larger screens
- Touch-friendly interface elements
- Optimized for mobile performance

## ♿ Accessibility

### Standards Compliance

- **WCAG 2.1 AA**: Web Content Accessibility Guidelines
- **ARIA Labels**: Proper screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Clear focus indicators

### Implementation

- Semantic HTML elements
- Proper heading hierarchy
- Alt text for images
- Form labels and error messages
- Screen reader announcements

## 🚀 Deployment

### Build Process

1. **Production Build**: `npm run build`
2. **Static Files**: Generated in `dist/` folder
3. **Deployment**: Deploy `dist/` contents to web server

### Environment Configuration

- **Development**: `.env.local` for local development
- **Production**: Environment variables set on deployment platform
- **Build-time**: Vite replaces environment variables during build

## 🤝 Contributing

### Development Workflow

1. **Feature Branch**: Create branch from `main`
2. **Development**: Implement feature following guidelines
3. **Testing**: Ensure all tests pass
4. **Code Review**: Submit pull request for review
5. **Merge**: After approval and CI checks pass

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (if configured)
- **Git Hooks**: Pre-commit checks (if configured)

## 📄 License

This project is part of the Shared Media Streaming platform. See the main repository for license information.

## 🆘 Support

For questions or issues:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information
4. Contact the development team

---

**Note**: This frontend is designed to work with the corresponding backend API. Ensure the backend is running and properly configured before testing frontend functionality.
