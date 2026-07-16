# emails/

Transactional email templates for STRESSNES.

Built with [Resend](https://resend.com) + [React Email](https://react.email).
Templates are React components that render to HTML.

## Setup

```bash
# Send an email via Resend
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ from, to, subject, react: <Template /> });
```

## Planned Templates

| File | Trigger |
|---|---|
| `emails/order-confirmation.tsx` | Order placed |
| `emails/order-shipped.tsx` | Order shipped (with tracking) |
| `emails/order-delivered.tsx` | Order delivered |
| `emails/order-cancelled.tsx` | Order cancelled |
| `emails/welcome.tsx` | New user registration |
| `emails/password-reset.tsx` | Password reset request |
| `emails/magic-link.tsx` | Magic link login |
| `emails/abandoned-cart.tsx` | Cart abandoned (scheduled) |

## Design Guidelines

- Use STRESSNES brand colors: `#121212` primary, `#C8A96E` gold accent
- Font: system serif for headings, system sans for body
- Keep emails under 600px wide
- Test with https://react.email/preview
