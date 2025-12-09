'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save, Edit2, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { getBusinessProfile, createBusinessProfile, updateBusinessProfile } from '@/lib/api';
import type { BusinessProfile, CreateBusinessProfileData } from '@/lib/types';

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateBusinessProfileData>({
    business_name: '',
    description: '',
    website: '',
    custom_agent_instruction: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getBusinessProfile();
      if (response.data) {
        setProfile(response.data);
        setFormData({
          business_name: response.data.business_name,
          description: response.data.description,
          website: response.data.website,
          custom_agent_instruction: response.data.custom_agent_instruction
        });
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No profile exists, show create form
        setEditing(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (profile) {
        const response = await updateBusinessProfile(formData);
        setProfile(response.data!);
        setSuccess('Business profile updated successfully!');
      } else {
        const response = await createBusinessProfile(formData);
        setProfile(response.data!);
        setSuccess('Business profile created successfully!');
      }
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        business_name: profile.business_name,
        description: profile.description,
        website: profile.website,
        custom_agent_instruction: profile.custom_agent_instruction
      });
      setEditing(false);
    }
    setError('');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonLoader variant="rectangle" className="h-32" />
        <SkeletonLoader variant="text" count={5} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--brand-primary)]/10 rounded-[var(--radius-squircle)]">
            <Building2 className="w-8 h-8 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-h1 text-[var(--text-primary)]">Business Profile</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Configure your business details and AI agent behavior
            </p>
          </div>
        </div>
        {profile && !editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        )}
      </motion.div>

      {/* Notifications */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[var(--error-bg)] border border-[var(--error)] rounded-[var(--radius-md)] flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
          <p className="text-small text-[var(--error)]">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[var(--success-bg)] border border-[var(--success)] rounded-[var(--radius-md)] flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
          <p className="text-small text-[var(--success)]">{success}</p>
        </motion.div>
      )}

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <div className="space-y-6">
            <Input
              label="Business Name"
              placeholder="Acme Support"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              disabled={!editing}
            />

            <div>
              <label className="block text-[var(--text-secondary)] text-[13px] font-medium mb-2">
                Description
              </label>
              <textarea
                placeholder="Customer support for Acme products"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!editing}
                rows={3}
                className="w-full px-3 py-2 text-[14px] bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] placeholder:text-[var(--text-tertiary)] focus-ring transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <Input
              label="Website"
              type="url"
              placeholder="https://acme.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              disabled={!editing}
            />

            <div>
              <label className="block text-[var(--text-secondary)] text-[13px] font-medium mb-2">
                Custom Agent Instructions
              </label>
              <textarea
                placeholder="Always be professional and mention our 24/7 support availability..."
                value={formData.custom_agent_instruction}
                onChange={(e) => setFormData({ ...formData, custom_agent_instruction: e.target.value })}
                disabled={!editing}
                rows={6}
                className="w-full px-3 py-2 text-[14px] bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] placeholder:text-[var(--text-tertiary)] focus-ring transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="text-[12px] text-[var(--text-tertiary)] mt-2">
                These instructions will guide how your AI agent responds to customers
              </p>
            </div>

            {editing && (
              <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={saving}
                  disabled={saving}
                  className="flex-1"
                >
                  <Save className="w-4 h-4" />
                  {profile ? 'Save Changes' : 'Create Profile'}
                </Button>
                {profile && (
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
