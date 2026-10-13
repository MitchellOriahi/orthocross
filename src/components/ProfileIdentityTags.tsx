import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Cake, Cross, Globe, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getBranchTradition, ORTHODOX_BRANCHES, PATRON_SAINT_OPTIONS, type IdentityOption } from "@/data/profileIdentity";
import { PROFILE_COUNTRIES } from "@/data/profileCountries";
import { cn } from "@/lib/utils";

type Field = "branch" | "patron_saint_id" | "country_code" | "age";
const AGE_OPTIONS: IdentityOption[] = Array.from({ length: 108 }, (_, i) => ({ value: String(i + 13), label: String(i + 13) }));
const branchClasses = {
  eastern: "profile-branch-eastern",
  oriental: "profile-branch-oriental",
  unaffiliated: "profile-branch-unaffiliated",
};
function IdentityPicker({ label, value, options, icon: Icon, className, disabled, onSelect }: {
  label: string; value: string | null; options: IdentityOption[]; icon: typeof Cross;
  className?: string; disabled: boolean; onSelect: (value: string | null) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  const groups = Array.from(new Set(options.map(option => option.group ?? "")));
  const select = async (next: string | null) => { if (await onSelect(next)) setOpen(false); };
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled} aria-label={`Choose ${label.toLowerCase()}`} aria-haspopup="listbox"
          className={cn("h-auto min-h-9 max-w-full rounded-full border border-border px-3 py-2 text-sm font-medium", className)}>
          <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 whitespace-normal break-words text-left">{selected?.label ?? label}</span>
          <ChevronDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[100] w-80 max-w-[calc(100vw-2rem)] overflow-hidden p-0">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} aria-label={`Search ${label.toLowerCase()}`} />
          <CommandList className="max-h-64 overscroll-contain">
            <CommandEmpty>No matches found.</CommandEmpty>
            <CommandGroup><CommandItem value="Not selected" disabled={disabled} onSelect={() => void select(null)}>
              Not selected {value === null && <Check className="ml-auto h-4 w-4" />}
            </CommandItem></CommandGroup>
            {groups.map(group => <CommandGroup key={group} heading={group || undefined}>
              {options.filter(option => (option.group ?? "") === group).map(option => (
                <CommandItem key={option.value} value={`${option.label} ${option.value}`} disabled={disabled} onSelect={() => void select(option.value)}>
                  <span className="min-w-0 break-words">{option.label}</span>
                  {option.value === value && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>)}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ProfileIdentityTags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const queryKey = ["profileIdentityTags", user?.id];
  const { data, isPending, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profile_identity_tags")
        .select("branch, patron_saint_id, country_code, age").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user, staleTime: 30000,
  });
  const save = async (field: Field, value: string | number | null) => {
    if (!user || saving) return false;
    setSaving(true);
    try {
      const { data: updated, error } = await supabase.from("profile_identity_tags")
        .upsert({ user_id: user.id, [field]: value }, { onConflict: "user_id" })
        .select("branch, patron_saint_id, country_code, age").single();
      if (error) throw error;
      queryClient.setQueryData(queryKey, updated);
      return true;
    } catch {
      toast.error("Could not save your tag. Please try again.");
      return false;
    } finally { setSaving(false); }
  };
  if (!user) return null;
  if (isError) return <Button variant="ghost" size="sm" onClick={() => void refetch()}>Retry profile tags</Button>;
  return (
    <div className="flex flex-col gap-2 pt-3" aria-label="Profile tags" aria-busy={saving}>
      <div className="flex flex-wrap items-start gap-2">
        <IdentityPicker label="Orthodox branch" value={data?.branch ?? null} options={ORTHODOX_BRANCHES} icon={Cross}
          className={data?.branch ? branchClasses[getBranchTradition(data.branch)] : undefined}
          disabled={saving || isPending} onSelect={value => save("branch", value)} />
        <IdentityPicker label="Age" value={data?.age != null ? String(data.age) : null} options={AGE_OPTIONS} icon={Cake}
          disabled={saving || isPending} onSelect={value => save("age", value === null ? null : Number(value))} />
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <IdentityPicker label="Patron saint" value={data?.patron_saint_id ?? null} options={PATRON_SAINT_OPTIONS} icon={UserRound}
          disabled={saving || isPending} onSelect={value => save("patron_saint_id", value)} />
        <IdentityPicker label="Country" value={data?.country_code ?? null} options={PROFILE_COUNTRIES} icon={Globe}
          disabled={saving || isPending} onSelect={value => save("country_code", value)} />
      </div>
    </div>
  );
}