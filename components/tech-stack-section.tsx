"use client"

import { AnimatedSection } from "@/components/animated-section"
import { AnimatedCounter } from "@/components/animated-counter"

const techStack = [
  { name: "OpenAI", category: "LLM" },
  { name: "Claude", category: "LLM" },
  { name: "Gemini", category: "LLM" },
  { name: "Ollama", category: "LLM" },
  { name: "Python", category: "Language" },
  { name: "PHP", category: "Language" },
  { name: "N8N", category: "Automation" },
  { name: "Zapier", category: "Automation" },
  { name: "LangChain", category: "Framework" },
  { name: "FastAPI", category: "Framework" },
  { name: "PostgreSQL", category: "Database" },
  { name: "MongoDB", category: "Database" },
  { name: "Pinecone", category: "Vector DB" },
  { name: "Docker", category: "DevOps" },
  { name: "Linux", category: "DevOps" },
]

export function TechStackSection() {
  return (
    <section id="tech" className="py-28 sm:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <p className="text-primary font-semibold text-lg mb-4">Tech Stack</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
            Tools & Technologies I Work With
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A comprehensive toolkit for building production-grade AI systems and automation workflows.
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech, index) => (
              <div
                key={tech.name}
                className="group px-6 py-4 rounded-2xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 card-lift cursor-default animate-scale-in-bounce"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                    {tech.name}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {tech.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-20 pt-16 border-t border-border">
          {[
            { end: 4, label: "LLM Providers" },
            { end: 3, label: "Programming Languages" },
            { end: 5, label: "Automation Platforms" },
            { end: 10, label: "Database Systems" },
          ].map((stat, index) => (
            <AnimatedSection key={stat.label} animation="scale" delay={index * 100}>
              <div className="text-center group cursor-default">
                <AnimatedCounter
                  end={stat.end}
                  suffix="+"
                  className="text-4xl sm:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform"
                />
                <div className="text-base text-muted-foreground">{stat.label}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
