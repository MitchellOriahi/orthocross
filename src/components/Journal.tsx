import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Journal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [journalId, setJournalId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadJournal = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading journal:', error);
        return;
      }

      if (data) {
        setContent(data.content || "");
        setJournalId(data.id);
      }
    };

    loadJournal();
  }, [user]);

  useEffect(() => {
    const saveJournal = async () => {
      if (!user || isSaving) return;

      setIsSaving(true);

      try {
        if (journalId) {
          // Update existing entry
          await supabase
            .from('journal_entries')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', journalId);
        } else {
          // Create new entry
          const { data, error } = await supabase
            .from('journal_entries')
            .insert({ user_id: user.id, content })
            .select()
            .single();

          if (error) throw error;
          if (data) setJournalId(data.id);
        }
      } catch (error) {
        console.error('Error saving journal:', error);
      } finally {
        setIsSaving(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (content !== "") {
        saveJournal();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content, user, journalId, isSaving]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts, prayers, and reflections..."
          className="min-h-[300px] resize-none"
        />
        {isSaving && (
          <p className="text-xs text-muted-foreground mt-2">Saving...</p>
        )}
      </CardContent>
    </Card>
  );
};
