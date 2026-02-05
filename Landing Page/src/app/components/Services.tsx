import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { 
  Megaphone, 
  Monitor, 
  Package, 
  Video, 
  FileText, 
  Code,
  Zap,
  ArrowRight,
  Check
} from 'lucide-react';
import { handleAnchorClick } from '@/app/components/ui/utils';

const serviceCategories = [
  {
    id: 'marketing',
    icon: Megaphone,
    title: 'Marketing & Advertising',
    subtitle: 'Strategic campaigns that convert',
    services: [
      'Digital advertising design',
      'Social media graphics and templates',
      'Email marketing design',
      'Campaign creative development',
      'Display ads and banners',
      'Print advertising'
    ],
    gradient: 'from-blue-500 via-purple-500 to-pink-500'
  },
  {
    id: 'web',
    icon: Monitor,
    title: 'Digital & Web Design',
    subtitle: 'Beautiful, functional experiences',
    services: [
      'Website design and development',
      'Landing page design',
      'R&D',
      'User Interface (UI) design',
      'User Experience (UX) design',
      'Mobile app design',
      'Responsive design',
      'Interactive web experiences'
    ],
    gradient: 'from-purple-500 via-pink-500 to-red-500'
  },
  {
    id: 'print',
    icon: Package,
    title: 'Print & Packaging',
    subtitle: 'Tangible brand experiences',
    services: [
      'Packaging design',
      'Product labels',
      'Brochures and catalogs',
      'Posters and flyers',
      'Magazine and book layout',
      'Promotional materials',
      'Merchandise design'
    ],
    gradient: 'from-pink-500 via-red-500 to-orange-500'
  },
  {
    id: 'motion',
    icon: Video,
    title: 'Motion & Interactive',
    subtitle: 'Engaging visual storytelling',
    services: [
      'Animation (2D/3D)',
      'AR/VR experiences',
      'Social media video content',
      'Motion graphics',
      'Interactive experiences'
    ],
    gradient: 'from-red-500 via-orange-500 to-yellow-500'
  },
  {
    id: 'content',
    icon: FileText,
    title: 'Content & Documentation',
    subtitle: 'Clear, compelling communication',
    services: [
      'Presentation decks',
      'White papers and case studies',
      'Data visualisation',
      'Infographics',
      'Technical documentation'
    ],
    gradient: 'from-orange-500 via-yellow-500 to-green-500'
  },
  {
    id: 'development',
    icon: Code,
    title: 'Development Services',
    subtitle: 'Powerful digital solutions',
    services: [
      'Web development',
      'Mobile app development',
      'Website optimization',
      'Automations',
      'Custom integrations',
      'API development'
    ],
    gradient: 'from-green-500 via-teal-500 to-blue-500'
  }
];

export function Services() {
  const [activeTab, setActiveTab] = useState(serviceCategories[0].id);
  
  const activeService = serviceCategories.find(s => s.id === activeTab) || serviceCategories[0];
  const ActiveIcon = activeService.icon;

  return (
    <section id="services" className="min-h-[100vh] min-h-[100dvh] py-16 sm:py-24 lg:py-32 relative overflow-hidden flex flex-col justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/5 to-background"></div>
      
      {/* Animated gradient orb */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full blur-3xl opacity-20"
        style={{
          background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)`
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-4 sm:mb-6"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0 }}
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Our Services</span>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Succeed Online
            </span>
          </motion.h2>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            From design to development, we offer comprehensive solutions
            to elevate your brand and engage your audience.
          </motion.p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Service Category Tabs */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {serviceCategories.map((category, index) => {
              const Icon = category.icon;
              const isActive = activeTab === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full border transition-all duration-300 ${
                    isActive 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Icon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${isActive ? 'rotate-0' : 'group-hover:rotate-12'}`} />
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">{category.title}</span>
                    <span className="text-xs font-medium sm:hidden">{category.title.split(' ')[0]}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      layoutId="activeTab"
                      style={{
                        background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Active Service Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Left side - Service details */}
              <div className="order-2 lg:order-1">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl mb-4 sm:mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  <ActiveIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </motion.div>

                <motion.h3
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {activeService.title}
                </motion.h3>

                <motion.p
                  className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {activeService.subtitle}
                </motion.p>

                <motion.div
                  className="space-y-2 sm:space-y-3 mb-6 sm:mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {activeService.services.map((service, index) => (
                    <motion.div
                      key={service}
                      className="flex items-start gap-2 sm:gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base lg:text-lg">{service}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.a
                  href="#contact"
                  onClick={(e) => handleAnchorClick(e, '#contact')}
                  className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-300 text-sm sm:text-base"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>
              </div>

              {/* Right side - Visual card */}
              <div className="order-1 lg:order-2">
                <motion.div
                  className="relative aspect-square rounded-3xl overflow-hidden bg-card border border-border max-w-md mx-auto lg:max-w-none"
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  {/* Gradient background */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${activeService.gradient} opacity-20`}
                  />
                  
                  {/* Animated pattern */}
                  <div className="absolute inset-0">
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '30px 30px'
                      }}
                      animate={{
                        backgroundPosition: ['0px 0px', '30px 30px']
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </div>

                  {/* Floating elements */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="relative w-32 h-32 sm:w-48 sm:h-48"
                      animate={{
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`absolute inset-0 border-2 border-primary/30 rounded-full`}
                          style={{
                            scale: 1 + i * 0.3
                          }}
                          animate={{
                            rotate: [0, -360],
                            scale: [1 + i * 0.3, 1.2 + i * 0.3, 1 + i * 0.3]
                          }}
                          transition={{
                            duration: 10 + i * 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      ))}
                      
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{
                          rotate: [0, -360]
                        }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                          <ActiveIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-primary/50 rounded-full"
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.5, 1]
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom CTA */}
          <motion.div
            className="text-center mt-12 sm:mt-16 lg:mt-20 px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Can't find what you're looking for? We offer custom solutions tailored to your needs.
            </p>
            <motion.a
              href="#contact"
              onClick={(e) => handleAnchorClick(e, '#contact')}
              className="inline-flex items-center gap-2 text-primary hover:gap-4 transition-all duration-300 text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
            >
              <span className="font-medium">Discuss Your Project</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}