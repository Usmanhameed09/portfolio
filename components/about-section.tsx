"use client"

import { Bot, Workflow, Database, Zap } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

const highlights = [
  {
    icon: Bot,
    title: "AI Agents",
    description: "Building intelligent agents that handle complex tasks autonomously",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description: "Streamlining business processes with N8N and custom solutions",
  },
  {
    icon: Database,
    title: "RAG Systems",
    description: "Creating knowledge-powered AI with retrieval augmented generation",
  },
  {
    icon: Zap,
    title: "Enterprise Healthcare",
    description: "Deploying production-grade Healthcare systems for large organizations",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-28 sm:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <AnimatedSection animation="fade-left">
            <p className="text-primary font-semibold text-lg mb-4">About Me</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-8 text-balance leading-tight">
              AI Automation Engineer & Full-Stack Problem Solver
            </h2>
            <div className="space-y-5 text-lg text-muted-foreground leading-relaxed">
              <p>
                I&apos;m <strong className="text-foreground font-semibold">Usman Hameed</strong>, a specialist in AI
                Agents, Workflow Automation, and Enterprise Healthcare systems. I build practical AI tools that are used in real
                companies to solve real business problems.
              </p>
              <p>
                With deep experience in LLMs, RAG systems, N8N, API integrations, and ERP-grade automation, I focus on
                creating solutions that deliver measurable impact and drive operational efficiency.
              </p>
              <p>
                My approach combines cutting-edge AI technology with practical business understanding to deliver
                automation solutions that actually work in production.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 gap-6">
            {highlights.map((item, index) => (
              <AnimatedSection key={item.title} animation="scale" delay={index * 100}>
                <div className="h-full p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-lift glow-on-hover group">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <item.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl mb-3">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
