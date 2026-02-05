import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Services: ['Web Design', 'Development', 'Branding', 'Marketing'],
    Company: ['About', 'Work', 'Careers', 'Blog'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy']
  };

  return (
    <footer className="relative bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <motion.h3
              className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
              whileHover={{ scale: 1.05 }}
            >
              SolvingClub
            </motion.h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 max-w-sm text-sm sm:text-base">
              A creative agency crafting exceptional digital experiences
              that drive results and inspire action.
            </p>
            <div className="flex gap-3 sm:gap-4">
              {['T', 'L', 'I', 'D'].map((letter, index) => (
                <motion.a
                  key={letter}
                  href="#"
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  whileHover={{ y: -4, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <span className="text-xs sm:text-sm font-medium">{letter}</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors inline-block text-sm"
                      whileHover={{ x: 4 }}
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 sm:pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-muted-foreground text-xs sm:text-sm">
            © {currentYear} SolvingClub. All rights reserved.
          </p>
          <motion.p
            className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Made with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500" /> by SolvingClub
          </motion.p>
        </div>
      </div>
    </footer>
  );
}