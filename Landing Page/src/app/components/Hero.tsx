import { motion } from 'motion/react';
import { ArrowRight, ArrowDown, Sparkles } from 'lucide-react';
import { handleAnchorClick } from '@/app/components/ui/utils';
import { useIsMobile } from '@/app/components/ui/use-mobile';

export function Hero() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  return (
    <section className="relative min-h-screen min-h-[100dvh] flex items-center justify-center overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-24 px-4">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-muted/50 rounded-full mb-1 sm:mb-2 border border-border"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground">Your Creative Partner in Digital Excellence</span>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight px-4"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
          >
            We Craft Digital
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Experiences
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.4 }}
          >
            A modern design & development agency delivering exceptional websites, apps, and brand experiences that drive results.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.6 }}
          >
            <motion.a
              href="#contact"
              onClick={(e) => handleAnchorClick(e, '#contact')}
              className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-full inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-300 text-sm sm:text-base"
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            >
              Start Your Project
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>
            <motion.a
              href="#work"
              onClick={(e) => handleAnchorClick(e, '#work')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-border rounded-full hover:bg-muted/50 transition-all duration-300 text-center text-sm sm:text-base"
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            >
              View Our Work
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12 md:mt-16 max-w-2xl mx-auto px-4"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.8 }}
          >
            {[
              { number: '150+', label: 'Projects Delivered' },
              { number: '50+', label: 'Happy Clients' },
              { number: '5+', label: 'Years Experience' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{stat.number}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll arrow */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:block z-10">
        <ArrowDown className="w-6 h-6 text-muted-foreground/50" />
      </div>
    </section>
  );
}