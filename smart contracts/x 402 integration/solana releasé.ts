import * as anchor from "@coral-xyz/anchor";

export async function releaseEscrow(params: {
  escrowPubkey: string;
  recipient: string;
}) {
  /**
   * This function sends the release instruction
   * to the Trust Vault escrow program.
   */

  console.log("Releasing escrow:", params.escrowPubkey);

  // Placeholder for Anchor call
  // program.methods.release().accounts({...}).rpc();

  return true;
}
