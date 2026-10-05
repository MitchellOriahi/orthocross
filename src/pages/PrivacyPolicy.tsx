import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 mb-12">
          <Shield className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information you provide directly to us when you create an account, including your email address, 
            name, and any other information you choose to provide. We also automatically collect certain information 
            about your device when you use our services, including IP address, browser type, and usage data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use the information we collect to provide, maintain, and improve our services, to communicate with you, 
            to monitor and analyze trends and usage, and to personalize your experience. We may also use your information 
            to send you technical notices, updates, and support messages.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">3. Information Sharing</h2>
          <p className="text-muted-foreground">
            We do not share your personal information with third parties except as described in this policy. We may 
            share information with service providers who perform services on our behalf, when required by law, or to 
            protect our rights and the rights of others.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
          <p className="text-muted-foreground">
            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized 
            access, disclosure, alteration, and destruction. However, no internet or email transmission is ever fully 
            secure or error-free.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">5. Your Rights</h2>
          <p className="text-muted-foreground">
            You have the right to access, update, or delete your personal information at any time. You may also have 
            the right to object to or restrict certain types of processing of your information. To exercise these rights, 
            please contact us using the information provided below.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">6. Children's Privacy</h2>
          <p className="text-muted-foreground">
            Our services are not directed to children under the age of 13, and we do not knowingly collect personal 
            information from children under 13. If we learn that we have collected personal information from a child 
            under 13, we will take steps to delete such information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">7. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new 
            privacy policy on this page and updating the "Last updated" date at the top of this policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">8. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this privacy policy, please contact us at{" "}
            <a 
              href="mailto:orthocrossfoundation@gmail.com" 
              className="text-primary hover:underline font-medium"
            >
              orthocrossfoundation@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
