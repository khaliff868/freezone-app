'use client';

import { Phone, Mail, MessageCircle, Facebook, Instagram, Music } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-trini-red to-tropical-orange flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact Freezone</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Reach out to us for support, advertising, or marketplace inquiries.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Phone</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium select-all">290-1117</p>
          </div>

          {/* WhatsApp / Phone */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">WhatsApp / Phone</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium select-all">752-2936</p>
          </div>

          {/* Email */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h2>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium select-all">khaliff@email.com</p>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium select-all">freezone@marketplace.com</p>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Social Media</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* TikTok */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <Music className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">TikTok</p>
                  <p className="text-gray-900 dark:text-white font-medium select-all">freezone@tt</p>
                </div>
              </div>

              {/* Facebook */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Facebook</p>
                  <p className="text-gray-900 dark:text-white font-medium select-all">Freezonett</p>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Instagram</p>
                  <p className="text-gray-900 dark:text-white font-medium select-all">Freezonett</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
