# GLP Winner Tracking with Google Tag Manager - Complete Setup Guide

This guide will walk you through setting up GLP Winner affiliate tracking using Google Tag Manager (GTM) in your Nuxt.js application.

## 📚 Official Documentation
- [GLP Winner Tech Docs - Affiliate Tracking with GTM](https://www.glpwinner.com/tech-docs/affiliate-tracking-with-google-tag-manager)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Part 1: Code Implementation](#part-1-code-implementation)
3. [Part 2: Google Tag Manager Setup](#part-2-google-tag-manager-setup)
4. [Part 3: Testing & Verification](#part-3-testing--verification)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:
- ✅ A GLP Winner account
- ✅ A Google Tag Manager container ID (looks like `GTM-XXXXXX`)
- ✅ Access to your website's code
- ✅ Basic understanding of your website's structure

---

## Part 1: Code Implementation

### Step 1.1: Install GTM Plugin

**File:** `plugins/gtm.client.ts`

Create this file in your `plugins` folder and paste the following code:

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

**What this does:** This plugin loads Google Tag Manager on your website and initializes the data layer.

---

### Step 1.2: Create Tracking Composable

**File:** `composables/useGlpTracking.ts`

Create this file in your `composables` folder:

```typescript
type GlpConversionPayload = {
  email?: string
  conversionId: string | number // required
  extra?: Record<string, any>
}

export const useGlpTracking = () => {
  const push = (data: Record<string, any>) => {
    if (process.server) return
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).dataLayer.push(data)
  }

  const trackConversion = ({ email, conversionId, extra = {} }: GlpConversionPayload) => {
    const payload = {
      event: "glp_conversion",
      userEmail: email || undefined,
      conversionId: String(conversionId),
      ...extra,
    }
    console.log('DataLayer Push:', payload)
    push(payload)
  }

  return { trackConversion }
}
```

**What this does:** This creates a reusable function to track conversions by pushing data to the GTM data layer.

**Important Note:** The key names `userEmail` and `conversionId` must match what you configure in GTM (covered in Part 2).

---

### Step 1.3: Implement Tracking on Success Page

**File:** `pages/payment/success.vue`

In your payment success page, add the tracking code in the `onMounted` lifecycle hook:

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFormStore } from '~/stores/intakeFormStore';
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackConversion } = useGlpTracking();
const router = useRouter();
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

  console.log('GLP Tracking Debug:', { email, caseId, formData: formStore.formData })

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

**What this does:**
- When a user completes payment and lands on the success page
- It captures their email and case ID
- It sends this data to GTM for tracking

---

### Step 1.4: Configure Environment Variables

**File:** `nuxt.config.ts`

Add your GTM ID to your Nuxt config:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      gtmId: process.env.NUXT_PUBLIC_GTM_ID || 'GTM-XXXXXX',
      // ... other config
    }
  }
})
```

**File:** `.env`

Create or update your `.env` file:

```
NUXT_PUBLIC_GTM_ID=GTM-PCV5PS6X
```

Replace `GTM-PCV5PS6X` with your actual GTM container ID.

---

## Part 2: Google Tag Manager Setup

Now that the code is ready, let's configure GTM to receive and use this data.

### Step 2.1: Create Data Layer Variables

#### Variable 1: User Email

1. Log in to [Google Tag Manager](https://tagmanager.google.com/)
2. Select your container
3. Click **Variables** in the left sidebar
4. Under "User-Defined Variables", click **New**
5. Click the variable configuration area
6. Choose **Data Layer Variable**
7. Configure as follows:
   - **Variable Name:** `DLV - User Email`
   - **Data Layer Variable Name:** `userEmail`
   - **Data Layer Version:** Version 2
8. Click **Save**

![Data Layer Variable - User Email](screenshots/dlv-user-email.png)

---

#### Variable 2: Conversion ID

1. Click **New** to create another variable
2. Choose **Data Layer Variable**
3. Configure as follows:
   - **Variable Name:** `DLV - Conversion ID`
   - **Data Layer Variable Name:** `conversionId`
   - **Data Layer Version:** Version 2
4. Click **Save**

![Data Layer Variable - Conversion ID](screenshots/dlv-conversion-id.png)

---

### Step 2.2: Create Custom Event Trigger

1. Click **Triggers** in the left sidebar
2. Click **New**
3. Click the trigger configuration area
4. Choose **Custom Event**
5. Configure as follows:
   - **Trigger Name:** `Custom Event - GLP Conversion`
   - **Event name:** `glp_conversion`
   - **This trigger fires on:** All Custom Events
6. Click **Save**

**What this does:** This trigger will fire whenever your code pushes the `glp_conversion` event to the data layer.

---

### Step 2.3: Create GLP Winner Conversion Tag

1. Click **Tags** in the left sidebar
2. Click **New**
3. Click the tag configuration area
4. Choose **Custom HTML**
5. Configure as follows:
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

6. Under **Triggering**, click the trigger area
7. Select **Custom Event - GLP Conversion** (the trigger you created in Step 2.2)
8. Click **Save**

**What this does:** This tag runs when the trigger fires, and it sends the email and conversion ID to the GLP Winner SDK.

---

### Step 2.4: Install GLP Winner SDK

You need to add the GLP Winner SDK script to your GTM container.

#### Option A: Using GLP Winner Tag Template (Recommended)

1. Go to **Templates** in the left sidebar
2. Click **Search Gallery** in the Tag Templates section
3. Search for "GLP Winner"
4. Click on the GLP Winner template
5. Click **Add to workspace**
6. Go to **Tags** and create a new tag
7. Choose **GLP Winner** template
8. Configure:
   - **Tag Name:** `GLP Winner - Initialize`
   - Add your GLP Winner account settings (provided by GLP Winner)
9. Under **Triggering**, select **All Pages**
10. Click **Save**

#### Option B: Manual Script Installation

If the template is not available:

1. Go to **Tags** and click **New**
2. Choose **Custom HTML**
3. Configure:
   - **Tag Name:** `GLP Winner - SDK Initialization`
   - **HTML:** Paste the GLP Winner SDK script (provided by GLP Winner support)

```html
<script>
  // GLP Winner SDK script provided by GLP Winner
  // Contact GLP Winner support for your specific SDK code
