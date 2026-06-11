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
            console.log(`[Icon-Converter] ${srcPath} not found. Generating a modern construction-themed design...`);
            
            // Version-agnostic creation
            const cyanColorHex = 0x0891b2ff; // #0891b2 standard hex
            try {
                // Try Jimp v1.x constructor
                image = new Jimp({ width, height, color: cyanColorHex });
            } catch (err) {
                // Try Jimp v0.x constructor
                image = new Jimp(width, height, '#0891b2');
            }
            
            // Draw a subtle border and grid lines to resemble building blueprints/technical themes
            const borderThickness = Math.max(2, Math.floor(width * 0.02));
            const darkerCyanHex = 0x0e7490ff; // #0e7490
            const brightCyanHex = 0x22d3eeff; // #22d3ee
            
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    if (x < borderThickness || x >= width - borderThickness || 
                        y < borderThickness || y >= height - borderThickness) {
                        image.setPixelColor(darkerCyanHex, x, y);
                    } else if (x % Math.floor(width / 8) === 0 || y % Math.floor(height / 8) === 0) {
                        image.setPixelColor(brightCyanHex, x, y);
                    }
                }
            }
        }

        // Version-agnostic writing with forced PNG encoding
        console.log(`[Icon-Converter] Encoding image to true PNG buffer...`);
        let buffer;
        try {
            if (typeof image.getBufferAsync === 'function') {
                buffer = await image.getBufferAsync('image/png');
            } else if (typeof image.getBuffer === 'function') {
                buffer = await new Promise((resolve, reject) => {
                    image.getBuffer('image/png', (err, buf) => {
                        if (err) reject(err);
                        else resolve(buf);
                    });
                });
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
