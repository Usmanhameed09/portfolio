"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const portfolioItems = [
  {
    id: 1,
    title: "AI HR Agent Dashboard",
    category: "AI Automation",
    image: "/images/ainternalhr.png",
  },
  {
    id: 2,
    title: "AI Image Generator",
    category: "Generative AI",
    image: "/images/socialimage.png",
  },
  {
    id: 3,
    title: "Marketing Automation CRM",
    category: "CRM Solution",
    image: "/images/aimarketing.png",
  },
  {
    id: 4,
    title: "Legal Document AI",
    category: "RAG System",
    image: "/images/legal1.jpeg",
  },
  {
    id: 5,
    title: "Healthcare Order System",
    category: "Healthcare Tech",
    image: "/images/3.png",
  },
]

export function PortfolioSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % portfolioItems.length)
  }, [])

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + portfolioItems.length) % portfolioItems.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(nextSlide, 4000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  return (
    <section id="portfolio" className="py-28 sm:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-lg mb-4">Portfolio</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">Featured Work</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A showcase of AI automation projects that have transformed business operations.
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative group">
          {/* Main Image */}
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-secondary shadow-2xl">
            {portfolioItems.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentIndex
                    ? "opacity-100 translate-x-0"
                    : index < currentIndex
                      ? "opacity-0 -translate-x-full"
                      : "opacity-0 translate-x-full"
                }`}
              >
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium mb-4">
                    {item.category}
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-bold text-background">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Dots Navigation */}
        <div className="flex items-center justify-center gap-3 mt-8">
          {portfolioItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex ? "w-10 h-3 bg-primary" : "w-3 h-3 bg-border hover:bg-primary/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Thumbnail Preview */}
        <div className="hidden sm:flex items-center justify-center gap-4 mt-10">
          {portfolioItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => goToSlide(index)}
              className={`relative aspect-video w-32 rounded-xl overflow-hidden transition-all duration-300 ${
                index === currentIndex
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
