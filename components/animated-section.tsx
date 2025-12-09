"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale" | "blur"
  delay?: number
}

export function AnimatedSection({ children, className, animation = "fade-up", delay = 0 }: AnimatedSectionProps) {
  const { ref, isInView } = useScrollAnimation<HTMLDivElement>()

  const animationClasses = {
    "fade-up": "scroll-animate",
    "fade-left": "scroll-animate-left",
    "fade-right": "scroll-animate-right",
    scale: "scroll-animate-scale",
    blur: "scroll-animate",
  }

  return (
    <div
      ref={ref}
      className={cn(animationClasses[animation], isInView && "in-view", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
