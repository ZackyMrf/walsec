---
name: Vigilant Void
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#ffffff'
  on-tertiary: '#3c0091'
  tertiary-container: '#e9ddff'
  on-tertiary-container: '#7342dd'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
  surface-card: '#18181B'
  text-muted: '#A1A1AA'
  semantic-safe: '#10B981'
  semantic-alert: '#EF4444'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1280px
---

## Brand & Style
The design system embodies a "Cyber-Minimalist" aesthetic tailored for high-stakes Web3 security. The brand personality is clinical, authoritative, and intimidatingly precise. It signals a "zero-trust" environment where security is absolute and performance is measured in microseconds.

The visual style is a blend of **Brutalism** and **Modern Minimalism**. It rejects the soft, approachable trends of consumer tech in favor of raw, high-contrast interfaces reminiscent of a security operations center (SOC) or a terminal emulator. Expect heavy use of monospaced data, rigid geometric containers, and a total absence of organic curves. The UI should evoke the feeling of a sophisticated tool used by elite security researchers—unforgiving, functional, and powerful.

## Colors
The palette is strictly dark-mode, anchored by "Deep Void" (#09090B) to ensure maximum contrast for high-legibility "Clean White" typography. 

- **Primary:** Used for essential text and high-priority borders.
- **Secondary (Electric Blue):** Represents active processes, scanning states, and connectivity.
- **Tertiary (Cyber Purple):** Reserved for "Walrus Memory" references and advanced cryptographic functions.
- **Semantic Logic:** Green and Red are used sparingly but with high saturation to indicate binary security states (Safe vs. Breach).

Avoid gradients. Colors should be applied as solid blocks or thin, sharp strokes to maintain the technical, terminal-inspired feel.

## Typography
The typographic hierarchy prioritizes data density and legibility. 

**Geist** is used for headlines to provide a sharp, Swiss-inspired modernist feel. **Inter** handles standard body text for maximum clarity. **JetBrains Mono** is the workhorse of the system, used for all data points, wallet addresses, transaction hashes, and status labels to reinforce the "Terminal" aesthetic. 

Small caps with increased letter spacing should be used for section headers and metadata labels to create a structured, organized information architecture.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop (12 columns) and a fluid 4-column model on mobile. All spacing must be multiples of a 4px base unit to ensure mathematical precision.

Layouts should feel modular, like a command-line interface divided into panels. Use 1px borders to separate content zones rather than relying on whitespace alone. This "boxed-in" approach emphasizes the containment and monitoring of data. Content should be densely packed but strictly aligned to the grid, avoiding any "floating" elements.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layers** and **Bold Borders**, never through shadows. 

The background is the lowest level (#09090B). Surfaces and cards (#18181B) sit on top, separated by sharp 1px borders (using #27272A or the Primary color for focus). There is no "ambient" light; the interface should feel flat and structural. To highlight an element, use a primary-colored border or a subtle increase in surface brightness rather than a drop shadow. This maintains the "screen-on-black" terminal feel.

## Shapes
The shape language is strictly **Sharp**. Every corner in the UI—from buttons and input fields to cards and dropdowns—must have a 0px border radius. This geometry communicates rigidity, discipline, and technical precision. Circles are only permitted for status indicators (LED style) or user avatars, and even then, consider using square variants if the brand allows.

## Components

- **Buttons:** Rectangular with 0px radius. "Primary" buttons use a solid White fill with Black text. "Secondary" buttons use a 1px border with no fill. On hover, invert the colors or apply the Electric Blue stroke.
- **Input Fields:** 1px border (#27272A). Focus state uses a 1px Primary White or Electric Blue border with a blocky text cursor.
- **Chips/Status:** Use JetBrains Mono for text. "Safe" chips should use a subtle Emerald stroke; "Alert" chips use a Neon Red stroke. No background fills unless active.
- **Iconography:** Use Lucide icons with a 1.5px stroke. No fills. Icons should be sized precisely (16px or 20px) and always aligned to the text baseline.
- **Cards:** No shadows. Sharp corners. Use a 1px border (#18181B) to separate from the background.
- **Data Tables:** Highly dense. Use 1px horizontal dividers. Header rows should be in all-caps JetBrains Mono with a slight gray tint.
- **Security Scanners:** Include a "terminal output" component—a scrollable area with a black background and monospaced text streams to show live security logs.