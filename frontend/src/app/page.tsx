import Link from "next/link"
import Image from "next/image"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Upload,
  Zap,
  Download,
  ArrowRight,
  Play,
  CheckCircle,
  Users,
  BarChart3,
  Sparkles,
  Globe,
  Clock,
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        {/* Hero section with enhanced design */}
        <section className="relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-blue-50 to-white" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.15]"
            aria-hidden="true"
          />
          <div
            className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute top-1/2 -left-24 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-6 text-sm font-medium animate-fade-in">
                  <Zap className="h-4 w-4 mr-2" />
                  AI-Powered Video Transformation
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl animate-slide-up [--slide-delay:100ms]">
                  <span className="block">Transform Your Videos</span>
                  <span className="block text-primary mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                    with AI Magic
                  </span>
                </h1>
                <p className="mt-6 text-xl text-muted-foreground animate-slide-up [--slide-delay:200ms]">
                  Automatically repurpose your videos into optimized content for YouTube Shorts, Display Ads, and other
                  platforms — all with a single upload.
                </p>
                <div className="mt-10 flex flex-wrap gap-4 animate-slide-up [--slide-delay:300ms]">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  >
                    <Link href="/login">
                      Get Started <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 rounded-full border-2 hover:bg-primary/5 transition-colors duration-300"
                  >
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
                <div className="mt-8 flex items-center text-sm text-muted-foreground animate-slide-up [--slide-delay:400ms]">
                  <div className="flex -space-x-2 mr-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-white flex items-center justify-center text-xs font-medium text-primary shadow-sm"
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <span>
                    Join <span className="font-medium text-primary">2,000+</span> content creators
                  </span>
                </div>
              </div>
              <div className="relative animate-fade-in [--fade-delay:500ms]">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all duration-500 hover:shadow-primary/10 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-400/20 mix-blend-overlay" />
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    width={800}
                    height={600}
                    alt="Video transformation preview"
                    className="w-full h-auto"
                  />
                  <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-full p-4 shadow-lg hover:bg-white transition-colors group">
                    <Play className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-yellow-200 rounded-full blur-2xl opacity-60 animate-pulse" />
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-200 rounded-full blur-2xl opacity-60 animate-pulse [animation-delay:1s]" />
              </div>
            </div>
          </div>
        </section>

        {/* Logos section */}
        <section className="bg-gray-50 py-12 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8 tracking-wider">
              TRUSTED BY CONTENT CREATORS FROM
            </p>
            <div className="flex justify-center flex-wrap gap-x-12 gap-y-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-8 w-32 bg-gray-200 rounded-md opacity-50 hover:opacity-80 transition-opacity duration-300"
                />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works section with enhanced cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 mb-4 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Simple Process
            </div>
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform makes it easy to transform your videos in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden md:block" />

            <Card className="border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group rounded-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400" />
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold mb-4 shadow-lg shadow-primary/20">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Upload Your Video</h3>
                  <p className="text-muted-foreground">
                    Upload any video and our AI will analyze it to find the most engaging moments. Support for all major
                    formats.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group md:translate-y-8 rounded-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400" />
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-8 w-8" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold mb-4 shadow-lg shadow-primary/20">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-3">AI Processing</h3>
                  <p className="text-muted-foreground">
                    Our system automatically transcribes, analyzes, and finds the best clips for each platform with
                    perfect timing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group rounded-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400" />
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Download className="h-8 w-8" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold mb-4 shadow-lg shadow-primary/20">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Get Optimized Content</h3>
                  <p className="text-muted-foreground">
                    Download platform-specific videos with proper formatting, aspect ratios, and engaging captions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 text-center">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              <Link href="/login">
                Start Transforming Your Videos{" "}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features section */}
        <section className="bg-gray-50 py-24 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 mb-4 text-sm font-medium">
                <CheckCircle className="h-4 w-4 mr-2" />
                Powerful Capabilities
              </div>
              <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to transform your videos into engaging content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Smart Clip Detection",
                  description: "AI identifies the most engaging moments in your videos automatically",
                  icon: Sparkles,
                },
                {
                  title: "Multi-Platform Export",
                  description: "Optimize for YouTube Shorts, TikTok, Instagram Reels, and more",
                  icon: Globe,
                },
                {
                  title: "Automatic Captions",
                  description: "Generate and style captions that boost engagement and accessibility",
                  icon: CheckCircle,
                },
                {
                  title: "Custom Branding",
                  description: "Add your logo, colors, and style to maintain brand consistency",
                  icon: Users,
                },
                {
                  title: "Batch Processing",
                  description: "Transform multiple videos at once to save time",
                  icon: Clock,
                },
                {
                  title: "Analytics Integration",
                  description: "Track performance across platforms with our analytics dashboard",
                  icon: BarChart3,
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-blue-400/10 flex items-center justify-center text-primary mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 text-green-600 mb-4 text-sm font-medium">
              <Users className="h-4 w-4 mr-2" />
              Testimonials
            </div>
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of content creators who are saving time and growing their audience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Content Creator",
                quote:
                  "This tool has completely transformed my content strategy. I can now create platform-specific videos in minutes instead of hours. The AI is surprisingly accurate at finding the best moments.",
              },
              {
                name: "Michael Chen",
                role: "YouTube Influencer",
                quote:
                  "I've tried many video tools, but this one stands out. The ability to automatically generate shorts from my long-form content has doubled my channel growth in just two months.",
              },
              {
                name: "Jessica Williams",
                role: "Marketing Director",
                quote:
                  "Our ad performance has improved by 40% since we started using this platform. The AI-generated clips consistently outperform our manually created content.",
              },
            ].map((testimonial, i) => (
              <Card
                key={i}
                className="border border-gray-100 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
              >
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col h-full">
                    <div className="flex mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 italic flex-grow">"{testimonial.quote}"</p>
                    <div className="flex items-center mt-auto">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-primary font-medium mr-3">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]"
            aria-hidden="true"
          />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div
              className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              aria-hidden="true"
            />

            <h2 className="text-3xl font-bold mb-6 text-white">Ready to Transform Your Videos?</h2>
            <p className="text-xl mb-10 text-white/80 max-w-2xl mx-auto">
              Join thousands of content creators who are saving time and growing their audience with AI-powered video
              transformation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-white text-primary hover:bg-white/90"
              >
                <Link href="/login">Get Started Today</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-full bg-transparent text-white border-white hover:bg-white/10 transition-all duration-300"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

