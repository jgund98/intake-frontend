# Complete Google Tag Manager (GTM) Integration Guide

**For Non-Technical Users - Step by Step Implementation**

This guide will help you implement Google Tag Manager tracking in your Nuxt.js application from start to finish. No technical expertise required - just follow each step carefully.

---

## Table of Contents

1. [What is GTM and Why Use It?](#what-is-gtm-and-why-use-it)
2. [Overview of Current Implementation](#overview-of-current-implementation)
3. [Prerequisites](#prerequisites)
4. [Part 1: Understanding the Code Structure](#part-1-understanding-the-code-structure)
5. [Part 2: Setting Up Environment Variables](#part-2-setting-up-environment-variables)
6. [Part 3: Code Implementation](#part-3-code-implementation)
7. [Part 4: Google Tag Manager Configuration](#part-4-google-tag-manager-configuration)
8. [Part 5: Testing Your Setup](#part-5-testing-your-setup)
9. [Part 6: Using GTM Anywhere in Your App](#part-6-using-gtm-anywhere-in-your-app)
10. [Troubleshooting](#troubleshooting)
11. [Complete Checklist](#complete-checklist)

---

## What is GTM and Why Use It?

**Google Tag Manager (GTM)** is a free tool that lets you track user behavior on your website without changing code every time. Think of it as a control panel where you can:

- Track when users complete forms
- Track purchases and conversions
- Send data to marketing platforms (like GLP Winner)
- Measure website performance
- All without asking developers to change code constantly

**Benefits:**
- One-time code setup
- Non-developers can manage tracking
- Changes go live instantly
- No website redeployment needed

---

## Overview of Current Implementation

Your application already has GTM integrated with two tracking events:

### 1. Lead Tracking (`glp_lead`)
Fires when users complete form steps during the intake process.

**Data Tracked:**
- User email
- Form step name (e.g., `weight_loss_step1_sub1_basicInfo`)
- Step ID and sub-step ID
- Step title and marketing ID

### 2. Conversion Tracking (`glp_conversion`)
Fires when users complete payment on the success page.

**Data Tracked:**
- User email
- Conversion ID (case ID from your system)

---

## Prerequisites

Before starting, ensure you have:

- [x] A Google Tag Manager account
- [x] Your GTM Container ID (looks like `GTM-XXXXXX`)
- [x] Access to your project's codebase
- [x] Access to your `.env` file
- [x] Node.js and npm installed
- [x] A code editor (VS Code recommended)

---

## Part 1: Understanding the Code Structure

Your GTM integration consists of these files:

### File Structure

```
intake-frontend/
├── plugins/
│   └── gtm.client.ts              ← Loads GTM on page load
├── composables/
│   ├── useGlpTracking.ts          ← Reusable tracking functions
│   └── useFormRenderer.ts         ← Tracks form step completion
├── pages/
│   └── payment/
│       └── success.vue            ← Tracks payment conversion
├── nuxt.config.ts                 ← Configuration file
├── .env                           ← Environment variables (GTM ID)
└── docs/
    └── GTM_COMPLETE_GUIDE.md      ← This file
```

### How It Works

```
1. User visits website
   ↓
2. gtm.client.ts loads GTM script
   ↓
3. User fills out form
   ↓
4. useFormRenderer.ts tracks each step completion → glp_lead event
   ↓
5. User completes payment
   ↓
6. success.vue tracks conversion → glp_conversion event
   ↓
7. GTM sends data to GLP Winner (or other platforms)
```

---

## Part 2: Setting Up Environment Variables

### Step 2.1: Locate Your `.env` File

Your `.env` file is in the root folder of your project:

```
intake-frontend/
└── .env
```

### Step 2.2: Add GTM Configuration

Open `.env` and add these lines:

```env
# Google Tag Manager Configuration
NUXT_PUBLIC_GTM_ID=GTM-XXXXXX
NUXT_PUBLIC_GTM_AUTH=
NUXT_PUBLIC_GTM_PREVIEW=
NUXT_PUBLIC_GTM_COOKIES_WIN=
```

**Replace `GTM-XXXXXX` with your actual GTM Container ID.**

**What are these variables?**

- `NUXT_PUBLIC_GTM_ID` - Your GTM container ID (required)
- `NUXT_PUBLIC_GTM_AUTH` - Authentication token for environment-specific tracking (optional)
- `NUXT_PUBLIC_GTM_PREVIEW` - Preview mode identifier (optional)
- `NUXT_PUBLIC_GTM_COOKIES_WIN` - Cookie settings (optional)

**Where to find your GTM Container ID:**
1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Click on your container
3. Look at the top right corner - you'll see `GTM-XXXXXX`

### Step 2.3: Verify Configuration in `nuxt.config.ts`

Open [nuxt.config.ts](../nuxt.config.ts) and verify these lines exist (they should already be there):

```typescript
runtimeConfig: {
  public: {
    gtmId: process.env.NUXT_PUBLIC_GTM_ID,
    gtmAuth: process.env.NUXT_PUBLIC_GTM_AUTH,
    gtmPreview: process.env.NUXT_PUBLIC_GTM_PREVIEW,
    gtmCookiesWin: process.env.NUXT_PUBLIC_GTM_COOKIES_WIN,
    // ... other config
  }
}
```

---

## Part 3: Code Implementation

All code is already implemented. This section explains each file so you can understand and modify it if needed.

### File 1: GTM Plugin - [plugins/gtm.client.ts](../plugins/gtm.client.ts)

**Purpose:** Loads Google Tag Manager when your website starts.

**Current Code:**

```typescript
export default defineNuxtPlugin(() => {
  const { public: { gtmId } } = useRuntimeConfig()
  if (!gtmId) return

  // Prevent double-injection
  if (document.getElementById('gtm-script')) return

  // dataLayer bootstrap
  ;(window as any).dataLayer = (window as any).dataLayer || []
  ;(window as any).dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  // Main GTM script
  const s = document.createElement('script')
  s.id = 'gtm-script'
  s.async = true
  s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
  document.head.appendChild(s)

  // Optional noscript iframe (good practice)
  const ns = document.createElement('noscript')
  ns.innerHTML = `
    <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>
  `
  document.body.prepend(ns)
})
```

**What it does:**
1. Gets your GTM ID from environment variables
2. Creates the GTM tracking script
3. Initializes the `dataLayer` (where tracking data is stored)
4. Adds a backup iframe for browsers with JavaScript disabled

**When it runs:** Automatically when any page loads (client-side only).

**Do you need to modify this?** No, it works as-is.

---

### File 2: Tracking Composable - [composables/useGlpTracking.ts](../composables/useGlpTracking.ts)

**Purpose:** Provides reusable functions to track leads and conversions.

**Current Code:**

```typescript
type GlpConversionPayload = {
  email?: string
  conversionId: string | number
  extra?: Record<string, any>
}

type GlpLeadPayload = {
  email?: string
  leadStep?: string
  extra?: Record<string, any>
}

export const useGlpTracking = () => {
  const push = (data: Record<string, any>) => {
    if (process.server) return
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).dataLayer.push(data)
  }

  const trackLead = ({ email, leadStep, extra = {} }: GlpLeadPayload) => {
    const payload = {
      event: "glp_lead",
      userEmail: email || undefined,
      lead_step: leadStep || undefined,
      ...extra,
    }
    console.log("DataLayer Push (lead):", payload)
    push(payload)
  }

  const trackConversion = ({ email, conversionId, extra = {} }: GlpConversionPayload) => {
    const payload = {
      event: "glp_conversion",
      userEmail: email || undefined,
      conversionId: String(conversionId),
      ...extra,
    }
    console.log("DataLayer Push (conversion):", payload)
    push(payload)
  }

  return { trackLead, trackConversion }
}
```

**What it does:**
- `trackLead()` - Sends lead tracking data to GTM
- `trackConversion()` - Sends conversion tracking data to GTM
- `push()` - Helper function that pushes data to GTM's dataLayer

**Key Variables Sent to GTM:**

| Function | Event Name | Variables |
|----------|-----------|-----------|
| `trackLead()` | `glp_lead` | `userEmail`, `lead_step`, custom extras |
| `trackConversion()` | `glp_conversion` | `userEmail`, `conversionId`, custom extras |

**Do you need to modify this?** Only if you want to track different data.

---

### File 3: Form Tracking - [composables/useFormRenderer.ts](../composables/useFormRenderer.ts:113-519)

**Purpose:** Automatically tracks when users complete form steps.

**Key Section:**

```typescript
const { trackLead } = useGlpTracking();

// Lead tracking state
const firedLeadSteps = new Set<string>()

const leadEmail = computed(() => {
  const basicInfo = formStore.formData?.basicInfo as any
  return basicInfo?.email || ""
})

const productSlug = computed(() => {
  const category = orgStore.category
  if (!category) return "unknown"
  return category.toLowerCase().replace(/\s+/g, "_") // "Weight Loss" -> "weight_loss"
})

const getLeadStepName = (step: Step, subStep: any, slug: string) => {
  const field = subStep.fieldName || subStep.component || "unknown"
  return `${slug}_step${step.stepId}_sub${subStep.subStepId}_${field}`
}

// Handle next - move to next visible substep
const handleNext = () => {
  const currentIndex = currentSubStepIndex.value
  const completedStep = steps.value.find(
    (step: Step) => step.stepId === currentStepId.value
  )
  const completedSubStep = visibleSubSteps.value[currentIndex]

  // Fire lead tracking for the COMPLETED step BEFORE navigation
  if (completedStep && completedSubStep) {
    const slug = productSlug.value
    const leadStepName = getLeadStepName(completedStep, completedSubStep, slug)

    if (!firedLeadSteps.has(leadStepName)) {
      firedLeadSteps.add(leadStepName)

      trackLead({
        email: leadEmail.value,
        leadStep: leadStepName,
        extra: {
          stepId: completedStep.stepId,
          subStepId: completedSubStep.subStepId,
          stepTitle: completedStep.stepTitle,
          marketingId: completedStep.marketingId,
        },
      })
    } else {
      console.log('Lead already tracked for this step, skipping')
    }
  }

  // Navigation logic continues...
}
```

**What it does:**
1. Monitors when users click "Continue" on form steps
2. Generates unique step names like `weight_loss_step1_sub1_basicInfo`
3. Tracks user's email address
4. Prevents duplicate tracking using a Set
5. Sends lead data to GTM before moving to next step

**Lead Step Name Format:**
```
{product_category}_step{stepId}_sub{subStepId}_{fieldName}

Examples:
- weight_loss_step1_sub1_basicInfo
- weight_loss_step2_sub3_medicalHistory
- erectile_dysfunction_step1_sub1_basicInfo
```

**Do you need to modify this?** Only if you want different step naming.

---

### File 4: Conversion Tracking - [pages/payment/success.vue](../pages/payment/success.vue:8-103)

**Purpose:** Tracks successful payment conversions.

**Key Section:**

```vue
<script setup lang="ts">
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackConversion } = useGlpTracking();
const formStore = useFormStore();

// Get user's email from form data
const userEmail = computed(() => {
  const userDetails = formStore.formData?.userDetails as any;
  const basicInfo = formStore.formData?.basicInfo as any;
  return userDetails?.email || basicInfo?.email || '';
});

// Check if payment was completed
const isPaymentCompleted = computed(() => formStore.isPaymentCompleted);

onMounted(() => {
  if (!isPaymentCompleted.value) {
    router.push({ path: "/payment" })
    return
  }

  const caseId = formStore.caseId
  const email = userEmail.value

  if (caseId) {
    trackConversion({
      email,
      conversionId: caseId,
    })
  } else {
    console.warn("GLP conversion not fired: missing caseId")
  }
})
</script>
```

**What it does:**
1. Checks if payment was completed
2. Gets user's email from form data
3. Gets case ID from form store
4. Sends conversion data to GTM when page loads
5. Shows warning if case ID is missing

**Do you need to modify this?** Only if you track conversions differently.

---

## Part 4: Google Tag Manager Configuration

Now that your code is ready, configure GTM to receive and use this data.

### Step 4.1: Create Data Layer Variables

Data Layer Variables tell GTM which pieces of data to read from your code.

#### Variable 1: User Email

1. Log in to [Google Tag Manager](https://tagmanager.google.com/)
2. Select your container
3. Click **Variables** in the left sidebar
4. Under "User-Defined Variables", click **New**
5. Click the variable configuration area
6. Choose **Data Layer Variable**
7. Configure:
   - **Variable Name:** `DLV - User Email`
   - **Data Layer Variable Name:** `userEmail`
   - **Data Layer Version:** Version 2
8. Click **Save**

#### Variable 2: Conversion ID

1. Click **New** to create another variable
2. Choose **Data Layer Variable**
3. Configure:
   - **Variable Name:** `DLV - Conversion ID`
   - **Data Layer Variable Name:** `conversionId`
   - **Data Layer Version:** Version 2
4. Click **Save**

#### Variable 3: Lead Step

1. Click **New** to create another variable
2. Choose **Data Layer Variable**
3. Configure:
   - **Variable Name:** `DLV - Lead Step`
   - **Data Layer Variable Name:** `lead_step`
   - **Data Layer Version:** Version 2
4. Click **Save**

#### Variable 4: Step ID (Optional)

1. Click **New**
2. Choose **Data Layer Variable**
3. Configure:
   - **Variable Name:** `DLV - Step ID`
   - **Data Layer Variable Name:** `stepId`
   - **Data Layer Version:** Version 2
4. Click **Save**

---

### Step 4.2: Create Custom Event Triggers

Triggers tell GTM when to fire your tags.

#### Trigger 1: GLP Lead Event

1. Click **Triggers** in the left sidebar
2. Click **New**
3. Click the trigger configuration area
4. Choose **Custom Event**
5. Configure:
   - **Trigger Name:** `Custom Event - GLP Lead`
   - **Event name:** `glp_lead`
   - **This trigger fires on:** All Custom Events
6. Click **Save**

**What this does:** Fires whenever your code sends a `glp_lead` event (form step completion).

#### Trigger 2: GLP Conversion Event

1. Click **New**
2. Choose **Custom Event**
3. Configure:
   - **Trigger Name:** `Custom Event - GLP Conversion`
   - **Event name:** `glp_conversion`
   - **This trigger fires on:** All Custom Events
4. Click **Save**

**What this does:** Fires whenever your code sends a `glp_conversion` event (payment success).

---

### Step 4.3: Create Tags

Tags are the actual code that runs when triggers fire.

#### Tag 1: GLP Winner Lead Tag

1. Click **Tags** in the left sidebar
2. Click **New**
3. Click the tag configuration area
4. Choose **Custom HTML**
5. Configure:
   - **Tag Name:** `GLP Winner - Lead`
   - **HTML:** Paste the code below

```html
<script>
  // Get values from Data Layer Variables
  var userEmail = {{DLV - User Email}};
  var leadStep = {{DLV - Lead Step}};
  var stepId = {{DLV - Step ID}};

  console.log('GLP Winner - Lead Tag Fired', {
    userEmail: userEmail,
    leadStep: leadStep,
    stepId: stepId
  });

  // Call GLP Winner SDK lead tracking
  if (typeof glp !== 'undefined' && leadStep) {
    glp.lead({
      email: userEmail,
      lead_step: leadStep
    });
  } else {
    console.warn('GLP Winner SDK not loaded or leadStep missing');
  }
</script>
```

6. Under **Triggering**, click the trigger area
7. Select **Custom Event - GLP Lead**
8. Click **Save**

#### Tag 2: GLP Winner Conversion Tag

1. Click **New**
2. Choose **Custom HTML**
3. Configure:
   - **Tag Name:** `GLP Winner - Conversion`
   - **HTML:** Paste the code below

```html
<script>
  // Get values from Data Layer Variables
  var userEmail = {{DLV - User Email}};
  var conversionId = {{DLV - Conversion ID}};

  console.log('GLP Winner - Conversion Tag Fired', {
    userEmail: userEmail,
    conversionId: conversionId
  });

  // Call GLP Winner SDK conversion tracking
  if (typeof glp !== 'undefined' && conversionId) {
    glp.conversion({
      email: userEmail,
      conversion_id: conversionId
    });
  } else {
    console.warn('GLP Winner SDK not loaded or conversionId missing');
  }
</script>
```

4. Under **Triggering**, select **Custom Event - GLP Conversion**
5. Click **Save**

---

### Step 4.4: Install GLP Winner SDK (Required)

You must install the GLP Winner SDK script so the tags can communicate with GLP Winner.

#### Option A: Using GLP Winner Tag Template (Recommended)

1. Go to **Templates** in the left sidebar
2. Click **Search Gallery** in the Tag Templates section
3. Search for "GLP Winner"
4. Click on the GLP Winner template
5. Click **Add to workspace**
6. Go to **Tags** and create a new tag
7. Choose **GLP Winner** template
8. Configure with your GLP Winner account settings
9. Under **Triggering**, select **All Pages**
10. Click **Save**

#### Option B: Manual Script Installation

If the template isn't available, contact GLP Winner support for your SDK script.

1. Go to **Tags** and click **New**
2. Choose **Custom HTML**
3. Configure:
   - **Tag Name:** `GLP Winner - SDK Initialization`
   - **HTML:** Paste your GLP Winner SDK script (provided by GLP Winner)
4. Under **Triggering**, select **All Pages**
5. Click **Save**

---

### Step 4.5: Submit and Publish

1. Click **Submit** in the top right corner
2. Add a **Version Name:** `GTM Lead and Conversion Tracking Setup`
3. Add a **Version Description:** `Implemented lead tracking for form steps and conversion tracking for payments`
4. Click **Publish**

Your GTM setup is now live!

---

## Part 5: Testing Your Setup

### Step 5.1: Enable GTM Preview Mode

1. In GTM, click **Preview** in the top right
2. Enter your website URL (e.g., `http://localhost:3000` or your production URL)
3. Click **Connect**
4. A new window opens with your site in debug mode

---

### Step 5.2: Test Lead Tracking (Form Steps)

#### Test Scenario 1: Complete First Form Step

1. Start filling out your intake form
2. Complete the first step (e.g., basic information)
3. Click "Continue"

**Expected Results:**

**In Browser Console (F12):**
```javascript
DataLayer Push (lead): {
  event: "glp_lead",
  userEmail: "user@example.com",
  lead_step: "weight_loss_step1_sub1_basicInfo",
  stepId: 1,
  subStepId: 1,
  stepTitle: "Basic Information",
  marketingId: 101
}

GLP Winner - Lead Tag Fired: {
  userEmail: "user@example.com",
  leadStep: "weight_loss_step1_sub1_basicInfo",
  stepId: 1
}
```

**In GTM Preview Panel:**
1. Event `glp_lead` appears in the timeline
2. Click on the event
3. Go to **Variables** tab - verify `DLV - User Email` and `DLV - Lead Step` show correct values
4. Go to **Tags** tab - verify `GLP Winner - Lead` tag shows "Fired"

#### Test Scenario 2: Complete Multiple Steps

1. Continue through 2-3 more form steps
2. Each time you click "Continue", check console and GTM Preview

**Expected Results:**
- Each step fires a unique `glp_lead` event
- Lead step names increment (e.g., `step1_sub2`, `step2_sub1`, etc.)
- No duplicate events for the same step (deduplication works)

---

### Step 5.3: Test Conversion Tracking (Payment Success)

#### Test Scenario: Complete Payment Flow

1. Fill out the entire form
2. Complete payment (use test payment if available)
3. Land on success page (`/payment/success`)

**Expected Results:**

**In Browser Console:**
```javascript
DataLayer Push (conversion): {
  event: "glp_conversion",
  userEmail: "user@example.com",
  conversionId: "case-12345-abc"
}

GLP Winner - Conversion Tag Fired: {
  userEmail: "user@example.com",
  conversionId: "case-12345-abc"
}
```

**In GTM Preview Panel:**
1. Event `glp_conversion` appears
2. Variables show correct email and conversion ID
3. Tag `GLP Winner - Conversion` shows "Fired"

---

### Step 5.4: Verify Data Layer Contents

In browser console, type:

```javascript
dataLayer
```

**Expected Output:**
```javascript
[
  { event: "gtm.js", "gtm.start": 1701234567890 },
  {
    event: "glp_lead",
    userEmail: "user@example.com",
    lead_step: "weight_loss_step1_sub1_basicInfo",
    stepId: 1,
    subStepId: 1,
    stepTitle: "Basic Information",
    marketingId: 101
  },
  {
    event: "glp_lead",
    userEmail: "user@example.com",
    lead_step: "weight_loss_step1_sub2_medicalHistory",
    stepId: 1,
    subStepId: 2,
    stepTitle: "Medical History",
    marketingId: 101
  },
  {
    event: "glp_conversion",
    userEmail: "user@example.com",
    conversionId: "case-12345-abc"
  }
]
```

---

### Step 5.5: Test Edge Cases

#### Edge Case 1: Missing Email

1. Clear form data
2. Complete a step without entering email
3. Check console

**Expected:**
```javascript
DataLayer Push (lead): {
  event: "glp_lead",
  userEmail: undefined,
  lead_step: "weight_loss_step1_sub1_basicInfo",
  ...
}
```

Tracking should still fire, just without email.

#### Edge Case 2: Missing Case ID

1. Navigate directly to `/payment/success` without completing payment
2. Check console

**Expected:**
```javascript
GLP conversion not fired: missing caseId
```

No conversion event should fire.

#### Edge Case 3: Duplicate Step

1. Complete step 1
2. Click "Back"
3. Click "Continue" again

**Expected:**
```javascript
Lead already tracked for this step, skipping
```

Only one `glp_lead` event fires per unique step.

---

## Part 6: Using GTM Anywhere in Your App

You can track custom events anywhere in your application using the `useGlpTracking` composable.

### Example 1: Track Button Click

```vue
<script setup lang="ts">
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackLead } = useGlpTracking();

const handleButtonClick = () => {
  trackLead({
    email: 'user@example.com',
    leadStep: 'custom_button_clicked',
    extra: {
      buttonName: 'Schedule Consultation',
      timestamp: Date.now()
    }
  });

  // Your button logic here
  console.log('Button clicked!');
};
</script>

<template>
  <button @click="handleButtonClick">
    Schedule Consultation
  </button>
</template>
```

### Example 2: Track Custom Page View

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackLead } = useGlpTracking();

onMounted(() => {
  trackLead({
    email: 'user@example.com',
    leadStep: 'pricing_page_viewed',
    extra: {
      pageUrl: window.location.href,
      referrer: document.referrer
    }
  });
});
</script>

<template>
  <div>
    <h1>Pricing Page</h1>
  </div>
</template>
```

### Example 3: Track Form Submission

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackLead } = useGlpTracking();
const email = ref('');
const formSubmitted = ref(false);

const handleSubmit = async () => {
  // Track form submission
  trackLead({
    email: email.value,
    leadStep: 'newsletter_signup',
    extra: {
      source: 'footer_form'
    }
  });

  // Submit form
  await submitToAPI(email.value);
  formSubmitted.value = true;
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="email" type="email" placeholder="Enter your email" />
    <button type="submit">Subscribe</button>
  </form>
</template>
```

### Example 4: Track Video Play

```vue
<script setup lang="ts">
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackLead } = useGlpTracking();

const handleVideoPlay = () => {
  trackLead({
    leadStep: 'product_video_played',
    extra: {
      videoId: 'intro-video-01',
      videoDuration: 120,
      timestamp: Date.now()
    }
  });
};

const handleVideoComplete = () => {
  trackLead({
    leadStep: 'product_video_completed',
    extra: {
      videoId: 'intro-video-01',
      watchTime: 120
    }
  });
};
</script>

<template>
  <video
    @play="handleVideoPlay"
    @ended="handleVideoComplete"
    src="/videos/intro.mp4"
  />
</template>
```

### Example 5: Track Custom Conversion

```vue
<script setup lang="ts">
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackConversion } = useGlpTracking();

const handleSubscriptionPurchase = async (subscriptionId: string) => {
  // Process subscription
  await processSubscription(subscriptionId);

  // Track conversion
  trackConversion({
    email: 'user@example.com',
    conversionId: subscriptionId,
    extra: {
      plan: 'premium',
      amount: 99.99,
      currency: 'USD'
    }
  });
};
</script>
```

### Example 6: Track E-commerce Events

```vue
<script setup lang="ts">
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackLead } = useGlpTracking();

// Track product view
const trackProductView = (productId: string) => {
  trackLead({
    leadStep: 'product_viewed',
    extra: {
      productId,
      category: 'weight-loss',
      timestamp: Date.now()
    }
  });
};

// Track add to cart
const trackAddToCart = (productId: string, price: number) => {
  trackLead({
    leadStep: 'product_added_to_cart',
    extra: {
      productId,
      price,
      currency: 'USD'
    }
  });
};

// Track checkout started
const trackCheckoutStarted = (cartTotal: number) => {
  trackLead({
    leadStep: 'checkout_started',
    extra: {
      cartTotal,
      itemCount: 2
    }
  });
};
</script>
```

---

### Creating GTM Tags for Custom Events

For each custom event, create corresponding GTM tags:

#### Step 1: Create Data Layer Variable (if needed)

For custom data like `buttonName`, create a new DLV:

1. Go to **Variables** → **New**
2. Choose **Data Layer Variable**
3. Configure:
   - **Variable Name:** `DLV - Button Name`
   - **Data Layer Variable Name:** `buttonName`
4. Click **Save**

#### Step 2: Create Trigger

1. Go to **Triggers** → **New**
2. Choose **Custom Event**
3. Configure:
   - **Trigger Name:** `Custom Event - Button Clicked`
   - **Event name:** Use the `lead_step` value (e.g., `custom_button_clicked`)
   - **This trigger fires on:** Some Custom Events
   - **Fire this trigger when:** `lead_step` equals `custom_button_clicked`
4. Click **Save**

#### Step 3: Create Tag

1. Go to **Tags** → **New**
2. Choose **Custom HTML** or use GLP Winner template
3. Add your tracking code
4. Attach the trigger
5. Click **Save**

---

## Troubleshooting

### Issue 1: GTM Script Not Loading

**Symptoms:**
- No console logs
- `dataLayer` is undefined
- No GTM Preview panel

**Solutions:**

1. **Check GTM ID in `.env`:**
   ```env
   NUXT_PUBLIC_GTM_ID=GTM-XXXXXX
   ```
   Make sure it's correct and starts with `GTM-`.

2. **Restart development server:**
   ```bash
   npm run dev
   ```

3. **Check browser console for errors:**
   - Open DevTools (F12)
   - Look for script loading errors
   - Verify GTM script is in the `<head>` tag

4. **Verify plugin is loaded:**
   - Check [plugins/gtm.client.ts](../plugins/gtm.client.ts) exists
   - Ensure filename ends with `.client.ts` (client-side only)

---

### Issue 2: Events Not Firing

**Symptoms:**
- No console logs for `DataLayer Push`
- `dataLayer` array is empty
- GTM Preview shows no events

**Solutions:**

1. **Check if you're on the correct page:**
   - Lead tracking only fires on form pages
   - Conversion tracking only fires on `/payment/success`

2. **Verify conditions are met:**
   - For conversions: `isPaymentCompleted` must be `true`
   - For conversions: `caseId` must exist

3. **Check form store data:**
   ```javascript
   // In browser console
   console.log($nuxt.$pinia.state.value.intakeFormStore)
   ```

4. **Look for warnings in console:**
   ```
   GLP conversion not fired: missing caseId
   Lead already tracked for this step, skipping
   ```

---

### Issue 3: Email Not Captured

**Symptoms:**
- `userEmail` shows as `undefined` in dataLayer
- GTM Preview shows empty email variable

**Solutions:**

1. **Verify email field in form:**
   - Check form has an email input
   - Verify field is named correctly

2. **Check form store structure:**
   ```javascript
   // In browser console
   const store = $nuxt.$pinia.state.value.intakeFormStore
   console.log('User email:', store.formData?.basicInfo?.email)
   console.log('Or:', store.formData?.userDetails?.email)
   ```

3. **Update email path in code if needed:**

   In [pages/payment/success.vue](../pages/payment/success.vue:48-52):
   ```typescript
   const userEmail = computed(() => {
     const userDetails = formStore.formData?.userDetails as any;
     const basicInfo = formStore.formData?.basicInfo as any;
     const contactInfo = formStore.formData?.contactInfo as any; // Add if needed

     return userDetails?.email
       || basicInfo?.email
       || contactInfo?.email // Add if needed
       || '';
   });
   ```

---

### Issue 4: Tags Not Firing in GTM

**Symptoms:**
- Events appear in GTM Preview
- Variables show correct data
- But tags show "Not Fired" or don't appear

**Solutions:**

1. **Check trigger configuration:**
   - Event name must exactly match: `glp_lead` or `glp_conversion`
   - Event names are case-sensitive

2. **Verify tag has trigger attached:**
   - Edit the tag
   - Check "Triggering" section
   - Make sure correct trigger is selected

3. **Check tag sequencing:**
   - SDK initialization must fire before conversion/lead tags
   - Go to tag **Advanced Settings** → **Tag Sequencing**
   - Add dependency on SDK initialization tag

4. **Look for tag errors in GTM Preview:**
   - Click on the tag in GTM Preview
   - Check "Errors" tab
   - Fix JavaScript errors in tag code

---

### Issue 5: Duplicate Events Firing

**Symptoms:**
- Same `glp_lead` event fires multiple times for one step
- Multiple tags fire when only one should

**Solutions:**

1. **Check deduplication logic:**

   In [composables/useFormRenderer.ts](../composables/useFormRenderer.ts:467-482):
   ```typescript
   if (!firedLeadSteps.has(leadStepName)) {
     firedLeadSteps.add(leadStepName)
     trackLead({...})
   } else {
     console.log('Lead already tracked for this step, skipping')
   }
   ```

   This should prevent duplicates. If it doesn't, the Set might be cleared on page reload.

2. **Verify GTM tag firing conditions:**
   - Edit trigger
   - Add condition: "Fire this trigger when Page URL does not contain 'preview'"
   - This prevents double-firing in GTM Preview mode

3. **Check for multiple GTM containers:**
   - Search page source for `GTM-`
   - Ensure only one container is loaded

---

### Issue 6: Conversions Not in GLP Winner Dashboard

**Symptoms:**
- Everything works in GTM Preview
- Console logs show correct data
- But conversions don't appear in GLP Winner

**Solutions:**

1. **Verify GTM container is published:**
   - GTM Preview mode doesn't send real data
   - Click **Submit** → **Publish** in GTM

2. **Check GLP Winner SDK is loaded:**
   ```javascript
   // In browser console
   console.log(typeof glp)
   // Should output: "object" or "function"
   // If "undefined", SDK isn't loaded
   ```

3. **Verify SDK initialization:**
   - Check Network tab in DevTools
   - Look for requests to GLP Winner's domain
   - Verify SDK script loads successfully (status 200)

4. **Check GLP Winner account credentials:**
   - Verify you're using correct account
   - Check affiliate ID is correct
   - Contact GLP Winner support if needed

5. **Wait for data processing:**
   - Data may take 10-15 minutes to appear
   - Some platforms have delayed reporting

6. **Test with GLP Winner's debugging tool:**
   - Contact GLP Winner support for debugging URL
   - They can verify if conversions are received

---

### Issue 7: TypeScript Errors

**Symptoms:**
- Red underlines in code editor
- Build errors

**Solutions:**

1. **Install type definitions:**
   ```bash
   npm install --save-dev @types/gtag.js
   ```

2. **Add type declarations:**

   Create `types/gtm.d.ts`:
   ```typescript
   interface Window {
     dataLayer: any[];
     glp?: {
       lead: (data: any) => void;
       conversion: (data: any) => void;
     };
   }
   ```

3. **Use type assertions:**
   ```typescript
   (window as any).dataLayer = (window as any).dataLayer || []
   ```

---

### Issue 8: GTM Preview Not Connecting

**Symptoms:**
- Can't connect to Preview mode
- "Waiting for connection" message

**Solutions:**

1. **Disable browser extensions:**
   - Ad blockers often block GTM
   - Try incognito/private mode

2. **Check CORS settings:**
   - GTM Preview requires cookies
   - Check browser privacy settings
   - Allow third-party cookies for GTM domains

3. **Use same browser:**
   - Open GTM and your site in same browser
   - Don't switch between browsers

4. **Clear browser cache:**
   - Clear cookies and cache
   - Try connecting again

---

## Complete Checklist

Use this checklist to ensure everything is set up correctly:

### Environment Configuration
- [ ] GTM Container ID added to `.env` file
- [ ] `.env` file not committed to git (in `.gitignore`)
- [ ] `nuxt.config.ts` reads GTM ID from environment
- [ ] Development server restarted after environment changes

### Code Files
- [ ] [plugins/gtm.client.ts](../plugins/gtm.client.ts) exists and loads GTM script
- [ ] [composables/useGlpTracking.ts](../composables/useGlpTracking.ts) provides tracking functions
- [ ] [composables/useFormRenderer.ts](../composables/useFormRenderer.ts) tracks form steps
- [ ] [pages/payment/success.vue](../pages/payment/success.vue) tracks conversions
- [ ] No console errors in browser

### GTM Configuration
- [ ] Data Layer Variable created: `DLV - User Email` → `userEmail`
- [ ] Data Layer Variable created: `DLV - Conversion ID` → `conversionId`
- [ ] Data Layer Variable created: `DLV - Lead Step` → `lead_step`
- [ ] Data Layer Variable created (optional): `DLV - Step ID` → `stepId`
- [ ] Custom Event Trigger created: `glp_lead`
- [ ] Custom Event Trigger created: `glp_conversion`
- [ ] GLP Winner SDK tag created and fires on All Pages
- [ ] GLP Winner Lead tag created with `glp_lead` trigger
- [ ] GLP Winner Conversion tag created with `glp_conversion` trigger
- [ ] All tags have correct variables attached
- [ ] Container published (not just previewed)

### Testing - Lead Tracking
- [ ] GTM Preview mode works
- [ ] Console logs show `DataLayer Push (lead)` when completing form steps
- [ ] `glp_lead` event appears in GTM Preview timeline
- [ ] Variables show correct email and lead step name
- [ ] `GLP Winner - Lead` tag fires
- [ ] No duplicate events for same step
- [ ] Lead step names follow format: `{category}_step{id}_sub{id}_{field}`

### Testing - Conversion Tracking
- [ ] Console logs show `DataLayer Push (conversion)` on success page
- [ ] `glp_conversion` event appears in GTM Preview
- [ ] Variables show correct email and conversion ID
- [ ] `GLP Winner - Conversion` tag fires
- [ ] Case ID is captured correctly
- [ ] Warning appears if case ID is missing

### Testing - Edge Cases
- [ ] Tracking works without email (email shows as `undefined`)
- [ ] Conversion doesn't fire if payment not completed
- [ ] Back button doesn't create duplicate lead events
- [ ] Direct navigation to success page shows warning

### Production Verification
- [ ] GTM container published to production
- [ ] Live site loads GTM script (check page source)
- [ ] dataLayer exists on live site (check console)
- [ ] Events fire on live site (check console logs)
- [ ] GLP Winner SDK loads on live site
- [ ] Conversions appear in GLP Winner dashboard within 15 minutes
- [ ] No JavaScript errors in production console

### Documentation
- [ ] Team members know how to use `useGlpTracking` composable
- [ ] Instructions for adding new tracking events documented
- [ ] GTM access shared with team (if needed)
- [ ] GLP Winner account access documented

---

## Summary

You now have a complete GTM integration with:

- Automatic lead tracking on form steps
- Automatic conversion tracking on payment success
- Reusable composable for custom tracking anywhere
- Deduplication to prevent double-tracking
- Comprehensive testing and troubleshooting guides

### Data Flow

```
User Action
    ↓
Code tracks event → useGlpTracking()
    ↓
Data pushed to dataLayer
    ↓
GTM detects event → Trigger fires
    ↓
GTM reads variables → Tag executes
    ↓
GLP Winner SDK → Sends to GLP Winner servers
    ↓
GLP Winner Dashboard → Shows attribution
```

### Key Files Reference

| File | Purpose | When to Modify |
|------|---------|----------------|
| [plugins/gtm.client.ts](../plugins/gtm.client.ts) | Loads GTM | Rarely (already works) |
| [composables/useGlpTracking.ts](../composables/useGlpTracking.ts) | Tracking functions | When adding new tracking types |
| [composables/useFormRenderer.ts](../composables/useFormRenderer.ts) | Auto form tracking | When changing step naming |
| [pages/payment/success.vue](../pages/payment/success.vue) | Conversion tracking | When email path changes |
| [nuxt.config.ts](../nuxt.config.ts) | Configuration | When adding new env variables |
| `.env` | GTM ID | When changing GTM container |

### Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check console for tracking
# Open DevTools (F12) → Console tab

# Check dataLayer contents
# In browser console:
dataLayer

# Check if GLP SDK loaded
# In browser console:
typeof glp
```

---

## Getting Help

### Internal Resources
- This documentation: [docs/GTM_COMPLETE_GUIDE.md](../docs/GTM_COMPLETE_GUIDE.md)
- Legacy documentation: [docs/GLP_WINNER_GTM_SETUP.md](../docs/GLP_WINNER_GTM_SETUP.md)
- Code files: See "Key Files Reference" above

### External Resources
- GLP Winner Support: support@glpwinner.com
- GLP Winner Docs: https://www.glpwinner.com/tech-docs/affiliate-tracking-with-google-tag-manager
- GTM Help Center: https://support.google.com/tagmanager
- GTM Academy: https://analytics.google.com/analytics/academy/

### Developer Tools
- Browser Console: F12 → Console tab
- Network Tab: F12 → Network tab
- GTM Preview Mode: Debug tags in real-time
- Vue DevTools: For debugging Pinia stores

---

**Last Updated:** December 2025
**Version:** 2.0
**Author:** Development Team
**Compatibility:** Nuxt 3.x, Vue 3.x, GTM Container v2

---

## Appendix: Event Schema Reference

### Lead Event Schema

```typescript
{
  event: "glp_lead",
  userEmail: string | undefined,
  lead_step: string | undefined,
  stepId?: number,
  subStepId?: number,
  stepTitle?: string,
  marketingId?: number,
  ...extra?: any
}
```

### Conversion Event Schema

```typescript
{
  event: "glp_conversion",
  userEmail: string | undefined,
  conversionId: string,
  ...extra?: any
}
```

### Example Lead Event

```json
{
  "event": "glp_lead",
  "userEmail": "john.doe@example.com",
  "lead_step": "weight_loss_step1_sub1_basicInfo",
  "stepId": 1,
  "subStepId": 1,
  "stepTitle": "Basic Information",
  "marketingId": 101
}
```

### Example Conversion Event

```json
{
  "event": "glp_conversion",
  "userEmail": "john.doe@example.com",
  "conversionId": "case-12345-abc-def"
}
```

---

## Appendix: GTM Variable Names Reference

| Code Variable | GTM DLV Name | Description |
|---------------|--------------|-------------|
| `userEmail` | `DLV - User Email` | User's email address |
| `conversionId` | `DLV - Conversion ID` | Case/Order ID for conversion |
| `lead_step` | `DLV - Lead Step` | Form step name |
| `stepId` | `DLV - Step ID` | Numeric step ID |
| `subStepId` | `DLV - Sub Step ID` | Numeric sub-step ID |
| `stepTitle` | `DLV - Step Title` | Human-readable step title |
| `marketingId` | `DLV - Marketing ID` | Marketing campaign ID |

---

## Appendix: Common Lead Step Names

Based on your form configuration:

```
weight_loss_step1_sub1_basicInfo
weight_loss_step1_sub2_medicalHistory
weight_loss_step2_sub1_currentMedications
weight_loss_step2_sub2_allergies
weight_loss_step3_sub1_consultationPreference
erectile_dysfunction_step1_sub1_basicInfo
erectile_dysfunction_step1_sub2_symptoms
...
```

**Format:** `{category}_{step}{id}_sub{id}_{fieldName}`

- `category` - Product category slug (lowercase, underscores)
- `stepId` - Main step number
- `subStepId` - Sub-step number within main step
- `fieldName` - Field name or component name

---

**End of Documentation**
