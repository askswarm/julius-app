"use client";

import { motion } from "framer-motion";

interface Props {
  sport: string;
  image: string;
  onComplete: () => void;
}

export default function SessionStartAnimation({ sport, image, onComplete }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "#000" }}
    >
      <motion.img
        src={image}
        initial={{ scale: 1 }}
        animate={{ scale: 1.3 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.6 }}
        onAnimationComplete={onComplete}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative text-center z-10"
      >
        <p className="text-3xl font-bold text-white" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>{sport}</p>
        <p className="text-base text-white/70 mt-2">Session gestartet</p>
      </motion.div>
    </motion.div>
  );
}
