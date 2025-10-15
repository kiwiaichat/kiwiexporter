document.addEventListener("DOMContentLoaded",function(){
    document.getElementById("img").addEventListener("click",function(){
        document.getElementById("input").click()
    })
})

// Function to extract metadata from image
async function extractImageMetadata(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const bytes = new Uint8Array(arrayBuffer);

            try {
                // Check if it's a PNG file
                if (file.type === 'image/png' || (bytes.length > 8 &&
                    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47)) {

                    const metadata = extractPNGMetadata(bytes);
                    resolve(metadata);
                } else {
                    // Try EXIF extraction for other formats
                    extractEXIFMetadata(file).then(resolve).catch(() => resolve({}));
                }
            } catch (error) {
                console.error('Error extracting metadata:', error);
                resolve({});
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// Extract metadata from PNG chunks
function extractPNGMetadata(bytes) {
    const metadata = {};
    let offset = 8; // Skip PNG signature

    while (offset < bytes.length - 8) {
        // Read chunk length
        const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) |
                      (bytes[offset + 2] << 8) | bytes[offset + 3];
        offset += 4;

        // Read chunk type
        const type = String.fromCharCode(bytes[offset], bytes[offset + 1],
                                       bytes[offset + 2], bytes[offset + 3]);
        offset += 4;

        // Check for custom chunks that might contain character data
        if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
            const chunkData = bytes.slice(offset, offset + length);
            const textData = decodeTextChunk(chunkData, type);
            if (textData) {
                // Look for "chara" field in the text data
                if (textData.includes('chara')) {
                    metadata.chara = textData;
                }
                // Also check for other common character data fields
                if (textData.includes('character') || textData.includes('char_data')) {
                    metadata.characterData = textData;
                }
            }
        } else if (type === 'caRt') { // Custom chunk for character data
            try {
                const chunkData = bytes.slice(offset, offset + length);
                const decoder = new TextDecoder('utf-8');
                const charaData = decoder.decode(chunkData);
                if (charaData.includes('chara')) {
                    metadata.chara = charaData;
                }
            } catch (e) {
                console.warn('Failed to decode caRt chunk:', e);
            }
        }

        // Skip to next chunk (length + 4 bytes CRC)
        offset += length + 4;
    }

    return metadata;
}

