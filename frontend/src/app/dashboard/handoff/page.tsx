'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Bell, Mail, Flag, Plus, Trash2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface HandoffRule {
  id: string;
  condition: string; // e.g., "intent_equals", "sentiment_below"
  value: string;
  action: string; // "notify_email", "assign_team"
}

export default function HandoffPage() {
  const [rules, setRules] = useState<HandoffRule[]>([
    { id: '1', condition: 'sentiment_below', value: '0.3', action: 'notify_email' },
    { id: '2', condition: 'intent_equals', value: 'billing_dispute', action: 'assign_team' }
  ]);
  const [emailAlerts, setEmailAlerts] = useState<string[]>(['support@acme.com']);

  // Mock saving
  const [saving, setSaving] = useState(false);
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  const addRule = () => {
    setRules([...rules, { id: Date.now().toString(), condition: 'intent_equals', value: '', action: 'notify_email' }]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, field: keyof HandoffRule, val: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: val } : r));
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-[var(--brand-accent)]/10 rounded-[var(--radius-squircle)]">
          <Users className="w-8 h-8 text-[var(--brand-accent)]" />
        </div>
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Human Handoff</h1>
          <p className="text-body text-[var(--text-secondary)] mt-1">
            Configure when and how AI conversations escalate to your team.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Global Settings */}
        <Card>
          <h2 className="text-lg font-space font-semibold text-[var(--brand-primary)] border-b border-[var(--border-subtle)] pb-2 mb-4">Availability & Sensitivity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
              <div>
                <h4 className="font-medium text-[var(--text-primary)]">Strict Handoff Mode</h4>
                <p className="text-xs text-[var(--text-tertiary)]">Immediately escalate if AI confidence is low</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-[var(--border-strong)]" />
                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-[var(--border-strong)] cursor-pointer"></label>
              </div>
            </div>
          </div>
        </Card>

        {/* Rules Engine */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-space font-semibold text-[var(--brand-primary)]">Escalation Rules</h2>
              <p className="text-sm text-[var(--text-secondary)]">Define triggers for automatic handoff</p>
            </div>
            <Button size="sm" variant="secondary" onClick={addRule}>
              <Plus className="w-4 h-4 mr-1" /> Add Rule
            </Button>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                <div className="col-span-1 flex justify-center">
                  <div className="p-2 bg-[var(--bg-tertiary)] rounded-full">
                    <Flag className="w-4 h-4 text-[var(--brand-accent)]" />
                  </div>
                </div>
                <div className="col-span-3">
                  <select
                    className="w-full text-sm bg-transparent border-none focus:ring-0 font-medium"
                    value={rule.condition}
                    onChange={(e) => updateRule(rule.id, 'condition', e.target.value)}
                  >
                    <option value="intent_equals">If Intent is...</option>
                    <option value="sentiment_below">If Sentiment &lt;</option>
                    <option value="confidence_below">If Confidence &lt;</option>
                    <option value="word_match">If message contains...</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    className="w-full text-sm bg-[var(--bg-secondary)] px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]"
                    value={rule.value}
                    placeholder="Value..."
                    onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <select
                    className="w-full text-sm bg-transparent border-none focus:ring-0 text-[var(--text-secondary)]"
                    value={rule.action}
                    onChange={(e) => updateRule(rule.id, 'action', e.target.value)}
                  >
                    <option value="notify_email">Send Email Alert</option>
                    <option value="assign_team">Assign to Team</option>
                    <option value="mark_priority">Mark as Priority</option>
                  </select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removeRule(rule.id)} className="text-[var(--text-tertiary)] hover:text-[var(--status-error)] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Alerts */}
        <Card>
          <h2 className="text-lg font-space font-semibold text-[var(--brand-primary)] border-b border-[var(--border-subtle)] pb-2 mb-4">Notification Channels</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Email Alerts</label>
              <div className="flex gap-2">
                <Input placeholder="support@acme.com" value={emailAlerts[0]} onChange={(e) => {
                  const newEmails = [...emailAlerts];
                  newEmails[0] = e.target.value;
                  setEmailAlerts(newEmails);
                }} />
                <Button variant="secondary">Update</Button>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">We&apos;ll send a transcript summary for every escalated conversation.</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button size="lg" onClick={handleSave} loading={saving}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
