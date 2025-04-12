/**
 * Zjednodušený driver pro ST7735 1.8" TFT displej
 */
//% weight=100 color=#0050BB icon="\uf108"
//% groups='["Základní", "Barvy", "Kreslení", "Text"]'
namespace ST7735 {
    // Definice pinů
    const TFT_RS = DigitalPin.P0    // DC/RS pin
    const TFT_CS = DigitalPin.P1    // CS pin
    const TFT_RST = DigitalPin.P8   // Reset pin
    const TFT_SDA = DigitalPin.P15  // MOSI pin
    const TFT_CLK = DigitalPin.P13  // SCK pin

    // Příkazy displeje - jen ty nezbytné
    const ST7735_SWRESET = 0x01
    const ST7735_SLPOUT = 0x11
    const ST7735_DISPON = 0x29
    const ST7735_CASET = 0x2A
    const ST7735_RASET = 0x2B
    const ST7735_RAMWR = 0x2C
    const ST7735_MADCTL = 0x36
    const ST7735_COLMOD = 0x3A

    // Globální proměnná pro uchování aktuální rotace displeje
    let currentRotation = 0;

    // Definice barev (jako funkce, aby nedocházelo k chybám)
    //% block="černá"
    //% group="Barvy" weight=90
    export function BLACK(): number { return 0x0000; }

    //% block="červená"
    //% group="Barvy" weight=89
    export function RED(): number { return 0xF800; }

    //% block="zelená"
    //% group="Barvy" weight=88
    export function GREEN(): number { return 0x07E0; }

    //% block="modrá"
    //% group="Barvy" weight=87
    export function BLUE(): number { return 0x001F; }

    //% block="bílá"
    //% group="Barvy" weight=86
    export function WHITE(): number { return 0xFFFF; }

    //% block="žlutá"
    //% group="Barvy" weight=85
    export function YELLOW(): number { return 0xFFE0; }

    //% block="purpurová"
    //% group="Barvy" weight=84
    export function MAGENTA(): number { return 0xF81F; }

    //% block="azurová"
    //% group="Barvy" weight=83
    export function CYAN(): number { return 0x07FF; }

