import { useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePictureUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('profile_picture_url, username')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfilePicture(data.profile_picture_url);
      setUsername(data.username || "");
    }
  };

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfilePicture(publicUrl);
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const getUserInitials = () => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profilePicture || undefined} />
          <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <input
            type="file"
            id="profile-picture-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="profile-picture-upload">
            <Button
              variant="outline"
              disabled={uploading}
              asChild
            >
              <span className="cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    {profilePicture ? 'Change Picture' : 'Upload Picture'}
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Max 2MB. JPG, PNG, or GIF
          </p>
        </div>
      </div>
      {username && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Username: <span className="font-medium text-foreground">@{username}</span>
          </p>
        </div>
      )}
    </div>
  );
}
