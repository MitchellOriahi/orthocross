import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AvatarCustomizerProps {
  onClose: () => void;
  equippedArmor: string[];
}

const avatarOptions = {
  gender: ["male", "female"],
  skinTones: ["very_light", "light", "medium_light", "medium", "medium_dark", "dark", "very_dark"],
  hairstyles: ["short_cropped", "short_wavy", "buzz", "shoulder_length", "long_straight", "long_curly", "bun", "braids", "afro"],
  eyeColors: ["brown", "hazel", "green", "blue", "gray", "amber"],
  beardOptions: ["none", "stubble", "short", "full"],
  outfitPalettes: ["earth", "byzantine_gold_blue", "coptic_red_gold", "armenian_claret", "ethiopian_green_yellow"]
};

export const AvatarCustomizer = ({ onClose, equippedArmor }: AvatarCustomizerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatar, setAvatar] = useState({
    gender: "male",
    skinTone: "medium",
    hairstyle: "short_cropped",
    eyeColor: "brown",
    beardOption: "none",
    outfitPalette: "earth"
  });

  useEffect(() => {
    loadAvatar();
  }, [user]);

  const loadAvatar = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setAvatar({
        gender: data.gender,
        skinTone: data.skin_tone,
        hairstyle: data.hairstyle,
        eyeColor: data.eye_color,
        beardOption: data.beard_option,
        outfitPalette: data.outfit_palette
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('user_avatars')
      .update({
        gender: avatar.gender,
        skin_tone: avatar.skinTone,
        hairstyle: avatar.hairstyle,
        eye_color: avatar.eyeColor,
        beard_option: avatar.beardOption,
        outfit_palette: avatar.outfitPalette
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save avatar",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Saved",
        description: "Your avatar has been updated!"
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 safe-top">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Customize Your Avatar</h1>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">Avatar Preview</h2>
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-sm text-muted-foreground">
                  {avatar.gender === 'male' ? '♂' : '♀'} {avatar.skinTone.replace(/_/g, ' ')}
                </p>
                {equippedArmor.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium mb-2">Equipped Armor:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {equippedArmor.map((piece, i) => (
                        <span key={i} className="text-xs bg-primary/20 px-2 py-1 rounded">
                          🛡️
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>Gender</Label>
                  <Select value={avatar.gender} onValueChange={(val) => setAvatar({...avatar, gender: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarOptions.gender.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Skin Tone</Label>
                  <Select value={avatar.skinTone} onValueChange={(val) => setAvatar({...avatar, skinTone: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarOptions.skinTones.map(option => (
                        <SelectItem key={option} value={option}>{option.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Hairstyle</Label>
                  <Select value={avatar.hairstyle} onValueChange={(val) => setAvatar({...avatar, hairstyle: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarOptions.hairstyles.map(option => (
                        <SelectItem key={option} value={option}>{option.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Eye Color</Label>
                  <Select value={avatar.eyeColor} onValueChange={(val) => setAvatar({...avatar, eyeColor: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarOptions.eyeColors.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {avatar.gender === 'male' && (
                  <div>
                    <Label>Beard</Label>
                    <Select value={avatar.beardOption} onValueChange={(val) => setAvatar({...avatar, beardOption: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {avatarOptions.beardOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Outfit Palette</Label>
                  <Select value={avatar.outfitPalette} onValueChange={(val) => setAvatar({...avatar, outfitPalette: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarOptions.outfitPalettes.map(option => (
                        <SelectItem key={option} value={option}>{option.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Button onClick={handleSave} size="lg" className="w-full">
              Save Avatar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
