import ParticleField from "./ParticleField";

/**
 * Cyberpunk-style page background:
 *  - 3D particle field
 *  - neon scanline / grid overlay
 *  - ambient color blobs
 * Render as the first child of a `relative overflow-hidden` parent.
 */
const CyberBackground = () => (
  <div className="absolute inset-0 pointer-events-none -z-0" aria-hidden="true">
    <ParticleField />
    <div className="absolute inset-0 hero-grid-overlay opacity-40" />
    <div className="absolute inset-0 cyber-scanlines opacity-30" />
    <div className="absolute -top-32 -right-32 w-[40rem] h-[40rem] bg-[hsl(var(--brand-secondary))] opacity-20 rounded-full blur-3xl" />
    <div className="absolute -bottom-32 -left-32 w-[40rem] h-[40rem] bg-[hsl(var(--brand-primary))] opacity-25 rounded-full blur-3xl" />
  </div>
);

export default CyberBackground;
