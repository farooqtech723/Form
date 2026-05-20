const text = `tellimed
AUF NUMMER SICHER
Julia Feldmann
Außendienst
+49 (0) 176 - 14 75 46 00
tellimed GmbH & Co. KG
Kesselstr. 30 A, 47546 Kalkar
+49 (0) 28 24 - 9 77 57 - 0
+49 (0) 28 24 - 9 77 57 - 57
post@tellimed.de
www.tellimed.de`;

function parseAndFillBusinessCard(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(?:[\+\*]49|0|O)[\s\(\)Oo0-9\-\/]{6,}/;

    let foundEmail = '';
    let foundPhone = '';

    for (const line of lines) {
        if (!foundEmail) {
            const emailMatch = line.match(emailRegex);
            if (emailMatch) foundEmail = emailMatch[0];
        }

        const phoneMatch = line.match(phoneRegex);
        if (phoneMatch) {
            const numStr = phoneMatch[0].replace(/[\s\(\)\-\/Oo]/g, '');
            const isMobile = numStr.startsWith('+491') || numStr.startsWith('01') || numStr.startsWith('*491');
            if (!foundPhone || isMobile) {
                foundPhone = phoneMatch[0];
            }
        }
    }

    const excludeKeywords = ['tel', 'fax', 'mobil', 'web', 'www', '.de', '.com', '@', 'telefon', 'außendienst', 'sicher'];
    const possibleNames = lines.filter(line => {
        if (line.match(emailRegex) || line.match(phoneRegex)) return false;
        const lower = line.toLowerCase();
        for (const kw of excludeKeywords) {
            if (lower.includes(kw)) return false;
        }
        if (line.match(/\d{3,}/)) return false;
        if (/^[^a-zA-Z0-9]+$/.test(line)) return false;
        return true;
    });

    let foundName = '';
    let foundEinheit = '';

    const companyIndicators = ['gmbh', 'kg', 'ag', 'co.', 'inc', 'llc', 'tellimed'];

    for (let i = 0; i < possibleNames.length; i++) {
        const line = possibleNames[i];
        const lower = line.toLowerCase();
        const isCompany = companyIndicators.some(ind => lower.includes(ind));

        if (isCompany && !foundEinheit) {
            foundEinheit = line;
            possibleNames.splice(i, 1);
            i--;
        }
    }

    for (let i = 0; i < possibleNames.length; i++) {
        const line = possibleNames[i];
        const words = line.split(/\s+/);
        const isName = words.length >= 2 && words.length <= 4 && words.every(w => /^[A-ZÄÖÜ]/.test(w));

        if (isName && !foundName) {
            foundName = line;
            possibleNames.splice(i, 1);
            i--;
        }
    }

    if (!foundName && possibleNames.length > 0) {
        foundName = possibleNames[0];
        possibleNames.shift();
    }
    if (!foundEinheit && possibleNames.length > 0) {
        foundEinheit = possibleNames[0];
    }

    console.log({
        email: foundEmail,
        phone: foundPhone,
        name: foundName,
        einheit: foundEinheit
    });
}

parseAndFillBusinessCard(text);
