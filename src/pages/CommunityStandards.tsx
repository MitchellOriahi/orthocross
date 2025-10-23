import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function CommunityStandards() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Community Standards</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Our Commitment to Safety</CardTitle>
              <CardDescription>
                OrthoCross is dedicated to maintaining a respectful, safe, and spiritually enriching community for all users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What We Expect</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Respectful communication that honors Christian values</li>
                  <li>Support and encouragement for fellow believers</li>
                  <li>Appropriate language and content at all times</li>
                  <li>Respect for different Orthodox traditions and practices</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What's Not Allowed</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Harassment, bullying, or threatening behavior</li>
                  <li>Hate speech or discriminatory content</li>
                  <li>Spam or unsolicited promotional content</li>
                  <li>Inappropriate or explicit material</li>
                  <li>Impersonation or misleading information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Reporting and Blocking</h3>
                <p className="text-sm mb-2">
                  We provide tools to help you maintain a safe experience:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li><strong>Report a message:</strong> Long-press any message to report inappropriate content</li>
                  <li><strong>Block a user:</strong> Prevent unwanted messages by blocking users from their profile or message thread</li>
                  <li><strong>Remove conversation:</strong> Hide conversations from your inbox at any time</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What Happens Next</h3>
                <p className="text-sm mb-2">
                  When you report content:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Our team reviews all reports promptly</li>
                  <li>Appropriate action is taken based on our standards</li>
                  <li>Your report is kept confidential</li>
                  <li>Serious violations may result in account suspension</li>
                </ul>
              </div>

              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="text-sm">
                  <strong>Remember:</strong> You can block or report messages anytime. Your safety and spiritual well-being are our top priorities.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Your messages are private and secured. We only access reported content for moderation purposes.
              </p>
              <p>
                For more information about how we handle your data, please review our <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/privacy')}>Privacy Policy</Button>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                If you have questions about our community standards or need to report a serious issue, please contact us:
              </p>
              <Button onClick={() => navigate('/support')}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
