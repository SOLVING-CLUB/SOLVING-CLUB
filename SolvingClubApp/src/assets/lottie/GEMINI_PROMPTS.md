# Gemini Pro Prompts for Lottie Animation Generation

Use these prompts with Gemini Pro to generate custom Lottie animations for the Solving Club app.

---

## 🎨 General Design Guidelines

Before generating, specify:
- **Style**: Modern, minimalist, professional
- **Color Scheme**: Primary color #6366F1 (indigo), Secondary #EC4899 (pink)
- **Theme**: Software development, coding, teamwork, technology
- **Format**: Lottie JSON format
- **Size**: 200x200px viewport
- **Duration**: 2-3 seconds, looping
- **Complexity**: Medium (not too simple, not too complex)

---

## 📱 Login Screen Animation

**Prompt:**

```
Create a custom Lottie animation in JSON format for a software agency mobile app login screen. 

Context: "Solving Club" is a software development agency organization. The login screen welcomes back developers and team members.

Requirements:
- Animation should represent: Developer working on code, welcome back gesture, or friendly tech greeting
- Style: Modern, professional, minimalist
- Colors: Primary #6366F1 (indigo), white, subtle gradients
- Viewport: 200x200px
- Duration: 2-3 seconds, seamless loop
- Elements: Could include a developer at computer, code lines, welcome wave, or tech icon with friendly animation
- Mood: Welcoming, professional, tech-forward
- Animation should be smooth, not too fast, professional yet friendly
- No text in the animation
- Export as Lottie JSON format

The animation should convey: "Welcome back to Solving Club - your software development workspace"
```

---

## ✨ Signup Screen Animation

**Prompt:**

```
Create a custom Lottie animation in JSON format for a software agency mobile app signup screen.

Context: "Solving Club" is a software development agency. The signup screen is for new team members joining the organization.

Requirements:
- Animation should represent: Team collaboration, joining a group, building together, or growth/progress
- Style: Modern, professional, energetic but not overwhelming
- Colors: Primary #6366F1 (indigo), Secondary #EC4899 (pink), white
- Viewport: 200x200px
- Duration: 2-3 seconds, seamless loop
- Elements: Could include people joining together, building blocks stacking, team handshake, or collaborative coding
- Mood: Inviting, collaborative, growth-oriented, professional
- Animation should feel like "joining something great" or "building together"
- No text in the animation
- Export as Lottie JSON format

The animation should convey: "Join Solving Club - Build amazing software with our team"
```

---

## 🔐 Forgot Password Screen Animation

**Prompt:**

```
Create a custom Lottie animation in JSON format for a software agency mobile app password reset screen.

Context: "Solving Club" is a software development agency. Users need to reset their password securely.

Requirements:
- Animation should represent: Security, key/lock, password protection, or secure access
- Style: Modern, professional, trustworthy
- Colors: Primary #6366F1 (indigo), warning #F59E0B (amber), white
- Viewport: 200x200px
- Duration: 2-3 seconds, seamless loop
- Elements: Could include a lock opening, key turning, shield with checkmark, or secure padlock animation
- Mood: Secure, trustworthy, helpful, professional
- Animation should feel safe and reassuring
- No text in the animation
- Export as Lottie JSON format

The animation should convey: "Secure password reset - We'll help you regain access safely"
```

---

## 🎯 Alternative: Single Comprehensive Prompt

**Prompt for all three animations:**

```
Create three custom Lottie animations in JSON format for a software development agency mobile app called "Solving Club". 

App Context:
- Software development agency/organization
- Team collaboration platform
- Professional, modern, tech-forward brand
- Primary color: #6366F1 (indigo), Secondary: #EC4899 (pink)

Animation 1 - Login Screen:
- Theme: Welcome back, developer at work, friendly tech greeting
- Mood: Welcoming, professional
- Represents: Returning to work, developer workspace

Animation 2 - Signup Screen:
- Theme: Team collaboration, joining together, building/construction
- Mood: Inviting, collaborative, growth
- Represents: Becoming part of the team, building together

Animation 3 - Forgot Password Screen:
- Theme: Security, lock/key, password protection
- Mood: Secure, trustworthy, helpful
- Represents: Safe password recovery

Technical Requirements for all:
- Viewport: 200x200px
- Duration: 2-3 seconds, seamless loop
- Style: Modern, minimalist, professional
- Colors: Use brand colors (#6366F1, #EC4899) with white and subtle gradients
- Complexity: Medium (not too simple, not too detailed)
- Smooth animations, professional quality
- No text elements
- Export each as separate Lottie JSON files

Make each animation unique, relevant to software development/agency context, and visually cohesive as a set.
```

---

## 📝 Usage Instructions

1. **Copy the prompt** for the animation you need
2. **Paste into Gemini Pro** (Google AI Studio or API)
3. **Request JSON format** explicitly if needed
4. **Save the output** as:
   - `login.json` for Login screen
   - `signup.json` for Signup screen
   - `forgot-password.json` for Forgot Password screen
5. **Place files** in `src/assets/lottie/` directory
6. **Update** `src/assets/lottie/animations.ts` to use `require()` instead of inline JSON

---

## 🔄 After Generation

Update `src/assets/lottie/animations.ts`:

```typescript
// Replace inline animations with:
export const loginAnimation = require('./login.json');
export const signupAnimation = require('./signup.json');
export const forgotPasswordAnimation = require('./forgot-password.json');
```

---

## 💡 Tips for Better Results

- **Be specific**: Mention "software agency", "development team", "coding" in prompts
- **Iterate**: Generate multiple versions and choose the best
- **Refine**: Ask Gemini to adjust speed, colors, or complexity
- **Test**: Import into the app and adjust if needed
- **Consistency**: Use similar style across all three animations

---

## 🎨 Color Reference

- **Primary**: `#6366F1` (Indigo)
- **Primary Dark**: `#4F46E5`
- **Primary Light**: `#818CF8`
- **Secondary**: `#EC4899` (Pink)
- **Success**: `#22C55E` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)
- **Info**: `#3B82F6` (Blue)

Use these colors in your prompts for brand consistency.

