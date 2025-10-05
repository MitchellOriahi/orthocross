import { getMascot, type MascotPose } from "@/data/mascotsConfig";

// Import all mascot images
import savaIdle from "@/assets/mascots/mascot_sava_idle.png";
import savaPointRight from "@/assets/mascots/mascot_sava_point_right.png";
import savaThink from "@/assets/mascots/mascot_sava_think.png";
import savaClap from "@/assets/mascots/mascot_sava_clap.png";
import savaSad from "@/assets/mascots/mascot_sava_sad.png";
import savaCelebrate from "@/assets/mascots/mascot_sava_celebrate.png";
import savaRead from "@/assets/mascots/mascot_sava_read.png";
import savaEquipArmor from "@/assets/mascots/mascot_sava_equip_armor.png";
import savaSleep from "@/assets/mascots/mascot_sava_sleep.png";

import kyraIdle from "@/assets/mascots/mascot_kyra_idle.png";
import kyraPointRight from "@/assets/mascots/mascot_kyra_point_right.png";
import kyraThink from "@/assets/mascots/mascot_kyra_think.png";
import kyraClap from "@/assets/mascots/mascot_kyra_clap.png";
import kyraSad from "@/assets/mascots/mascot_kyra_sad.png";
import kyraCelebrate from "@/assets/mascots/mascot_kyra_celebrate.png";
import kyraRead from "@/assets/mascots/mascot_kyra_read.png";
import kyraEquipArmor from "@/assets/mascots/mascot_kyra_equip_armor.png";
import kyraSleep from "@/assets/mascots/mascot_kyra_sleep.png";

import minaIdle from "@/assets/mascots/mascot_mina_idle.png";
import minaPointRight from "@/assets/mascots/mascot_mina_point_right.png";
import minaThink from "@/assets/mascots/mascot_mina_think.png";
import minaClap from "@/assets/mascots/mascot_mina_clap.png";
import minaSad from "@/assets/mascots/mascot_mina_sad.png";
import minaCelebrate from "@/assets/mascots/mascot_mina_celebrate.png";
import minaRead from "@/assets/mascots/mascot_mina_read.png";
import minaEquipArmor from "@/assets/mascots/mascot_mina_equip_armor.png";
import minaSleep from "@/assets/mascots/mascot_mina_sleep.png";

import selamIdle from "@/assets/mascots/mascot_selam_idle.png";
import selamPointRight from "@/assets/mascots/mascot_selam_point_right.png";
import selamThink from "@/assets/mascots/mascot_selam_think.png";
import selamClap from "@/assets/mascots/mascot_selam_clap.png";
import selamSad from "@/assets/mascots/mascot_selam_sad.png";
import selamCelebrate from "@/assets/mascots/mascot_selam_celebrate.png";
import selamRead from "@/assets/mascots/mascot_selam_read.png";
import selamEquipArmor from "@/assets/mascots/mascot_selam_equip_armor.png";
import selamSleep from "@/assets/mascots/mascot_selam_sleep.png";

const mascotImages: Record<string, Record<MascotPose, string>> = {
  sava: {
    idle: savaIdle,
    point_right: savaPointRight,
    think: savaThink,
    clap: savaClap,
    sad: savaSad,
    celebrate: savaCelebrate,
    read: savaRead,
    equip_armor: savaEquipArmor,
    sleep: savaSleep,
  },
  kyra: {
    idle: kyraIdle,
    point_right: kyraPointRight,
    think: kyraThink,
    clap: kyraClap,
    sad: kyraSad,
    celebrate: kyraCelebrate,
    read: kyraRead,
    equip_armor: kyraEquipArmor,
    sleep: kyraSleep,
  },
  mina: {
    idle: minaIdle,
    point_right: minaPointRight,
    think: minaThink,
    clap: minaClap,
    sad: minaSad,
    celebrate: minaCelebrate,
    read: minaRead,
    equip_armor: minaEquipArmor,
    sleep: minaSleep,
  },
  selam: {
    idle: selamIdle,
    point_right: selamPointRight,
    think: selamThink,
    clap: selamClap,
    sad: selamSad,
    celebrate: selamCelebrate,
    read: selamRead,
    equip_armor: selamEquipArmor,
    sleep: selamSleep,
  },
};

interface MascotProps {
  mascotId: string;
  pose?: MascotPose;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  message?: string;
}

export const Mascot = ({ 
  mascotId, 
  pose = "idle", 
  size = "md",
  className = "",
  message
}: MascotProps) => {
  const mascot = getMascot(mascotId);
  
  if (!mascot) {
    console.warn(`Mascot with id "${mascotId}" not found`);
    return null;
  }

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  };

  const imageUrl = mascotImages[mascotId]?.[pose];

  if (!imageUrl) {
    console.warn(`Image for mascot "${mascotId}" with pose "${pose}" not found`);
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <img 
          src={imageUrl} 
          alt={`${mascot.display_name} - ${pose}`}
          className="w-full h-full object-contain"
        />
      </div>
      {message && (
        <div className="relative max-w-xs">
          <div className="bg-card border-2 border-primary rounded-2xl px-4 py-3 shadow-lg">
            <p className="text-sm font-medium text-foreground text-center">{message}</p>
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-primary" />
        </div>
      )}
    </div>
  );
};
