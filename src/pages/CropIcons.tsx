import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cropAllSaintIcons } from '@/scripts/cropSaintIcons';

export default function CropIcons() {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleCrop = async () => {
    setProcessing(true);
    setStatus('Processing icons...');
    try {
      await cropAllSaintIcons();
      setStatus('All icons have been cropped and downloaded. Please upload them back to replace the originals.');
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Crop Saint Icons</h1>
        <p className="text-muted-foreground mb-6">
          This utility will crop the white borders from all saint icons, leaving only the red frames.
          The cropped images will be downloaded to your computer.
        </p>
        
        <Button 
          onClick={handleCrop} 
          disabled={processing}
          size="lg"
        >
          {processing ? 'Processing...' : 'Crop All Icons'}
        </Button>
        
        {status && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm">{status}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
