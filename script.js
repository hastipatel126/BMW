function init() {
    let sceneReady = false;

// ════════════════════════════════════════
        // CORE SETUP
        // ════════════════════════════════════════
        const canvas = document.getElementById('main-canvas');
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.01, 200);
        camera.position.set(0, 1.8, 9);
        camera.lookAt(0, 0, 0);

        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        let isMobile = window.innerWidth <= 768;
        let isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        let isLowEnd = (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
        function resize() {
            isMobile = window.innerWidth <= 768;
            isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
            renderer.setSize(innerWidth, innerHeight);
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.0 : 1.5));
            if (typeof updateScrollHeight === 'function') updateScrollHeight();
            if (typeof resizeCh === 'function') resizeCh();
        }
        resize();
        window.addEventListener('resize', debounce(resize, 150));

        // ════════════════════════════════════════
        // SCENE LIGHTS
        // ════════════════════════════════════════
        const ambLight = new THREE.AmbientLight(0x050d18, 1.5);
        scene.add(ambLight);

        const sunLight = new THREE.DirectionalLight(0x4488cc, 5);
        sunLight.position.set(8, 12, 6);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 50;
        sunLight.shadow.camera.left = -10;
        sunLight.shadow.camera.right = 10;
        sunLight.shadow.camera.top = 10;
        sunLight.shadow.camera.bottom = -10;
        sunLight.shadow.bias = -0.001;
        scene.add(sunLight);

        const rimLight = new THREE.DirectionalLight(0x0033aa, 3);
        rimLight.position.set(-6, 4, -8);
        scene.add(rimLight);

        const groundLight = new THREE.DirectionalLight(0x001133, 1.5);
        groundLight.position.set(0, -5, 0);
        scene.add(groundLight);

        const sparkLight = new THREE.PointLight(0x00aaff, 0, 8);
        sparkLight.position.set(0, 2, 3);
        scene.add(sparkLight);

        const fireLight = new THREE.PointLight(0xff4400, 0, 6);
        fireLight.position.set(-3, 1, 0);
        scene.add(fireLight);

        // ════════════════════════════════════════
        // BACKGROUND IMAGES
        // ════════════════════════════════════════
        const bgUrls = [
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920&q=90&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=1920&q=90&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1920&q=90&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=1920&q=90&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1920&q=90&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&q=90&auto=format&fit=crop'
        ];

        const bgImages = [];
        const bgLayer = document.getElementById('bg-layer');
        let loadedImgs = 0;

        bgUrls.forEach((url, idx) => {
            const img = new Image();
            if (idx === 0) img.fetchPriority = "high";
            img.src = url;
            img.onload = () => loadedImgs++;

            const div = document.createElement('div');
            div.className = 'bg-img';
            div.style.backgroundImage = `url('${url}')`;
            bgLayer.appendChild(div);
            bgImages.push(div);
        });

        const sectionBg = [0, 1, 2, 3, 1, 4, 5, 5];
        let activeBgIdx = -1;

        const layerA = document.getElementById('layer-a');
        const layerB = document.getElementById('layer-b');
        const layerC = document.getElementById('layer-c');

        // Generate Layer B streaks
        for(let i=0; i<20; i++) {
            const str = document.createElement('div');
            str.className = 'l-streak';
            str.style.width = (15 + Math.random() * 25) + 'vw';
            str.style.top = (Math.random() * 200 - 50) + '%';
            str.style.left = (Math.random() * 80) + '%';
            if (layerB) layerB.appendChild(str);
        }

        function updateBackground(sIdx) {
            const newBgIdx = sectionBg[sIdx];
            if (newBgIdx !== activeBgIdx && activeBgIdx !== -1) {
                bgImages[activeBgIdx].classList.remove('active');
            }
            if (newBgIdx !== activeBgIdx) {
                const newBg = bgImages[newBgIdx];
                newBg.classList.add('prepare');
                void newBg.offsetWidth; // force reflow
                newBg.classList.remove('prepare');
                newBg.classList.add('active');
                activeBgIdx = newBgIdx;
            }
        }

        // ════════════════════════════════════════
        // ENVIRONMENT & FLOOR
        // ════════════════════════════════════════
        const floorGeo = new THREE.PlaneGeometry(80, 80, 1, 1);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x020408, metalness: 0.95, roughness: 0.04
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.02;
        floor.receiveShadow = true;
        scene.add(floor);

        // Grid
        const gridHelper = new THREE.GridHelper(80, 80, 0x0a1830, 0x050e1c);
        gridHelper.position.y = -1.01;
        scene.add(gridHelper);

        // Fog
        scene.fog = new THREE.FogExp2(0x010308, 0.04);

        // ════════════════════════════════════════
        // PARTICLE FIELD
        // ════════════════════════════════════════
        const PCount = 1500;
        const pPositions = new Float32Array(PCount * 3);
        const pSizes = new Float32Array(PCount);
        for (let i = 0; i < PCount; i++) {
            pPositions[i * 3] = (Math.random() - .5) * 60;
            pPositions[i * 3 + 1] = (Math.random() - .5) * 30;
            pPositions[i * 3 + 2] = (Math.random() - .5) * 60;
            pSizes[i] = Math.random() * 2 + .5;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));
        const pMat = new THREE.PointsMaterial({
            color: 0x1a4080, size: .04, transparent: true, opacity: .6, sizeAttenuation: true
        });
        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);

        // Speed streaks (horizontal lines behind car)
        const streakGroup = new THREE.Group();
        scene.add(streakGroup);
        for (let i = 0; i < 30; i++) {
            const len = 1 + Math.random() * 6;
            const y = -0.5 + Math.random() * 1.8;
            const z = (Math.random() - .5) * 1.8;
            const startX = 3 + Math.random() * 10;
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(
                new Float32Array([-startX, y, z, -startX - len, y, z]), 3
            ));
            const alpha = .05 + Math.random() * .2;
            const mat = new THREE.LineBasicMaterial({ color: 0x0066cc, transparent: true, opacity: alpha });
            streakGroup.add(new THREE.Line(geo, mat));
        }
        streakGroup.visible = false;

        // ════════════════════════════════════════
        // CAR BUILDER
        // ════════════════════════════════════════
        function buildCar(cfg) {
            const g = new THREE.Group();
            const { color = 0x08101e, accent = 0x1c6bff, type = 'coupe' } = cfg;

            const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: .92, roughness: .07 });
            const glassMat = new THREE.MeshStandardMaterial({ color: 0x8aaabb, metalness: .1, roughness: 0, transparent: true, opacity: .3, side: THREE.DoubleSide });
            const chromeMat = new THREE.MeshStandardMaterial({ color: 0xc0d0e0, metalness: 1, roughness: .05 });
            const tireMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: .1, roughness: .9 });
            const accentMat = new THREE.MeshStandardMaterial({ color: accent, metalness: .8, roughness: .2, emissive: accent, emissiveIntensity: .3 });

            const isSUV = type === 'suv';
            const bW = isSUV ? 2.3 : 2.1;
            const bH = isSUV ? .65 : .52;
            const bD = isSUV ? 1.05 : .95;

            // BODY
            function bevelBox(w, h, d, r = .04) {
                const shape = new THREE.BoxGeometry(w, h, d, 4, 2, 4);
                return shape;
            }
            const bodyG = bevelBox(bW, bH, bD);
            const body = new THREE.Mesh(bodyG, bodyMat);
            body.castShadow = true; body.receiveShadow = true;
            g.add(body);

            // HOOD slope
            const hoodG = new THREE.BoxGeometry(bW * .6, bH * .3, bD * .9);
            const hood = new THREE.Mesh(hoodG, bodyMat);
            hood.position.set(bW * .35, bH * .45, 0);
            hood.rotation.z = isSUV ? -.08 : -.12;
            hood.castShadow = true;
            g.add(hood);

            // TRUNK
            const trunkG = new THREE.BoxGeometry(bW * .4, bH * .2, bD * .9);
            const trunk = new THREE.Mesh(trunkG, bodyMat);
            trunk.position.set(-bW * .38, bH * .32, 0);
            trunk.rotation.z = isSUV ? .06 : .1;
            trunk.castShadow = true;
            g.add(trunk);

            // CABIN
            const cabH = isSUV ? .62 : .48;
            const cabW = isSUV ? 1.5 : 1.35;
            const cabG = new THREE.BoxGeometry(cabW, cabH, bD * .86);
            const cab = new THREE.Mesh(cabG, bodyMat);
            cab.position.set(isSUV ? -.04 : -.06, bH / 2 + cabH / 2 - .02, 0);
            cab.castShadow = true;
            g.add(cab);

            // WINDSHIELD
            const wsG = new THREE.PlaneGeometry(cabW * .7, cabH * .72);
            const ws = new THREE.Mesh(wsG, glassMat);
            ws.position.set(cabW * .38, bH / 2 + cabH * .38, 0);
            ws.rotation.y = Math.PI / 2;
            ws.rotation.z = isSUV ? -.24 : -.28;
            g.add(ws);

            // REAR WINDOW
            const rwG = new THREE.PlaneGeometry(cabW * .65, cabH * .65);
            const rw = new THREE.Mesh(rwG, glassMat);
            rw.position.set(-cabW * .38, bH / 2 + cabH * .35, 0);
            rw.rotation.y = Math.PI / 2;
            rw.rotation.z = isSUV ? .24 : .3;
            g.add(rw);

            // SIDE WINDOWS
            [-1, 1].forEach(side => {
                const swG = new THREE.PlaneGeometry(cabW * .6, cabH * .55);
                const sw = new THREE.Mesh(swG, glassMat);
                sw.position.set(0, bH / 2 + cabH * .4, (bD * .44) * side);
                g.add(sw);
            });

            // WHEELS
            const wR = isSUV ? .42 : .35;
            const wW = .24;
            [[bW * .62, -(bH * .42), bD * .54], [bW * .62, -(bH * .42), -bD * .54],
            [-bW * .58, -(bH * .42), bD * .54], [-bW * .58, -(bH * .42), -bD * .54]].forEach(([wx, wy, wz]) => {
                const tireG = new THREE.CylinderGeometry(wR, wR, wW, 40);
                const tire = new THREE.Mesh(tireG, tireMat);
                tire.rotation.z = Math.PI / 2; tire.position.set(wx, wy, wz);
                tire.castShadow = true; g.add(tire);

                // Rim spokes
                const rimG = new THREE.CylinderGeometry(wR * .72, wR * .72, wW + .01, 8);
                const rim = new THREE.Mesh(rimG, chromeMat);
                rim.rotation.z = Math.PI / 2; rim.position.set(wx, wy, wz); g.add(rim);

                for (let s = 0; s < 8; s++) {
                    const spokeG = new THREE.BoxGeometry(.03, wR * .62, .025);
                    const spoke = new THREE.Mesh(spokeG, chromeMat);
                    spoke.rotation.z = Math.PI / 2;
                    spoke.rotation.x = s * (Math.PI / 4);
                    spoke.position.set(wx, wy, wz); g.add(spoke);
                }
                const hubG = new THREE.CylinderGeometry(wR * .15, wR * .15, wW + .04, 16);
                const hub = new THREE.Mesh(hubG, accentMat);
                hub.rotation.z = Math.PI / 2; hub.position.set(wx, wy, wz); g.add(hub);

                // Brake disc glow
                const discG = new THREE.CylinderGeometry(wR * .5, wR * .5, .02, 32);
                const discMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: .8, roughness: .3 });
                const disc = new THREE.Mesh(discG, discMat);
                disc.rotation.z = Math.PI / 2; disc.position.set(wx, wy, wz); g.add(disc);
            });

            // HEADLIGHTS
            const hlMat = new THREE.MeshStandardMaterial({
                color: 0xddeeff, emissive: 0x8899ff, emissiveIntensity: .8, transparent: true, opacity: .95
            });
            [-.35, .35].forEach(z => {
                const hlG = new THREE.BoxGeometry(.05, .12, .28);
                const hl = new THREE.Mesh(hlG, hlMat);
                hl.position.set(bW / 2 + .01, bH * .25, z); g.add(hl);

                // DRL strip
                const drlG = new THREE.BoxGeometry(.03, .03, .26);
                const drlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 });
                const drl = new THREE.Mesh(drlG, drlMat);
                drl.position.set(bW / 2 + .02, bH * .38, z); g.add(drl);
            });

            // TAILLIGHTS
            const tlMat = new THREE.MeshStandardMaterial({
                color: 0xff1100, emissive: 0xff0800, emissiveIntensity: 1.2, transparent: true, opacity: .9
            });
            [-.32, .32].forEach(z => {
                const tlG = new THREE.BoxGeometry(.04, .13, .25);
                const tl2 = new THREE.Mesh(tlG, tlMat);
                tl2.position.set(-bW / 2 - .01, bH * .28, z); g.add(tl2);
            });

            // KIDNEY GRILLE
            const grilleMat = new THREE.MeshStandardMaterial({ color: 0x0a0e14, metalness: .7, roughness: .4 });
            [-.22, .22].forEach(z => {
                const gG = new THREE.BoxGeometry(.04, .28, .22);
                const gr = new THREE.Mesh(gG, grilleMat);
                gr.position.set(bW / 2 + .02, bH * .05, z); g.add(gr);
                const grBorder = new THREE.Mesh(new THREE.BoxGeometry(.02, .30, .24), chromeMat);
                grBorder.position.set(bW / 2 + .03, bH * .05, z); g.add(grBorder);
            });

            // BUMPER LOWER
            const bumperG = new THREE.BoxGeometry(.06, bH * .24, bD * .9);
            const bumper = new THREE.Mesh(bumperG, chromeMat);
            bumper.position.set(bW / 2 + .04, -(bH * .18), 0); g.add(bumper);

            // DIFFUSER
            const diffG = new THREE.BoxGeometry(.06, bH * .15, bD * .8);
            const diffMat = new THREE.MeshStandardMaterial({ color: 0x060a10, metalness: .5, roughness: .5 });
            const diff = new THREE.Mesh(diffG, diffMat);
            diff.position.set(-bW / 2 - .04, -(bH * .22), 0); g.add(diff);

            // SPOILER (sport)
            if (type === 'sport' || type === 'm8') {
                const spG = new THREE.BoxGeometry(.06, .15, bD * .85);
                const sp = new THREE.Mesh(spG, chromeMat);
                sp.position.set(-bW / 2 - .02, bH / 2 + cabH * .08, 0); g.add(sp);
            }

            // EXHAUST PIPES
            [-bD * .28, bD * .28].forEach(z => {
                const exG = new THREE.CylinderGeometry(.035, .035, .12, 16);
                const exMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: .9, roughness: .2 });
                const ex = new THREE.Mesh(exG, exMat);
                ex.rotation.z = Math.PI / 2;
                ex.position.set(-bW / 2 - .06, -(bH * .3), z); g.add(ex);
            });

            return g;
        }

        // ════════════════════════════════════════
        // CAR CONFIGS
        // ════════════════════════════════════════
        const carConfigs = [
            { label: 'M4', color: 0x05090f, accent: 0x1c6bff, type: 'sport' },
            { label: 'i7', color: 0x030710, accent: 0x00ccff, type: 'coupe' },
            { label: 'X5', color: 0x0a0802, accent: 0x44aa22, type: 'suv' },
            { label: 'M8', color: 0x08030e, accent: 0xaa44ff, type: 'm8' },
        ];

        const carGroup = new THREE.Group();
        scene.add(carGroup);
        let activeCar = null;
        let builtCars = [];

        function buildAllCars() {
            builtCars.forEach(c => carGroup.remove(c));
            builtCars = [];
            carConfigs.forEach((cfg, i) => {
                const car = buildCar(cfg);
                car.position.set(0, -5, 0);
                car.visible = false;
                carGroup.add(car);
                builtCars.push(car);
            });
            showCar(0, false);
        }

        let transitionActive = false;
        function showCar(idx, animate = true) {
            if (transitionActive && animate) return;
            transitionActive = animate;
            const prev = activeCar;
            const next = builtCars[idx];

            // Update accent light
            const accent = carConfigs[idx].accent;
            sparkLight.color.setHex(accent);
            
            const bloom = document.getElementById('bloom');
            if (bloom) {
                const r = (accent >> 16) & 255;
                const g = (accent >> 8) & 255;
                const b = accent & 255;
                bloom.style.background = `radial-gradient(ellipse, rgba(${r},${g},${b},0.06) 0%, transparent 70%)`;
            }

            if (prev && animate) {
                gsap.to(prev.position, {
                    y: -5, duration: .5, ease: 'power2.in', onComplete: () => {
                        prev.visible = false;
                        next.visible = true;
                        next.position.set(0, -5, 0);
                        gsap.to(next.position, { y: 0, duration: .8, ease: 'power3.out', onComplete: () => { transitionActive = false; } });
                        activeCar = next;
                    }
                });
            } else {
                if (prev) prev.visible = false;
                next.visible = true;
                next.position.set(0, animate ? -5 : 0, 0);
                if (animate) gsap.to(next.position, { y: 0, duration: 1, ease: 'power3.out', onComplete: () => { transitionActive = false; } });
                activeCar = next;
            }
            // Update picker dots
            document.querySelectorAll('.mpick').forEach((el, i) => el.classList.toggle('active', i === idx));
            document.querySelectorAll('.mdot').forEach((el, i) => el.classList.toggle('active', i === idx));
            currentCarIdx = idx;
        }

        let currentCarIdx = 0;
        window.jumpToModel = function (idx) { showCar(idx, true); }

        // ════════════════════════════════════════
        // SCROLL SYSTEM
        // ════════════════════════════════════════
        const sections = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'];
        let currentY = 0, targetY = 0, touchStartY = 0;
        let totalHeight = 0;

        function getTotalHeight() {
            return document.getElementById('scroll-root').scrollHeight - innerHeight;
        }

        // Section scroll positions (as fraction 0–1)
        const sectionBreaks = [0, .08, .16, .24, .34, .44, .56, .70, 1.0];

        function getScrollFrac() {
            return currentY / Math.max(getTotalHeight(), 1);
        }

        function getSectionProgress(sIdx) {
            const start = sectionBreaks[sIdx];
            const end = sectionBreaks[sIdx + 1];
            const f = getScrollFrac();
            return Math.max(0, Math.min(1, (f - start) / (end - start)));
        }

        // ════════════════════════════════════════
        // CAMERA CHOREOGRAPHY
        // ════════════════════════════════════════
        // Each section defines a camera pose + car state
        const camPoses = [
            // S0 HERO: wide, slightly elevated, car side view
            { px: 0, py: 2.2, pz: 10, tx: 0, ty: .3, tz: 0, carRY: -.2, fov: 52 },
            // S1 M4: front 3/4 angle
            { px: 3, py: 1.4, pz: 6, tx: -.2, ty: .2, tz: 0, carRY: -.35, fov: 55 },
            // S2 ORBIT: orbit around
            { px: -4, py: 1.8, pz: 5, tx: 0, ty: .2, tz: 0, carRY: .4, fov: 58 },
            // S3 i7: low ground angle
            { px: 2.5, py: .7, pz: 5.5, tx: .2, ty: .1, tz: 0, carRY: -.45, fov: 60 },
            // S4 PERF: rear 3/4
            { px: -4, py: 2, pz: 4, tx: 0, ty: .4, tz: 0, carRY: .55, fov: 55 },
            // S5 X5: high angle
            { px: 3, py: 3.5, pz: 5, tx: 0, ty: 0, tz: 0, carRY: -.3, fov: 62 },
            // S6 TIMELINE: close side
            { px: 5, py: 1.2, pz: 3, tx: 0, ty: .2, tz: 0, carRY: -.15, fov: 65 },
            // S7 COLLECTION: pull back
            { px: 0, py: 3, pz: 12, tx: 0, ty: 0, tz: 0, carRY: .2, fov: 50 },
        ];

        // Section → car index
        const sectionCar = [0, 0, 0, 1, 0, 2, 0, 3];

        let lastSection = -1;
        let camPX = 0, camPY = 2.2, camPZ = 10, camTX = 0, camTY = .3, camTZ = 0, camFOV = 52;
        let targetCarRY = 0;
        let autoRotate = true;
        let autoRotTime = 0;

        function lerp(a, b, t) { return a + (b - a) * t }

        function updateCamera(dt) {
            const f = getScrollFrac();

            // Which section are we in?
            let sIdx = 0;
            for (let i = 0; i < sectionBreaks.length - 1; i++) {
                if (f >= sectionBreaks[i]) sIdx = i;
            }
            sIdx = Math.min(sIdx, camPoses.length - 1);

            if (sIdx !== lastSection) {
                if (lastSection !== -1) {
                    document.querySelectorAll('.letterbox').forEach(l => l.classList.add('active'));
                    setTimeout(() => {
                        document.querySelectorAll('.letterbox').forEach(l => l.classList.remove('active'));
                    }, 300);
                }
                lastSection = sIdx;
                
                const titles = [
                    "BMW — The Ultimate Machine",
                    "BMW M4 Competition — 530hp",
                    "BMW M4 — Sculpted By Air",
                    "BMW i7 — The Future of Luxury",
                    "BMW — Raw Numbers",
                    "BMW X5 M50i — Dominance",
                    "BMW — A Century of Icons",
                    "BMW — The Collection"
                ];
                document.title = titles[sIdx] || "BMW — The Ultimate Driving Machine";
            }

            // Cross-section blend
            const sStart = sectionBreaks[sIdx];
            const sEnd = sectionBreaks[Math.min(sIdx + 1, sectionBreaks.length - 1)];
            const tLocal = sEnd > sStart ? (f - sStart) / (sEnd - sStart) : 0;
            const tSmooth = tLocal < .5 ? 2 * tLocal * tLocal : 1 - 2 * (1 - tLocal) * (1 - tLocal);

            const poseA = camPoses[sIdx];
            const poseB = camPoses[Math.min(sIdx + 1, camPoses.length - 1)];

            const tPX = lerp(poseA.px, poseB.px, tSmooth);
            const tPY = lerp(poseA.py, poseB.py, tSmooth);
            const tPZ = lerp(poseA.pz, poseB.pz, tSmooth);
            const tTX = lerp(poseA.tx, poseB.tx, tSmooth);
            const tTY = lerp(poseA.ty, poseB.ty, tSmooth);
            const tFOV = lerp(poseA.fov, poseB.fov, tSmooth);
            const tCRY = lerp(poseA.carRY, poseB.carRY, tSmooth);

            const spd = .04;
            camPX = lerp(camPX, tPX, spd);
            camPY = lerp(camPY, tPY, spd);
            camPZ = lerp(camPZ, tPZ, spd);
            camTX = lerp(camTX, tTX, spd);
            camTY = lerp(camTY, tTY, spd);
            camFOV = lerp(camFOV, tFOV, .05);

            camera.position.set(camPX, camPY, camPZ);
            camera.fov = camFOV;
            camera.updateProjectionMatrix();
            camera.lookAt(camTX, camTY, camTZ);

            // Car rotation
            if (activeCar) {
                autoRotTime += dt;
                const baseRY = tCRY + autoRotTime * .3;
                activeCar.rotation.y = lerp(activeCar.rotation.y, baseRY, .025);
                activeCar.position.y = lerp(activeCar.position.y, Math.sin(autoRotTime * .7) * .08, .1);
            }

            // Switch car based on section
            const targetCar = sectionCar[sIdx];
            if (targetCar !== currentCarIdx && !transitionActive) {
                showCar(targetCar, true);
            }
            
            updateBackground(sIdx);

            // Lights based on scroll
            sparkLight.intensity = lerp(sparkLight.intensity, sIdx === 3 ? 3 : 1, .05);
            fireLight.intensity = lerp(fireLight.intensity, sIdx === 4 ? 2 : 0, .05);
            streakGroup.visible = sIdx === 4;

            // Particles drift
            particles.rotation.y += dt * .015;
            particles.rotation.x += dt * .005;

            // HUD
            if (activeCar && sIdx < 6) {
                const spd2 = Math.abs(Math.sin(autoRotTime * .4)) * 120 + 140;
                const rpm = Math.abs(Math.sin(autoRotTime * .3 + 1)) * 3000 + 3500;
                const gears = ['2', '3', '4', '5', '6'];
                document.getElementById('hud-speed').textContent = Math.round(spd2);
                document.getElementById('hud-rpm').textContent = Math.round(rpm);
                document.getElementById('hud-gear').textContent = gears[Math.floor(autoRotTime * .5) % 5];
                document.getElementById('hud').classList.add('vis');
            }
        }

        // ════════════════════════════════════════
        // ANIMATION UTILS
        // ════════════════════════════════════════
        function wrapWords(parent) {
            let html = '';
            parent.childNodes.forEach(node => {
                if (node.nodeType === 3) {
                    const words = node.textContent.split(/(\s+)/);
                    words.forEach(w => {
                        if (w.trim()) {
                            html += `<span class="word-wrap"><span class="word">${w}</span></span>`;
                        } else {
                            html += w;
                        }
                    });
                } else if (node.nodeType === 1) {
                    if (node.tagName === 'BR') {
                        html += '<br>';
                    } else {
                        const cloned = node.cloneNode(true);
                        cloned.innerHTML = '';
                        html += `<${node.tagName.toLowerCase()} class="${node.className}">`;
                        html += wrapWords(node);
                        html += `</${node.tagName.toLowerCase()}>`;
                    }
                }
            });
            return html;
        }

        document.querySelectorAll('.s-headline').forEach(el => {
            el.innerHTML = wrapWords(el);
            el.querySelectorAll('.word').forEach((w, i) => {
                w.style.transitionDelay = (i * 0.08) + 's';
            });
        });

        document.querySelectorAll('.pbar-fill').forEach(fill => {
            const spark = document.createElement('div');
            spark.className = 'pbar-spark';
            fill.appendChild(spark);
        });

        function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

        function animateCounter(el) {
            if (el.dataset.animated) return;
            el.dataset.animated = '1';
            const textNode = el.childNodes[0];
            const target = parseFloat(textNode.nodeValue);
            if (isNaN(target)) return;
            
            const isFloat = textNode.nodeValue.includes('.');
            const duration = 1400;
            const startT = performance.now();
            
            function step(now) {
                const elapsed = Math.min(1, (now - startT) / duration);
                const val = target * easeOutExpo(elapsed);
                textNode.nodeValue = isFloat ? val.toFixed(1) : Math.floor(val);
                if (elapsed < 1) requestAnimationFrame(step);
                else textNode.nodeValue = target;
            }
            requestAnimationFrame(step);
        }

        // ════════════════════════════════════════
        // GLITCH & CHROMATIC ABERRATION ENGINE
        // ════════════════════════════════════════
        const cR = document.getElementById('ch-red');
        const cG = document.getElementById('ch-green');
        const cB = document.getElementById('ch-blue');
        let ctxR, ctxG, ctxB;
        if (cR) {
            ctxR = cR.getContext('2d');
            ctxG = cG.getContext('2d');
            ctxB = cB.getContext('2d');
            
            function resizeCh() {
                cR.width = cG.width = cB.width = innerWidth;
                cR.height = cG.height = cB.height = innerHeight;
            }
            resizeCh();
        }

        const turb = document.getElementById('glitch-turb');
        const disp = document.getElementById('glitch-disp');
        const flash = document.getElementById('glitch-flash');
        const overlay = document.getElementById('glitch-overlay');
        
        let isGlitching = false;
        let lastGlitch = 0;
        let glRed = 12, glBlue = -12;
        let chOp = 0.04;
        let curFreq = 0.85;

        document.body.style.filter = 'url(#glitch-filter)';

        function triggerGlitch() {
            if (isMobile) return;
            if (typeof sceneReady !== 'undefined' && !sceneReady) return;
            const now = performance.now();
            if (isGlitching || now - lastGlitch < 500) return;
            const loader = document.getElementById('loader');
            if (loader && loader.style.display !== 'none' && loader.style.opacity !== '0') return;

            isGlitching = true;
            lastGlitch = now;
            chOp = 0.35;
            if(cR) {
                cR.style.transform = `translateX(${glRed}px)`;
                cB.style.transform = `translateX(${glBlue}px)`;
                cR.style.opacity = cG.style.opacity = cB.style.opacity = chOp;
            }

            if(flash) {
                flash.style.transition = 'opacity 40ms';
                flash.style.opacity = '0.4';
                setTimeout(() => { flash.style.opacity = '0'; }, 40);
            }

            setTimeout(() => {
                const numTears = 3 + Math.floor(Math.random() * 4);
                for(let i=0; i<numTears; i++) {
                    const t = document.createElement('div');
                    t.className = 'glitch-tear';
                    t.style.height = (2 + Math.random() * 6) + 'px';
                    t.style.top = (Math.random() * 100) + '%';
                    t.style.transform = `translateX(${(Math.random() * 160) - 80}px)`;
                    if(overlay) overlay.appendChild(t);
                    setTimeout(() => t.remove(), 80);
                }
            }, 60);

            setTimeout(() => {
                const numTears = 2 + Math.floor(Math.random() * 2);
                for(let i=0; i<numTears; i++) {
                    const t = document.createElement('div');
                    t.className = 'glitch-tear';
                    t.style.height = (1 + Math.random() * 3) + 'px';
                    t.style.top = (Math.random() * 100) + '%';
                    t.style.transform = `translateX(${(Math.random() * 80) - 40}px)`;
                    if(overlay) overlay.appendChild(t);
                    setTimeout(() => t.remove(), 60);
                }
            }, 140);

            setTimeout(() => {
                chOp = 0.04;
                if(cR) {
                    cR.style.transition = 'transform 200ms, opacity 200ms';
                    cB.style.transition = 'transform 200ms, opacity 200ms';
                    cG.style.transition = 'opacity 200ms';
                    cR.style.transform = `translateX(2px)`;
                    cB.style.transform = `translateX(-2px)`;
                    cR.style.opacity = cG.style.opacity = cB.style.opacity = chOp;
                    setTimeout(() => {
                        if(cR) cR.style.transition = cB.style.transition = cG.style.transition = '';
                    }, 200);
                }
            }, 220);

            setTimeout(() => { isGlitching = false; }, 420);

            let startTime = now;
            function animateFreq(t) {
                let elapsed = t - startTime;
                if(elapsed < 60) {
                    curFreq = 0.85 + (4.2 - 0.85) * (elapsed / 60);
                    if(disp) disp.setAttribute('scale', 10 + Math.random() * 20);
                } else if (elapsed > 220 && elapsed < 420) {
                    curFreq = 4.2 - (4.2 - 0.85) * ((elapsed - 220) / 200);
                    if(disp) disp.setAttribute('scale', 20 * (1 - (elapsed - 220)/200));
                } else if (elapsed <= 220) {
                    curFreq = 4.2 + Math.random() * 0.5;
                    if(disp) disp.setAttribute('scale', 15 + Math.random() * 15);
                }
                if(turb) turb.setAttribute('baseFrequency', curFreq);
                if(elapsed < 420) requestAnimationFrame(animateFreq);
                else {
                    if(turb) turb.setAttribute('baseFrequency', '0.85');
                    if(disp) disp.setAttribute('scale', '0');
                }
            }
            requestAnimationFrame(animateFreq);
        }

        function scheduleRandomGlitch() {
            const delay = 6000 + Math.random() * 8000;
            setTimeout(() => {
                triggerGlitch();
                scheduleRandomGlitch();
            }, delay);
        }
        scheduleRandomGlitch();

        // ════════════════════════════════════════
        // SECTION REVEAL
        // ════════════════════════════════════════
        function revealSection(sId) {
            const labels = document.querySelectorAll(`#l-${sId}, #h-${sId}, #b-${sId}, #c-${sId}, #sp-${sId}, #pb-${sId}`);
            labels.forEach(el => { if (el) el.classList.add('vis'); });

            const secEl = document.getElementById(sId);
            if (secEl) {
                secEl.querySelectorAll('.spec-val').forEach(animateCounter);
            }

            // Perf bars
            if (sId === 's4') {
                document.querySelectorAll('.pbar-fill').forEach(bar => {
                    bar.style.width = bar.dataset.w + '%';
                    setTimeout(() => {
                        const spark = bar.querySelector('.pbar-spark');
                        if (spark) spark.classList.add('fade');
                    }, 1600);
                });
                const pb = document.getElementById('pb-s4');
                if (pb) pb.classList.add('vis');
            }
            if (sId === 's6') {
                document.querySelectorAll('#tl .tl-item').forEach(el => el.classList.add('vis'));
            }
            if (sId === 's7') {
                document.querySelectorAll('.coll-card').forEach((el, i) => {
                    setTimeout(() => el.classList.add('vis'), i * 90);
                });
            }
        }

        // Intersection observer for sections
        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        revealSection(e.target.id);
                        if (typeof triggerGlitch === 'function') triggerGlitch();
                        if (typeof playThump === 'function') playThump();
                    }
                });
            }, { threshold: .15, rootMargin: "0px 0px -10% 0px" });
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el) revealObserver.observe(el);
            });
        } else {
            sections.forEach(id => revealSection(id));
        }

        // ════════════════════════════════════════
        // SMOOTH SCROLL (VIRTUAL)
        // ════════════════════════════════════════
        function updateScrollHeight() {
            const sh = document.getElementById('scroll-root').scrollHeight;
            document.getElementById('scroll-height').style.height = sh + 'px';
        }
        window.addEventListener('load', updateScrollHeight);

        let scrollTimeout = null;
        function setScrollingState() {
            document.body.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                document.body.classList.remove('is-scrolling');
            }, 150);
        }

        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            setScrollingState();
            targetY += e.deltaY * 0.8;
            const maxScroll = Math.max(0, getTotalHeight());
            targetY = Math.max(0, Math.min(maxScroll, targetY));
            window.scrollTo(0, targetY);
        }, { passive: false });

        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            setScrollingState();
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            touchStartY = touchY;
            targetY += deltaY * 1.5;
            const maxScroll = Math.max(0, getTotalHeight());
            targetY = Math.max(0, Math.min(maxScroll, targetY));
            window.scrollTo(0, targetY);
        }, { passive: false });

        window.addEventListener('scroll', () => {
            targetY = window.scrollY;
        });

        function updateScrollProgress() {
            const pct = currentY / Math.max(getTotalHeight(), 1);
            document.getElementById('scroll-prog').style.width = (pct * 100) + '%';
        }

        window.scrollToSection = function (sIdx) {
            const total = getTotalHeight();
            targetY = sectionBreaks[sIdx] * total;
            window.scrollTo({ top: targetY, behavior: 'auto' });
        };

        // ════════════════════════════════════════
        // MOUSE PARALLAX & CURSOR
        // ════════════════════════════════════════
        let mx = innerWidth / 2, my = innerHeight / 2;
        let pmx = 0, pmy = 0;
        let normalizedX = 0, normalizedY = 0;
        let smoothNx = 0, smoothNy = 0;
        let camOffsetX = 0;

        let ringX = mx, ringY = my;
        
        const magEls = document.querySelectorAll('a, button, .coll-card, .mpick, .s-cta, .nav-links a, [onclick]');
        let hoverCard = false;
        let hoverCta = null;
        let hoverCanvas = true;

        magEls.forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (el.classList.contains('coll-card')) hoverCard = true;
                if (el.classList.contains('s-cta')) hoverCta = el;
                hoverCanvas = false;
            });
            el.addEventListener('mouseleave', () => {
                hoverCard = false;
                hoverCta = null;
                hoverCanvas = true;
                el.style.transform = '';
            });
        });

        document.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            normalizedX = mx / innerWidth - 0.5;
            normalizedY = my / innerHeight - 0.5;
        });

        document.addEventListener('mousedown', () => {
            const ring = document.getElementById('cur-ring');
            if (ring) {
                ring.classList.remove('click-pulse');
                void ring.offsetWidth;
                ring.classList.add('click-pulse');
            }
            triggerGlitch();
        });

        const trailCount = 10;
        const trails = [];
        const curDot = document.getElementById('cur-dot');
        const curRing = document.getElementById('cur-ring');
        const curRingWrapper = document.getElementById('cur-ring-wrapper');
        const curTrail = document.getElementById('cur-trail');
        
        if (!isLowEnd) {
            for (let i = 0; i < trailCount; i++) {
                const dot = document.createElement('div');
                dot.className = 'cur-trail-dot';
                if (curTrail) curTrail.appendChild(dot);
                trails.push({ x: mx, y: my, el: dot });
            }
        }

        // ════════════════════════════════════════
        // MAIN RENDER LOOP
        // ════════════════════════════════════════
        function updateScroll() {
            const scrollLerp = isMobile ? 0.12 : 0.075;
            currentY = lerp(currentY, targetY, scrollLerp);
            const sr = document.getElementById('scroll-root');
            if (sr) sr.style.transform = `translateY(${-currentY}px)`;
            updateScrollProgress();
        }

        function updateParallax() {
            const pScale = isMobile ? 0.3 : (isTablet ? 0.6 : 1.0);

            bgImages.forEach(bg => {
                bg.style.transform = `translateY(${currentY * -0.25 * pScale}px)`;
            });

            pmx = lerp(pmx, (mx / innerWidth - .5) * .4, .05);
            pmy = lerp(pmy, (my / innerHeight - .5) * .2, .05);
            if (activeCar) {
                carGroup.rotation.y = lerp(carGroup.rotation.y, pmx, .03);
                carGroup.rotation.x = lerp(carGroup.rotation.x, pmy * .3, .03);
            }

            smoothNx = lerp(smoothNx, normalizedX, 0.06);
            smoothNy = lerp(smoothNy, normalizedY, 0.06);

            if (layerA) layerA.style.transform = `translate(${smoothNx * -25 * pScale}px, ${currentY * -0.15 * pScale + smoothNy * -15 * pScale}px)`;
            if (layerB) layerB.style.transform = `translate(${smoothNx * -40 * pScale}px, ${currentY * -0.3 * pScale + smoothNy * -20 * pScale}px)`;
            if (layerC) layerC.style.transform = `translate(${smoothNx * -15 * pScale}px, ${currentY * -0.2 * pScale + smoothNy * -10 * pScale}px)`;

            sections.forEach((id, i) => {
                const prog = getSectionProgress(i);
                if (prog >= 0 && prog <= 1) {
                    const el = document.getElementById(id);
                    if (el) {
                        const h = el.querySelector('.s-headline');
                        const b = el.querySelector('.s-body');
                        const sp = el.querySelector('.spec-row');
                        if (h) h.style.transform = `translateY(${prog * -30 * pScale}px)`;
                        if (b) b.style.transform = `translateY(${prog * -15 * pScale}px)`;
                        if (sp) sp.style.transform = `translateY(${prog * -10 * pScale}px)`;
                    }
                }
            });

            camOffsetX += (normalizedX * 0.3 * pScale - camOffsetX) * 0.03;
            camera.position.x += camOffsetX;
        }

        function updateCursor() {
            if (isMobile) return;
            let targetX = mx;
            let targetY = my;
            let isNear = false;

            magEls.forEach(el => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dist = Math.hypot(mx - cx, my - cy);

                if (dist < 90) {
                    isNear = true;
                    const factor = 1 - (dist / 90);
                    const speed = factor * 0.35;
                    
                    targetX += (cx - targetX) * speed;
                    targetY += (cy - targetY) * speed;

                    const attractX = mx - cx;
                    const attractY = my - cy;
                    el.style.transform = `translate(${attractX * 0.25}px, ${attractY * 0.25}px)`;
                    el.style.transition = 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
                } else {
                    if (el.style.transform) el.style.transform = '';
                }
            });

            if (curDot) curDot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;

            ringX += (targetX - ringX) * 0.12;
            ringY += (targetY - ringY) * 0.12;
            if (curRingWrapper) curRingWrapper.style.transform = `translate(${ringX}px, ${ringY}px)`;

            if (curRing) {
                if (isNear) curRing.classList.add('near'); else curRing.classList.remove('near');
                if (hoverCard) curRing.classList.add('hover-card'); else curRing.classList.remove('hover-card');
                if (hoverCanvas) curRing.classList.add('hover-canvas'); else curRing.classList.remove('hover-canvas');
                
                if (hoverCta) {
                    curRing.classList.add('hover-cta');
                    curRing.style.width = hoverCta.offsetWidth + 'px';
                } else {
                    curRing.classList.remove('hover-cta');
                    curRing.style.width = '';
                }
            }

            if (trails.length > 0) {
                trails[0].x += (mx - trails[0].x) * 0.35;
                trails[0].y += (my - trails[0].y) * 0.35;
                for (let i = 1; i < trailCount; i++) {
                    trails[i].x += (trails[i-1].x - trails[i].x) * 0.35;
                    trails[i].y += (trails[i-1].y - trails[i].y) * 0.35;
                }

                trails.forEach((tr, i) => {
                    const size = 4 - (3 * (i / 9));
                    const op = 0.2 - (0.2 * (i / 9));
                    const color = i < 3 ? 'var(--spark)' : '#fff';
                    tr.el.style.transform = `translate(${tr.x}px, ${tr.y}px) translate(-50%, -50%)`;
                    tr.el.style.width = size + 'px';
                    tr.el.style.height = size + 'px';
                    tr.el.style.opacity = op;
                    tr.el.style.background = color;
                });
            }
        }

        let lastT = 0;
        function animate(t) {
            requestAnimationFrame(animate);
            const dt = Math.min((t - lastT) / 1000, .05);
            lastT = t;

            updateScroll();
            updateCamera(dt);
            updateParallax();
            updateCursor();

            sparkLight.position.x = Math.sin(t * .001) * 3;
            sparkLight.position.z = Math.cos(t * .0008) * 3 + 2;
            sunLight.intensity = 4.5 + Math.sin(t * .0005) * .5;

            renderer.render(scene, camera);

            if (ctxR && isGlitching && !isMobile) {
                ctxR.clearRect(0,0, innerWidth, innerHeight);
                ctxG.clearRect(0,0, innerWidth, innerHeight);
                ctxB.clearRect(0,0, innerWidth, innerHeight);
                ctxR.drawImage(canvas, 0, 0, innerWidth, innerHeight);
                ctxG.drawImage(canvas, 0, 0, innerWidth, innerHeight);
                ctxB.drawImage(canvas, 0, 0, innerWidth, innerHeight);
            }
        }

        // ════════════════════════════════════════
        // LOADER
        // ════════════════════════════════════════
        let loadPct = 0;
        const ldrProg = document.getElementById('ldr-prog');
        const ldrFill = document.getElementById('ldr-fill');
        const ldrPct = document.getElementById('ldr-pct');

        buildAllCars();
        updateScrollHeight();
        requestAnimationFrame(animate);

        setTimeout(() => {
            if (loadPct < 100) {
                loadedImgs = 6; // Force skip
                loadPct = 100;
            }
            if (typeof pageFullyLoaded !== 'undefined') pageFullyLoaded = true;
        }, 4000);

        const loadInterval = setInterval(() => {
            loadPct += Math.random() * 4 + 1;
            if (loadPct >= 99 && loadedImgs < 6) loadPct = 99; // wait for images
            if (loadPct > 100) loadPct = 100;
            ldrProg.style.width = loadPct + '%';
            ldrFill.style.clipPath = `inset(0 ${100 - loadPct}% 0 0)`;
            ldrFill.style.webkitClipPath = `inset(0 ${100 - loadPct}% 0 0)`;
            ldrPct.textContent = Math.round(loadPct) + '%';
            if (loadPct >= 100) {
                clearInterval(loadInterval);
                setTimeout(() => {
                    const lc = document.getElementById('loader-content');
                    const sw = document.getElementById('loader-sweep');
                    const lt = document.getElementById('loader-top');
                    const lb = document.getElementById('loader-bottom');
                    const loader = document.getElementById('loader');
                    
                    if (lc) lc.style.opacity = '0';
                    if (sw) sw.classList.add('sweep');
                    
                    setTimeout(() => {
                        if (lt) lt.style.transform = 'translateY(-100%)';
                        if (lb) lb.style.transform = 'translateY(100%)';
                        if (sw) sw.style.opacity = '0';
                        
                        setTimeout(() => {
                            if (loader) loader.style.display = 'none';
                            sceneReady = true;
                            if (typeof pageFullyLoaded !== 'undefined') pageFullyLoaded = true;
                            // Hero text reveal
                            document.getElementById('l-s0').classList.add('vis');
                            document.getElementById('h-s0').classList.add('vis');
                            setTimeout(() => {
                                document.getElementById('b-s0').classList.add('vis');
                                document.getElementById('c-s0').classList.add('vis');
                                sparkLight.intensity = 2;
                            }, 400);
                        }, 600);
                    }, 300);
                    if (typeof triggerGlitch === 'function') setTimeout(triggerGlitch, 400);
                }, 300);
            }
        }, 40);

        // Audio Context & Master Gain
        let audioCtx = null;
        let masterGain;
        let userHasInteracted = false;
        let pageFullyLoaded = false;

        async function getAudioContext() {
            if (!audioCtx) {
                try {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    masterGain = audioCtx.createGain();
                    masterGain.gain.value = 0.4;
                    masterGain.connect(audioCtx.destination);
                } catch (e) { return null; }
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }
            return audioCtx;
        }

        const unlockAudio = async () => {
            if (!userHasInteracted) {
                userHasInteracted = true;
                await getAudioContext();
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
                const muteBtn = document.getElementById('mute-btn');
                if (muteBtn) muteBtn.innerText = '🔊';
            }
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        async function playEngRev(startF = 90, endF = null, dur = 0.4) {
            if (!userHasInteracted) return;
            const ctx = await getAudioContext();
            if (!ctx) return;
            const o = ctx.createOscillator(), g = ctx.createGain(), d = ctx.createWaveShaper();
            const curve = new Float32Array(256);
            for (let i = 0; i < 256; i++) { const x = i * 2 / 256 - 1; curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x)); }
            d.curve = curve; d.oversample = '4x';
            o.connect(d); d.connect(g); g.connect(masterGain);
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(startF, ctx.currentTime);
            
            if (endF !== null) {
                o.frequency.exponentialRampToValueAtTime(endF, ctx.currentTime + dur * 0.8);
                o.frequency.exponentialRampToValueAtTime(startF * 0.6, ctx.currentTime + dur);
            } else {
                o.frequency.exponentialRampToValueAtTime(startF * 2.5, ctx.currentTime + dur * 0.3);
                o.frequency.exponentialRampToValueAtTime(startF * 0.6, ctx.currentTime + dur);
            }
            
            g.gain.setValueAtTime(0.1, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            o.start(); o.stop(ctx.currentTime + dur);
        }

        async function playThump() {
            if (!userHasInteracted || !pageFullyLoaded) return;
            const ctx = await getAudioContext();
            if (!ctx) return;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(masterGain);
            o.type = 'sine';
            o.frequency.setValueAtTime(40, ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.2);
            g.gain.setValueAtTime(0.06, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            o.start(); o.stop(ctx.currentTime + 0.2);
        }

        async function playCrackle() {
            if (!userHasInteracted || !pageFullyLoaded) return;
            const ctx = await getAudioContext();
            if (!ctx) return;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(masterGain);
            o.type = 'square';
            o.frequency.setValueAtTime(1200, ctx.currentTime);
            o.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.15);
            g.gain.setValueAtTime(0.03, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            o.start(); o.stop(ctx.currentTime + 0.15);
        }

        document.querySelectorAll('.coll-card').forEach(c => c.addEventListener('mouseenter', () => playEngRev(85, null, 0.3)));
        document.querySelectorAll('.s-cta, .mpick').forEach(el => el.addEventListener('click', () => playEngRev(110, 280, 0.4)));

}

try {
    if (!window.WebGLRenderingContext) throw new Error("WebGL not supported");
    init();
} catch (err) {
    console.error('INIT FAILED:', err);
    document.body.style.background = '#0a0a0a';
    document.body.innerHTML = '<div style="color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">BMW — Loading Error. Please refresh.</div>';
}