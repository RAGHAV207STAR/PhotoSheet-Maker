
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import HomepageHeader from '@/components/app/homepage-header';
import HomepageBody from '@/components/app/homepage-body';
import Image from 'next/image';

// This is a Server Component.
// It runs only on the server, so we can safely select a random image here.
export default function Home() {
  // Select a random image on the server to prevent hydration mismatch.
  const heroImage: ImagePlaceholder = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];

  return <Homepage heroImage={heroImage} />;
}

// Client Component to render the page content
function Homepage({ heroImage }: { heroImage: ImagePlaceholder }) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
       <header
          className="relative w-full text-white"
        >
          <div 
            className="relative h-64 md:h-80 w-full"
          >
            <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                priority
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col">
                <HomepageHeader />
            </div>
          </div>
      </header>

      <main className="flex-grow w-full px-4 py-8 flex flex-col items-center gap-8">
        <HomepageBody />
      </main>

      <footer className="py-6 text-center text-sm w-full">
        <p className="font-semibold text-blue-900/60">&copy; {new Date().getFullYear()} Photosheet Maker. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