</script>
```

4. Under **Triggering**, select **All Pages**
5. Click **Save**

---

### Step 2.5: Submit and Publish

1. Click **Submit** in the top right corner
2. Add a **Version Name:** `Added GLP Winner Conversion Tracking`
3. Add a **Version Description:** `Implemented conversion tracking with email and conversion ID`
4. Click **Publish**

🎉 Your GTM setup is now complete!

---

## Part 3: Testing & Verification

### Step 3.1: Enable GTM Preview Mode

1. In GTM, click **Preview** in the top right corner
2. Enter your website URL (e.g., `http://localhost:3000` or your production URL)
3. Click **Connect**
4. A new window will open with your website in debug mode

---

### Step 3.2: Test the Conversion Flow

1. In the debug window, complete your payment flow
2. Navigate to the payment success page
3. Open the browser console (F12 or Right-click → Inspect → Console)
4. Look for the following logs:

```
GLP Tracking Debug: {
  email: 'user@example.com',
  caseId: 'abc-123-def-456',
  formData: {...}
}

DataLayer Push: {
  event: 'glp_conversion',
  userEmail: 'user@example.com',
  conversionId: 'abc-123-def-456'
}

GLP Winner - Conversion Tag Fired: {
  userEmail: 'user@example.com',
  conversionId: 'abc-123-def-456'
}
```

---

### Step 3.3: Verify in GTM Preview

1. In the GTM Preview panel (bottom of the page), you should see:
   - **Event:** `glp_conversion`
2. Click on the `glp_conversion` event
3. Go to the **Variables** tab
4. Verify that:
   - **DLV - User Email** shows the user's email
   - **DLV - Conversion ID** shows the conversion ID
