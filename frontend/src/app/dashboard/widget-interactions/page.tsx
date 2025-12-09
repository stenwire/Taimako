'use client';

import { useState, useEffect } from 'react';
import { getAccessToken } from '@/lib/api';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { User, MessageSquare } from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000'; // Env var

interface GuestVisitor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

interface Message {
  id: string;
  sender: 'guest' | 'ai';
  message_text: string;
  created_at: string;
}

export default function WidgetInteractionsPage() {
  const [guests, setGuests] = useState<GuestVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<GuestVisitor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${BACKEND_URL}/widgets/guests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGuests(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTranscript = async (guest: GuestVisitor) => {
    setSelectedGuest(guest);
    setLoadingMessages(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${BACKEND_URL}/widgets/interactions/${guest.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) return <div className="p-8">Loading visitors...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guest Interactions</h1>
        <p className="text-gray-500 mt-2">View visitors who have interacted with your chat widget.</p>
      </div>

      <Card className="overflow-hidden">
        {guests.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No interactions yet.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {guest.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{guest.email || guest.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(guest.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => loadTranscript(guest)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      View Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Chat Transcript Modal */}
      {selectedGuest && (
        <Modal
          isOpen={!!selectedGuest}
          onClose={() => setSelectedGuest(null)}
          title={`Chat with ${selectedGuest.name}`}
        >
          <div className="h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-md border">
              {loadingMessages ? (
                <div className="text-center text-gray-400 mt-4">Loading transcript...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-4">No messages found.</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'guest' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${msg.sender === 'guest'
                        ? 'bg-white text-gray-800 border border-gray-200'
                        : 'bg-indigo-600 text-white'
                        }`}
                    >
                      <p>{msg.message_text}</p>
                      <p className="text-[10px] opacity-70 mt-1 min-w-[60px] text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 text-right">
              <button
                onClick={() => setSelectedGuest(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
