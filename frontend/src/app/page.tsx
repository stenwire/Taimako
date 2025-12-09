'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, FileText, MessageSquare, Shield, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: FileText,
      title: 'Document Intelligence',
      description: 'Upload and process your documents with advanced AI analysis'
    },
    {
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      description: 'Chat with an AI agent trained on your business knowledge'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is isolated and protected with enterprise-grade security'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get instant answers from your knowledge base'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] via-[#FFFFFF] to-[#F5F7F9]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--brand-primary)] rounded-[var(--radius-squircle)]">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <span className="text-h2 text-[var(--text-primary)]">Agentic CX</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                Log In
              </Button>
              <Button variant="primary" onClick={() => router.push('/auth/signup')}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)]/10 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="text-small font-medium text-[var(--brand-primary)]">
              AI-Powered Customer Experience
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[48px] lg:text-[64px] font-medium leading-tight tracking-tight text-[var(--text-primary)] mb-6"
          >
            Transform Your Customer Support with{' '}
            <span className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] bg-clip-text text-transparent">
              AI Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[18px] text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Upload your documents, train your AI agent, and deliver instant, accurate responses to your customers.
            Built for modern businesses that value speed and precision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" variant="primary" onClick={() => router.push('/auth/signup')}>
              Get Started Free
            </Button>
            <Button size="lg" variant="secondary" onClick={() => router.push('/auth/login')}>
              View Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="attio-card p-6 hover-lift"
              >
                <div className="p-3 bg-[var(--brand-primary)]/10 rounded-[var(--radius-squircle)] w-fit mb-4">
                  <Icon className="w-6 h-6 text-[var(--brand-primary)]" />
                </div>
                <h3 className="text-h2 text-[var(--text-primary)] mb-2">{feature.title}</h3>
                <p className="text-small text-[var(--text-secondary)]">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--brand-primary)] rounded-[var(--radius-squircle)]">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <span className="text-small text-[var(--text-secondary)]">
                © 2025 Agentic CX. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-small text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors">
                Privacy
              </a>
              <a href="#" className="text-small text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors">
                Terms
              </a>
              <a href="#" className="text-small text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
