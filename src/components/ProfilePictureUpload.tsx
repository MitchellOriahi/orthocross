import { useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { ImageCropper } from "./ImageCropper";

export default function ProfilePictureUpload() {
  const { user } = useAuth();
  const { profile, refetch } = useProfileData();
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Read file and show cropper
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
        setSelectedFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileName = `${user.id}-${Date.now()}.png`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, croppedBlob, {
          upsert: true,
          contentType: 'image/png',
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

      await refetch();
      setSelectedImage(null);
      setSelectedFile(null);
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const handleUseOriginal = async () => {
    if (!user || !selectedFile) return;

    setUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, selectedFile, {
          upsert: true,
          contentType: selectedFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refetch();
      setSelectedImage(null);
      setSelectedFile(null);
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const getUserInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  if (selectedImage) {
    return (
      <ImageCropper
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        onUseOriginal={handleUseOriginal}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profile?.profile_picture_url || undefined} />
          <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <input
            type="file"
            id="profile-picture-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
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
                    {profile?.profile_picture_url ? 'Change Picture' : 'Upload Picture'}
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Max 5MB. JPG, PNG, or GIF
          </p>
        </div>
      </div>
      {profile?.username && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Username: <span className="font-medium text-foreground">@{profile.username}</span>
          </p>
        </div>
      )}
    </div>
  );
}
