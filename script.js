document.addEventListener('DOMContentLoaded', () => {
    // Select core elements from the DOM
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');

    // --- Theme Logic ---
    // Initialize theme based on user's previous choice in localStorage or their system preference
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    html.classList.add(savedTheme);

    // Toggle theme between dark and light modes and save the preference
    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });

    // --- Cursor Logic ---
    const dot = document.getElementById('cursor-dot');
    const outline = document.getElementById('cursor-outline');
    
    // mX and mY store the actual mouse coordinates
    // dX, dY, oX, oY store the "lagged" coordinates for a smooth follow effect
    let mX = 0, mY = 0, dX = 0, dY = 0, oX = 0, oY = 0;
    
    window.addEventListener('mousemove', e => { 
        mX = e.clientX; 
        mY = e.clientY; 
    });

    // The tick function uses Linear Interpolation (lerp) to make the cursor follow the mouse smoothly
    function tick() {
        // Dot follows at 20% speed (0.2)
        dX += (mX - dX) * 0.2; 
        dY += (mY - dY) * 0.2;
        
        // Outline follows at 10% speed (0.1) for a liquid feel
        oX += (mX - oX) * 0.1; 
        oY += (mY - oY) * 0.1;
        
        // Apply transformations; -20px offset centers the larger outline over the mouse
        dot.style.transform = `translate(${dX}px, ${dY}px)`;
        outline.style.transform = `translate(${oX - 20}px, ${oY - 20}px)`;
        
        // Schedule next frame
        requestAnimationFrame(tick);
    }
    tick();

    // --- Roadmap Reveal Logic ---
    // Specialized observer for the roadmap to add a custom "bump" timing function upon entry
    const roadmapObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Adds a slight elastic bounce effect to the transition
                entry.target.style.transitionTimingFunction = "cubic-bezier(0.34, 1.56, 0.64, 1)";
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('#roadmap .reveal').forEach(el => roadmapObserver.observe(el));

    // --- Background Logic (Neural Network) ---
    const canvas = document.getElementById('neural-canvas');
    const ctx = canvas.getContext('2d');
    let pts = []; // Array to store particle data

    // Handle canvas resizing and particle regeneration
    function res() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        pts = [];
        // Particle density scales with screen width
        const density = Math.floor(canvas.width / 45);
        for (let i = 0; i < density; i++) {
            pts.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5, // X Velocity
                vy: (Math.random() - 0.5) * 0.5  // Y Velocity
            });
        }
    }

    // Main animation loop for the background
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isDark = html.classList.contains('dark');

        // Set colors based on current theme
        ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.35)';
        ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(99, 102, 241, 0.65)';

        // Parallax effect: network moves at 15% of the scroll speed
        const scrollOffset = window.scrollY * 0.15;

        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            p.x += p.vx;
            p.y += p.vy;

            // Screen wrapping logic (if point leaves screen, teleport to opposite side)
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            // Calculate current drawing Y position with parallax and wrapping
            const drawY = (p.y - scrollOffset % canvas.height + canvas.height) % canvas.height;

            // Draw individual "neuron" point
            ctx.beginPath();
            ctx.arc(p.x, drawY, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Draw connecting "synapse" lines between nearby points
            for (let j = i + 1; j < pts.length; j++) {
                const p2 = pts[j];
                const drawY2 = (p2.y - scrollOffset % canvas.height + canvas.height) % canvas.height;
                const dx = p.x - p2.x;
                const dy = drawY - drawY2;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Connection threshold (lines fade in/out based on distance)
                if (dist < 180) {
                    ctx.beginPath();
                    ctx.globalAlpha = 1 - (dist / 180);
                    ctx.lineWidth = isDark ? 1.4 : 1.0;
                    ctx.moveTo(p.x, drawY);
                    ctx.lineTo(p2.x, drawY2);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0; // Reset alpha for next iteration
                }
            }
        }
        requestAnimationFrame(loop);
    }

    // Initialize background
    window.addEventListener('resize', res);
    res();
    loop();

    // --- General Reveal Logic ---
    // Observer that adds a "visible" class to elements when they enter the viewport
    const obs = new IntersectionObserver(es => { 
        es.forEach(e => { 
            if (e.isIntersecting) e.target.classList.add('visible'); 
        }); 
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
});