import { cropWhiteBorders } from '../utils/cropWhiteBorders';

// Import all saint icons
import anthonyIcon from '@/assets/saints/anthony-icon.jpg';
import athanasiusIcon from '@/assets/saints/athanasius-icon.jpg';
import basilIcon from '@/assets/saints/basil-icon.jpg';
import catherineIcon from '@/assets/saints/catherine-icon.jpg';
import georgeIcon from '@/assets/saints/george-icon.jpg';
import johnChrysostomIcon from '@/assets/saints/john-chrysostom-icon.jpg';
import markIcon from '@/assets/saints/mark-icon.jpg';
import maryEgyptIcon from '@/assets/saints/mary-egypt-icon.jpg';
import mosesBlackIcon from '@/assets/saints/moses-black-icon.jpg';
import nicholasIcon from '@/assets/saints/nicholas-icon.jpg';
import theotokosIcon from '@/assets/saints/theotokos-icon.jpg';

const saintIcons = [
  { name: 'anthony', path: anthonyIcon },
  { name: 'athanasius', path: athanasiusIcon },
  { name: 'basil', path: basilIcon },
  { name: 'catherine', path: catherineIcon },
  { name: 'george', path: georgeIcon },
  { name: 'john-chrysostom', path: johnChrysostomIcon },
  { name: 'mark', path: markIcon },
  { name: 'mary-egypt', path: maryEgyptIcon },
  { name: 'moses-black', path: mosesBlackIcon },
  { name: 'nicholas', path: nicholasIcon },
  { name: 'theotokos', path: theotokosIcon },
];

export const cropAllSaintIcons = async () => {
  console.log('Starting to crop saint icons...');
  
  for (const icon of saintIcons) {
    try {
      console.log(`Processing ${icon.name}...`);
      const croppedBlob = await cropWhiteBorders(icon.path);
      
      // Download the cropped image
      const url = URL.createObjectURL(croppedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${icon.name}-icon-cropped.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`Successfully cropped ${icon.name}`);
    } catch (error) {
      console.error(`Failed to crop ${icon.name}:`, error);
    }
  }
  
  console.log('Finished cropping all icons');
};
