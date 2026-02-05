import { motion } from 'motion/react';
import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission (in a real app, this would send to a backend)
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'hello@solvingclub.com',
      href: 'mailto:hello@solvingclub.com'
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+1 (555) 123-4567',
      href: 'tel:+15551234567'
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'San Francisco, CA',
      href: '#'
    }
  ];

  return (
    <section id="contact" className="min-h-[100vh] min-h-[100dvh] py-16 sm:py-24 lg:py-32 relative overflow-hidden flex flex-col justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20">
          <motion.div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-4 sm:mb-6"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Get In Touch</span>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Let's Create Something
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Amazing Together
            </span>
          </motion.h2>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Have a project in mind? We'd love to hear from you.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            className="bg-card border border-border rounded-2xl p-6 sm:p-8"
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none text-sm sm:text-base"
                  placeholder="Tell us about your project..."
                  required
                />
              </div>

              <motion.button
                type="submit"
                className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send Message
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            className="space-y-6 sm:space-y-8"
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Contact Information</h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                We're here to help and answer any question you might have. 
                We look forward to hearing from you!
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <motion.a
                    key={info.label}
                    href={info.href}
                    className="flex items-center gap-3 sm:gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all duration-300 group"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    whileHover={{ x: 8 }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all flex-shrink-0">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{info.label}</div>
                      <div className="font-medium text-sm sm:text-base">{info.value}</div>
                    </div>
                  </motion.a>
                );
              })}
            </div>

            {/* Social links placeholder */}
            <div className="pt-6 sm:pt-8 border-t border-border">
              <h4 className="font-medium mb-4 text-sm sm:text-base">Follow Us</h4>
              <div className="flex gap-3 sm:gap-4">
                {['Twitter', 'LinkedIn', 'Instagram', 'Dribbble'].map((social) => (
                  <motion.a
                    key={social}
                    href="#"
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    whileHover={{ y: -4, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xs font-medium">{social[0]}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}