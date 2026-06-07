"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { SPRING_IOS_SNAPPY, pressHover, pressTap } from "@/components/motion/motionSystem";

type Props = HTMLMotionProps<"button"> & {
  children: React.ReactNode;
};

/** Apple tarzı dokunma geri bildirimi — hover + tap spring */
export function SpringPress({
  children,
  className = "",
  disabled,
  ...rest
}: Props) {
  return (
    <motion.button
      whileHover={disabled ? undefined : pressHover}
      whileTap={disabled ? undefined : pressTap}
      transition={SPRING_IOS_SNAPPY}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
