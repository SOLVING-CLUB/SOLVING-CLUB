"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu as MenuIcon, X } from 'lucide-react';
import { HoveredLink, Menu, MenuItem } from '@/app/components/ui/navbar-menu';
import { handleAnchorClick } from '@/app/components/ui/utils';
import { cn } from '@/app/components/ui/utils';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background/80 border-b border-border"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Desktop Navigation - Aceternity Navbar */}
      <div className="hidden md:block">
        {/* Logo - Fixed Top Left */}
        <motion.a 
          href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
          className="fixed top-4 left-8 z-50 text-xl sm:text-2xl font-bold tracking-tight"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          SolvingClub
        </motion.a>
        
        {/* Let's Talk Button - Fixed Top Right */}
        <motion.a
          href="#contact"
          onClick={(e) => handleAnchorClick(e, '#contact')}
          className="fixed top-4 right-8 z-50 px-4 lg:px-6 py-2 sm:py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-300 text-sm lg:text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Let's Talk
        </motion.a>
        
        {/* Centered Navbar Menu */}
        <div className={cn("fixed top-4 left-1/2 -translate-x-1/2 z-50")}>
          <Menu setActive={setActive}>
            <MenuItem setActive={setActive} active={active} item="Services">
              <div className="flex flex-col space-y-2 text-sm">
                <HoveredLink 
                  href="#services"
                  onClick={(e) => {
                    handleAnchorClick(e, '#services');
                    setActive(null);
                  }}
                >
                  All Services
                </HoveredLink>
                <HoveredLink 
                  href="#services"
                  onClick={(e) => {
                    handleAnchorClick(e, '#services');
                    setActive(null);
                  }}
                >
                  Web Development
                </HoveredLink>
                <HoveredLink 
                  href="#services"
                  onClick={(e) => {
                    handleAnchorClick(e, '#services');
                    setActive(null);
                  }}
                >
                  Design & Branding
                </HoveredLink>
                <HoveredLink 
                  href="#services"
                  onClick={(e) => {
                    handleAnchorClick(e, '#services');
                    setActive(null);
                  }}
                >
                  Marketing
                </HoveredLink>
              </div>
            </MenuItem>
            
            <MenuItem setActive={setActive} active={active} item="Work">
              <div className="flex flex-col space-y-2 text-sm">
                <HoveredLink 
                  href="#work"
                  onClick={(e) => {
                    handleAnchorClick(e, '#work');
                    setActive(null);
                  }}
                >
                  View Portfolio
                </HoveredLink>
                <HoveredLink 
                  href="#work"
                  onClick={(e) => {
                    handleAnchorClick(e, '#work');
                    setActive(null);
                  }}
                >
                  Featured Projects
                </HoveredLink>
              </div>
            </MenuItem>
            
            <MenuItem setActive={setActive} active={active} item="About">
              <div className="flex flex-col space-y-2 text-sm">
                <HoveredLink 
                  href="#about"
                  onClick={(e) => {
                    handleAnchorClick(e, '#about');
                    setActive(null);
                  }}
                >
                  Our Story
                </HoveredLink>
                <HoveredLink 
                  href="#team"
                  onClick={(e) => {
                    handleAnchorClick(e, '#team');
                    setActive(null);
                  }}
                >
                  Meet the Team
                </HoveredLink>
              </div>
            </MenuItem>
          </Menu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <motion.a 
              href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
              className="text-xl sm:text-2xl font-bold tracking-tight"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              SolvingClub
            </motion.a>

            <button
              className="text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.nav
                className="mt-4 pb-4 flex flex-col gap-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <a
                  href="#services"
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={(e) => {
                    handleAnchorClick(e, '#services');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Services
                </a>
                <a
                  href="#work"
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={(e) => {
                    handleAnchorClick(e, '#work');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Work
                </a>
                <a
                  href="#about"
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={(e) => {
                    handleAnchorClick(e, '#about');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  About
                </a>
                <a
                  href="#team"
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={(e) => {
                    handleAnchorClick(e, '#team');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Team
                </a>
                <a
                  href="#contact"
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-center hover:bg-primary/90 transition-all"
                  onClick={(e) => {
                    handleAnchorClick(e, '#contact');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Let's Talk
                </a>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}