    /**
     * Vytvoření RGB barvy
     * @param r červená (0-255)
     * @param g zelená (0-255)
     * @param b modrá (0-255)
     */
    //% block="barva z RGB r %r g %g b %b"
    //% weight=95 group="Barvy"
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    //% inlineInputMode=inline
    export function color565(r: number, g: number, b: number): number {
        // Převod 24-bit RGB (8-8-8) na 16-bit RGB565 formát
        return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)
    }

    // Rozměry displeje
    export const WIDTH = 128
    export const HEIGHT = 160

    // Ultra-rychlé SPI funkce
    function cmd(c: number): void {
        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 0)
        pins.spiWrite(c)
        pins.digitalWritePin(TFT_CS, 1)
    }

    function data(d: number): void {
        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)
        pins.spiWrite(d)
        pins.digitalWritePin(TFT_CS, 1)
    }

    // Nastavení adresního okna pro konkrétní oblast
    function setWindow(x0: number, y0: number, x1: number, y1: number): void {
        cmd(ST7735_CASET)
        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)
        pins.spiWrite(0)
        pins.spiWrite(x0)
        pins.spiWrite(0)
        pins.spiWrite(x1)
        pins.digitalWritePin(TFT_CS, 1)

        cmd(ST7735_RASET)
        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)
        pins.spiWrite(0)
        pins.spiWrite(y0)
        pins.spiWrite(0)
        pins.spiWrite(y1)
        pins.digitalWritePin(TFT_CS, 1)

        cmd(ST7735_RAMWR)
    }

    // Rychlá inicializace displeje
    function initDisplay(): void {
        // Reset displeje
        pins.digitalWritePin(TFT_RST, 1)
        basic.pause(1)
        pins.digitalWritePin(TFT_RST, 0)
        basic.pause(1)
        pins.digitalWritePin(TFT_RST, 1)
        basic.pause(1)

        // Základní inicializace - naprosté minimum
        cmd(ST7735_SWRESET)
        basic.pause(10)

        cmd(ST7735_SLPOUT)
        basic.pause(10)

        cmd(ST7735_COLMOD)
        data(0x05) // 16-bit barevný režim (RGB565)

        cmd(ST7735_MADCTL)
        data(0xC8) // Orientace displeje - upravte dle potřeby

        cmd(ST7735_DISPON)
    }

    /**
     * Inicializace ST7735 displeje
     */
    //% block="inicializovat ST7735 displej"
    //% weight=100 group="Základní"
    export function init(): void {
        // Nastavení SPI na maximální frekvenci
        pins.spiPins(TFT_SDA, DigitalPin.P14, TFT_CLK)
        pins.spiFormat(8, 0)
        pins.spiFrequency(16000000) // Extrémní 16MHz - testujte při problémech snížení

        pins.digitalWritePin(TFT_CS, 1)
        pins.digitalWritePin(TFT_RS, 0)

        initDisplay()
    }

    /**
     * Vyčištění displeje (nastavení na černou nebo jinou barvu)
     * @param color volitelná barva, výchozí je černá
     */
    //% block="vyčistit displej || barvou %color"
    //% weight=98 group="Základní"
    //% expandableArgumentMode="toggle"
    export function clearDisplay(color?: number): void {
        // Pokud color není definován, použij BLACK
        const clr = (color === undefined) ? BLACK() : color;
        fillColor(clr);
    }

    /**
     * Vyplnění celého displeje jednou barvou
     * @param color barva v RGB565 formátu
     */
    //% block="vyplnit displej barvou %color"
    //% weight=90 group="Kreslení"
    export function fillColor(color: number): void {
        // Nastavení adresního okna pro celý displej
        setWindow(0, 0, WIDTH - 1, HEIGHT - 1)

        // Komponenty barvy
        const hi = (color >> 8) & 0xFF
        const lo = color & 0xFF

        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)

        // Vyplňování displeje v blocích pro maximální rychlost
        const CHUNK_SIZE = 1280 // Optimální velikost bloku
        const totalPixels = WIDTH * HEIGHT

        for (let i = 0; i < totalPixels; i += CHUNK_SIZE) {
            let count = Math.min(CHUNK_SIZE, totalPixels - i)
            for (let j = 0; j < count; j++) {
                pins.spiWrite(hi)
                pins.spiWrite(lo)
            }
        }

        pins.digitalWritePin(TFT_CS, 1)
    }

    /**
     * Vyplnění obdélníku barvou
     * @param x x pozice
     * @param y y pozice
     * @param w šířka
     * @param h výška
     * @param color barva v RGB565 formátu
     */
    //% block="vykreslit obdélník na x %x y %y šířka %w výška %h barva %color"
    //% weight=85 group="Kreslení"
    //% inlineInputMode=inline
    //% x.min=0 x.max=127 y.min=0 y.max=159
    //% w.min=1 w.max=128 h.min=1 h.max=160
    export function fillRect(x: number, y: number, w: number, h: number, color: number): void {
        if (x >= WIDTH || y >= HEIGHT) return
        if (x + w > WIDTH) w = WIDTH - x
        if (y + h > HEIGHT) h = HEIGHT - y

        setWindow(x, y, x + w - 1, y + h - 1)

        const hi = (color >> 8) & 0xFF
        const lo = color & 0xFF

        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)

        const pixels = w * h
        for (let i = 0; i < pixels; i++) {
            pins.spiWrite(hi)
            pins.spiWrite(lo)
        }

        pins.digitalWritePin(TFT_CS, 1)
    }

    /**
     * Vykreslení jednoho pixelu
     * @param x souřadnice X
     * @param y souřadnice Y
     * @param color barva pixelu
     */
    //% block="vykreslit pixel na x %x y %y barva %color"
    //% weight=88 group="Kreslení"
    //% inlineInputMode=inline
    //% x.min=0 x.max=127 y.min=0 y.max=159
    export function drawPixel(x: number, y: number, color: number): void {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return
        
        setWindow(x, y, x, y)
        
        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)
        pins.spiWrite((color >> 8) & 0xFF)
        pins.spiWrite(color & 0xFF)
        pins.digitalWritePin(TFT_CS, 1)
    }

    /**
     * Nastavení orientace displeje
     * @param rotation orientace displeje (0-3)
     */
    //% block="nastavit orientaci displeje %rotation"
    //% weight=95 group="Základní"
    //% rotation.min=0 rotation.max=3
    export function setRotation(rotation: number): void {
        currentRotation = rotation; // Uložení aktuální rotace
        cmd(ST7735_MADCTL);
        
        // Různé MADCTL hodnoty pro různé rotace
        switch (rotation) {
            case 0: // 0 stupňů
                data(0xC8);
                break;
            case 1: // 90 stupňů
                data(0xA8);
                break;
            case 2: // 180 stupňů
                data(0x08);
                break;
            case 3: // 270 stupňů
                data(0x68);
                break;
        }
    }

    // Font 6x8 pixelů (každý znak definován jako 8 bajtů - jeden pro každý řádek)
    // První bajt je horní řádek, např. 0x3C znamená "00111100"
    const FONT_6X8: number[][] = [
        // Mezera (32)
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        // ! (33)
        [0x00, 0x00, 0x06, 0x5F, 0x5F, 0x06, 0x00, 0x00],
        // " (34)
        [0x00, 0x03, 0x03, 0x00, 0x03, 0x03, 0x00, 0x00],
        // # (35)
        [0x14, 0x7F, 0x7F, 0x14, 0x7F, 0x7F, 0x14, 0x00],
        // $ (36)
        [0x24, 0x2E, 0x6B, 0x6B, 0x3A, 0x12, 0x00, 0x00],
        // % (37)
        [0x46, 0x66, 0x30, 0x18, 0x0C, 0x66, 0x62, 0x00],
        // & (38)
        [0x30, 0x7A, 0x4F, 0x5D, 0x37, 0x7A, 0x48, 0x00],
        // ' (39)
        [0x04, 0x07, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00],
        // ( (40)
        [0x00, 0x1C, 0x3E, 0x63, 0x41, 0x00, 0x00, 0x00],
        // ) (41)
        [0x00, 0x41, 0x63, 0x3E, 0x1C, 0x00, 0x00, 0x00],
        // * (42)
        [0x08, 0x2A, 0x3E, 0x1C, 0x1C, 0x3E, 0x2A, 0x08],
        // + (43)
        [0x08, 0x08, 0x3E, 0x3E, 0x08, 0x08, 0x00, 0x00],
        // , (44)
        [0x00, 0x80, 0xE0, 0x60, 0x00, 0x00, 0x00, 0x00],
        // - (45)
        [0x08, 0x08, 0x08, 0x08, 0x08, 0x08, 0x00, 0x00],
        // . (46)
        [0x00, 0x00, 0x60, 0x60, 0x00, 0x00, 0x00, 0x00],
        // / (47)
        [0x60, 0x30, 0x18, 0x0C, 0x06, 0x03, 0x01, 0x00],
        // 0 (48)
        [0x3E, 0x7F, 0x71, 0x59, 0x4D, 0x7F, 0x3E, 0x00],
        // 1 (49)
        [0x40, 0x42, 0x7F, 0x7F, 0x40, 0x40, 0x00, 0x00],
        // 2 (50)
        [0x62, 0x73, 0x59, 0x49, 0x6F, 0x66, 0x00, 0x00],
        // 3 (51)
        [0x22, 0x63, 0x49, 0x49, 0x7F, 0x36, 0x00, 0x00],
        // 4 (52)
        [0x18, 0x1C, 0x16, 0x53, 0x7F, 0x7F, 0x50, 0x00],
        // 5 (53)
        [0x27, 0x67, 0x45, 0x45, 0x7D, 0x39, 0x00, 0x00],
        // 6 (54)
        [0x3C, 0x7E, 0x4B, 0x49, 0x79, 0x30, 0x00, 0x00],
        // 7 (55)
        [0x03, 0x03, 0x71, 0x79, 0x0F, 0x07, 0x00, 0x00],
        // 8 (56)
        [0x36, 0x7F, 0x49, 0x49, 0x7F, 0x36, 0x00, 0x00],
        // 9 (57)
        [0x06, 0x4F, 0x49, 0x69, 0x3F, 0x1E, 0x00, 0x00],
        // : (58)
        [0x00, 0x00, 0x66, 0x66, 0x00, 0x00, 0x00, 0x00],
        // ; (59)
        [0x00, 0x80, 0xE6, 0x66, 0x00, 0x00, 0x00, 0x00],
        // < (60)
        [0x08, 0x1C, 0x36, 0x63, 0x41, 0x00, 0x00, 0x00],
        // = (61)
        [0x24, 0x24, 0x24, 0x24, 0x24, 0x24, 0x00, 0x00],
        // > (62)
        [0x00, 0x41, 0x63, 0x36, 0x1C, 0x08, 0x00, 0x00],
        // ? (63)
        [0x02, 0x03, 0x51, 0x59, 0x0F, 0x06, 0x00, 0x00],
        // @ (64)
        [0x3E, 0x7F, 0x41, 0x5D, 0x5D, 0x1F, 0x1E, 0x00],
        // A (65)
        [0x7C, 0x7E, 0x13, 0x13, 0x7E, 0x7C, 0x00, 0x00],
        // B (66)
        [0x41, 0x7F, 0x7F, 0x49, 0x49, 0x7F, 0x36, 0x00],
        // C (67)
        [0x1C, 0x3E, 0x63, 0x41, 0x41, 0x63, 0x22, 0x00],
        // D (68)
        [0x41, 0x7F, 0x7F, 0x41, 0x63, 0x3E, 0x1C, 0x00],
        // E (69)
        [0x41, 0x7F, 0x7F, 0x49, 0x5D, 0x41, 0x63, 0x00],
        // F (70)
        [0x41, 0x7F, 0x7F, 0x49, 0x1D, 0x01, 0x03, 0x00],
        // G (71)
        [0x1C, 0x3E, 0x63, 0x41, 0x51, 0x73, 0x72, 0x00],
        // H (72)
        [0x7F, 0x7F, 0x08, 0x08, 0x7F, 0x7F, 0x00, 0x00],
        // I (73)
        [0x00, 0x41, 0x7F, 0x7F, 0x41, 0x00, 0x00, 0x00],
        // J (74)
        [0x30, 0x70, 0x40, 0x41, 0x7F, 0x3F, 0x01, 0x00],
        // K (75)
        [0x41, 0x7F, 0x7F, 0x08, 0x1C, 0x77, 0x63, 0x00],
        // L (76)
        [0x41, 0x7F, 0x7F, 0x41, 0x40, 0x60, 0x70, 0x00],
        // M (77)
        [0x7F, 0x7F, 0x0E, 0x1C, 0x0E, 0x7F, 0x7F, 0x00],
        // N (78)
        [0x7F, 0x7F, 0x06, 0x0C, 0x18, 0x7F, 0x7F, 0x00],
        // O (79)
        [0x1C, 0x3E, 0x63, 0x41, 0x63, 0x3E, 0x1C, 0x00],
        // P (80)
        [0x41, 0x7F, 0x7F, 0x49, 0x09, 0x0F, 0x06, 0x00],
        // Q (81)
        [0x1E, 0x3F, 0x21, 0x71, 0x7F, 0x5E, 0x00, 0x00],
        // R (82)
        [0x41, 0x7F, 0x7F, 0x09, 0x19, 0x7F, 0x66, 0x00],
        // S (83)
        [0x26, 0x6F, 0x4D, 0x59, 0x73, 0x32, 0x00, 0x00],
        // T (84)
        [0x03, 0x41, 0x7F, 0x7F, 0x41, 0x03, 0x00, 0x00],
        // U (85)
        [0x7F, 0x7F, 0x40, 0x40, 0x7F, 0x7F, 0x00, 0x00],
        // V (86)
        [0x1F, 0x3F, 0x60, 0x60, 0x3F, 0x1F, 0x00, 0x00],
        // W (87)
        [0x7F, 0x7F, 0x30, 0x18, 0x30, 0x7F, 0x7F, 0x00],
        // X (88)
        [0x43, 0x67, 0x3C, 0x18, 0x3C, 0x67, 0x43, 0x00],
        // Y (89)
        [0x07, 0x4F, 0x78, 0x78, 0x4F, 0x07, 0x00, 0x00],
        // Z (90)
        [0x47, 0x63, 0x71, 0x59, 0x4D, 0x67, 0x73, 0x00],
        // [ (91)
        [0x00, 0x7F, 0x7F, 0x41, 0x41, 0x00, 0x00, 0x00],
        // \ (92)
        [0x01, 0x03, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x00],
        // ] (93)
        [0x00, 0x41, 0x41, 0x7F, 0x7F, 0x00, 0x00, 0x00],
        // ^ (94)
        [0x08, 0x0C, 0x06, 0x03, 0x06, 0x0C, 0x08, 0x00],
        // _ (95)
        [0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80]
    ];

    /**
     * Vykreslení textu
     * @param text text k vykreslení
     * @param x x pozice
     * @param y y pozice
     * @param color barva textu
     * @param bgColor barva pozadí, výchozí je černá
     */
    //% block="vykreslit text %text na x %x y %y barva %color || barva pozadí %bgColor"
    //% weight=85 group="Text"
    //% inlineInputMode=inline
    //% x.min=0 x.max=122 y.min=0 y.max=152
    //% expandableArgumentMode="toggle"
    export function drawText(text: string, x: number, y: number, color: number, bgColor?: number): void {
        // Pokud bgColor není definován, použij BLACK
        const bg = (bgColor === undefined) ? BLACK() : bgColor;

        const textLength = text.length;
        const charWidth = 6;
        const charHeight = 8;
        
        // Nastavení směru vykreslování podle rotace
        let posX = x;
        let posY = y;
        let dX = 0;
        let dY = 0;
        
        // Určení směru vykreslování podle rotace
        switch (currentRotation) {
            case 0: // 0 stupňů - normální zleva doprava
                dX = charWidth;
                dY = 0;
                // Kontrola zda se text vejde na displej
                if (x + textLength * charWidth > WIDTH) {
                    posX = WIDTH - textLength * charWidth;
                    if (posX < 0) posX = 0;
                }
                // Vyplnění pozadí
                if (bg !== color) {
                    fillRect(posX, posY, textLength * charWidth, charHeight, bg);
                }
                break;
                
            case 1: // 90 stupňů - shora dolů
                dX = 0;
                dY = charWidth;
                // Kontrola zda se text vejde na displej
                if (y + textLength * charWidth > HEIGHT) {
                    posY = HEIGHT - textLength * charWidth;
                    if (posY < 0) posY = 0;
                }
                // Vyplnění pozadí
                if (bg !== color) {
                    fillRect(posX, posY, charHeight, textLength * charWidth, bg);
                }
                break;
                
            case 2: // 180 stupňů - zprava doleva
                dX = -charWidth;
                dY = 0;
                // Posunutí počáteční pozice vpravo pro správné vykreslení
                posX = x + (textLength - 1) * charWidth;
                // Kontrola zda se text vejde na displej
                if (posX >= WIDTH) {
                    posX = WIDTH - 1;
                }
                if (posX - (textLength - 1) * charWidth < 0) {
                    posX = (textLength - 1) * charWidth;
                }
                // Vyplnění pozadí
                if (bg !== color) {
                    fillRect(posX - (textLength - 1) * charWidth, posY, textLength * charWidth, charHeight, bg);
                }
                break;
                
            case 3: // 270 stupňů - zdola nahoru
                dX = 0;
                dY = -charWidth;
                // Posunutí počáteční pozice dolů pro správné vykreslení
                posY = y + (textLength - 1) * charWidth;
                // Kontrola zda se text vejde na displej
                if (posY >= HEIGHT) {
                    posY = HEIGHT - 1;
                }
                if (posY - (textLength - 1) * charWidth < 0) {
                    posY = (textLength - 1) * charWidth;
                }
                // Vyplnění pozadí
                if (bg !== color) {
                    fillRect(posX, posY - (textLength - 1) * charWidth, charHeight, textLength * charWidth, bg);
                }
                break;
        }

        // Pro každý znak
        for (let charIdx = 0; charIdx < textLength; charIdx++) {
            const charCode = text.charCodeAt(charIdx) - 32;  // 32 = mezera, první znak
            if (charCode < 0 || charCode >= FONT_6X8.length) continue;

            const fontData = FONT_6X8[charCode];
            
            // Pro každý řádek znaku
            for (let row = 0; row < 8; row++) {
                const rowBits = fontData[row];
                
                // Pro každý sloupec znaku
                for (let col = 0; col < 6; col++) {
                    // Kontrola, zda je pixel nastaven (bit na pozici col)
                    const isPixelSet = (rowBits & (1 << (5 - col))) !== 0;
                    
                    // Výpočet pozice pixelu podle rotace
                    let pixelX = 0;
                    let pixelY = 0;
                    
                    switch (currentRotation) {
                        case 0: // 0 stupňů
                            pixelX = posX + col;
                            pixelY = posY + row;
                            break;
                        case 1: // 90 stupňů
                            pixelX = posX + row;
                            pixelY = posY + col;
                            break;
                        case 2: // 180 stupňů
                            pixelX = posX - col;
                            pixelY = posY + (7 - row);
                            break;
                        case 3: // 270 stupňů
                            pixelX = posX + (7 - row);
                            pixelY = posY - col;
                            break;
                    }
                    
                    // Vykreslit pixel pokud je nastaven, nebo pozadí pokud není
                    if (isPixelSet) {
                        drawPixel(pixelX, pixelY, color);
                    } else if (bg !== color) {
                        drawPixel(pixelX, pixelY, bg);
                    }
                }
            }
            
            // Posun na další znak
            posX += dX;
            posY += dY;
        }
    }
}