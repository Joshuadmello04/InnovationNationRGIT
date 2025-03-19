// app/page.tsx
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Transform Your Videos with AI</span>
              <span className="block text-blue-600">Create Shorts, Ads, and More</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Automatically repurpose your videos into optimized content for YouTube Shorts, 
              Display Ads, and other platforms — all with a single upload.
            </p>
            <div className="mt-10 flex justify-center">
              <Link 
                href="/login" 
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg md:px-10"
              >
                Get Started
              </Link>
              <Link 
                href="/dashboard" 
                className="ml-4 px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:text-lg md:px-10"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
          
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mb-4">1</div>
                <h3 className="text-lg font-semibold mb-2">Upload Your Video</h3>
                <p className="text-gray-600">Upload any video and our AI will analyze it to find the most engaging moments.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mb-4">2</div>
                <h3 className="text-lg font-semibold mb-2">AI Processing</h3>
                <p className="text-gray-600">Our system automatically transcribes, analyzes, and finds the best clips for each platform.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mb-4">3</div>
                <h3 className="text-lg font-semibold mb-2">Get Optimized Content</h3>
                <p className="text-gray-600">Download platform-specific videos with proper formatting, aspect ratios, and engaging captions.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}