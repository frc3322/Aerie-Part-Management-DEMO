/**
 * Confetti celebration utility for part completions
 */

/**
 * Last known pointer position for confetti origin.
 */
let lastPointerPosition = { x: 0, y: 0 };
let pointerTrackingInitialized = false;

function initPointerTracking() {
    if (pointerTrackingInitialized) return;
    pointerTrackingInitialized = true;

    const updateFromMouse = (event) => {
        lastPointerPosition = { x: event.clientX, y: event.clientY };
    };

    const updateFromTouch = (event) => {
        const touch = event.touches?.[0] || event.changedTouches?.[0];
        if (!touch) return;
        lastPointerPosition = { x: touch.clientX, y: touch.clientY };
    };

    document.addEventListener("mousemove", updateFromMouse, { passive: true });
    document.addEventListener("mousedown", updateFromMouse, { passive: true });
    document.addEventListener("touchstart", updateFromTouch, { passive: true });
    document.addEventListener("touchmove", updateFromTouch, { passive: true });
}

function getConfettiOrigin() {
    const hasPointer = Number.isFinite(lastPointerPosition.x);
    if (
        hasPointer &&
        (lastPointerPosition.x !== 0 || lastPointerPosition.y !== 0)
    ) {
        return lastPointerPosition;
    }
    return { x: window.innerWidth / 2, y: window.innerHeight * 0.55 };
}

/**
 * Creates a burst confetti animation at the last pointer position.
 * Uses lightweight physics (gravity + drag) for natural arcs.
 */
export function celebrateCompletion() {
    initPointerTracking();

    const colors = [
        "#ff6b6b",
        "#4ecdc4",
        "#ffe66d",
        "#a8e6cf",
        "#dda0dd",
        "#98d8c8",
        "#ff8a80",
        "#80d6ff",
        "#81c784",
        "#ffb74d",
    ];

    const origin = getConfettiOrigin();
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 120 : 220;

    spawnBurstParticles({ origin, colors, particleCount });
}

/**
 * Spawn a burst of particles that explode outward then fall with gravity.
 */
function spawnBurstParticles({ origin, colors, particleCount }) {
    const gravityPxPerSecondSquared = 1600;
    const dragPerSecond = 0.14;
    const minSpeed = 800;
    const maxSpeed = 1650;
    const maxLifetimeMs = 2200;
    const minLifetimeMs = 1200;

    const particles = [];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < particleCount; i++) {
        const element = document.createElement("div");
        element.className = "confetti-piece";

        const size = randomBetween(5, 10);
        element.style.width = `${size}px`;
        element.style.height = `${randomBetween(6, 14)}px`;
        element.style.borderRadius = Math.random() > 0.7 ? "999px" : "2px";
        element.style.background =
            colors[Math.floor(Math.random() * colors.length)];

        const angle = randomBetween(-Math.PI, 0); // Upward half
        const speed = randomBetween(minSpeed, maxSpeed);

        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const rotation = randomBetween(0, 360);
        const rotationVelocity = randomBetween(-720, 720);
        const lifetimeMs = randomBetween(minLifetimeMs, maxLifetimeMs);

        fragment.appendChild(element);
        particles.push({
            element,
            x: origin.x,
            y: origin.y,
            vx,
            vy,
            rotation,
            rotationVelocity,
            createdAtMs: performance.now(),
            lifetimeMs,
        });
    }

    document.body.appendChild(fragment);

    let lastFrameTimeMs = performance.now();
    const animate = (nowMs) => {
        const dtSeconds = Math.min((nowMs - lastFrameTimeMs) / 1000, 0.033);
        lastFrameTimeMs = nowMs;

        const dragFactor = Math.max(0, 1 - dragPerSecond * dtSeconds);

        for (const particle of particles) {
            const elapsedMs = nowMs - particle.createdAtMs;
            if (elapsedMs >= particle.lifetimeMs) {
                particle.element.remove();
                particle.dead = true;
                continue;
            }

            particle.vx *= dragFactor;
            particle.vy *= dragFactor;
            particle.vy += gravityPxPerSecondSquared * dtSeconds;

            particle.x += particle.vx * dtSeconds;
            particle.y += particle.vy * dtSeconds;
            particle.rotation += particle.rotationVelocity * dtSeconds;

            const lifeProgress = elapsedMs / particle.lifetimeMs;
            const opacity = Math.max(0, 1 - lifeProgress * 1.15);

            particle.element.style.opacity = `${opacity}`;
            particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px) rotate(${particle.rotation}deg)`;
        }

        const aliveCount = particles.reduce(
            (count, particle) => count + (particle.dead ? 0 : 1),
            0
        );
        if (aliveCount > 0) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}
