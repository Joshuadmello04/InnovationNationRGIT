import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Zap, Download } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="relative">
          {/* Background gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white pointer-events-none"
            aria-hidden="true"
          />

          {/* Hero section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Transform Your Videos with AI</span>
                <span className="block text-primary">Create Shorts, Ads, and More</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-muted-foreground">
                Automatically repurpose your videos into optimized content for YouTube Shorts, Display Ads, and other
                platforms — all with a single upload.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="h-12 px-8">
                  <Link href="/login">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* How It Works section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <Upload className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Upload Your Video</h3>
                    <p className="text-muted-foreground">
                      Upload any video and our AI will analyze it to find the most engaging moments.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <Zap className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">AI Processing</h3>
                    <p className="text-muted-foreground">
                      Our system automatically transcribes, analyzes, and finds the best clips for each platform.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <Download className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Get Optimized Content</h3>
                    <p className="text-muted-foreground">
                      Download platform-specific videos with proper formatting, aspect ratios, and engaging captions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