5. Go to the **Tags** tab
6. Verify that **GLP Winner - Conversion** tag shows as "Fired"

---

### Step 3.4: Check Data Layer

In the browser console, type:

```javascript
dataLayer
```

You should see an array containing your conversion event:

```javascript
[
  {
    event: 'glp_conversion',
    userEmail: 'user@example.com',
    conversionId: 'abc-123-def-456'
  }
]
```

---

## Troubleshooting

### Issue 1: Email or Conversion ID showing as "undefined"

**Problem:** In GTM Preview, the variables show as "undefined"

**Solution:**
1. Check that the data layer variable names in GTM match exactly what your code is pushing
   - Code pushes: `userEmail` → GTM variable must look for `userEmail`
   - Code pushes: `conversionId` → GTM variable must look for `conversionId`
2. Check the browser console for the "DataLayer Push" log to see what's actually being sent
3. Verify the variable names are case-sensitive (e.g., `userEmail` ≠ `useremail`)

---

### Issue 2: Conversion tag not firing

**Problem:** The GLP Winner conversion tag doesn't fire

**Solution:**
1. Check that the trigger is correctly configured
   - Event name must be exactly `glp_conversion`
2. Check that the tag has the correct trigger attached
3. Use GTM Preview mode to see why the tag didn't fire (blocked, not triggered, etc.)

---

### Issue 3: GLP SDK not defined

**Problem:** Console shows "GLP Winner SDK not loaded"

**Solution:**
1. Make sure the GLP Winner SDK initialization tag is set to fire on "All Pages"
2. Check that the SDK script is loading (Network tab in browser dev tools)
3. Make sure the SDK loads before the conversion tag fires
4. Add tag sequencing in GTM:
   - Edit the "GLP Winner - Conversion" tag
   - Go to "Advanced Settings" → "Tag Sequencing"
   - Check "Fire a tag before GLP Winner - Conversion fires"
   - Select "GLP Winner - SDK Initialization"

---

### Issue 4: Email not captured in form

**Problem:** Console shows empty email

**Solution:**
1. Verify your form is capturing the email field
2. Check the path to the email in your form store
3. Update the `userEmail` computed property in `success.vue`:

```typescript
const userEmail = computed(() => {
  // Adjust these paths based on your form structure
  const userDetails = formStore.formData?.userDetails as any;
  const basicInfo = formStore.formData?.basicInfo as any;
  const contactInfo = formStore.formData?.contactInfo as any;

  return userDetails?.email
    || basicInfo?.email
    || contactInfo?.email
    || '';
});
```

---

### Issue 5: Conversions not showing in GLP Winner dashboard

**Problem:** Everything works in GTM Preview but conversions don't appear in GLP Winner

**Solution:**
1. Make sure you've published your GTM container (not just previewed)
2. Check that you're using the correct GLP Winner account credentials
3. Wait 10-15 minutes for data to appear (there can be a delay)
4. Contact GLP Winner support to verify your setup
5. Check that the conversion beacon is being sent:
   - Open Network tab in browser dev tools
   - Look for requests to GLP Winner's tracking domain
   - Verify the request includes email and conversion_id

---

## Key Concepts Explained

### What is the Data Layer?

The **data layer** is like a storage box where your website puts information that Google Tag Manager can read. Think of it as a messenger between your website and GTM.

**Example:**
```javascript
// Your website puts data in the box
dataLayer.push({
  event: 'purchase',
  userEmail: 'john@example.com',
  orderTotal: 99.99
})

// GTM reads from the box and uses this information
```

---

### What are Data Layer Variables?

**Data Layer Variables** in GTM are like labels that tell GTM which piece of information to pick up from the data layer.

**Example:**
- Your code pushes: `userEmail: 'john@example.com'`
- GTM variable named "DLV - User Email" looks for `userEmail`
- GTM can now use `{{DLV - User Email}}` in tags, which will contain `'john@example.com'`

---

### What are Triggers?

**Triggers** tell GTM when to do something. They're like rules: "When X happens, fire this tag."

