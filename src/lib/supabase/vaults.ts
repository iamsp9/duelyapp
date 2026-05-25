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

  return data; // Returns matches for EncryptedVault { ciphertext, iv, metadata } or null
}