import { createClient } from "./client";

import type {
  EncryptedVault,
} from "@/types/vault";

export async function saveVault(
  vault: EncryptedVault
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Not authenticated"
    );
  }

  const { error } =
    await supabase
      .from("vaults")
      .upsert({
        user_id: user.id,

        ciphertext:
          vault.ciphertext,

        iv: vault.iv,

        metadata:
          vault.metadata,
      });

  if (error) {
    throw error;
  }
}

export async function loadVault() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Not authenticated"
    );
  }

  const { data, error } =
    await supabase
      .from("vaults")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}