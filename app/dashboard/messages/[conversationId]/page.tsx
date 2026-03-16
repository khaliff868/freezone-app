'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Image as ImageIcon, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; name: string; avatar: string | null };
  read: boolean;
  createdAt: string;
}

interface ConversationData {
  conversation: {
    id: string;
    participant1: { id: string; name: string; avatar: string | null };
    participant2: { id: string; name: string; avatar: string | null };
    listing: {
      id: string;
      title: string;
      images: string[];
      category: string;
      price: number | null;
    } | null;
  };
  messages: Message[];
}

export default function ConversationPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  
  const [data, setData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id && conversationId) {
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [session, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [data?.messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else if (res.status === 404) {
        router.push('/dashboard/messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        const message = await res.json();
        setData((prev) =>
          prev ? { ...prev, messages: [...prev.messages, message] } : prev
        );
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-caribbean-teal border-t-transparent"></div>
      </div>
    );
  }

  const { conversation, messages } = data;
  const otherParticipant =
    conversation.participant1.id === session?.user?.id
      ? conversation.participant2
      : conversation.participant1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-white/10 border-b border-gray-200 dark:border-white/20 p-4 shadow-sm dark:shadow-none">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard/messages"
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-white" />
          </Link>
          
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-trini-red to-trini-gold flex items-center justify-center text-white font-bold text-lg">
            {otherParticipant.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 dark:text-white">{otherParticipant.name}</h2>
            {conversation.listing && (
              <Link
                href={`/dashboard/listings/${conversation.listing.id}`}
                className="text-sm text-caribbean-teal hover:underline"
              >
                Re: {conversation.listing.title}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Listing Context Card */}
      {conversation.listing && (
        <div className="max-w-4xl mx-auto w-full p-4">
          <Link
            href={`/dashboard/listings/${conversation.listing.id}`}
            className="flex items-center gap-4 bg-white dark:bg-white/10 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-white/15 transition-colors border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none"
          >
            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {conversation.listing.images[0] ? (
                <img
                  src={conversation.listing.images[0]}
                  alt={conversation.listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">{conversation.listing.title}</h3>
              {conversation.listing.price && (
                <p className="text-trini-gold font-semibold">
                  ${conversation.listing.price.toLocaleString()} TTD
                </p>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === session?.user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isOwn
                      ? 'bg-caribbean-teal text-white'
                      : 'bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-white/10 border-t border-gray-200 dark:border-white/20 p-4 shadow-sm dark:shadow-none">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-caribbean-teal"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-gradient-to-r from-caribbean-teal to-ocean-blue text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
