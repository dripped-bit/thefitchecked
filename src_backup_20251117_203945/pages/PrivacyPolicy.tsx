/**
 * Privacy Policy Page
 * Required for Google OAuth verification
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p>
              Welcome to TheFitChecked ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our AI-powered fashion and outfit planning application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address and name (when you create an account)</li>
              <li>Google profile information (when you sign in with Google)</li>
              <li>Authentication credentials managed securely by Supabase</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Photos you upload for avatar generation</li>
              <li>Outfit preferences and style selections</li>
              <li>Calendar events you create for outfit planning</li>
              <li>Shopping preferences and product interactions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Google Calendar Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>We request access to your Google Calendar to sync outfit events</li>
              <li>We only create, read, update, and delete events that you explicitly save through our app</li>
              <li>We do not access or modify other calendar events</li>
              <li>You can revoke calendar access at any time through your Google Account settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Avatar Generation:</strong> Create personalized 3D avatars from your photos using AI</li>
              <li><strong>Outfit Recommendations:</strong> Generate outfit suggestions based on your preferences, weather, and occasions</li>
              <li><strong>Calendar Sync:</strong> Automatically sync your outfit plans to your Google Calendar</li>
              <li><strong>Shopping Integration:</strong> Provide product recommendations and shopping links</li>
              <li><strong>Service Improvement:</strong> Analyze usage patterns to improve our AI models and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
            <p>
              We use industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Authentication and database storage with encryption at rest</li>
              <li><strong>Secure APIs:</strong> All data transmission uses HTTPS encryption</li>
              <li><strong>Avatar Storage:</strong> Images stored securely with access controls</li>
              <li><strong>Third-party Services:</strong> We use reputable AI services (FAL.ai, Anthropic, Fashn) with strict data handling agreements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p>We integrate with the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google OAuth & Calendar API:</strong> For authentication and calendar syncing</li>
              <li><strong>FAL.ai:</strong> AI avatar and clothing generation</li>
              <li><strong>Fashn AI:</strong> Virtual try-on technology</li>
              <li><strong>Anthropic Claude:</strong> AI-powered outfit suggestions</li>
              <li><strong>SerpAPI:</strong> Product search and shopping integration</li>
              <li><strong>Vercel:</strong> Hosting and deployment</li>
            </ul>
            <p className="mt-3">
              Each service has its own privacy policy governing their data handling practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Revoke Permissions:</strong> Disconnect Google Calendar or other integrations</li>
              <li><strong>Export Data:</strong> Download your outfits and calendar events</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p>
              TheFitChecked is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p>
              If you have questions about this privacy policy or our data practices, please contact us at:
            </p>
            <ul className="list-none space-y-2 mt-3">
              <li><strong>Website:</strong> <a href="https://thefitchecked.com" className="text-blue-600 hover:text-blue-700">thefitchecked.com</a></li>
              <li><strong>GitHub:</strong> <a href="https://github.com/dripped-bit/thefitchecked" className="text-blue-600 hover:text-blue-700">github.com/dripped-bit/thefitchecked</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Google API Services User Data Policy</h2>
            <p>
              TheFitChecked's use of information received from Google APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
