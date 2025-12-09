"use client"

import { ArrowUpRight } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

const projects = [
  {
    title: "AI Agent (Internal HR Bot)",
    description: "Handles employee queries, forms, leaves, HR policies, onboarding. Reduced HR response time by 80%.",
    tags: ["OpenAI", "N8N", "APIs"],
  },
  {
    title: "Automated Meeting Follow-up & CRM Sync",
    description: "Auto-summaries, action items, CRM updates, next-steps emails. Fully automated meeting workflows.",
    tags: ["N8N", "GPT-4", "Workflows", "APIs"],
  },
  {
    title: "AI Image Generator",
    description: "Custom prompts, brand styles, dynamic templates. Generate on-brand visuals at scale.",
    tags: ["Stable Diffusion", "Python", "FastAPI", "React"],
  },
  {
    title: "AI Marketing Automation CRM",
    description: "Posts, captions, scheduling, call flows, and analytics. Complete marketing automation suite.",
    tags: ["Laravel", "OpenAI", "Gemini", "MySQL", "Social Media Apps"],
  },
  {
    title: "RAG Legal Assistant",
    description: "Upload documents → AI reviews → Extracts, summarizes, compares. Enterprise legal intelligence.",
    tags: ["LangChain", "Pinecone", "Claude", "Python", "FastAPI", "AWS"],
  },
  {
    title: "AI Sales Outreach System",
    description: "Generates context-aware outreach based on lead behavior. Personalization at scale.",
    tags: ["GPT-4", "N8N", "Workflow", "Python"],
  },
  {
    title: "ERP",
    description: "Finance, HR, supply chain automation. Integrated with existing enterprise systems.",
    tags: ["PHP", "Linux", "MYSQL", "Apache"],
  },
  {
    title: "OCM Test Ordering System",
    description: "Automated lab order communication with hospitals. Fast and secure healthcare data flow.",
    tags: ["HL7", "Laravel", "PostgreSQL", "Docker"],
  },
]

export function ProjectsSection() {
  return (
    <section id="projects" className="py-28 sm:py-36 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <p className="text-primary font-semibold text-lg mb-4">Projects</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
            Real AI Solutions in Production
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A selection of AI automation projects I&apos;ve built and deployed for businesses across various industries.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <AnimatedSection
              key={project.title}
              animation={index % 2 === 0 ? "fade-left" : "fade-right"}
              delay={index * 75}
            >
              <div className="group relative h-full p-8 rounded-2xl bg-background border border-border hover:border-primary transition-all duration-500 card-lift overflow-hidden">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Shine sweep effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <h3 className="font-bold text-foreground text-xl pr-4 group-hover:text-primary transition-colors duration-300">
                      {project.title}
                    </h3>
                    <div className="relative">
                      <ArrowUpRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:rotate-45 group-hover:scale-110 transition-all duration-300 flex-shrink-0" />
                      {/* Pulse ring on hover */}
                      <div className="absolute inset-0 rounded-full border border-primary/50 scale-0 group-hover:scale-150 group-hover:opacity-0 transition-all duration-500" />
                    </div>
                  </div>
                  <p className="text-base text-muted-foreground mb-6 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, i) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground font-medium group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
