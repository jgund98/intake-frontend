# Sana Vida - Healthcare Intake Platform

A modern, full-featured healthcare intake platform built with Nuxt 4, Vue 3, and TypeScript. This application provides a seamless patient onboarding experience with dynamic forms, secure payment processing, and comprehensive healthcare workflow management.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Development](#development)
- [API Reference](#api-reference)
- [Form Configurations](#form-configurations)
- [Theming & Customization](#theming--customization)
- [Deployment](#deployment)
- [Code Quality](#code-quality)
- [Additional Resources](#additional-resources)

---

## Overview

Sana Vida is a healthcare intake platform designed to streamline patient onboarding for various medical services including weight loss, skin care, hair growth, men's health, and wellness programs. The platform features:

- Multi-step intake forms with conditional logic
- Secure NMI payment integration
- AWS S3 file uploads for medical documents
- Real-time form validation with Zod
- Responsive design optimized for mobile and desktop
- Email notifications via SMTP
- Slack integration for team notifications
- Google Tag Manager for analytics

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Nuxt 4 (Vue 3) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4.1 |
| **State Management** | Pinia |
| **Validation** | Zod |
| **Payment** | NMI Collect.js |
| **File Storage** | AWS S3 |
| **Email** | Nodemailer |
| **Linting** | ESLint + Prettier |
| **Package Manager** | npm |

---

## Features

### Core Features
- **Dynamic Form Engine** - JSON-driven forms with conditional rendering and validation
- **Multi-step Wizard** - Intuitive stepper navigation with progress tracking
- **Payment Processing** - PCI-compliant payment tokenization via NMI Collect.js
- **File Uploads** - Secure document uploads to AWS S3 with presigned URLs
- **State Persistence** - Form progress saved via Pinia stores

### Healthcare-Specific
- **BMI Calculator** - Integrated health metrics calculation
- **Consultation Preferences** - Phone/video or email/text consultation options
- **Medication Tracking** - Current medication documentation
- **Medical History** - Comprehensive health questionnaires

### Integrations
- **Care360 GraphQL API** - Healthcare data management
- **Google Tag Manager** - Marketing and analytics tracking
- **Slack Notifications** - Real-time team alerts
- **Calendly** - Appointment scheduling integration

---

## Project Structure

```
sana-vida/intake-frontend/
│
├── assets/
│   └── css/
│       └── main.css                    # Tailwind theme configuration
│
├── components/
│   ├── cards/                          # Card-based UI components
│   │   ├── BeforeAfterCard.vue         # Before/after comparison
│   │   ├── BooleanFieldCard.vue        # Yes/No selection cards
│   │   ├── BundleCard.vue              # Product bundle display
│   │   ├── FileUpload.vue              # File upload component
│   │   ├── FormCardWrapper.vue         # Form card container
│   │   ├── IconCard.vue                # Icon-based cards
│   │   ├── ProductCard.vue             # Product display card
│   │   └── SelectChip.vue              # Selection chip/tag
│   │
│   ├── marketings/                     # Marketing components
│   │   ├── FrameCard.vue               # Marketing frame
│   │   └── ImageCard.vue               # Marketing image display
│   │
│   ├── panels/                         # Form panel components
│   │   ├── BasicInfo.vue               # Basic information form
│   │   ├── BMICalculator.vue           # BMI calculation panel
│   │   ├── BooleanSelectCard.vue       # Boolean selection panel
│   │   ├── CheckboxAgreements.vue      # Terms & agreements
│   │   ├── ConsultationPreference.vue  # Consultation type selection
│   │   ├── CurrentMedication.vue       # Medication documentation
│   │   ├── DropdownWithMultiSelect.vue # Multi-select dropdown
│   │   ├── MarketingWrapper.vue        # Desktop marketing wrapper
│   │   ├── MobileMarketingWrapper.vue  # Mobile marketing wrapper
│   │   ├── MobileProductDetailsWrapper.vue
│   │   ├── MobileSuccessDetailsWrapper.vue
│   │   ├── MultiSelect.vue             # Multi-select panel
│   │   ├── MultiSelectWithDropdowns.vue
│   │   ├── MultiSelectWithText.vue     # Multi-select with text input
│   │   ├── ProductDetailsWrapper.vue   # Product details display
│   │   ├── ProductSelection.vue        # Product selection panel
│   │   ├── SingleSelectCardList.vue    # Single select cards
│   │   ├── SuccessDetailsWrapper.vue   # Success state display
│   │   └── UserDetails.vue             # User details form
│   │
│   ├── payment/
│   │   └── NmiPayment.vue              # NMI payment integration
│   │
│   └── ui/                             # Reusable UI components
│       ├── buttons/
│       │   └── SwiperNavButton.vue     # Carousel navigation
│       ├── slider/
│       │   └── ProductSwiper.vue       # Product carousel
│       ├── stepper/
│       │   └── Stepper.vue             # Multi-step stepper
│       ├── AppLoader.vue               # Loading spinner
│       ├── CheckBox.vue                # Checkbox input
│       ├── ConfirmationModal.vue       # Modal dialog
│       ├── DatePicker.vue              # Date selection
│       ├── Dropdown.vue                # Dropdown select
│       ├── DropdownChecklist.vue       # Dropdown with checkboxes
│       ├── EmailInput.vue              # Email input with validation
│       ├── NumberInput.vue             # Number input
│       ├── PhoneInput.vue              # Phone input with formatting
│       ├── SingleSelect.vue            # Single select input
│       ├── TextArea.vue                # Multiline text input
│       ├── TextInput.vue               # Text input
│       └── Toast.vue                   # Toast notifications
│
├── composables/                        # Vue composables
│   ├── useCaseCreation.ts              # Case creation logic
│   ├── useFormRenderer.ts              # Dynamic form rendering
│   ├── useGlpTracking.ts               # GLP-1 conversion tracking
│   ├── useOrgData.ts                   # Organization data fetching
│   └── usePromoCode.ts                 # Promo code validation
│
├── data/
│   ├── forms/                          # Form configurations (JSON)
│   │   ├── index.ts                    # Form config exports
│   │   ├── hairGrowthConfig.json       # Hair growth intake form
│   │   ├── marketingConfig.json        # Marketing content config
│   │   ├── mensHealthConfig.json       # Men's health intake form
│   │   ├── skinCareConfig.json         # Skin care intake form
│   │   ├── weightLossConfig.json       # Weight loss intake form
│   │   └── wellnessConfig.json         # General wellness form
│   └── usStates.json                   # US states reference data
│
├── layouts/
│   ├── components/
│   │   └── Header.vue                  # Application header
│   └── default.vue                     # Default page layout
│
├── models/                             # TypeScript type definitions
│   ├── apiResponse.model.ts            # API response types
│   └── panels.model.ts                 # Panel component types
│
├── pages/                              # Route pages
│   ├── payment/
│   │   ├── index.vue                   # Payment page
│   │   └── success.vue                 # Payment success page
│   ├── products/
│   │   └── index.vue                   # Products listing
│   └── index.vue                       # Home/intake form page
│
├── plugins/
│   ├── gtm.client.ts                   # Google Tag Manager
│   └── init.client.ts                  # Client initialization
│
├── public/
│   ├── fonts/                          # Self-hosted fonts
│   ├── icons/                          # SVG icons
│   └── images/                         # Static images
│
├── server/
│   ├── api/                            # Server API endpoints
│   │   ├── assets-url.post.ts          # S3 presigned URL generation
│   │   ├── create-case.post.ts         # Case creation endpoint
│   │   ├── getOrgData.get.ts           # Organization data fetch
│   │   ├── log-nmi-error.post.ts       # Payment error logging
│   │   ├── log-nmi-success.post.ts     # Payment success logging
│   │   ├── send-feedback.post.ts       # Feedback email sending
│   │   └── v1/
│   │       └── promo-codes.get.ts      # Promo code validation
│   ├── lib/
│   │   └── appErrors.ts                # Error handling utilities
│   └── utils/
│       ├── s3Client.ts                 # AWS S3 client
│       └── slack.ts                    # Slack notification utility
│
├── stores/                             # Pinia stores
│   ├── intakeFormStore.ts              # Form state management
│   └── uiStore.ts                      # UI state management
│
├── utils/
│   └── caseHelper.ts                   # Case creation helpers
│
├── .env.example                        # Environment template
├── app.vue                             # Root Vue component
├── nuxt.config.ts                      # Nuxt configuration
├── package.json                        # Dependencies
├── tailwind.config.js                  # Tailwind configuration
└── tsconfig.json                       # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intake-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit with your configuration
   code .env  # or use your preferred editor
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

### Environment Configuration

Create a `.env` file in the project root with the following variables:

#### Organization & API Settings
```bash
# Care360 Healthcare API
NUXT_PUBLIC_GRAPHQL_LINK_NAME=your-link-name
NUXT_PUBLIC_CARE360_TOKEN=your-care360-token
NUXT_PUBLIC_GRAPHQL_API_URL=https://api.care360.com/graphql
```

#### Site Configuration
```bash
# Project Branding
NUXT_PROJECT_NAME=Sana Vida
NUXT_PROJECT_DOMAIN=https://sanavida.com
NUXT_PROJECT_LOGO_URL=/images/logo.svg

# Form Settings
NUXT_PUBLIC_DEFAULT_CATEGORY=Weight Loss

# External Links
NUXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-calendar
NUXT_PUBLIC_PRIVACY_POLICY=https://sanavida.com/privacy
```

#### Payment Processing
```bash
# NMI Payment Gateway (Collect.js tokenization key)
NUXT_PUBLIC_NMI_COLLECTJS_KEY=your-nmi-collectjs-key
```

#### Analytics
```bash
# Google Tag Manager
NUXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

#### Server-Side Only (Private)
```bash
# AWS S3 Configuration
NUXT_AWS_REGION=us-east-1
NUXT_AWS_ACCESS_KEY_ID=your-access-key
NUXT_AWS_SECRET_ACCESS_KEY=your-secret-key
NUXT_AWS_S3_BUCKET_NAME=your-bucket-name

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Slack Notifications
NUXT_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

> **Security Note**: Variables prefixed with `NUXT_PUBLIC_` are exposed to the browser. Never put sensitive credentials in public variables.

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run generate` | Generate static site |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |

### Development Workflow

1. Create a feature branch from `dev`
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit using conventional commits
   ```bash
   git add .
   git commit -m "feat: add new intake form field"
   ```

3. Push and create a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code formatting (no logic changes) |
| `refactor:` | Code refactoring |
| `perf:` | Performance improvements |
| `test:` | Adding/updating tests |
| `chore:` | Maintenance tasks |

---

## API Reference

### Server Endpoints

#### `POST /api/create-case`
Creates a new patient case in Care360.

**Request Body:**
```json
{
  "formData": { /* intake form data */ },
  "productId": "string",
  "paymentToken": "string"
}
```

#### `POST /api/assets-url`
Generates presigned S3 URLs for file uploads.

**Request Body:**
```json
{
  "fileName": "document.pdf",
  "fileType": "application/pdf"
}
```

#### `POST /api/send-feedback`
Sends customer feedback via email.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "projectName": "Sana Vida",
  "rating": 5,
  "feedback": "Great experience!"
}
```

#### `GET /api/getOrgData`
Fetches organization configuration data.

#### `GET /api/v1/promo-codes?code=SAVE20`
Validates and retrieves promo code details.

#### `POST /api/log-nmi-success` | `POST /api/log-nmi-error`
Logs payment transaction results for monitoring.

---

## Form Configurations

Form configurations are JSON files located in `data/forms/`. Each configuration defines:

- Panel types and sequence
- Field definitions and validation rules
- Conditional display logic
- Marketing content integration

### Available Form Types

| Form | File | Description |
|------|------|-------------|
| Weight Loss | `weightLossConfig.json` | GLP-1 and weight management intake |
| Skin Care | `skinCareConfig.json` | Dermatological treatment intake |
| Hair Growth | `hairGrowthConfig.json` | Hair restoration consultation |
| Men's Health | `mensHealthConfig.json` | Men's wellness and vitality |
| Wellness | `wellnessConfig.json` | General health and wellness |

### Form Configuration Structure

```json
{
  "category": "Weight Loss",
  "panels": [
    {
      "id": "basic-info",
      "type": "BasicInfo",
      "title": "Tell us about yourself",
      "fields": [
        {
          "name": "firstName",
          "type": "text",
          "label": "First Name",
          "required": true,
          "validation": {
            "minLength": 2,
            "maxLength": 50
          }
        }
      ]
    }
  ]
}
```

---

## Theming & Customization

### Tailwind CSS Theme

The design system is defined in `assets/css/main.css` using Tailwind CSS v4's `@theme` directive:

#### Color Palette
```css
@theme {
  /* Primary Brand Colors */
  --color-primary: #0A5F6B;
  --color-primary-light: #a1e1c4;
  --color-secondary: #3ab079;

  /* Grayscale */
  --color-gray-1: #1c1c1c;  /* Primary text */
  --color-gray-2: #383838;  /* Secondary text */
  /* ... */
}
```

#### Typography
```css
@theme {
  /* Font Families */
  --font-lora: 'Lora', serif;
  --font-domine: 'Domine', serif;

  /* Font Sizes */
  --text-h1: 3rem;
  --text-body1: 0.9375rem;
}
```

### Customizing Brand Colors

1. Open `assets/css/main.css`
2. Locate the `@theme` block
3. Update color values to match your brand:

```css
@theme {
  --color-primary: #YOUR_BRAND_COLOR;
  --color-primary-dark-8: #YOUR_DARK_SHADE;
  --color-secondary: #YOUR_SECONDARY_COLOR;
}
```

---

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview
```

### AWS Amplify Deployment

The project is configured for AWS Amplify deployment. See `infra.md` for detailed setup instructions.

### Environment Variables in Production

Ensure all environment variables are configured in your deployment platform:
- AWS Amplify: Configure in the Amplify Console under "Environment variables"
- Vercel: Configure in Project Settings > Environment Variables
- Netlify: Configure in Site settings > Environment variables

---

## Code Quality

### ESLint Configuration

The project uses ESLint with:
- `@nuxt/eslint-config` - Nuxt-specific rules
- `@typescript-eslint` - TypeScript support
- `eslint-plugin-vue` - Vue.js best practices
- `eslint-plugin-prettier` - Prettier integration

### Prettier Configuration

Code formatting is handled by Prettier with consistent styling across the codebase.

### Type Safety

Full TypeScript support with:
- Strict type checking enabled
- Type definitions for all models
- Vue component type inference

---

## Additional Resources

| Resource | Link |
|----------|------|
| Nuxt Documentation | https://nuxt.com/docs |
| Vue 3 Documentation | https://vuejs.org/ |
| Tailwind CSS v4 | https://tailwindcss.com/docs |
| Pinia Documentation | https://pinia.vuejs.org/ |
| Zod Validation | https://zod.dev/ |
| NMI Collect.js | https://secure.nmi.com/merchants/resources/integration/integration_portal.php |

---

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## Support

For questions, issues, or feature requests, please contact the development team.
