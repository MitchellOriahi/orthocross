import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Globe, Lock, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { searchPublicGroups, Group } from "@/hooks/useGroupsData";

interface GroupSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userGroupIds: string[];
  onRequestSent: () => void;
}

export const GroupSearchDialog = ({ open, onOpenChange, userId, userGroupIds, onRequestSent }: GroupSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestingGroupId, setRequestingGroupId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPublicGroups(searchQuery.trim());
      // Filter out groups the user is already in
      setSearchResults(results.filter(g => !userGroupIds.includes(g.id)));
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search groups",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestToJoin = async (groupId: string) => {
    setRequestingGroupId(groupId);
    try {
      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('group_join_requests')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRequest) {
        toast({
          title: "Request already sent",
          description: "You have already requested to join this group"
        });
        return;
      }

      const { error } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: groupId,
          user_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: "Your request to join has been sent to the group admins"
      });
      
      // Remove from search results
      setSearchResults(prev => prev.filter(g => g.id !== groupId));
      onRequestSent();
    } catch (error) {
      console.error("Error requesting to join:", error);
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive"
      });
    } finally {
      setRequestingGroupId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Groups
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex gap-2">
            <Input
              placeholder="Search by group name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "..." : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {searchResults.length === 0 && searchQuery && !isSearching ? (
              <div className="text-center text-muted-foreground py-8">
                No public groups found matching "{searchQuery}"
              </div>
            ) : (
              searchResults.map((group) => (
                <div 
                  key={group.id}
                  className="p-3 rounded-lg bg-muted/50 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          <span>{group.member_count} members</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestToJoin(group.id)}
                      disabled={requestingGroupId === group.id}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      {requestingGroupId === group.id ? "..." : "Join"}
                    </Button>
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
