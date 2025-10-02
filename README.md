# TheFitChecked - AI-Powered Virtual Fitting Room

> **"Shop Smarter, Return Never"** - Revolutionary virtual try-on application with 3D avatar generation

## 🎯 Project Overview

TheFitChecked is a cutting-edge React-based web application that creates personalized 3D avatars from user photos and enables virtual clothing try-on experiences. The application eliminates the uncertainty of online shopping by allowing users to see how clothes will look on their digital twin before making purchases.

### Key Features
- **3D Avatar Generation**: Create realistic avatars from user photos using AI
- **Virtual Try-On**: See how clothes look on your avatar before buying
- **Weather-Based Recommendations**: Get outfit suggestions based on local weather
- **Digital Closet**: Manage and organize your virtual wardrobe
- **Body Measurements**: Track and store accurate measurements for perfect fits
- **Style Insights**: Receive personalized fashion recommendations

## 🛠 Technology Stack

### Core Technologies
- **React 18.3.1** - UI framework with TypeScript support
- **TypeScript 5.5.3** - Type-safe development
- **Vite 5.4.2** - Fast build tool and development server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework

### 3D & Graphics
- **Three.js 0.180.0** - 3D graphics and avatar rendering
- **@types/three** - TypeScript definitions for Three.js

### AI & APIs
- **@fal-ai/client 1.6.2** - FAL AI client for avatar generation (clothing generation only)
- **@fal-ai/serverless-client 0.15.0** - Serverless AI operations
- **ByteDance Seedream v4** - Standalone clothing generation AI model
- **FASHN API (Native)** - Direct virtual try-on technology (completely independent from FAL)
- **Weather API** - Real-time weather data

### IMPORTANT: FASHN vs FAL API Integration Notes

**FASHN API is completely independent from FAL API:**
- FASHN has its own API key (VITE_FASHN_API_KEY) obtained directly from the FASHN platform
- FASHN is NEVER accessed through fal.ai or fal.run endpoints
- Authentication: Bearer token directly to api.fashn.ai endpoints
- Model: Uses "tryon" model (not "fal-ai/fashn/tryon")
- Documentation: https://github.com/fashn-AI
- Integration: Native FASHN API client, no FAL wrapper

**Workflow Architecture:**
- **Page 6 (Avatar Homepage)**: FAL Seedream generates clothing + Native FASHN API for virtual try-on
- **Page 5 (Virtual Try-On)**: Upload clothing + Native FASHN API for virtual try-on
- **Page 4 (Avatar 3D)**: Native FASHN API integration for 3D avatar try-on

**FASHN API Parameters:**

The FASHN API supports several important parameters for optimal performance:

- **`garment_photo_type`**: `'auto' | 'flat-lay' | 'model'`
  - `'auto'`: Automatically detects the garment photo type (default)
  - `'flat-lay'`: For flat-lay or ghost mannequin images
  - `'model'`: For photos of garments worn on a model
  - Purpose: Optimizes internal parameters for better try-on results

- **`model_name`**: Currently using `'tryon-v1.6'`
- **`model_image`**: Avatar/person image (HTTP URL or base64)
- **`garment_image`**: Clothing item image (HTTP URL or base64)

### Database & Storage
- **Supabase 2.57.4** - Backend as a service for data storage
- **Image Upload Service** - Custom image handling with base64 conversion

### Styling & UI
- **Lucide React 0.344.0** - Modern icon library
- **@fontsource/dancing-script 5.2.8** - Custom typography
- **Custom Glassmorphism** - Beige-tinted glass effects (30% opacity, 25px blur)

## 🏗 Application Architecture

### Screen Flow
The application consists of 8 main screens in a linear flow:

1. **Welcome Screen** (`WelcomeScreen.tsx`)
   - Landing page with app introduction
   - Ultra-translucent "Create Your Avatar" button with ripple effects
   - Feature highlights with minimalist design
   - Dark charcoal "Shop Smarter, Return Never" tagline

2. **Photo Upload** (`AvatarPhotoUpload.tsx`)
   - Upload photos for avatar generation
   - Photo validation and preprocessing
   - Progress indicators
   - Black "Create Avatar" header

3. **Avatar Generation** (`AvatarGeneration.tsx`)
   - Real-time avatar creation process
   - Quality scoring and validation
   - 3D model generation using ByteDance Seedream v4
   - Auto-redirect to next page on completion

