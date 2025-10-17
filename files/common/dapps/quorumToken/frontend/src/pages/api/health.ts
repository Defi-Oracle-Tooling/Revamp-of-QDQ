import type { NextApiRequest, NextApiResponse } from 'next';

// Simple health endpoint returning build and environment info
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletconnect = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || null;
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    walletconnectProjectId: walletconnect,
  });
}
