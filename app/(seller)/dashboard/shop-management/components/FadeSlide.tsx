// components/FadeSlide.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface FadeSlideProps {
  children: React.ReactNode;
  keyId: string | number;
}
export default function FadeSlide({ children, keyId }: FadeSlideProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyId}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