4. **Photo Capture Flow** (`EnhancedPhotoCaptureFlow.tsx`)
   - Multi-angle photo capture (6 angles total)
   - Front, side, and back views (upper and full body)
   - Photo quality validation with scoring (0-100)
   - Translucent camera placeholder boxes
   - No orange colors or borders

5. **Measurements** (`AvatarMeasurementsPage.tsx`)
   - Body measurements input
   - Size recommendations
   - Proportion calculations
   - Unit conversion (cm/inches)

6. **Virtual Try-On** (`AppFacePage.tsx`) - Page 5
   - Upload outfit images
   - Apply clothes to avatar using FASHN API
   - Real-time visualization
   - Support for tops, bottoms, and one-pieces

7. **Style Profile** (`Page4Component.tsx`)
   - Personal style preferences
   - Fashion profile setup

8. **Avatar Homepage** (`AvatarHomepage.tsx`) - Page 6
   - Modern slate/blue theme dashboard
   - Weather widget with real-time data
   - Outfit recommendations grid
   - Digital closet access
   - Style insights section
   - Glassmorphism containers throughout

## 🎨 Design System

### Recent Design Updates
- **Glassmorphism Applied**: All content boxes use beige-tinted glass effects
- **Color Scheme**: Transitioned from amber/orange to slate/gray/charcoal
- **Ultra-Translucent UI**: Buttons and containers use `bg-white/5` with backdrop blur
- **Removed Borders**: Clean, borderless design throughout
- **Black Text Headers**: All major headers changed to pure black
- **Minimalist Feature Blocks**: Smaller icons and text without backgrounds

