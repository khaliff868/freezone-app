import Link from 'next/link';
import { Megaphone, ShoppingBag, Eye, Users, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Advertise with Freezone | Freezone Swap or Sell',
  description: 'Promote your business to thousands of buyers and sellers across Trinidad & Tobago.',
};

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-trini-red via-trini-black to-trini-red py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-trini-gold to-tropical-orange flex items-center justify-center shadow-lg">
              <Megaphone className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Advertise with <span className="text-trini-gold">Freezone</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Promote your business to thousands of active buyers and sellers across Trinidad &amp; Tobago 🇹🇹
          </p>
          <Link
            href="/dashboard/banners"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-trini-gold to-tropical-orange text-trini-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Why Advertise on Freezone?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white/10 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-caribbean-teal to-caribbean-ocean rounded-xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">High Visibility</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your ad is displayed on the most visited pages — the Home and Browse pages — seen by every visitor.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white/10 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-trini-gold to-tropical-orange rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Targeted Audience</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reach active buyers and sellers in Trinidad &amp; Tobago who are ready to engage.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white/10 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-tropical-purple to-tropical-pink rounded-xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Affordable Plans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Flexible pricing packages to fit any budget — from small businesses to major brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-100 dark:bg-gray-800/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            How It Works
          </h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Create Your Banner', desc: 'Upload your banner ad with a title, image, and link from your dashboard.' },
              { step: '2', title: 'Choose Placement & Duration', desc: 'Select where your banner appears and how long you want it to run.' },
              { step: '3', title: 'Submit Payment', desc: 'Complete your payment and submit proof for admin review.' },
              { step: '4', title: 'Go Live!', desc: 'Once approved, your banner is shown to all Freezone visitors instantly.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-trini-gold to-tropical-orange rounded-full flex items-center justify-center text-trini-black font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to grow your business?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Join other businesses already reaching thousands of customers on Freezone.
          </p>
          <Link
            href="/dashboard/banners"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-trini-gold to-tropical-orange text-trini-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            Create Your Banner Ad <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-trini-black via-trini-red to-trini-black py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/80 text-sm">
            © 2026 Freezone Swap or Sell. Made with <span className="text-trini-red">❤️</span> in Trinidad &amp; Tobago 🇹🇹
          </p>
        </div>
      </footer>
    </div>
  );
}