// Clean and validate base64 string, handling common corruption issues
function cleanBase64String(str) {
    if (!str || typeof str !== 'string') {
        return null;
    }

    // Remove common prefixes that might be present
    let cleaned = str
        .replace(/chara["\s]*[:=]?\s*["\s]*/gi, '') // Remove "chara" prefixes
        .replace(/["\s]/g, '') // Remove quotes and whitespace
        .replace(/[^A-Za-z0-9+/=]/g, '') // Remove non-base64 characters
        .replace(/=+$/, ''); // Remove trailing equals for now

    // Ensure length is valid for base64 (multiple of 4 when padding is considered)
    const remainder = cleaned.length % 4;
    if (remainder > 0) {
        // Try to fix common padding issues
        const paddingNeeded = 4 - remainder;
        cleaned = cleaned.padEnd(cleaned.length + paddingNeeded, '=');
    }

    return cleaned;
}

// Validate if a string is valid base64
function isValidBase64(str) {
    try {
        if (!str || str.length === 0) {
            return false;
        }

        // Check if string matches base64 pattern (A-Z, a-z, 0-9, +, /, =)
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(str)) {
            return false;
        }

        // Check if string length is valid (multiple of 4, accounting for padding)
        const length = str.length;
        if (length % 4 > 0 && length % 4 !== 2 && length % 4 !== 3) {
            return false;
        }

        // Try to decode to verify it's actually valid base64
        atob(str);
        return true;
    } catch (e) {
        return false;
    }
}

// Safely decode base64 with multiple fallback attempts
function safeBase64Decode(str) {
    const cleaned = cleanBase64String(str);
    if (!cleaned) {
        throw new Error('No valid base64 content found');
    }

    // Try different padding approaches if the first attempt fails
    const paddingAttempts = [cleaned, cleaned + '=', cleaned + '=='];

    for (const attempt of paddingAttempts) {
        if (isValidBase64(attempt)) {
            try {
                const decoded = atob(attempt);

                // Try to clean and parse the JSON, handling control characters
                const cleanJSON = cleanJSONString(decoded);
                const parsed = JSON.parse(cleanJSON);
                return cleanJSON;
            } catch (e) {
                continue;
            }
        }
    }

    throw new Error('Unable to decode valid base64 data');
}

// Clean JSON string by removing or escaping problematic control characters
function cleanJSONString(str) {
    // First, try to identify and fix the specific control character issue
    let cleaned = str;

    // Look for the specific control character that's causing issues
    // Based on the error "Bad control character in string literal in JSON at position 257"
    // Let's find and handle the problematic character
    for (let i = 0; i < cleaned.length; i++) {
        const charCode = cleaned.charCodeAt(i);
        // If we find a control character in the range that breaks JSON
        if (charCode >= 0x00 && charCode <= 0x1F && charCode !== 0x09 && charCode !== 0x0A && charCode !== 0x0D) {
            // Replace with a space or remove it
            cleaned = cleaned.substring(0, i) + ' ' + cleaned.substring(i + 1);
        }
    }

    return cleaned;
}


// Decode PNG text chunks
function decodeTextChunk(chunkData, type) {
    try {
        const decoder = new TextDecoder('utf-8');
        let text = decoder.decode(chunkData);

        // Handle compressed text chunks (zTXt)
        if (type === 'zTXt') {
            // For now, just return as-is since we can't easily decompress in browser
            return text;
        }

        return text;
    } catch (e) {
        console.warn('Failed to decode text chunk:', e);
        return null;
    }
}

// Extract EXIF metadata for non-PNG images
async function extractEXIFMetadata(file) {
    return new Promise((resolve) => {
        // Simple EXIF extraction - look for common EXIF patterns
        const reader = new FileReader();
        reader.onload = function(e) {
            const bytes = new Uint8Array(e.target.result);

            // Look for EXIF header (0xFFE1)
            for (let i = 0; i < bytes.length - 4; i++) {
                if (bytes[i] === 0xFF && bytes[i + 1] === 0xE1) {
                    // Found EXIF data, try to extract
                    try {
                        const exifLength = (bytes[i + 2] << 8) | bytes[i + 3];
                        const exifData = bytes.slice(i + 4, i + 4 + exifLength);

                        // Look for character data in EXIF
                        const decoder = new TextDecoder('utf-8');
                        const exifString = decoder.decode(exifData);

                        if (exifString.includes('chara')) {
                            const metadata = { chara: exifString };
                            resolve(metadata);
                            return;
                        }
                    } catch (e) {
                        console.warn('Failed to parse EXIF:', e);
                    }
                }
            }
            resolve({});
        };
        reader.readAsArrayBuffer(file);
    });
}

document.getElementById("input").addEventListener("change",function(){
    let file = this.files[0]
    if (!file) return;

    // Show loading state
    document.getElementById("results").innerHTML = "Extracting metadata...";

    extractImageMetadata(file).then(metadata => {
        // Display results

        if (metadata.chara) {
             console.log((metadata.chara).replace("chara",""))
            try {
                // Use the safer base64 decoding function
                const decodedString = safeBase64Decode(metadata.chara);
                let data = JSON.parse(decodedString)["data"];

                // He said screw it, I'll smile right through it

                // map to KIWI format

                /*{
       "1": {
         "name": "",
         "description": ",
         "author": "",
         "status": "public",
         "avatar": "/",
         "sys_pmt": "",
         "greeting": "",
         "chats": "",
         "tags": [
           "Kiwi"
         ],
         "views": 0
       },*/

                let kiwi = {
                  "name": data["name"],
                  "sys_pmt": data["description"],
                  // this format makes me want to kill myself, and i mean it
                  "greeting": data["scenario"] + "\n\n" + data["first_mes"].replaceAll("<START>","").replaceAll("<END>","") + data["creator_notes"],
                  "description": data["creator_notes"],
                  "tags": data["tags"],
                }

                let encod = JSON.stringify(kiwi)
                // remove non latin1 characters
                encod = encod.replace(/[^A-Za-z0-9+/=]/g, '');
                document.getElementById("results").innerHTML = btoa(encod);

            } catch (error) {
                console.error('Error processing character data:', error);

                let errorMessage = error.message;
                let userFriendlyMessage = '';

                // Provide more specific error messages based on the type of error
                if (error.message.includes('base64')) {
                    userFriendlyMessage = 'Invalid or corrupted base64 data found in the image metadata. The character data may be damaged or incomplete.';
                } else if (error.message.includes('JSON')) {
                    userFriendlyMessage = 'The decoded data is not valid JSON format. The character data structure may be corrupted.';
                } else if (error.message.includes('No valid base64 content')) {
                    userFriendlyMessage = 'No valid character data found in the image. The image may not contain the expected metadata format.';
                } else {
                    userFriendlyMessage = 'An error occurred while processing the character data from the image.';
                }

                document.getElementById("results").innerHTML = `<div style="padding: 10px; color: #d86868;">
                    <h4>❌ Error processing character data</h4>
                    <p>${userFriendlyMessage}</p>
                    <details style="margin-top: 8px;">
                        <summary style="cursor: pointer; color: #888;">Technical Details</summary>
                        <p style="font-family: monospace; font-size: 12px; margin-top: 8px; word-break: break-all;">${errorMessage}</p>
                    </details>
                </div>`;
            }
        } else {
            document.getElementById("results").innerHTML = `<div style="padding: 10px; color: #d8a868;">
                <h4>⚠️ No character data found</h4>
                <p>No 'chara' metadata found in the image.</p>
            </div>`;
        }
    }).catch(error => {
        console.error('Extraction error:', error);
        document.getElementById("results").innerHTML = `<div style="padding: 10px; color: #d86868;">
            <h4>❌ Error extracting metadata</h4>
            <p>${error.message}</p>
        </div>`;
    });
})

document.getElementsByTagName("button")[1].addEventListener("click",function(){
    // copy to clipboard
    navigator.clipboard.writeText(document.getElementById("results").innerHTML)
    alert("Copied to clipboard")
})