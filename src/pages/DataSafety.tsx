import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Shield, Mail } from 'lucide-react';

const DataSafety = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Data Safety</h1>
          <p className="text-muted-foreground text-lg">
            Your privacy and data security are important to us
          </p>
        </div>

        <Card className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-destructive" />
              Request Account Deletion
            </h2>
            <p className="text-muted-foreground">
              If you would like to delete your account and all associated data, please contact us. We will process your request and permanently remove all your personal information from our systems within 30 days.
            </p>
            <p className="text-muted-foreground">
              This includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Profile information</li>
              <li>Reading progress and history</li>
              <li>Bookmarks and highlights</li>
              <li>Journal entries</li>
              <li>Streak data</li>
              <li>All other personal data</li>
            </ul>
            <div className="pt-4">
              <Button 
                asChild
                className="gap-2"
              >
                <a href="mailto:orthocrossfoundation@gmail.com?subject=Data%20Deletion%20Request">
                  <Mail className="h-4 w-4" />
                  Request Data Deletion
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Please include your account email address in your deletion request.
            </p>
          </div>
        </Card>

        <Card className="p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Data We Collect</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>We collect and store the following information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account credentials (email and encrypted password)</li>
              <li>Reading progress and completed chapters</li>
              <li>Personal journal entries and notes</li>
              <li>Bookmarks and highlighted verses</li>
              <li>Activity streaks and achievements</li>
              <li>Prayer and fasting reminders</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">How We Protect Your Data</h2>
          <div className="space-y-3 text-muted-foreground">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All data is encrypted in transit and at rest</li>
              <li>We use industry-standard security practices</li>
              <li>Your journal entries are private and only visible to you</li>
              <li>We never share your personal data with third parties</li>
              <li>Regular security audits and updates</li>
            </ul>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            For additional questions about data safety, please review our{' '}
            <a href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            {' '}or{' '}
            <a href="/support" className="text-primary hover:underline">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataSafety;
