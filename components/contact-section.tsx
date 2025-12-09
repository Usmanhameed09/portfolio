"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, MapPin, Send, ExternalLink } from "lucide-react"

const UPWORK_URL = "https://www.upwork.com/freelancers/~0139fe6cbd7c4b5ee0"

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setSubmitted(true)
  }

  return (
    <section id="contact" className="py-28 sm:py-36 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20">
          <div className="animate-slide-in-left">
            <p className="text-primary font-semibold text-lg mb-4">Contact</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-8 text-balance leading-tight">
              Let&apos;s Build Something Amazing Together
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Have a project in mind? I&apos;d love to hear about it. Drop me a message and let&apos;s discuss how AI
              automation can transform your business.
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <div className="text-lg text-foreground font-medium">usmanhameed.dev@gmail.com</div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Location</div>
                  <div className="text-lg text-foreground font-medium">Available Worldwide (Remote)</div>
                </div>
              </div>
            </div>

            <Button asChild size="lg" variant="outline" className="text-base bg-transparent">
              <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer">
                View Upwork Profile
                <ExternalLink className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </div>

          <div className="bg-background rounded-3xl border border-border p-8 sm:p-10 shadow-xl animate-slide-in-right">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-scale-in">
                  <Send className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Message Sent!</h3>
                <p className="text-lg text-muted-foreground">
                  Thanks for reaching out. I&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    required
                    className="h-12 text-base bg-secondary/50 border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-12 text-base bg-secondary/50 border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-base font-medium">
                    Project Details
                  </Label>
                  <Textarea
                    id="project"
                    placeholder="Tell me about your project..."
                    rows={5}
                    required
                    className="text-base bg-secondary/50 border-border focus:border-primary resize-none"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
