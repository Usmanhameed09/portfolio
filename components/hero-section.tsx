"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Play } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"
import { useMagneticHover, useParallax } from "@/hooks/use-scroll-animation"

const UPWORK_URL = "https://www.upwork.com/freelancers/~0139fe6cbd7c4b5ee0"

export function HeroSection() {
  const magneticRef = useMagneticHover()
  const scrollY = useParallax()

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/30" />

      {/* Animated gradient orbs with morph effect */}
      <div
        className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl animate-morph"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      />
      <div
        className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-accent/15 to-primary/10 rounded-full blur-3xl animate-morph animation-delay-500"
        style={{ transform: `translateY(${scrollY * -0.15}px)` }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />

      {/* Floating particles */}
      <div className="absolute top-40 right-1/4 w-3 h-3 bg-primary/40 rounded-full animate-float animation-delay-200" />
      <div className="absolute top-60 left-1/4 w-2 h-2 bg-accent/40 rounded-full animate-float animation-delay-400" />
      <div className="absolute bottom-40 right-1/3 w-4 h-4 bg-primary/30 rounded-full animate-float animation-delay-600" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 mb-10 animate-fade-in-up shine-effect overflow-hidden">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-base font-medium text-primary">AI Automation Engineer</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-foreground mb-8 text-balance leading-[1.1]">
            <span className="inline-block animate-fade-in-up">I Build AI Systems That</span>{" "}
            <span className="text-primary relative inline-block animate-fade-in-up animation-delay-200">
              <span className="animate-text-shimmer">Automate Real Work</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path
                  d="M2 10C50 4 150 4 298 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-primary/40 animate-draw-line"
                />
              </svg>
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty leading-relaxed animate-blur-in animation-delay-300">
            Custom AI Agents, N8N Automation, RAG Legal AI, and Enterprise Workflows. Transforming businesses through
            intelligent automation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
            <div ref={magneticRef} className="magnetic-hover">
              <Button
                size="lg"
                asChild
                className="text-lg px-10 py-7 shadow-xl hover:shadow-2xl transition-all hover:scale-105 animate-pulse-glow relative overflow-hidden shine-effect"
              >
                <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer">
                  Hire Me
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </div>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-lg px-10 py-7 hover:bg-secondary transition-all hover:scale-105 bg-transparent group"
            >
              <a href="#projects">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                View Projects
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-24 pt-12 border-t border-border animate-fade-in-up animation-delay-600">
            <div className="group cursor-default">
              <AnimatedCounter
                end={10}
                suffix="+"
                className="text-4xl sm:text-6xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform"
              />
              <div className="text-base sm:text-lg text-muted-foreground">AI Projects</div>
            </div>
            <div className="group cursor-default">
              <AnimatedCounter
                end={8}
                suffix="+"
                className="text-4xl sm:text-6xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform"
              />
              <div className="text-base sm:text-lg text-muted-foreground">Happy Clients</div>
            </div>
            <div className="group cursor-default">
              <AnimatedCounter
                end={4}
                suffix="+"
                className="text-4xl sm:text-6xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform"
              />
              <div className="text-base sm:text-lg text-muted-foreground">Years Experience</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
