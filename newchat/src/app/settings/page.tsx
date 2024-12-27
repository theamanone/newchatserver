"use client";
import React from 'react'
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsProvider } from '@/context/SettingsContext';

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsLayout />
    </SettingsProvider>
  );
}
