# Apple Design System for TheFitChecked

iOS-styled design system following Apple's Human Interface Guidelines.

## 📦 What's Included

### Utilities
- `src/utils/cn.ts` - Tailwind class merging utility

### Styles
- `src/styles/apple-design.css` - iOS design tokens and component styles

### UI Components
- `src/components/ui/Button.tsx` - iOS-styled button with haptic feedback
- `src/components/ui/Card.tsx` - iOS-styled cards with variants
- `src/components/ui/Input.tsx` - iOS-styled form inputs with validation

### Examples
- `src/examples/AppleDesignExample.tsx` - Complete usage examples

## 🚀 Quick Start

### 1. Import Components

```tsx
import { Button, Card, CardHeader, CardTitle, Input } from '../components/ui';
```

### 2. Use iOS Typography

```tsx
<h1 className="ios-large-title">Large Title</h1>
<h2 className="ios-title-1">Title 1</h2>
<p className="ios-body">Body text</p>
<p className="ios-subheadline">Subheadline</p>
```

### 3. Use Buttons

```tsx
{/* Primary button */}
<Button variant="primary">Continue</Button>

{/* Secondary button */}
<Button variant="secondary">Cancel</Button>

{/* Destructive button */}
<Button variant="destructive">Delete</Button>

{/* With loading state */}
<Button variant="primary" loading>Processing...</Button>

{/* Different sizes */}
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

{/* Full width */}
<Button variant="primary" fullWidth>Full Width</Button>
```

### 4. Use Cards

```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your content here</p>
  </CardContent>
  <CardFooter>
    <Button variant="primary">Action</Button>
  </CardFooter>
</Card>
```

### 5. Use Inputs

```tsx
{/* Basic input */}
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  fullWidth
/>

{/* With icons */}
<Input
  label="Password"
  type="password"
  placeholder="Enter password"
  leftIcon={<LockIcon />}
  fullWidth
/>

{/* With error */}
<Input
  label="Username"
  error="This username is taken"
  fullWidth
/>
```

## 🎨 Design Tokens

### Colors

```css
/* System Colors */
--ios-blue: #007AFF;
--ios-green: #34C759;
--ios-red: #FF3B30;
--ios-orange: #FF9500;
--ios-yellow: #FFCC00;
--ios-pink: #FF2D55;
--ios-purple: #AF52DE;
--ios-teal: #5AC8FA;
--ios-indigo: #5856D6;

/* Gray Scale */
--ios-gray: #8E8E93;
--ios-gray-2: #AEAEB2;
--ios-gray-3: #C7C7CC;
--ios-gray-4: #D1D1D6;
--ios-gray-5: #E5E5EA;
--ios-gray-6: #F2F2F7;

/* Labels */
--ios-label: rgba(0, 0, 0, 0.85);
--ios-label-secondary: rgba(60, 60, 67, 0.6);
--ios-label-tertiary: rgba(60, 60, 67, 0.3);
--ios-label-quaternary: rgba(60, 60, 67, 0.18);
```

### Typography

```css
/* Font Sizes */
--ios-font-large-title: 34px;
--ios-font-title-1: 28px;
--ios-font-title-2: 22px;
--ios-font-title-3: 20px;
--ios-font-headline: 17px;
--ios-font-body: 17px;
--ios-font-callout: 16px;
--ios-font-subheadline: 15px;
--ios-font-footnote: 13px;
--ios-font-caption-1: 12px;
--ios-font-caption-2: 11px;
```

### Spacing

```css
--ios-spacing-xs: 4px;
--ios-spacing-sm: 8px;
--ios-spacing-md: 16px;
--ios-spacing-lg: 24px;
--ios-spacing-xl: 32px;
--ios-spacing-2xl: 48px;
```

### Border Radius

```css
--ios-radius-sm: 8px;
--ios-radius-md: 10px;
--ios-radius-lg: 12px;
--ios-radius-xl: 16px;
--ios-radius-2xl: 20px;
--ios-radius-full: 9999px;
```

## 🌗 Dark Mode Support

All design tokens automatically adapt to dark mode based on `prefers-color-scheme`.

```tsx
// Colors automatically switch in dark mode
<div className="bg-[var(--ios-bg-primary)]">
  <p className="text-[var(--ios-label)]">
    This text adapts to light/dark mode
  </p>
</div>
```

## 📱 iOS-Specific Features

### Haptic Feedback

Buttons include automatic haptic feedback on iOS:

```tsx
<Button hapticFeedback={true}>Tap me for haptics</Button>
```

### Safe Area Support

```css
.ios-safe-area-top {
  padding-top: env(safe-area-inset-top);
}
```

```tsx
<div className="ios-safe-area-top ios-safe-area-bottom">
  Content respects iOS safe areas
</div>
```

### Blur Effects

```css
.ios-blur {
  backdrop-filter: blur(20px) saturate(180%);
}
```

```tsx
<div className="ios-blur">
  iOS-style frosted glass effect
</div>
```

## 🎯 Utility Classes

### Pre-built Components

```tsx
{/* iOS-style button */}
<button className="ios-button ios-button-primary">Button</button>

{/* iOS-style card */}
<div className="ios-card">Card content</div>

{/* iOS-style list */}
<div className="ios-list">
  <div className="ios-list-item">Item 1</div>
  <div className="ios-list-item">Item 2</div>
</div>

{/* iOS-style input */}
<input className="ios-input" placeholder="Enter text" />

{/* iOS-style separator */}
<hr className="ios-separator" />

{/* iOS-style badge */}
<span className="ios-badge">New</span>
```

### Animations

```tsx
{/* Fade in */}
<div className="ios-fade-in">Fades in smoothly</div>

{/* Slide up */}
<div className="ios-slide-up">Slides up from below</div>

{/* Scale in */}
<div className="ios-scale-in">Scales in from center</div>
```

## 🔧 Using the cn() Utility

The `cn()` utility intelligently merges Tailwind classes:

```tsx
import { cn } from '../utils/cn';

// Conditional classes
<div className={cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50'
)}>
  Content
</div>

// Conflicting classes (last wins)
<div className={cn('px-4', 'px-8')}>
  {/* Renders with px-8 */}
</div>
```

## 📚 Complete Example

```tsx
import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';

const MyComponent = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Your API call here
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--ios-bg-grouped-primary)] p-6 ios-safe-area-top ios-safe-area-bottom">
      <h1 className="ios-large-title text-[var(--ios-label)] mb-6">
        My App
      </h1>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            fullWidth
          />
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            fullWidth
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 🎨 View the Example

To see all components in action, import and render the example:

```tsx
import AppleDesignExample from './examples/AppleDesignExample';

// In your route or component
<AppleDesignExample />
```

## 📖 Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [iOS Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [iOS Color](https://developer.apple.com/design/human-interface-guidelines/color)

## ✨ Benefits

- **iOS Native Feel**: Matches iOS design patterns exactly
- **Dark Mode**: Automatic light/dark mode support
- **Haptic Feedback**: Built-in haptic feedback on iOS devices
- **Type-Safe**: Full TypeScript support
- **Accessible**: ARIA attributes and keyboard navigation
- **Responsive**: Works on all screen sizes
- **Performant**: Uses CSS variables and Tailwind

---

Built with ❤️ for TheFitChecked
