"use client"

import { Bot, Workflow, ImageIcon, Scale, Mail, Building2, Stethoscope, TrendingUp } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

const services = [
  {
    icon: Bot,
    title: "AI Agents & Internal Bots",
    description: "Custom HR Agent, Support bots, Department automation agents",
    features: ["Employee Query Handling", "Form Processing", "Onboarding Automation"],
  },
  {
    icon: Workflow,
    title: "AI Automation Workflows",
    description: "N8N / Zapier / Custom APIs for multi-step workflow automation",
    features: ["CRM Sync", "Automated Follow-ups", "Email/WhatsApp Pipelines"],
  },
  {
    icon: ImageIcon,
    title: "AI Image Generator",
    description: "Custom branded generator with fine-tuned models",
    features: ["Brand-Specific Styles", "Dynamic Templates", "Batch Generation"],
  },
  {
    icon: TrendingUp,
    title: "AI Marketing & Social CRM",
    description: "Auto content generation, scheduling, multi-platform posting",
    features: ["Content Generation", "Lead Automation", "Analytics Dashboard"],
  },
  {
    icon: Scale,
    title: "RAG Legal Assistant",
    description: "Document review, knowledge base search, contract intelligence",
    features: ["Document Analysis", "Contract Review", "Legal Research"],
  },
  {
    icon: Mail,
    title: "AI Sales Outreach",
    description: "Context-aware email sequences with lead scoring",
    features: ["Personalization at Scale", "Behavior Analysis", "Smart Sequencing"],
  },
  {
    icon: Building2,
    title: "ERP Automation",
    description: "AI-powered operational workflows & system integrations",
    features: ["Finance Automation", "Supply Chain", "HR Workflows"],
  },
  {
    icon: Stethoscope,
    title: "Healthcare Systems",
    description: "Test ordering, lab integrations, secure data workflows",
    features: ["Lab Integration", "Order Management", "HIPAA Compliant"],
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-28 sm:py-36 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <p className="text-primary font-semibold text-lg mb-4">Services</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
            AI-First Solutions for Modern Business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Comprehensive AI automation services designed to transform your operations and drive measurable business
            outcomes.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <AnimatedSection key={service.title} animation="scale" delay={index * 50}>
              <div className="group h-full p-7 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all duration-300 card-lift glow-on-hover overflow-hidden shine-effect">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <service.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-3 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-base text-muted-foreground mb-5 leading-relaxed">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li
                      key={feature}
                      className="text-sm text-muted-foreground flex items-center gap-2 transition-transform duration-300"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
