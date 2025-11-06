/**
 * Terms of Service Page
 * Required for Google OAuth verification
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack?: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </button>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
            <p>
              By accessing or using TheFitChecked ("the Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            <p>
              TheFitChecked is an AI-powered fashion and outfit planning application that provides:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>3D avatar generation from user photos</li>
              <li>AI-generated outfit recommendations</li>
              <li>Virtual try-on capabilities</li>
              <li>Calendar integration for outfit planning</li>
              <li>Shopping recommendations and affiliate links</li>
              <li>Style preference tracking and personalization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Creation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 13 years old to use the Service</li>
              <li>One person or entity may not maintain more than one account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Account Security</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>We are not liable for any loss or damage from your failure to maintain account security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptable Use</h2>

            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload inappropriate, offensive, or illegal content</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Upload photos of other people without their consent</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated systems (bots, scrapers) to access the Service</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Content</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Rights</h3>
            <p>
              You retain all rights to photos, preferences, and other content you upload to the Service ("User Content").
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">License to Us</h3>
            <p>
              By uploading User Content, you grant us a worldwide, non-exclusive, royalty-free license to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use, process, and display your content to provide the Service</li>
              <li>Generate avatars and outfit recommendations</li>
              <li>Store your content on our servers and third-party AI services</li>
            </ul>
            <p className="mt-3">
              This license ends when you delete your content or account, except for content retained in backups for a reasonable period.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Your Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You represent that you own or have rights to all User Content you upload</li>
              <li>You are responsible for ensuring your content complies with these Terms</li>
              <li>You will not upload content that violates others' rights or applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI-Generated Content</h2>
            <p>
              TheFitChecked uses artificial intelligence to generate avatars, outfit recommendations, and other content:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-generated content is provided "as is" without warranties</li>
              <li>Results may vary and are not guaranteed to be accurate or suitable</li>
              <li>We use third-party AI services (FAL.ai, Fashn, Anthropic) which have their own terms</li>
              <li>You should review AI recommendations before making purchase decisions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Google Calendar Integration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Calendar access is optional and requires your explicit consent</li>
              <li>We only create events you explicitly save through the app</li>
              <li>You can revoke calendar access at any time</li>
              <li>We are not responsible for conflicts or issues with your Google Calendar</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shopping and Affiliate Links</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We provide shopping recommendations and links to third-party retailers</li>
              <li>Some links are affiliate links, meaning we may earn a commission</li>
              <li>We are not responsible for product quality, availability, or retailer policies</li>
              <li>All purchases are transactions between you and the retailer</li>
              <li>Product prices and availability are subject to change</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Rights</h3>
            <p>
              The Service, including its design, features, and technology, is owned by TheFitChecked and protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Your License</h3>
            <p>
              We grant you a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimers</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-semibold uppercase">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>We do not guarantee the Service will be uninterrupted, secure, or error-free</li>
                <li>We do not warrant the accuracy of AI-generated content or recommendations</li>
                <li>We are not responsible for third-party services (Google, retailers, AI providers)</li>
                <li>Use of the Service is at your own risk</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THEFITCHECKED SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, data, or use</li>
                <li>Damages resulting from third-party services or products</li>
                <li>Any damages exceeding the amount you paid us (if any) in the past 12 months</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p>We may terminate or suspend your account and access to the Service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>For violation of these Terms</li>
              <li>For conduct that harms the Service or other users</li>
              <li>At our discretion, with or without notice</li>
            </ul>
            <p className="mt-3">
              You may terminate your account at any time by contacting us or using the account deletion feature.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service.
              Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where TheFitChecked operates,
              without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
            <p>
              For questions about these Terms, please contact us at:
            </p>
            <ul className="list-none space-y-2 mt-3">
              <li><strong>Website:</strong> <a href="https://thefitchecked.com" className="text-blue-600 hover:text-blue-700">thefitchecked.com</a></li>
              <li><strong>GitHub:</strong> <a href="https://github.com/dripped-bit/thefitchecked" className="text-blue-600 hover:text-blue-700">github.com/dripped-bit/thefitchecked</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and TheFitChecked regarding use of the Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
