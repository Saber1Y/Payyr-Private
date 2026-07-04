# Vercel + Cloudflare Demo Script

Use this when you want to explain the current hackathon deployment clearly and confidently.

## Short version

> The frontend is deployed on Vercel.  
> For the hackathon MVP, the Canton/Daml backend is running from our local environment and exposed securely through Cloudflare Tunnel.  
> We chose this setup because we could not justify the extra VPS cost during the hackathon window, but we still wanted to demonstrate the real product flow end to end.  
> The privacy model, Daml contracts, and ledger-backed access boundaries are real.  
> The next step after the hackathon would be moving the backend to an always-on VPS or dedicated server.

## Slightly longer version

> Payyr Private uses a split deployment setup for the hackathon.  
> The Next.js frontend is deployed on Vercel, while the Daml backend runs as a real Canton/Daml stack.  
> To keep the MVP affordable and still demonstrate the complete product honestly, we exposed the backend through Cloudflare Tunnel instead of paying for a separate always-on VPS during the hackathon.  
> That means the demo uses the real ledger, real contract visibility rules, and real role-based access — employer, employee, and auditor all see different data because of the Daml model, not because of a fake frontend mock.  
> For a post-hackathon production-style deployment, the backend would move to a dedicated server and the authentication layer would be tightened further with per-user Daml tokens.

## If a judge asks why this still counts

> The important thing is that the backend is still real Canton/Daml infrastructure and the privacy boundaries are enforced by the ledger.  
> The deployment bridge is temporary, but the application behavior, privacy model, and contract logic are not simulated.

## If a judge asks what the next deployment step is

> The next step is moving the Daml backend from the local demo environment to an always-on VPS, then replacing the shared backend token approach with party-scoped Daml authentication for each logged-in user.
