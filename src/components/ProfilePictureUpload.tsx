import { useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { ImageCropper } from "./ImageCropper";
import { useQueryClient } from "@tanstack/react-query";
import ProfileIdentityTags from "./ProfileIdentityTags";
import { useProfileDonorTier } from "@/hooks/useProfileDonorTier";
import { useDonorDonationCount } from "@/hooks/useDonorSince";
import { DONOR_TIERS } from "@/config/donorTiers";
import { DonorTierName } from "./DonorTierName";
import { useLanguage } from "@/contexts/LanguageContext";
import { donorDurationLabel } from "@/lib/donorDurationLabel";
import { DonorTierGuide } from "./DonorTierGuide";

export default function ProfilePictureUpload() {
  const { user } = useAuth();
  const { profile, refetch } = useProfileData();
  const tierKey = useProfileDonorTier(user?.id);
  const donationCount = useDonorDonationCount(user?.id);
  const { language } = useLanguage();
  const tier = DONOR_TIERS.find(item => item.key === tierKey);
  const tenure = donorDurationLabel(donationCount, language);
  const [tierGuideOpen, setTierGuideOpen] = useState(false);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const value = newUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(value)) {
      toast.error('Use 3–20 letters, numbers or underscores');
      return;
    }
    setSavingUsername(true);
    const { error } = await supabase.from('profiles').update({ username: value }).eq('id', user.id);
    setSavingUsername(false);
    if (error) {
      toast.error(error.code === '23505' ? 'This username is already taken' : 'Could not save username');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success('Username saved');
  };

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

      // Get public URL with cache-busting timestamp
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
      
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: urlWithCacheBust })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Invalidate all profile queries to update everywhere
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
      
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: urlWithCacheBust })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Invalidate all profile queries to update everywhere
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
      <div className="flex items-start gap-4">
        <div className="flex w-20 shrink-0 flex-col items-center gap-3">
        <Avatar className={`w-20 h-20${tier ? ` donor-avatar-ring donor-tier-${tier.key}` : ""}`}>
          <AvatarImage src={profile?.profile_picture_url || undefined} />
          <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
        </Avatar>
        {tier && <Button variant="ghost" onClick={() => setTierGuideOpen(true)} aria-label={`View all donator tiers: ${tier.name}`}
          className={`donor-tier-button donor-tier-${tier.key} h-auto rounded-full border px-3 py-1 text-[11px] font-semibold leading-none`}>
          <DonorTierName tier={tier} />
        </Button>}
        </div>
        <div className="flex min-h-20 min-w-0 flex-1 flex-col justify-center">
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
      {tier && tenure && <p className="text-xs text-muted-foreground" data-no-translate>{tenure}</p>}
      <DonorTierGuide tierKey={tierGuideOpen ? tierKey : null} onClose={() => setTierGuideOpen(false)} />
      {profile && (
        <div className="pt-2 border-t border-border/50">
          {profile.username ? (
            <p className="text-sm text-muted-foreground">
              Username: <span className="font-medium text-foreground">@{profile.username}</span>
            </p>
          ) : (
            <form className="flex gap-2" onSubmit={saveUsername}>
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Choose a username" aria-label="Username" autoComplete="username" />
              <Button type="submit" disabled={savingUsername || !newUsername.trim()}>Save</Button>
            </form>
          )}
          <ProfileIdentityTags />
        </div>
      )}
    </div>
  );
}
