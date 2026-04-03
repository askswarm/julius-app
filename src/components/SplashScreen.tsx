"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem("julius_splash_shown")) {
      setShow(true);
      sessionStorage.setItem("julius_splash_shown", "1");
      setTimeout(() => setShow(false), 1800);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.4, ease: "easeIn" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: "var(--bg)" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.1, 1.0], opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold"
            style={{ background: "var(--grad-teal)", color: "#0D1117" }}
          >
            J
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-xl font-bold mt-4"
            style={{ color: "var(--text)" }}
          >
            Julius
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-sm mt-1"
            style={{ color: "var(--text3)" }}
          >
            Your Longevity Coach
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
