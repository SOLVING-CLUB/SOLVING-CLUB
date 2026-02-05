import { motion } from 'motion/react';
import { Linkedin, Github, Mail } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';

const teamMembers = [
  {
    name: "Amélie Laurent",
    title: "Founder & CEO",
    summary: "Former co-founder of Opendoor. Early staff at Spotify and Clearbit.",
    avatarUrl: "https://www.untitledui.com/images/avatars/amelie-laurent?fm=webp&q=80",
    socials: [
      {
        icon: Linkedin,
        href: "https://www.linkedin.com/",
        label: "LinkedIn",
      },
      {
        icon: Github,
        href: "https://github.com/",
        label: "GitHub",
      },
    ],
  },
  {
    name: "Nikolas Gibbons",
    title: "Engineering Manager",
    summary: "Lead engineering teams at Figma, Pitch, and Protocol Labs.",
    avatarUrl: "https://www.untitledui.com/images/avatars/nikolas-gibbons?fm=webp&q=80",
    socials: [
      {
        icon: Linkedin,
        href: "https://www.linkedin.com/",
        label: "LinkedIn",
      },
      {
        icon: Github,
        href: "https://github.com/",
        label: "GitHub",
      },
    ],
  },
  {
    name: "Sienna Hewitt",
    title: "Product Manager",
    summary: "Former PM for Linear, Lambda School, and On Deck.",
    avatarUrl: "https://www.untitledui.com/images/avatars/sienna-hewitt?fm=webp&q=80",
    socials: [
      {
        icon: Linkedin,
        href: "https://www.linkedin.com/",
        label: "LinkedIn",
      },
      {
        icon: Github,
        href: "https://github.com/",
        label: "GitHub",
      },
    ],
  },
  {
    name: "Lily-Rose Chedjou",
    title: "Frontend Developer",
    summary: "Former frontend dev for Linear, Coinbase, and Postscript.",
    avatarUrl: "https://www.untitledui.com/images/avatars/lily-rose-chedjou?fm=webp&q=80",
    socials: [
      {
        icon: Linkedin,
        href: "https://www.linkedin.com/",
        label: "LinkedIn",
      },
      {
        icon: Github,
        href: "https://github.com/",
        label: "GitHub",
      },
    ],
  },
  {
    name: "Zahra Christensen",
    title: "Backend Developer",
    summary: "Lead backend dev at Clearbit. Former Clearbit and Loom.",
    avatarUrl: "https://www.untitledui.com/images/avatars/zahra-christensen?fm=webp&q=80",
    socials: [
      {
        icon: Linkedin,
        href: "https://www.linkedin.com/",
        label: "LinkedIn",
      },
      {
        icon: Github,
        href: "https://github.com/",
        label: "GitHub",
      },
    ],
  },
  {
    name: "Caitlyn King",
    title: "Product Designer",
    summary: "Founding design team at Figma. Former Pleo, Stripe, and Tile.",
    avatarUrl: "https://www.untitledui.com/images/avatars/caitlyn-king?fm=webp&q=80",
    socials: [
      {
        icon: Linkedin,
        href: "https://www.linkedin.com/",
        label: "LinkedIn",
      },
      {
        icon: Github,
        href: "https://github.com/",
        label: "GitHub",
      },
    ],
  },
  {
    name: "Zaid Schwartz",
    title: "UX Researcher",
    summary: "Lead user research for Slack. Contractor for Netflix and Udacity.",
    avatarUrl: "https://www.untitledui.com/images/avatars/zaid-schwartz?fm=webp&q=80",
    socials: [
      {
        icon: Linkedin,
        href: "https://www.linkedin.com/",
        label: "LinkedIn",
      },
      {
        icon: Github,
        href: "https://github.com/",
        label: "GitHub",
      },
    ],
  },
  {
    name: "Marco Kelly",
    title: "Customer Success",
    summary: "Lead CX at Wealthsimple. Former PagerDuty and Sqreen.",
    avatarUrl: "https://www.untitledui.com/images/avatars/marco-kelly?fm=webp&q=80",
    socials: [
      {
        icon: Linkedin,
        href: "https://www.linkedin.com/",
        label: "LinkedIn",
      },
      {
        icon: Github,
        href: "https://github.com/",
        label: "GitHub",
      },
    ],
  },
];

export function Team() {
  return (
    <section id="team" className="min-h-[100vh] min-h-[100dvh] py-16 sm:py-24 lg:py-32 relative overflow-hidden flex flex-col justify-center bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          {/* <motion.div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-4 sm:mb-6"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs sm:text-sm font-medium text-primary">We're hiring!</span>
          </motion.div> */}

          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Meet our
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Team
            </span>
          </motion.h2>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground px-4"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Our philosophy is simple—hire a team of diverse, passionate people and foster a culture that empowers you to do your best work.
          </motion.p>
        </div>

        <div className="mt-12 sm:mt-16">
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            {teamMembers.map((member, index) => {
              const initials = member.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();

              return (
                <motion.li
                  key={member.name}
                  className="flex flex-col items-center gap-4 sm:gap-5"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback className="text-lg sm:text-xl font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{member.name}</h3>
                    <p className="text-sm sm:text-base text-primary mb-2">{member.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xs">
                      {member.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    {member.socials.map((social, socialIndex) => {
                      const Icon = social.icon;
                      return (
                        <motion.a
                          key={socialIndex}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                          whileHover={{ y: -4, scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.a>
                      );
                    })}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
