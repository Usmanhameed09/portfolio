import Link from "next/link"

const UPWORK_URL = "https://www.upwork.com/freelancers/usmanhameed"

export function Footer() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">
              Usman<span className="text-primary">.</span>
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-base text-muted-foreground">AI Automation Engineer</span>
          </div>

          <p className="text-base text-muted-foreground">
            © {new Date().getFullYear()} Usman Hameed. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
