# Lottie Animations

This directory contains Lottie animation JSON files for the app.

## Recommended Animations for Software Agency

### Login Screen
- **Developer/Coding animations** - Shows someone coding or working
- **Welcome animations** - Friendly greeting animations
- Suggested: Search "developer" or "coding" on LottieFiles.com

### Signup Screen  
- **Team/Collaboration animations** - Shows teamwork or joining
- **Growth animations** - Shows progress or building
- Suggested: Search "team" or "collaboration" on LottieFiles.com

### Forgot Password Screen
- **Security/Key animations** - Shows security or keys
- **Lock animations** - Shows lock/unlock concepts
- Suggested: Search "security" or "key" on LottieFiles.com

## How to Add Animations

1. Visit [LottieFiles.com](https://lottiefiles.com)
2. Search for free animations matching the themes above
3. Download the JSON file
4. Place it in this directory (e.g., `login.json`, `signup.json`, `forgot-password.json`)
5. Import in your component: `require('../../assets/lottie/login.json')`

## Example Usage

```typescript
import {LottieAnimation} from '../../shared/components/LottieAnimation';

<LottieAnimation
  source={require('../../assets/lottie/login.json')}
  width={250}
  height={250}
  autoPlay
  loop
/>
```

