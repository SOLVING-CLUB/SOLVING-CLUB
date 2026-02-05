import { useEffect, lazy, Suspense, useState } from 'react';
import { motion } from 'motion/react';
import { Header } from '@/app/components/Header';
import { Hero } from '@/app/components/Hero';
import { initPerformanceOptimizations } from '@/utils/performance';
import { useIsMobile } from '@/app/components/ui/use-mobile';

// Lazy load components for better performance
const Services = lazy(() => import('@/app/components/Services').then(module => ({ default: module.Services })));
const Work = lazy(() => import('@/app/components/Work').then(module => ({ default: module.Work })));
const About = lazy(() => import('@/app/components/About').then(module => ({ default: module.About })));
const Team = lazy(() => import('@/app/components/Team').then(module => ({ default: module.Team })));
const Contact = lazy(() => import('@/app/components/Contact').then(module => ({ default: module.Contact })));
const Footer = lazy(() => import('@/app/components/Footer').then(module => ({ default: module.Footer })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export default function App() {
  const isMobile = useIsMobile();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Add dark class to html element for dark theme
    document.documentElement.classList.add('dark');
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    // Initialize performance optimizations
    initPerformanceOptimizations();
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Reduce animations on mobile or if user prefers reduced motion
  const shouldReduceMotion = isMobile || prefersReducedMotion;
  const particleCount = shouldReduceMotion ? 5 : 20;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground relative overflow-x-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient background with depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-[#1a1a1f]"></div>
        
        {/* Animated mesh gradient orbs - Reduced on mobile */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="hidden md:block absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
                opacity: 0.3,
                willChange: 'transform'
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, 150, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div
              className="hidden md:block absolute bottom-0 right-1/4 w-[800px] h-[800px] rounded-full blur-[140px]"
              style={{
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, transparent 70%)',
                opacity: 0.25,
                willChange: 'transform'
              }}
              animate={{
                x: [0, -80, 0],
                y: [0, -120, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div
              className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]"
              style={{
                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                opacity: 0.2,
                willChange: 'transform'
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <motion.div
              className="hidden md:block absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full blur-[90px]"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
                opacity: 0.15,
                willChange: 'transform'
              }}
              animate={{
                x: [0, 60, 0],
                y: [0, -80, 0],
                scale: [1, 1.25, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        )}
        
        {/* Simplified static background for mobile */}
        {shouldReduceMotion && (
          <div className="md:hidden absolute inset-0">
            <div 
              className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full blur-[80px]"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
                opacity: 0.2
              }}
            />
            <div 
              className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
              style={{
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
                opacity: 0.15
              }}
            />
          </div>
        )}
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            opacity: 0.4
          }}
        />
        
        {/* Animated dot pattern - Disabled on mobile */}
        {!shouldReduceMotion && (
          <motion.div
            className="hidden md:block absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              opacity: 0.3
            }}
            animate={{
              backgroundPosition: ['0px 0px', '40px 40px']
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
        
        {/* Floating particles - Reduced on mobile */}
        {[...Array(particleCount)].map((_, i) => {
          const randomX = Math.random() * 100;
          const randomY = Math.random() * 100;
          const randomDelay = Math.random() * 2;
          const randomDuration = 4 + Math.random() * 4;
          const randomOffset = Math.random() * 20 - 10;
          
          return (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 bg-primary/30 rounded-full ${shouldReduceMotion ? 'hidden md:block' : ''}`}
              style={{
                left: `${randomX}%`,
                top: `${randomY}%`,
                willChange: shouldReduceMotion ? 'auto' : 'transform, opacity'
              }}
              animate={shouldReduceMotion ? {} : {
                y: [0, -30, 0],
                x: [0, randomOffset, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.8, 1],
              }}
              transition={shouldReduceMotion ? {} : {
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* Radial gradient vignette for depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-0">
        <Header />
        <main>
          <Hero />
          <Suspense fallback={<LoadingFallback />}>
            <Services />
            <Work />
            <About />
            <Team />
            <Contact />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </div>
  );
}
