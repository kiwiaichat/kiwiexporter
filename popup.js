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
        const resultsDiv = document.getElementById("results");

        if (metadata.chara) {
           let data = JSON.parse(atob(metadata.chara))["data"]

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


        }
    }).catch(error => {
        console.error('Extraction error:', error);
        document.getElementById("results").innerHTML = `<div style="padding: 10px; color: #d86868;">
            <h4>❌ Error extracting metadata</h4>
            <p>${error.message}</p>
        </div>`;
    });
})