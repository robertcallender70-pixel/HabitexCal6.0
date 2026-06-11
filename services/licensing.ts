// A simple obfuscation for our secret salt. In a real scenario, this would be more complex.
const _0x5a1t = 'SEVjcmV0U2FsdEZvckxpY2Vuc2VLZXlHZW5lcmF0aW9uSGFiaXRleENhbGN1bGFQcm8zLjA=';

const getSecret = (): string => {
    try {
        return atob(_0x5a1t);
    } catch (e) {
        // Fallback for environments where atob might fail unexpectedly
        return 'SecretSaltForLicenseKeyGenerationHabitexCalculaPro3.0';
    }
};

// Uses the browser's built-in crypto API for SHA-256 hashing
async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Validates a license key's signature against a device ID.
 * @param licenseKey The key provided by the user.
 * @param deviceId The unique ID of the user's device/browser.
 * @returns A promise that resolves to the license payload if the signature is valid, otherwise null.
 */
export async function validateLicenseKey(licenseKey: string, deviceId: string): Promise<any | null> {
    if (!licenseKey || typeof licenseKey !== 'string' || !licenseKey.includes('.')) {
        return null;
    }

    const parts = licenseKey.split('.');
    if (parts.length !== 2) {
        return null;
    }

    const [encodedPayload, signature] = parts;

    try {
        const payloadStr = atob(encodedPayload);
        const payload = JSON.parse(payloadStr);

        // Basic check on payload content
        if (payload.app !== 'habitex') {
            return null;
        }

        const secret = getSecret();
        const dataToSign = encodedPayload + deviceId + secret;
        const expectedSignature = await sha256(dataToSign);

        // Return the payload if the signature matches, regardless of expiration.
        // The calling component will handle the expiration logic.
        return signature === expectedSignature ? payload : null;

    } catch (error) {
        console.error("License validation error:", error);
        return null;
    }
}
