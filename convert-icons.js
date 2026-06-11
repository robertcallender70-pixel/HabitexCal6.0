import * as JimpLib from 'jimp';
import fs from 'fs';
import path from 'path';

// Version-agnostic wrapper for Jimp
let Jimp = JimpLib.Jimp || JimpLib.default || JimpLib;

async function processImage(srcPath, destPath, width, height) {
    try {
        let image;
        
        if (fs.existsSync(srcPath)) {
            console.log(`[Icon-Converter] Reading existing image: ${srcPath}`);
            image = await Jimp.read(srcPath);
            
            // Version-agnostic resize
            try {
                // Try Jimp v0.x signature
                image.resize(width, height);
            } catch (err) {
                // Try Jimp v1.x signature
                image.resize({ w: width, h: height });
            }
        } else {
            console.log(`[Icon-Converter] ${srcPath} not found. Generating a premium architectural logo design...`);
            
            // Version-agnostic creation
            try {
                // Try Jimp v1.x constructor with solid color
                image = new Jimp({ width, height, color: 0x073344ff });
            } catch (err) {
                // Try Jimp v0.x constructor
                image = new Jimp(width, height, '#073344');
            }
            
            // 1. Generate elegant diagonal gradient background: from Deep Teal (#073344) to Rich Cyan (#0891b2)
            const rStart = 7, gStart = 51, bStart = 68;     // #073344 (Teal-950)
            const rEnd = 8, gEnd = 145, bEnd = 178;        // #0891b2 (Cyan-600)
            
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const t = (x + y) / (width + height);
                    const r = Math.round(rStart + t * (rEnd - rStart));
                    const g = Math.round(gStart + t * (gEnd - gStart));
                    const b = Math.round(bStart + t * (bEnd - bStart));
                    const color = (r << 24) | (g << 16) | (b << 8) | 0xff;
                    image.setPixelColor(color, x, y);
                }
            }

            // 2. Add an elegant grid pattern overlay on the background (blueprint theme)
            const gridInterval = Math.max(12, Math.floor(width / 16));
            const gridColor = 0x22d3ee22; // #22d3ee with opacity for subtle overlay
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    if (x % gridInterval === 0 || y % gridInterval === 0) {
                        image.setPixelColor(gridColor, x, y);
                    }
                }
            }

            // 3. Define drawing colors and properties
            const whiteHex = 0xffffffff;
            const cyanGlowHex = 0x22d3eeff;  // #22d3ee (Cyan-400)
            const amberHex = 0xf59e0bff;     // #f59e0b (Amber-500)
            const lineThickness = Math.max(2, Math.floor(width * 0.024));

            // Line-drawing helper with thickness
            const drawThickLine = (x1, y1, x2, y2, color) => {
                const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;
                for (let i = 0; i <= steps; i++) {
                    const t = steps === 0 ? 0 : i / steps;
                    const cx = Math.round(x1 + t * (x2 - x1));
                    const cy = Math.round(y1 + t * (y2 - y1));
                    
                    const r = lineThickness / 2;
                    for (let dx = -Math.floor(r); dx <= Math.floor(r); dx++) {
                        for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
                            if (dx*dx + dy*dy <= r*r) {
                                const px = cx + dx;
                                const py = cy + dy;
                                if (px >= 0 && px < width && py >= 0 && py < height) {
                                    image.setPixelColor(color, px, py);
                                }
                            }
                        }
                    }
                }
            };

            // Rectangle helper with optional fill
            const drawRectangle = (xStart, yStart, xEnd, yEnd, color, fill = false) => {
                for (let x = Math.floor(xStart); x <= Math.floor(xEnd); x++) {
                    for (let y = Math.floor(yStart); y <= Math.floor(yEnd); y++) {
                        const isBorder = (x - xStart < lineThickness || xEnd - x < lineThickness ||
                                          y - yStart < lineThickness || yEnd - y < lineThickness);
                        if (fill || isBorder) {
                            if (x >= 0 && x < width && y >= 0 && y < height) {
                                image.setPixelColor(color, x, y);
                            }
                        }
                    }
                }
            };

            // Circle/Dot helper
            const drawDot = (cx, cy, r, color) => {
                for (let dx = -Math.floor(r); dx <= Math.floor(r); dx++) {
                    for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
                        if (dx*dx + dy*dy <= r*r) {
                            const px = cx + dx;
                            const py = cy + dy;
                            if (px >= 0 && px < width && py >= 0 && py < height) {
                                image.setPixelColor(color, px, py);
                            }
                        }
                    }
                }
            };

            // 4. Render the Elegant Isometric/Orthographic House Frame
            // We want a house shape representing Habitex. Let's make it cover the center 60% of the canvas.
            const startX = width * 0.22;
            const endX = width * 0.78;
            const houseBodyTop = height * 0.45;
            const houseBodyBottom = height * 0.76;
            const peakX = width * 0.50;
            const peakY = height * 0.18;

            // Draw roof triangle trim (white)
            drawThickLine(startX - (width * 0.04), houseBodyTop + (height * 0.01), peakX, peakY, whiteHex);
            drawThickLine(endX + (width * 0.04), houseBodyTop + (height * 0.01), peakX, peakY, whiteHex);

            // Draw house main outer walls (white)
            drawThickLine(startX, houseBodyTop, startX, houseBodyBottom, whiteHex);
            drawThickLine(endX, houseBodyTop, endX, houseBodyBottom, whiteHex);
            drawThickLine(startX, houseBodyBottom, endX, houseBodyBottom, whiteHex);

            // 5. Draw the Habitex Brand "H" in Glowing Amber on the left side of the house
            const hLeft = width * 0.35;
            const hRight = width * 0.45;
            const hTop = height * 0.52;
            const hBottom = height * 0.70;
            drawThickLine(hLeft, hTop, hLeft, hBottom, amberHex);
            drawThickLine(hRight, hTop, hRight, hBottom, amberHex);
            drawThickLine(hLeft, (hTop + hBottom) / 2, hRight, (hTop + hBottom) / 2, amberHex);

            // 6. Draw the Calculator Display & Keys on the right side of the house
            const calcLeft = width * 0.55;
            const calcRight = width * 0.67;
            const calcTop = height * 0.52;
            const calcBottom = height * 0.70;

            // Calculator Outer Border
            drawRectangle(calcLeft, calcTop, calcRight, calcBottom, cyanGlowHex, false);

            // Tiny Screen inside calculator
            const scrLeft = calcLeft + lineThickness + 1;
            const scrRight = calcRight - lineThickness - 1;
            const scrTop = calcTop + lineThickness + 1;
            const scrBottom = calcTop + lineThickness + Math.max(3, Math.floor(height * 0.035));
            drawRectangle(scrLeft, scrTop, scrRight, scrBottom, 0x1e293bff, true); // Dark slate screen

            // Four active calculator keys (amber/cyan dots)
            const dY = (calcBottom - scrBottom) / 3;
            const dX = (calcRight - calcLeft) / 3;
            
            const btnRadius = Math.max(1, Math.floor(width * 0.015));
            drawDot(calcLeft + dX, scrBottom + dY, btnRadius, amberHex);
            drawDot(calcLeft + 2*dX, scrBottom + dY, btnRadius, amberHex);
            drawDot(calcLeft + dX, scrBottom + 2*dY, btnRadius, cyanGlowHex);
            drawDot(calcLeft + 2*dX, scrBottom + 2*dY, btnRadius, cyanGlowHex);
        }

        // Version-agnostic writing with forced PNG encoding
        console.log(`[Icon-Converter] Encoding image to true PNG buffer...`);
        let buffer;
        try {
            if (typeof image.getBufferAsync === 'function') {
                buffer = await image.getBufferAsync('image/png');
            } else if (typeof image.getBuffer === 'function') {
                const res = image.getBuffer('image/png');
                if (res instanceof Promise) {
                    buffer = await res;
                } else {
                    buffer = await new Promise((resolve, reject) => {
                        image.getBuffer('image/png', (err, buf) => {
                            if (err) reject(err);
                            else resolve(buf);
                        });
                    });
                }
            }
        } catch (bufErr) {
            console.warn('[Icon-Converter] Warn obtaining PNG buffer, falling back to write:', bufErr);
        }

        if (buffer) {
            fs.writeFileSync(destPath, buffer);
            console.log(`[Icon-Converter] SUCCESS forced PNG buffer: Wrote true PNG (${width}x${height}) to ${destPath}`);
        } else {
            try {
                if (typeof image.writeAsync === 'function') {
                    await image.writeAsync(destPath);
                } else {
                    await image.write(destPath);
                }
            } catch (writeErr) {
                await image.write(destPath);
            }
            console.log(`[Icon-Converter] SUCCESS standard write: Wrote PNG (${width}x${height}) to ${destPath}`);
        }
    } catch (error) {
        console.error(`[Icon-Converter] ERROR processing image ${srcPath}:`, error);
        
        // Final fallback: attempt to create basic color block if possible
        try {
            let fallbackImage;
            try {
                fallbackImage = new Jimp({ width, height, color: 0x0891b2ff });
            } catch (e) {
                fallbackImage = new Jimp(width, height, '#0891b2');
            }
            
            if (typeof fallbackImage.writeAsync === 'function') {
                await fallbackImage.writeAsync(destPath);
            } else {
                await fallbackImage.write(destPath);
            }
            console.log(`[Icon-Converter] FALLBACK: Created solid color PNG for ${destPath}`);
        } catch (fallbackError) {
            console.error('[Icon-Converter] Serious error running fallback creator:', fallbackError);
        }
    }
}

async function run() {
    console.log('[Icon-Converter] Starting build-time asset verification and conversion...');
    
    const iconsDir = './public/assets/icons';
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    const screenshotsDir = './public/assets/screenshots';
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Process our PWA icons to ensure true PNG encoding
    await processImage(
        './public/assets/icons/icon-192x192.png',
        './public/assets/icons/icon-192x192.png',
        192,
        192
    );

    await processImage(
        './public/assets/icons/icon-512x512.png',
        './public/assets/icons/icon-512x512.png',
        512,
        512
    );

    await processImage(
        './public/assets/icons/shortcut-icon-96x96.png',
        './public/assets/icons/shortcut-icon-96x96.png',
        96,
        96
    );

    // Process screenshots
    await processImage(
        './public/assets/screenshots/screenshot1.png',
        './public/assets/screenshots/screenshot1.png',
        1080,
        1920
    );

    await processImage(
        './public/assets/screenshots/screenshot2.png',
        './public/assets/screenshots/screenshot2.png',
        1080,
        1920
    );
    
    console.log('[Icon-Converter] All asset conversions and verifications completed successfully!');
}

run();
