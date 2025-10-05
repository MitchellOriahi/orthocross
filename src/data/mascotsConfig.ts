export type MascotPose = 
  | "idle"
  | "point_right"
  | "think"
  | "clap"
  | "sad"
  | "celebrate"
  | "read"
  | "equip_armor"
  | "sleep";

export interface Mascot {
  id: string;
  display_name: string;
  campaign: string;
  gender: "male" | "female";
  default_pose: MascotPose;
  assets: Record<MascotPose, string>;
}

export interface MascotEvent {
  mascot: string | "any";
  pose: MascotPose;
  say: string;
}

export interface CampaignMascotConfig {
  rotation: string[];
  events: Record<string, MascotEvent>;
}

export const mascots: Mascot[] = [
  {
    id: "sava",
    display_name: "Brother Sava",
    campaign: "eastern_orthodox_history",
    gender: "male",
    default_pose: "idle",
    assets: {
      idle: "mascot_sava_idle.png",
      point_right: "mascot_sava_point_right.png",
      think: "mascot_sava_think.png",
      clap: "mascot_sava_clap.png",
      sad: "mascot_sava_sad.png",
      celebrate: "mascot_sava_celebrate.png",
      read: "mascot_sava_read.png",
      equip_armor: "mascot_sava_equip_armor.png",
      sleep: "mascot_sava_sleep.png",
    },
  },
  {
    id: "kyra",
    display_name: "Sister Kyra",
    campaign: "eastern_orthodox_history",
    gender: "female",
    default_pose: "idle",
    assets: {
      idle: "mascot_kyra_idle.png",
      point_right: "mascot_kyra_point_right.png",
      think: "mascot_kyra_think.png",
      clap: "mascot_kyra_clap.png",
      sad: "mascot_kyra_sad.png",
      celebrate: "mascot_kyra_celebrate.png",
      read: "mascot_kyra_read.png",
      equip_armor: "mascot_kyra_equip_armor.png",
      sleep: "mascot_kyra_sleep.png",
    },
  },
  {
    id: "mina",
    display_name: "Abba Mina",
    campaign: "oriental_orthodox_history",
    gender: "male",
    default_pose: "idle",
    assets: {
      idle: "mascot_mina_idle.png",
      point_right: "mascot_mina_point_right.png",
      think: "mascot_mina_think.png",
      clap: "mascot_mina_clap.png",
      sad: "mascot_mina_sad.png",
      celebrate: "mascot_mina_celebrate.png",
      read: "mascot_mina_read.png",
      equip_armor: "mascot_mina_equip_armor.png",
      sleep: "mascot_mina_sleep.png",
    },
  },
  {
    id: "selam",
    display_name: "Amma Selam",
    campaign: "oriental_orthodox_history",
    gender: "female",
    default_pose: "idle",
    assets: {
      idle: "mascot_selam_idle.png",
      point_right: "mascot_selam_point_right.png",
      think: "mascot_selam_think.png",
      clap: "mascot_selam_clap.png",
      sad: "mascot_selam_sad.png",
      celebrate: "mascot_selam_celebrate.png",
      read: "mascot_selam_read.png",
      equip_armor: "mascot_selam_equip_armor.png",
      sleep: "mascot_selam_sleep.png",
    },
  },
];

export const mascotLogic: Record<string, CampaignMascotConfig> = {
  eastern_orthodox_history: {
    rotation: ["sava", "kyra"],
    events: {
      segment_start: {
        mascot: "kyra",
        pose: "point_right",
        say: "Let's continue the journey.",
      },
      quiz_start: {
        mascot: "sava",
        pose: "think",
        say: "Ready for a quick quiz?",
      },
      answer_correct: {
        mascot: "any",
        pose: "clap",
        say: "Well done!",
      },
      answer_incorrect: {
        mascot: "any",
        pose: "sad",
        say: "Close—try again.",
      },
      island_unlocked: {
        mascot: "kyra",
        pose: "celebrate",
        say: "Island unlocked!",
      },
      armor_piece_awarded: {
        mascot: "sava",
        pose: "equip_armor",
        say: "A new piece of Eastern armor!",
      },
    },
  },
  oriental_orthodox_history: {
    rotation: ["mina", "selam"],
    events: {
      segment_start: {
        mascot: "selam",
        pose: "point_right",
        say: "Forward to the next step.",
      },
      quiz_start: {
        mascot: "mina",
        pose: "think",
        say: "Answer with care.",
      },
      answer_correct: {
        mascot: "any",
        pose: "clap",
        say: "Great job!",
      },
      answer_incorrect: {
        mascot: "any",
        pose: "sad",
        say: "Try once more.",
      },
      island_unlocked: {
        mascot: "selam",
        pose: "celebrate",
        say: "Island unlocked!",
      },
      armor_piece_awarded: {
        mascot: "mina",
        pose: "equip_armor",
        say: "A new piece of Oriental armor!",
      },
    },
  },
};

export const getMascot = (id: string): Mascot | undefined => {
  return mascots.find((m) => m.id === id);
};

export const getMascotForCampaign = (campaignId: string): Mascot | undefined => {
  return mascots.find((m) => m.campaign === campaignId);
};

export const getRandomMascotFromCampaign = (campaignId: string): Mascot | undefined => {
  const config = mascotLogic[campaignId];
  if (!config) return undefined;
  
  const randomId = config.rotation[Math.floor(Math.random() * config.rotation.length)];
  return getMascot(randomId);
};
