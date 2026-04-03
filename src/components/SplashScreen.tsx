"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  const finish = useCallback(() => {
    setShow(false);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("julius_splash_shown")) {
      finish();
      return;
    }
    sessionStorage.setItem("julius_splash_shown", "1");
    const timer = setTimeout(finish, 3500);
    return () => clearTimeout(timer);
  }, [finish]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: "easeIn" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#0D1117" }}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 splash-gradient" />

          {/* Subtle particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: [0, 0.3, 0], y: -200 }}
                transition={{ duration: 3, delay: i * 0.4, repeat: Infinity, ease: "easeOut" }}
                className="absolute rounded-full"
                style={{
                  width: 4 + i * 2,
                  height: 4 + i * 2,
                  background: "#7EE2B8",
                  left: `${15 + i * 14}%`,
                  bottom: 0,
                }}
              />
            ))}
          </div>

          {/* Pulsing ring */}
          <motion.div
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{ width: 80, height: 80, border: "2px solid #7EE2B8", zIndex: 1 }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 rounded-full flex items-center justify-center"
            style={{
              width: 80, height: 80,
              background: "linear-gradient(135deg, #2EA67A, #7EE2B8)",
              boxShadow: "0 0 40px rgba(126,226,184,0.3)",
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 700, color: "#0D1117" }}>J</span>
          </motion.div>

          {/* Title */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative z-10"
            style={{ color: "#E6EDF3", fontSize: 28, fontWeight: 600, marginTop: 20, letterSpacing: 2 }}
          >
            Julius
          </motion.p>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="relative z-10"
            style={{ color: "#7EE2B8", fontSize: 14, marginTop: 8, letterSpacing: 3, textTransform: "uppercase" }}
          >
            Your Longevity Coach
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