**Example:**
- **Trigger:** "When the `glp_conversion` event happens"
- **Action:** "Fire the GLP Winner conversion tag"

---

### What are Tags?

**Tags** are the actual code that runs when a trigger fires. They do the work.

**Example:**
- When someone completes payment
- The trigger fires
- The tag sends conversion data to GLP Winner

---

## Data Flow Diagram

```
User completes payment
         ↓
pages/payment/success.vue
    - Gets email and conversionId
         ↓
useGlpTracking.ts
    - Pushes to dataLayer: { event: 'glp_conversion', userEmail, conversionId }
         ↓
Google Tag Manager
    - Detects 'glp_conversion' event
    - Trigger fires
         ↓
Data Layer Variables
    - DLV - User Email reads 'userEmail'
    - DLV - Conversion ID reads 'conversionId'
         ↓
GLP Winner - Conversion Tag
    - Gets variables
    - Calls glp.conversion({ email, conversion_id })
         ↓
GLP Winner SDK
    - Sends data to GLP Winner servers
         ↓
GLP Winner Dashboard
    - Shows conversion with attribution
```

---

## Important Notes

### Variable Name Matching

⚠️ **CRITICAL:** The data layer variable names in your code MUST match what GTM is looking for.

| Code (composables/useGlpTracking.ts) | GTM (Data Layer Variable Name) |
|--------------------------------------|--------------------------------|
| `userEmail`                          | `userEmail`                    |
| `conversionId`                       | `conversionId`                 |

If you change one, you must change the other!

---

### When to Track Conversions

Track conversions when:
- ✅ User completes a purchase
- ✅ User submits a form successfully
- ✅ User completes a signup
- ✅ Payment is confirmed

Do NOT track on:
- ❌ Page views
- ❌ Failed payments
- ❌ Abandoned carts
- ❌ Incomplete forms

---

## Getting Help

### GLP Winner Support
- 📧 Email: support@glpwinner.com
- 📖 Documentation: https://www.glpwinner.com/tech-docs/affiliate-tracking-with-google-tag-manager

### Google Tag Manager Resources
- 📖 GTM Help Center: https://support.google.com/tagmanager
- 🎓 GTM Fundamentals: https://analytics.google.com/analytics/academy/

### Developer Resources
- 🔧 Browser Console: Press F12 to open developer tools
- 🔍 Network Tab: See requests being sent
- 📊 GTM Preview Mode: Debug your GTM setup in real-time

---

## Checklist

Use this checklist to ensure everything is set up correctly:

### Code Implementation
- [ ] GTM plugin created (`plugins/gtm.client.ts`)
- [ ] Tracking composable created (`composables/useGlpTracking.ts`)
- [ ] Tracking implemented on success page
- [ ] GTM ID added to environment variables
- [ ] Code tested locally

### GTM Setup
- [ ] Data Layer Variable created for User Email
- [ ] Data Layer Variable created for Conversion ID
- [ ] Custom Event Trigger created (`glp_conversion`)
- [ ] GLP Winner SDK tag created and fires on All Pages
- [ ] GLP Winner Conversion tag created
- [ ] Conversion tag uses correct variables
- [ ] Conversion tag has correct trigger
- [ ] Container published

### Testing
- [ ] GTM Preview mode tested
- [ ] Console logs show correct data
- [ ] Variables show in GTM Preview
- [ ] Conversion tag fires in GTM Preview
- [ ] GLP SDK logs show conversion sent
- [ ] Conversion appears in GLP Winner dashboard

---

## Summary

This setup creates a seamless flow:

1. **Your code** captures user information (email, conversion ID)
2. **GTM** receives this information through the data layer
3. **GLP Winner SDK** sends the conversion data to GLP Winner
4. **GLP Winner dashboard** shows conversions with proper attribution

By following this guide, even non-technical users can set up and verify GLP Winner affiliate tracking with Google Tag Manager.

---

**Last Updated:** December 2025
**Version:** 1.0
**Compatibility:** Nuxt 3.x, GTM Container v2
