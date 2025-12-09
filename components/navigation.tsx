"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#projects", label: "Projects" },
  { href: "#tech", label: "Tech Stack" },
  { href: "#contact", label: "Contact" },
]

const UPWORK_URL = "https://www.upwork.com/freelancers/~0139fe6cbd7c4b5ee0"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      const sections = navLinks.map((link) => link.href.slice(1))
      for (const section of sections.reverse()) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 150) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/80 backdrop-blur-xl shadow-lg border-b border-border/50" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors group">
            <span className="inline-block group-hover:animate-wiggle">Usman</span>
            <span className="text-primary inline-block group-hover:scale-125 transition-transform">.</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium transition-colors relative group underline-reveal ${
                  activeSection === link.href.slice(1) ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button
              asChild
              size="lg"
              className="text-base px-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 shine-effect overflow-hidden"
            >
              <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer">
                Hire Me
              </a>
            </Button>
          </div>

          <button
            className="md:hidden text-foreground p-2 hover:bg-secondary rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative w-7 h-7">
              <Menu
                size={28}
                className={`absolute inset-0 transition-all duration-300 ${isOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"}`}
              />
              <X
                size={28}
                className={`absolute inset-0 transition-all duration-300 ${isOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}
              />
            </div>
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-4 py-6 gap-2 bg-background/95 backdrop-blur-xl border-b border-border">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-lg font-medium text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all py-3 px-4 rounded-lg`}
              onClick={() => setIsOpen(false)}
              style={{
                animationDelay: `${index * 50}ms`,
                animation: isOpen ? "fade-in-up 0.4s ease forwards" : "none",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className="w-fit mt-4 mx-4" size="lg">
            <a href={UPWORK_URL} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)}>
              Hire Me
            </a>
          </Button>
        </nav>
      </div>
    </header>
  )
}
