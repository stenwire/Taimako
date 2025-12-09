'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, FileText, MessageSquare, ArrowRight, Sparkles, Settings } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardOverview() {
  const router = useRouter();
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Business Profile',
      description: 'Configure your business details and AI agent',
      icon: Building2,
      href: '/dashboard/business',
      color: 'var(--brand-primary)'
    },
    {
      title: 'Upload Documents',
      description: 'Add knowledge to your AI assistant',
      icon: FileText,
      href: '/dashboard/documents',
      color: 'var(--success)'
    },
    {
      title: 'Setup Widget',
      description: 'Customize and embed your chat widget',
      icon: Settings,
      href: '/dashboard/widget-settings',
      color: 'var(--warning)'
    },
    {
      title: 'Start Chatting',
      description: 'Ask questions about your documents',
      icon: MessageSquare,
      href: '/dashboard/chat',
      color: 'var(--brand-accent)'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[var(--brand-primary)]/10 rounded-[var(--radius-squircle)]">
            <Sparkles className="w-8 h-8 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-h1 text-[var(--text-primary)]">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Here's what you can do with your AI-powered customer experience platform
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Card className="hover-lift cursor-pointer" onClick={() => router.push(action.href)}>
                <div className="flex flex-col h-full">
                  <div
                    className="p-3 rounded-[var(--radius-squircle)] w-fit mb-4"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: action.color }} />
                  </div>
                  <h3 className="text-h2 text-[var(--text-primary)] mb-2">{action.title}</h3>
                  <p className="text-small text-[var(--text-secondary)] mb-4 flex-1">
                    {action.description}
                  </p>
                  <Button variant="ghost" className="w-full justify-between group">
                    Get Started
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Getting Started Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card title="Getting Started" subtitle="Follow these steps to set up your AI assistant">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-medium text-[13px]">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-body font-medium text-[var(--text-primary)] mb-1">
                  Create Your Business Profile
                </h4>
                <p className="text-small text-[var(--text-secondary)]">
                  Set up your business details and customize your AI agent's behavior
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-medium text-[13px]">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-body font-medium text-[var(--text-primary)] mb-1">
                  Upload Your Documents
                </h4>
                <p className="text-small text-[var(--text-secondary)]">
                  Add PDFs, text files, or markdown documents to build your knowledge base
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-medium text-[13px]">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-body font-medium text-[var(--text-primary)] mb-1">
                  Process Your Knowledge Base
                </h4>
                <p className="text-small text-[var(--text-secondary)]">
                  Let the AI analyze and index your documents for intelligent search
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-[var(--radius-md)]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-medium text-[13px]">
                4
              </div>
              <div className="flex-1">
                <h4 className="text-body font-medium text-[var(--text-primary)] mb-1">
                  Start Chatting
                </h4>
                <p className="text-small text-[var(--text-secondary)]">
                  Ask questions and get instant, accurate answers from your AI assistant
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
