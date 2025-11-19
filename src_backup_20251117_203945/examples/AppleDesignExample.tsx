/**
 * Apple Design System - Example Usage
 * Demonstrates how to use iOS-styled components
 */

import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input } from '../components/ui';
import '../styles/apple-design.css';

export const AppleDesignExample: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    console.log('Form submitted:', { email, password });
  };

  return (
    <div className="min-h-screen bg-[var(--ios-bg-grouped-primary)] p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="ios-large-title text-[var(--ios-label)] mb-2">
          Apple Design System
        </h1>
        <p className="ios-body text-[var(--ios-label-secondary)]">
          iOS-styled components for TheFitChecked
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Typography Examples */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>
              iOS text styles following Apple's Human Interface Guidelines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="ios-headline text-[var(--ios-label)]">Headline - Semibold 17pt</p>
            </div>
            <div>
              <p className="ios-body text-[var(--ios-label)]">Body - Regular 17pt</p>
            </div>
            <div>
              <p className="ios-callout text-[var(--ios-label)]">Callout - Regular 16pt</p>
            </div>
            <div>
              <p className="ios-subheadline text-[var(--ios-label-secondary)]">
                Subheadline - Regular 15pt
              </p>
            </div>
            <div>
              <p className="ios-footnote text-[var(--ios-label-secondary)]">
                Footnote - Regular 13pt
              </p>
            </div>
            <div>
              <p className="ios-caption-1 text-[var(--ios-label-tertiary)]">
                Caption 1 - Regular 12pt
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Button Examples */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>
              iOS-styled buttons with haptic feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
            <div>
              <Button variant="primary" fullWidth>Full Width Button</Button>
            </div>
            <div>
              <Button variant="primary" loading>Loading State</Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Examples */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Form Inputs</CardTitle>
            <CardDescription>
              iOS-styled form fields with validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
              fullWidth
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              fullWidth
            />
            <Input
              label="Error State"
              placeholder="This field has an error"
              error="Please enter a valid value"
              fullWidth
            />
          </CardContent>
        </Card>

        {/* Card Variants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default" padding="md">
            <h3 className="ios-headline text-[var(--ios-label)] mb-2">Default Card</h3>
            <p className="ios-subheadline text-[var(--ios-label-secondary)]">
              Subtle shadow
            </p>
          </Card>
          <Card variant="elevated" padding="md">
            <h3 className="ios-headline text-[var(--ios-label)] mb-2">Elevated Card</h3>
            <p className="ios-subheadline text-[var(--ios-label-secondary)]">
              Larger shadow with hover effect
            </p>
          </Card>
          <Card variant="outlined" padding="md">
            <h3 className="ios-headline text-[var(--ios-label)] mb-2">Outlined Card</h3>
            <p className="ios-subheadline text-[var(--ios-label-secondary)]">
              Border instead of shadow
            </p>
          </Card>
        </div>

        {/* Login Form Example */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Complete Example</CardTitle>
            <CardDescription>
              A complete login form using all components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEmail('');
                    setPassword('');
                  }}
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>
              iOS system colors with automatic dark mode support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { name: 'Blue', color: 'var(--ios-blue)' },
                { name: 'Green', color: 'var(--ios-green)' },
                { name: 'Indigo', color: 'var(--ios-indigo)' },
                { name: 'Orange', color: 'var(--ios-orange)' },
                { name: 'Pink', color: 'var(--ios-pink)' },
                { name: 'Purple', color: 'var(--ios-purple)' },
                { name: 'Red', color: 'var(--ios-red)' },
                { name: 'Teal', color: 'var(--ios-teal)' },
                { name: 'Yellow', color: 'var(--ios-yellow)' },
              ].map((colorItem) => (
                <div key={colorItem.name} className="text-center">
                  <div
                    className="w-full aspect-square rounded-xl mb-2"
                    style={{ backgroundColor: colorItem.color }}
                  />
                  <p className="ios-caption-1 text-[var(--ios-label-secondary)]">
                    {colorItem.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="ios-footnote text-[var(--ios-label-tertiary)]">
            Apple Design System for TheFitChecked
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppleDesignExample;
