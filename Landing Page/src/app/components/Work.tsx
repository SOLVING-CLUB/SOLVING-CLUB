import { motion } from 'motion/react';
import { useState } from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { handleAnchorClick } from '@/app/components/ui/utils';

const projects = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    category: 'Web Development',
    description: 'A modern e-commerce platform with seamless user experience',
    tags: ['React', 'Node.js', 'Stripe'],
    imageQuery: 'ecommerce website'
  },
  {
    id: 2,
    title: 'Brand Identity System',
    category: 'Branding & Design',
    description: 'Complete brand redesign for a sustainable fashion startup',
    tags: ['Branding', 'UI/UX', 'Print'],
    imageQuery: 'brand identity design'
  },
  {
    id: 3,
    title: 'Mobile Fitness App',
    category: 'Mobile Development',
    description: 'AI-powered fitness tracking and workout planning app',
    tags: ['React Native', 'AI', 'Health'],
    imageQuery: 'fitness mobile app'
  },
  {
    id: 4,
    title: 'SaaS Dashboard',
    category: 'Web Design',
    description: 'Intuitive analytics dashboard for SaaS businesses',
    tags: ['UI/UX', 'Data Viz', 'SaaS'],
    imageQuery: 'saas dashboard interface'
  },
  {
    id: 5,
    title: 'Marketing Campaign',
    category: 'Digital Marketing',
    description: 'Multi-channel campaign that increased engagement by 300%',
    tags: ['Social Media', 'Content', 'Ads'],
    imageQuery: 'digital marketing campaign'
  },
  {
    id: 6,
    title: 'AR Experience',
    category: 'Interactive',
    description: 'Immersive augmented reality product showcase',
    tags: ['AR', '3D', 'WebGL'],
    imageQuery: 'augmented reality experience'
  }
];

function ProjectCard({ project, index }: { project: typeof projects[0], index: number }) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isHovered, setIsHovered] = useState(false);

  // In a real application, you would fetch the image using unsplash_tool
  // For now, we'll use a placeholder

  return (
    <motion.div
      className="group relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer"
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <ImageWithFallback
          src={`https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80`}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-60"></div>
        
        {/* Hover overlay */}
        <motion.div
          className="absolute inset-0 bg-primary/90 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.3 }}
            className="text-primary-foreground text-center"
          >
            <ExternalLink className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">View Project</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-sm text-primary mb-2">{project.category}</div>
        <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <p className="text-muted-foreground mb-4">{project.description}</p>
        
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-muted text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function Work() {
  return (
    <section id="work" className="min-h-[100vh] min-h-[100dvh] py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-muted/30 flex flex-col justify-center">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20">
          <motion.div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-4 sm:mb-6"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs sm:text-sm font-medium text-primary">Our Portfolio</span>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Featured
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Projects
            </span>
          </motion.h2>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Take a look at some of our recent work and success stories.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.a
            href="#contact"
            onClick={(e) => handleAnchorClick(e, '#contact')}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-300 text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All Projects
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}