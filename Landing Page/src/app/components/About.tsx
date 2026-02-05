import { motion } from 'motion/react';
import { Target, Users, Lightbulb, Award } from 'lucide-react';
import { handleAnchorClick } from '@/app/components/ui/utils';

const values = [
  {
    icon: Target,
    title: 'Mission Driven',
    description: 'We\'re committed to delivering exceptional results that exceed expectations and drive meaningful impact.'
  },
  {
    icon: Users,
    title: 'Client Focused',
    description: 'Your success is our success. We work collaboratively to understand your needs and goals.'
  },
  {
    icon: Lightbulb,
    title: 'Innovation First',
    description: 'We stay ahead of trends and technologies to provide cutting-edge solutions that future-proof your business.'
  },
  {
    icon: Award,
    title: 'Quality Assured',
    description: 'Every project undergoes rigorous testing and refinement to ensure the highest standards of excellence.'
  }
];

export function About() {
  return (
    <section id="about" className="min-h-[100vh] min-h-[100dvh] py-16 sm:py-24 lg:py-32 relative overflow-hidden flex flex-col justify-center">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <motion.div
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-4 sm:mb-6"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs sm:text-sm font-medium text-primary">About Us</span>
            </motion.div>

            <motion.h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              We're a team of
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                creative problem solvers
              </span>
            </motion.h2>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              At SolvingClub, we believe great design and development go hand in hand. 
              Our multidisciplinary team combines creativity, technical expertise, and 
              strategic thinking to deliver solutions that not only look amazing but 
              perform exceptionally.
            </motion.p>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Whether you need a stunning website, a powerful mobile app, or a 
              complete brand transformation, we have the skills and passion to 
              bring your vision to life.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.a
                href="#contact"
                onClick={(e) => handleAnchorClick(e, '#contact')}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-300 text-center text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Work With Us
              </motion.a>
              <motion.a
                href="#work"
                onClick={(e) => handleAnchorClick(e, '#work')}
                className="px-6 sm:px-8 py-3 sm:py-4 border border-border rounded-full hover:bg-muted/50 transition-all duration-300 text-center text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Our Process
              </motion.a>
            </motion.div>
          </div>

          {/* Right content - Values grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  className="bg-card border border-border rounded-2xl p-5 sm:p-6 hover:border-primary/50 transition-all duration-300"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <motion.div
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </motion.div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}