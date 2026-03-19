# AirdropHub — Crypto Airdrop Tracker Template

A professional, full-stack Web3 airdrop tracker built with React, Node.js, and PostgreSQL.
Buyers can customise and launch this template in minutes.

---

## Quick Start

1. **Install dependencies** — already done if you opened this in Replit.
2. **Start the app** — click the **Run** button or type `npm run dev` in the Shell.
3. **Open the preview** — the app runs on port 5000.

---

## How to Personalise

### 1. Change the WhatsApp Number

Open `client/src/config.ts` and update the `WHATSAPP_PHONE` value:

```ts
export const WHATSAPP_PHONE = "2348012345678"; // your number, no + sign
```

That single change updates:
- The floating WhatsApp button
- The **Premium** link in the navigation menu

### 2. Change the Site Name & Tagline

In the same `client/src/config.ts` file:

```ts
export const SITE_NAME = "MyAirdropApp";
export const SITE_TAGLINE = "Your custom tagline here.";
```

### 3. Change the Premium Link

By default, Premium sends users to WhatsApp. To link to a payment page instead:

```ts
export const PREMIUM_LINK = "https://paystack.com/pay/your-link";
```

### 4. Add Real Airdrop Listings

Log in to the **Admin Panel** using the admin wallet address and add airdrops via the UI.

The admin wallet is set in `server/routes.ts` inside the `seedDatabase` function:

```ts
const adminWallet = "0xYourAdminWalletAddress";
```

Change this to your own MetaMask wallet address before going live.

---

## Wallet Connection

Users connect via **MetaMask** or any EVM-compatible browser wallet.

- The wallet address is stored in `localStorage` under the key `userWallet`.
- It is sent as the `x-wallet-address` header on every authenticated API request.
- To log out, the user clicks the **Disconnect** button in the nav bar.

If you want to change the RPC method or add WalletConnect support, edit:

```
client/src/components/layout.tsx  →  handleConnectWallet()
```

---

## Theme & Colours

Global colours live in `client/src/index.css` as CSS custom properties.
The primary colour (blue) is `--primary: 217 91% 60%`.
To switch to a different colour, update the HSL values in `:root` and `.dark`.

---

## Tech Stack

| Layer     | Technology                     |
|-----------|--------------------------------|
| Frontend  | React + Vite + Tailwind CSS    |
| UI        | shadcn/ui + Lucide Icons       |
| Backend   | Node.js + Express              |
| Database  | PostgreSQL (via Drizzle ORM)   |
| Auth      | Simulated wallet auth (MVP)    |
| Prices    | CoinGecko public API           |

---

## Support

For setup help, message us on WhatsApp using the button inside the app.