### Color Palette
- **Primary**: Slate (#64748b) / Gray (#6b7280) / Charcoal (#1f2937)
- **Backgrounds**: Ultra-translucent white overlays (2-8% opacity)
- **Text**: Black headers, gray body text
- **Accents**: Minimal color usage, focus on neutrals

### Glassmorphism Implementation
Custom utility classes defined in `index.css`:

```css
.glass-beige {
  background: rgba(245, 245, 220, 0.3);  /* Beige 30% opacity */
  backdrop-filter: blur(25px);           /* 25px blur */
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(245, 245, 220, 0.2);
}

.glass-beige-dark {
  background: rgba(222, 184, 135, 0.3);  /* Darker beige */
  backdrop-filter: blur(25px);
  border: 1px solid rgba(222, 184, 135, 0.2);
}

.glass-beige-light {
  background: rgba(250, 240, 230, 0.3);  /* Light beige */
  backdrop-filter: blur(25px);
  border: 1px solid rgba(250, 240, 230, 0.2);
}
```

### UI Components
- **Translucent Buttons**: `bg-white/5 backdrop-blur-lg border border-white/10`
- **Feature Blocks**: No backgrounds, minimal sizing
- **Navigation**: Floating left/right positioned buttons
- **Ripple Effects**: Animated translucent circles on CTA buttons
- **Weather Widget**: Glass-beige container with weather data
- **Outfit Cards**: Glassmorphism with hover effects

## 📁 Project Structure

```
fit-checked-app/
├── src/
│   ├── components/          # React components
│   │   ├── WelcomeScreen.tsx         # Landing page
│   │   ├── AvatarPhotoUpload.tsx     # Photo upload interface
│   │   ├── AvatarGeneration.tsx      # Avatar creation process
│   │   ├── EnhancedPhotoCaptureFlow.tsx # Multi-angle capture
│   │   ├── AvatarMeasurementsPage.tsx   # Body measurements
│   │   ├── AppFacePage.tsx           # Virtual try-on
│   │   ├── AvatarHomepage.tsx        # Main dashboard
│   │   ├── Avatar3DDisplay.tsx       # 3D model viewer
│   │   └── ...
│   ├── services/            # API and service layers
│   │   ├── avatarGenerationService.ts
│   │   ├── virtualTryOnService.ts
│   │   ├── weatherService.ts
│   │   ├── imageUploadService.ts
│   │   ├── byteDanceSeedreamService.ts
│   │   ├── environmentConfig.ts
│   │   └── ...
│   ├── types/               # TypeScript definitions
│   │   ├── photo.ts
│   │   ├── fal.ts
│   │   └── index.ts
│   ├── utils/               # Helper functions
│   │   ├── photoValidation.ts
│   │   └── proportionCalculator.ts
│   ├── App.tsx              # Main application component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles & glassmorphism utilities
├── public/                  # Static assets
│   ├── Untitled design.PNG # Logo image
│   └── ...
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind settings
├── tsconfig.json           # TypeScript config
└── .env                    # Environment variables
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Modern web browser (Chrome/Edge 90+ recommended)

### Environment Variables
Create a `.env` file in the root directory:

```env
# FAL AI API Configuration (REQUIRED for clothing generation)
VITE_FAL_KEY=your_fal_api_key_here

# FASHN API Configuration (REQUIRED for virtual try-on)
# Obtained directly from FASHN platform - completely independent from FAL
VITE_FASHN_API_KEY=your_fashn_api_key_here

# Weather API (OPTIONAL)
VITE_WEATHER_API_KEY=your_weather_api_key

# Supabase Configuration (OPTIONAL)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Settings
VITE_USE_PRODUCTION_API=true
VITE_USE_DEFAULT_MEASUREMENTS=false
```

### Installation Steps

1. **Clone the repository**
```bash
git clone [repository-url]
cd fit-checked-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env and add your API keys
```

4. **Start development server**
```bash
npm run dev
# Application will run on http://localhost:5173
```

5. **Build for production**
```bash
npm run build
```

6. **Preview production build**
```bash
npm run preview
```

## 📱 User Flow

### Complete Avatar Creation Journey

1. **Welcome Screen**
   - User sees translucent UI with ripple effects
   - Clicks ultra-translucent "Create Your Avatar" button
   - Views feature descriptions (3D Avatar, Virtual Try-On, Digital Closet)

2. **Photo Upload (Page 2)**
   - Upload existing photo or take new one
   - Photo validation for quality
   - Generate avatar button triggers AI processing

3. **Avatar Generation (Page 3)**
   - ByteDance Seedream v4 processes photo
   - Real-time progress updates
   - Auto-redirect when complete
   - Quality scoring displayed

4. **Photo Capture (Alternative flow)**
   - 6 photos required: Front/Side/Back (Upper & Full)
   - Each photo validated for quality (0-100 score)
   - Guided instructions for poses
   - Auto-advance on high-quality capture

5. **Measurements Input**
   - Enter height, chest, waist, hips, shoulders, inseam
   - Unit conversion support (cm/inches)
   - Body proportion validation
   - Size recommendations generated

6. **Virtual Try-On (Page 5)**
   - Upload clothing image (JPG/PNG/WebP, max 10MB)
   - Select garment type (tops/bottoms/one-pieces)
   - Native FASHN API processes virtual fitting (independent from FAL)
   - View outfit on avatar
   - "Looking good!" confirmation message

7. **Style Profile Setup**
   - Personal preferences input
   - Fashion style selection
   - Color preferences

8. **Avatar Homepage (Page 6)**
   - Weather widget shows current conditions
   - "Today's Outfit Recommendations" grid
   - Digital closet with saved items
   - Style insights and tips
   - All content in glassmorphism containers

## 🔧 Key Services Documentation

### Avatar Generation Service
```typescript
// Location: src/services/avatarGenerationService.ts
// Purpose: Handles 3D avatar creation
// API: FAL AI ByteDance Seedream v4

Key Methods:
- generateAvatar(photoData: string)
- validatePhotoQuality(photo: File)
- getGenerationStatus(jobId: string)
```

### Virtual Try-On Service
```typescript
// Location: src/services/directFashnService.ts
// Purpose: Native FASHN API virtual try-on (independent from FAL)
// API: Native FASHN API at api.fashn.ai

Key Methods:
- tryOnClothing(modelImageUrl, garmentImageUrl)
- submitTryOn(modelImageUrl, garmentImageUrl)
- pollForCompletion(jobId)

// IMPORTANT: Uses direct FASHN API, NOT fal.ai wrapper
// Authentication: Bearer token to api.fashn.ai
// Model: "tryon-v1.6" (not "fal-ai/fashn/tryon")

// API Parameters:
// - model_name: 'tryon-v1.6'
// - model_image: Avatar/person image URL or base64
// - garment_image: Clothing item image URL or base64
// - garment_photo_type: 'auto' | 'flat-lay' | 'model' (optimizes for photo type)
```

### Weather Service
```typescript
// Location: src/services/weatherService.ts
// Purpose: Fetch weather for outfit recommendations

Key Methods:
- getCurrentWeather(location: string)
- getWeatherRecommendations(temp: number)
```

### Image Upload Service
```typescript
// Location: src/services/imageUploadService.ts
// Purpose: Handle image uploads and conversions

Key Methods:
- uploadImage(base64Data: string)
- convertToBase64(file: File)
- validateFileSize(file: File)
```

## 🐛 Known Issues & Solutions

### Common Issues

**Issue: Avatar Generation Fails**
```bash
Solution:
1. Check FAL API key in .env
2. Verify image format (JPG/PNG only)
3. Ensure image size < 10MB
4. Check network connectivity
```

**Issue: Virtual Try-On Not Working**
```bash
Solution:
1. Confirm avatar generation completed
2. Check outfit image requirements
3. Verify native FASHN API key (VITE_FASHN_API_KEY) is correctly configured
4. Ensure using direct FASHN API, not FAL wrapper
5. Check api.fashn.ai endpoint availability
6. Try different garment category
```

**Issue: Glassmorphism Effects Missing**
```bash
Solution:
1. Update to Chrome/Edge 90+
2. Check browser CSS support for backdrop-filter
3. Verify Tailwind configuration
4. Clear browser cache
```

**Issue: Development Server Not Starting**
```bash
Solution:
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Browser Compatibility
- **Best**: Chrome 90+, Edge 90+
- **Good**: Firefox 103+
- **Limited**: Safari (backdrop-filter issues)
- **Mobile**: Responsive but optimized for desktop

### API Limitations
- FAL AI: 100 requests/minute rate limit
- Image size: Maximum 10MB per image
- Processing time: 5-15 seconds for avatar generation
- Virtual try-on: 3-8 seconds per outfit

## 🔮 Future Enhancements

### Planned Features
- [ ] Multiple avatar poses and animations
- [ ] Social sharing of outfits
- [ ] ML-based size recommendations
- [ ] Outfit history and favorites
- [ ] E-commerce platform integration
- [ ] Mobile app version (React Native)
- [ ] AR preview capabilities
- [ ] Voice-controlled navigation
- [ ] Outfit scheduling calendar
- [ ] Group try-on sessions

### Performance Optimizations
- [ ] Avatar caching system
- [ ] Progressive image loading
- [ ] WebGL performance improvements
- [ ] Component lazy loading
- [ ] Service worker for offline mode
- [ ] CDN integration for assets

## 🤝 Contributing

### Code Style Guidelines
- Use TypeScript for all new components
- Follow existing component patterns
- Maintain glassmorphism theme consistency
- Keep components under 300 lines
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Commit Conventions
```bash
feat: Add new feature
fix: Fix bug
style: UI/styling changes
refactor: Code improvements
docs: Documentation updates
test: Add or update tests
chore: Maintenance tasks
```

### Testing Requirements
- Test all pages render without errors
- Verify responsive design (mobile/tablet/desktop)
- Check API integrations with mock data
- Validate accessibility (WCAG 2.1 AA)
- Test cross-browser compatibility
- Verify glassmorphism effects

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes following guidelines
4. Test thoroughly
5. Submit PR with description
6. Await code review

## 📊 Performance Metrics

### Target Performance
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1
- Avatar Generation: < 15s
- Virtual Try-On: < 10s

### Optimization Tips
- Use WebP images where possible
- Implement lazy loading for images
- Minimize bundle size
- Cache API responses
- Use CDN for static assets

## 🔒 Security & Privacy

### Data Handling
- Photos processed locally when possible
- Encrypted transmission to APIs
- No permanent storage of personal photos
- Automatic cleanup after processing
- GDPR compliant data handling

### API Security
- Environment variables for sensitive keys
- Rate limiting implementation
- Request validation
- Error handling without exposing details

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- **FAL AI** - Clothing generation technology (ByteDance Seedream v4)
- **FASHN** - Native virtual try-on API capabilities (completely independent service)
- **ByteDance** - Seedream v4 AI model for standalone clothing generation
- **Three.js Community** - 3D rendering support
- **Tailwind CSS** - Styling framework
- **Vite** - Build tooling

### API Architecture Clarification

This project integrates TWO completely separate AI services:

1. **FAL AI (fal.ai)**: Used exclusively for clothing generation via ByteDance Seedream v4
   - Endpoint: https://fal.run/fal-ai/bytedance/seedream/v4/text-to-image
   - Authentication: Key-based via VITE_FAL_KEY
   - Purpose: Generate standalone clothing items from text prompts

2. **FASHN API (api.fashn.ai)**: Used exclusively for virtual try-on
   - Endpoint: https://api.fashn.ai/v1/run
   - Authentication: Bearer token via VITE_FASHN_API_KEY
   - Purpose: Apply clothing to avatar images
   - **IMPORTANT**: Completely independent from FAL - never accessed through fal.ai or fal.run

The two services work in tandem but are completely separate platforms with their own API keys, authentication methods, and endpoints.

# FASHN TypeScript SDK

[![NPM version](<https://img.shields.io/npm/v/fashn.svg?label=npm%20(beta)>)](https://npmjs.org/package/fashn)
<!-- ![npm bundle size](https://img.shields.io/bundlephobia/minzip/fashn) -->

![FASHN AI Try-On App](https://cilsrdpvqtgutxprdofn.supabase.co/storage/v1/object/public/assets/logo-enhanced_60x60.png)

This library provides convenient access to the FASHN REST API from server-side TypeScript or JavaScript.

The REST API documentation can be found on [docs.fashn.ai](https://docs.fashn.ai) with a [playground](https://docs.fashn.ai/playground).

### API Key
To use this SDK, you need to have an API key from a FASHN account.

Don't have an account yet? [Create an account](https://app.fashn.ai/?utm_source=nextjs-tryon-app&utm_medium=readme&utm_campaign=signup)
If you already have an account, go to Developer API → API Keys → `+ Create new API key`

## Installation

```sh
npm install fashn
```

## Usage

The full API of this library can be found in [api.md](api.md).

<!-- prettier-ignore -->
```js
import Fashn from 'fashn';

const client = new Fashn({
  apiKey: process.env['FASHN_API_KEY'], // This is the default and can be omitted
});

const response = await client.predictions.subscribe({
  inputs: {
    garment_image: 'https://example.com/garment.jpg',
    model_image: 'https://example.com/model.jpg',
  },
  model_name: 'tryon-v1.6',
});

console.log(response.output);
```

### Request & Response types

This library includes TypeScript definitions for all request params and response fields. You may import and use them like so:

<!-- prettier-ignore -->
```ts
import Fashn from 'fashn';

const client = new Fashn({
  apiKey: process.env['FASHN_API_KEY'], // This is the default and can be omitted
});

const params: Fashn.PredictionSubscribeParams = {
  inputs: {
    garment_image: 'https://example.com/garment.jpg',
    model_image: 'https://example.com/model.jpg',
  },
  model_name: 'tryon-v1.6',
};
const response: Fashn.PredictionSubscribeResponse = await client.predictions.subscribe(params);
```

Documentation for each method, request param, and response field are available in docstrings and will appear on hover in most modern editors.

## Handling errors

When the library is unable to connect to the API,
or if the API returns a non-success status code (i.e., 4xx or 5xx response),
a subclass of `APIError` will be thrown:

<!-- prettier-ignore -->
```ts
const response = await client.predictions
  .subscribe({
    inputs: {
      garment_image: 'https://example.com/garment.jpg',
      model_image: 'https://example.com/model.jpg',
    },
    model_name: 'tryon-v1.6',
  })
  .catch(async (err) => {
    if (err instanceof Fashn.APIError) {
      console.log(err.status); // 400
      console.log(err.name); // BadRequestError
      console.log(err.headers); // {server: 'nginx', ...}
    } else {
      throw err;
    }
  });
```

Error codes are as follows:

| Status Code | Error Type                 |
| ----------- | -------------------------- |
| 400         | `BadRequestError`          |
| 401         | `AuthenticationError`      |
| 403         | `PermissionDeniedError`    |
| 404         | `NotFoundError`            |
| 422         | `UnprocessableEntityError` |
| 429         | `RateLimitError`           |
| >=500       | `InternalServerError`      |
| N/A         | `APIConnectionError`       |

### Retries

Certain errors will be automatically retried 2 times by default, with a short exponential backoff.
Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict,
429 Rate Limit, and >=500 Internal errors will all be retried by default.

You can use the `maxRetries` option to configure or disable this:

<!-- prettier-ignore -->
```js
// Configure the default for all requests:
const client = new Fashn({
  maxRetries: 0, // default is 2
});

// Or, configure per-request:
await client.predictions.run({ inputs: { garment_image: 'https://example.com/garment.jpg', model_image: 'https://example.com/model.jpg' }, model_name: 'tryon-v1.6' }, {
  maxRetries: 5,
});
```

### Timeouts

Requests time out after 1 minute by default. You can configure this with a `timeout` option:

<!-- prettier-ignore -->
```ts
// Configure the default for all requests:
const client = new Fashn({
  timeout: 20 * 1000, // 20 seconds (default is 1 minute)
});

// Override per-request:
await client.predictions.run({ inputs: { garment_image: 'https://example.com/garment.jpg', model_image: 'https://example.com/model.jpg' }, model_name: 'tryon-v1.6' }, {
  timeout: 5 * 1000,
});
```

On timeout, an `APIConnectionTimeoutError` is thrown.

Note that requests which time out will be [retried twice by default](#retries).

## Advanced Usage

### Accessing raw Response data (e.g., headers)

The "raw" `Response` returned by `fetch()` can be accessed through the `.asResponse()` method on the `APIPromise` type that all methods return.
This method returns as soon as the headers for a successful response are received and does not consume the response body, so you are free to write custom parsing or streaming logic.

You can also use the `.withResponse()` method to get the raw `Response` along with the parsed data.
Unlike `.asResponse()` this method consumes the body, returning once it is parsed.

<!-- prettier-ignore -->
```ts
const client = new Fashn();

const response = await client.predictions
  .run({
    inputs: {
      garment_image: 'https://example.com/garment.jpg',
      model_image: 'https://example.com/model.jpg',
    },
    model_name: 'tryon-v1.6',
  })
  .asResponse();
console.log(response.headers.get('X-My-Header'));
console.log(response.statusText); // access the underlying Response object

const { data: response, response: raw } = await client.predictions
  .run({
    inputs: {
      garment_image: 'https://example.com/garment.jpg',
      model_image: 'https://example.com/model.jpg',
    },
    model_name: 'tryon-v1.6',
  })
  .withResponse();
console.log(raw.headers.get('X-My-Header'));
console.log(response.id);
```

### Logging

> [!IMPORTANT]
> All log messages are intended for debugging only. The format and content of log messages
> may change between releases.

#### Log levels

The log level can be configured in two ways:

1. Via the `FASHN_LOG` environment variable
2. Using the `logLevel` client option (overrides the environment variable if set)

```ts
import Fashn from 'fashn';

const client = new Fashn({
  logLevel: 'debug', // Show all log messages
});
```

Available log levels, from most to least verbose:

- `'debug'` - Show debug messages, info, warnings, and errors
- `'info'` - Show info messages, warnings, and errors
- `'warn'` - Show warnings and errors (default)
- `'error'` - Show only errors
- `'off'` - Disable all logging

At the `'debug'` level, all HTTP requests and responses are logged, including headers and bodies.
Some authentication-related headers are redacted, but sensitive data in request and response bodies
may still be visible.

#### Custom logger

By default, this library logs to `globalThis.console`. You can also provide a custom logger.
Most logging libraries are supported, including [pino](https://www.npmjs.com/package/pino), [winston](https://www.npmjs.com/package/winston), [bunyan](https://www.npmjs.com/package/bunyan), [consola](https://www.npmjs.com/package/consola), [signale](https://www.npmjs.com/package/signale), and [@std/log](https://jsr.io/@std/log). If your logger doesn't work, please open an issue.

When providing a custom logger, the `logLevel` option still controls which messages are emitted, messages
below the configured level will not be sent to your logger.

```ts
import Fashn from 'fashn';
import pino from 'pino';

const logger = pino();

const client = new Fashn({
  logger: logger.child({ name: 'Fashn' }),
  logLevel: 'debug', // Send all messages to pino, allowing it to filter
});
```

### Making custom/undocumented requests

This library is typed for convenient access to the documented API. If you need to access undocumented
endpoints, params, or response properties, the library can still be used.

#### Undocumented endpoints

To make requests to undocumented endpoints, you can use `client.get`, `client.post`, and other HTTP verbs.
Options on the client, such as retries, will be respected when making these requests.

```ts
await client.post('/some/path', {
  body: { some_prop: 'foo' },
  query: { some_query_arg: 'bar' },
});
```

#### Undocumented request params

To make requests using undocumented parameters, you may use `// @ts-expect-error` on the undocumented
parameter. This library doesn't validate at runtime that the request matches the type, so any extra values you
send will be sent as-is.

```ts
client.predictions.run({
  // ...
  // @ts-expect-error baz is not yet public
  baz: 'undocumented option',
});
```

For requests with the `GET` verb, any extra params will be in the query, all other requests will send the
extra param in the body.

If you want to explicitly send an extra argument, you can do so with the `query`, `body`, and `headers` request
options.

#### Undocumented response properties

To access undocumented response properties, you may access the response object with `// @ts-expect-error` on
the response object, or cast the response object to the requisite type. Like the request params, we do not
validate or strip extra properties from the response from the API.

### Customizing the fetch client

By default, this library expects a global `fetch` function is defined.

If you want to use a different `fetch` function, you can either polyfill the global:

```ts
import fetch from 'my-fetch';

globalThis.fetch = fetch;
```

Or pass it to the client:

```ts
import Fashn from 'fashn';
import fetch from 'my-fetch';

const client = new Fashn({ fetch });
```

### Fetch options

If you want to set custom `fetch` options without overriding the `fetch` function, you can provide a `fetchOptions` object when instantiating the client or making a request. (Request-specific options override client options.)

```ts
import Fashn from 'fashn';

const client = new Fashn({
  fetchOptions: {
    // `RequestInit` options
  },
});
```

#### Configuring proxies

To modify proxy behavior, you can provide custom `fetchOptions` that add runtime-specific proxy
options to requests:

<img src="https://raw.githubusercontent.com/stainless-api/sdk-assets/refs/heads/main/node.svg" align="top" width="18" height="21"> **Node** <sup>[[docs](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md#example---proxyagent-with-fetch)]</sup>

```ts
import Fashn from 'fashn';
import * as undici from 'undici';

const proxyAgent = new undici.ProxyAgent('http://localhost:8888');
const client = new Fashn({
  fetchOptions: {
    dispatcher: proxyAgent,
  },
});
```

<img src="https://raw.githubusercontent.com/stainless-api/sdk-assets/refs/heads/main/bun.svg" align="top" width="18" height="21"> **Bun** <sup>[[docs](https://bun.sh/guides/http/proxy)]</sup>

```ts
import Fashn from 'fashn';

const client = new Fashn({
  fetchOptions: {
    proxy: 'http://localhost:8888',
  },
});
```

<img src="https://raw.githubusercontent.com/stainless-api/sdk-assets/refs/heads/main/deno.svg" align="top" width="18" height="21"> **Deno** <sup>[[docs](https://docs.deno.com/api/deno/~/Deno.createHttpClient)]</sup>

```ts
import Fashn from 'npm:fashn';

const httpClient = Deno.createHttpClient({ proxy: { url: 'http://localhost:8888' } });
const client = new Fashn({
  fetchOptions: {
    client: httpClient,
  },
});
```

## Frequently Asked Questions

## Semantic versioning

This package generally follows [SemVer](https://semver.org/spec/v2.0.0.html) conventions, though certain backwards-incompatible changes may be released as minor versions:

1. Changes that only affect static types, without breaking runtime behavior.
2. Changes to library internals which are technically public but not intended or documented for external use. _(Please open a GitHub issue to let us know if you are relying on such internals.)_
3. Changes that we do not expect to impact the vast majority of users in practice.

We take backwards-compatibility seriously and work hard to ensure you can rely on a smooth upgrade experience.

We are keen for your feedback; please open an [issue](https://www.github.com/fashn-AI/fashn-typescript-sdk/issues) with questions, bugs, or suggestions.

## Requirements

TypeScript >= 4.9 is supported.

The following runtimes are supported:

- Web browsers (Up-to-date Chrome, Firefox, Safari, Edge, and more)
- Node.js 20 LTS or later ([non-EOL](https://endoflife.date/nodejs)) versions.
- Deno v1.28.0 or higher.
- Bun 1.0 or later.
- Cloudflare Workers.
- Vercel Edge Runtime.
- Jest 28 or greater with the `"node"` environment (`"jsdom"` is not supported at this time).
- Nitro v2.6 or greater.

Note that React Native is not supported at this time.

## 📞 Support

For support or questions:
- Create an issue in the repository
- Include reproduction steps for bugs
- Provide browser and OS details
- Attach console logs if applicable

---

**Built with ❤️ for the future of online shopping**

*TheFitChecked - Where fashion meets technology*