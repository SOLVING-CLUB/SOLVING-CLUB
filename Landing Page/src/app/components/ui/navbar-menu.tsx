"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "./utils";

const Transition = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
}) => {
  return (
    <div onMouseEnter={() => setActive(item)} className="relative">
      <motion.p
        transition={{ duration: 0.3 }}
        className="cursor-pointer text-foreground hover:opacity-[0.9] text-sm lg:text-base font-medium"
      >
        {item}
      </motion.p>
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {active === item && (
            <div className="absolute top-[calc(100%_+_1.2rem)] left-1/2 transform -translate-x-1/2 pt-4">
              <Transition
                className="bg-card rounded-2xl overflow-hidden border border-border shadow-xl p-4 min-w-[200px]"
              >
                <div className="w-max h-full">{children}</div>
              </Transition>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)}
      className="relative rounded-full border border-border bg-background/80 backdrop-blur-lg shadow-lg flex justify-center items-center space-x-4 px-6 py-4 w-fit"
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <a href={href} className="flex space-x-2" target="_blank" rel="noopener noreferrer">
      <img
        src={src}
        width={140}
        height={70}
        alt={title}
        className="flex-shrink-0 rounded-md shadow-2xl object-cover"
      />
      <div>
        <h4 className="text-xl font-bold mb-1 text-foreground dark:text-foreground">
          {title}
        </h4>
        <p className="text-muted-foreground text-sm max-w-[200px] dark:text-muted-foreground">
          {description}
        </p>
      </div>
    </a>
  );
};

export const HoveredLink = ({
  children,
  href,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) => {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground block py-2 px-4 rounded-lg hover:bg-muted/50 transition-colors"
      {...rest}
    >
      {children}
    </a>
  );
};
