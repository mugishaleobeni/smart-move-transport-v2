

# Smart Move Transport — Full Build Plan

## 1. Design System & Theme
- Glassmorphism design: blur/transparency effects, glass overlays on cards and panels
- Dark mode as default, with a light mode toggle
- White & black base with metallic accent colors
- Smooth hover animations, page transitions, and scroll effects
- Large readable fonts, high-contrast buttons, minimal text

## 2. Global Layout & Navbar
- Sticky navbar with logo, navigation links, language toggle (EN/RW), dark/light mode switch, and Login/Register buttons
- Collapses into a hamburger menu on mobile
- Language switch updates all content instantly

## 3. Internationalization (i18n)
- JSON-based translation files for English and Kinyarwanda
- All user-facing text rendered through translation keys
- Language toggle in navbar persists preference

## 4. Home Page
- Hero section with a car image slider, glass overlay, and CTAs ("Book Now" / "View Cars")
- Classic, premium layout with proper SEO headings and meta tags

## 5. Car Listing Page
- Responsive grid of car cards showing image, name, type, seating capacity, and price preview
- Hover animations on cards
- Action buttons: View Details, Book Now, Call, WhatsApp
- Lazy-loaded images
- Uses hardcoded mock car data

## 6. Car Details Page
- Dynamic route per car
- Image gallery, description, features list, pricing options (hour/trip/day)
- Booking CTA and contact options (call, WhatsApp)

## 7. Booking Page
- Multi-step flow: select car → enter location → choose date/time/duration → price estimate → submit
- Offline handling: bookings saved to localStorage when offline, auto-submitted when back online
- Visual booking confirmation

## 8. Authentication Pages
- Register: full name, username, email, phone, password + confirm, Google sign-in option
- Login: email or phone, password, Google login
- Clear validation messages, smooth transitions
- Frontend-only for now (no backend auth wired up)

## 9. AI Assistant (Floating Chat Widget)
- Floating animated bubble, always visible, opens a chat panel
- Real AI-powered responses via Lovable AI (edge function + streaming)
- Provides booking guidance, FAQ responses, and friendly conversational help
- Handles offline gracefully with a message

## 10. PWA & Offline Support
- Service worker setup for caching homepage, car list, car details, and images
- Offline booking queue with auto-sync
- Offline banner shown when disconnected, unavailable actions disabled

## 11. SEO & Performance
- Semantic HTML with proper heading hierarchy
- Alt text on all images, clean URLs, mobile-first design
- Lazy loading, component reuse, local caching, minimal re-renders

## 12. Pages & Routes Summary
| Route | Page |
|---|---|
| `/` | Home |
| `/cars` | Car Listing |
| `/cars/:id` | Car Details |
| `/booking` | Booking |
| `/login` | Login |
| `/register` | Register |

