'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { getAccessToken } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

const BACKEND_URL = 'http://localhost:8000'; // Should use env var
const FRONTEND_URL = 'http://localhost:3000'; // Should use env var

interface WidgetSettings {
  primary_color?: string;
  theme?: string;
  icon_url?: string;
  public_widget_id?: string;
  welcome_message?: string;
  initial_ai_message?: string;
  send_initial_message_automatically?: boolean;
}

export default function WidgetSettingsPage() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${BACKEND_URL}/widgets/my-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    if (!settings) return;
    try {
      const token = getAccessToken();
      const res = await fetch(`${BACKEND_URL}/widgets/my-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          primary_color: settings.primary_color,
          theme: settings.theme,
          icon_url: settings.icon_url,
          welcome_message: settings.welcome_message,
          initial_ai_message: settings.initial_ai_message,
          send_initial_message_automatically: settings.send_initial_message_automatically
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        success("Settings saved successfully!");
      } else {
        error("Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      error("Error saving settings");
    } finally {
      setUpdating(false);
    }
  };

  const copyEmbedCode = () => {
    if (!settings?.public_widget_id) return;
    const code = `<!-- Sten Chat Widget -->
<script>
  (function() {
      var s = document.createElement("script");
      s.src = "${FRONTEND_URL}/widget.js";
      s.async = true;
      s.dataset.widgetId = "${settings.public_widget_id}";
      document.head.appendChild(s);
  })();
</script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat Widget Settings</h1>
        <p className="text-gray-500 mt-2">Customize your chat widget and integrate it into your website.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings Form */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Appearance</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={settings?.primary_color || "#000000"}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => settings && setSettings({ ...settings, primary_color: e.target.value })}
                  className="h-10 w-20 cursor-pointer border rounded"
                />
                <Input
                  value={settings?.primary_color || "#000000"}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => settings && setSettings({ ...settings, primary_color: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
              <Input
                placeholder="https://example.com/icon.png"
                value={settings?.icon_url || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => settings && setSettings({ ...settings, icon_url: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for default icon.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                value={settings?.theme || "light"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => settings && setSettings({ ...settings, theme: e.target.value })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Messages</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                  <p className="text-xs text-gray-500 mb-2">Shown immediately when the widget opens (before chat starts).</p>
                  <Input
                    placeholder="Hi there! 👋"
                    value={settings?.welcome_message || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => settings && setSettings({ ...settings, welcome_message: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial AI Message</label>
                  <p className="text-xs text-gray-500 mb-2">Sent automatically by the AI when the guest starts a chat.</p>
                  <Input
                    placeholder="How can I help you today?"
                    value={settings?.initial_ai_message || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => settings && setSettings({ ...settings, initial_ai_message: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto_send"
                    checked={settings?.send_initial_message_automatically ?? true}
                    onChange={(e) => settings && setSettings({ ...settings, send_initial_message_automatically: e.target.checked })}
                    className="h-4 w-4 text-[var(--primary-color)] border-gray-300 rounded focus:ring-[var(--primary-color)]"
                  />
                  <label htmlFor="auto_send" className="text-sm font-medium text-gray-700">Send Initial AI Message automatically</label>
                </div>
              </div>
            </div>

            <Button onClick={handleUpdate} loading={updating}>
              Save Changes
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Installation</h2>
            <p className="text-sm text-gray-600">Copy this code and paste it into the <code>&lt;head&gt;</code> of your website.</p>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs font-mono overflow-x-auto whitespace-pre">
              {`<!-- Sten Chat Widget -->
<script>
  (function() {
      var s = document.createElement("script");
      s.src = "${FRONTEND_URL}/widget.js";
      s.async = true;
      s.dataset.widgetId = "${settings?.public_widget_id || '...'}";
      document.head.appendChild(s);
  })();
</script>`}
            </div>

            <Button variant="secondary" onClick={copyEmbedCode}>
              {copied ? "Copied!" : "Copy Code"}
            </Button>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="bg-gray-100 border border-gray-200 rounded-xl h-[600px] relative w-full flex items-center justify-center overflow-hidden">
            <p className="text-gray-400 absolute text-sm">Your Website Content</p>

            {/* Mock Widget UI */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-4">
              {/* Expanded State (Mock) */}
              <div className="w-[350px] h-[480px] bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
                <div className="h-14 bg-gray-900 text-white flex items-center px-4" style={{ backgroundColor: settings?.primary_color }}>
                  <span className="font-medium">Chat Support</span>
                </div>
                <div className="flex-1 p-4 bg-gray-50 flex flex-col space-y-3">
                  <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm text-sm border self-start max-w-[80%]">
                    {settings?.welcome_message || "👋 Hi there! How can I help?"}
                  </div>
                  {/* If user starts chat, they see this */}
                  <div className="p-3 rounded-lg rounded-br-none shadow-sm text-sm text-white self-end max-w-[80%]" style={{ backgroundColor: settings?.primary_color }}>
                    I have a question about pricing.
                  </div>
                  <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm text-sm border self-start max-w-[80%]">
                    {settings?.initial_ai_message || "How can I help you today?"}
                  </div>
                </div>
                <div className="p-3 border-t bg-white">
                  <div className="h-8 bg-gray-100 rounded-full w-full"></div>
                </div>
              </div>

              {/* Launcher Button */}
              <div className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white" style={{ backgroundColor: settings?.primary_color }}>
                {settings?.icon_url ? (
                  <img src={settings.icon_url} className="w-6 h-6 object-contain" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
