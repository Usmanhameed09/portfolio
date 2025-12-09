"use client"

import { useCountUp } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

export function AnimatedCounter({ end, suffix = "", prefix = "", duration = 2000, className }: AnimatedCounterProps) {
  const { count, ref } = useCountUp(end, duration)

  return (
    <div ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {count}
      {suffix}
    </div>
  )
}
