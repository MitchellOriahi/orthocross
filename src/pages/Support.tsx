import { Mail } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center space-y-4">
        <Mail className="w-12 h-12 mx-auto text-primary" />
        <p className="text-lg text-foreground">
          For any questions, concerns, or support inquiries, please contact{" "}
          <a 
            href="mailto:orthocrossfoundation@gmail.com" 
            className="text-primary hover:underline font-medium"
          >
            orthocrossfoundation@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default Support;
