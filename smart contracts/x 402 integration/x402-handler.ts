/**
 * x402 Payment Handler
 * Trust Vault
 *
 * This file verifies x402 HTTP payments and triggers
 * on-chain escrow release on Solana.
 */

import { Request, Response } from "express";
import { verifyX402Payment } from "./x402-utils";
import { releaseEscrow } from "./solana-release";

export async function x402Handler(req: Request, res: Response) {
  try {
    /**
     * 1. Extract x402 headers
     */
    const paymentHeader = req.headers["x-payment"];
    const signatureHeader = req.headers["x-payment-signature"];

    if (!paymentHeader || !signatureHeader) {
      return res.status(402).json({
        error: "x402 payment required",
      });
    }

    /**
     * 2. Verify payment using x402 logic
     */
    const payment = await verifyX402Payment({
      payment: paymentHeader as string,
      signature: signatureHeader as string,
    });

    if (!payment.valid) {
      return res.status(403).json({
        error: "Invalid x402 payment",
      });
    }

    /**
     * 3. Validate payment conditions
     */
    if (payment.amount < payment.expectedAmount) {
      return res.status(403).json({
        error: "Insufficient payment",
      });
    }

    /**
     * 4. Trigger on-chain escrow release
     */
    await releaseEscrow({
      escrowPubkey: payment.metadata.escrowId,
      recipient: payment.recipient,
    });

    /**
     * 5. Return success
     */
    return res.status(200).json({
      success: true,
      message: "Payment verified. Escrow released.",
    });
  } catch (error) {
    console.error("x402 error:", error);
    return res.status(500).json({
      error: "Internal x402 processing error",
    });
  }
}
