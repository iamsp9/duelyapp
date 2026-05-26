import { createClient } from "./client";
import type { EncryptedVault } from "@/types/vault";

export async function saveVault(vault: EncryptedVault) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("vaults")
    .upsert({
      user_id: user.id,
      ciphertext: vault.ciphertext,
      iv: vault.iv,
      metadata: vault.metadata,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    throw error;
  }
}

export async function loadVault() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("vaults")
    .select("ciphertext, iv, metadata")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// Schedules account for deletion by adding a timestamp 7 days into the future
export async function scheduleAccountDeletion() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: vault } = await supabase
    .from("vaults")
    .select("metadata")
    .eq("user_id", user.id)
    .single();
  
  if (vault) {
    const deleteAt = new Date();
    deleteAt.setDate(deleteAt.getDate() + 7);
    const newMetadata = { ...vault.metadata, delete_scheduled_at: deleteAt.toISOString() };
    
    const { error } = await supabase
      .from("vaults")
      .update({ metadata: newMetadata })
      .eq("user_id", user.id);
      
    if (error) throw error;
  }
}

// Reactivates the account if the user logs back in during the 7-day window
export async function cancelAccountDeletion() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: vault } = await supabase
    .from("vaults")
    .select("metadata")
    .eq("user_id", user.id)
    .single();
  
  if (vault && vault.metadata?.delete_scheduled_at) {
    const newMetadata = { ...vault.metadata };
    delete newMetadata.delete_scheduled_at;
    
    const { error } = await supabase
      .from("vaults")
      .update({ metadata: newMetadata })
      .eq("user_id", user.id);
      
    if (error) throw error;
  }
}

export async function wipeUserVault() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("vaults")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}