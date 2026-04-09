import { Loader2, FolderSync, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SetupStatus } from '@/hooks/useDirectoryGuard';

interface SetupGuardCardProps {
  status: SetupStatus;
  spreadsheetId: string | null;
  onTriggerSetup: () => void;
}

/**
 * Displays a blocking card when the user's Drive directory hasn't been
 * provisioned yet.  Renders nothing when status is 'ready'.
 */
const SetupGuardCard = ({ status, spreadsheetId, onTriggerSetup }: SetupGuardCardProps) => {
  if (status === 'ready') return null;

  if (status === 'loading') {
    return (
      <Card className="border-2 max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <CardTitle className="text-2xl">Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (status === 'initializing' || status === 'polling') {
    return (
      <Card className="border-2 max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <CardTitle className="text-2xl">
            {status === 'initializing' ? 'Setting Up Your File Directory...' : 'Finalizing Setup...'}
          </CardTitle>
          <CardDescription className="text-base">
            {status === 'initializing'
              ? 'Creating your Google Drive folders and bookkeeping sheet. This may take a moment.'
              : 'Almost there! Waiting for your Drive folders and spreadsheet to be provisioned.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // needs_setup
  return (
    <Card className="border-2 border-primary/30 max-w-md mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <CardTitle className="text-2xl">File Directory Required</CardTitle>
        <CardDescription className="text-base">
          Before using this feature, we need to set up your Google Drive directory and bookkeeping spreadsheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={onTriggerSetup}
        >
          <FolderSync className="w-5 h-5 mr-2" />
          Install File Directory Now
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          This creates a root folder, month sub-folders, and a master bookkeeping sheet in your Google Drive.
        </p>
      </CardContent>
    </Card>
  );
};

export default SetupGuardCard;
