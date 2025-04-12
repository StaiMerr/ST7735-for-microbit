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

    // Oprava barevného pořadí - ST7735 používá BGR formát místo RGB
    // Proto se červená a modrá jeví opačně

    //% block="černá"
    //% group="Barvy" weight=90
    export function BLACK(): number { return 0x0000; }

    //% block="červená" 
    //% group="Barvy" weight=89
    export function RED(): number { return 0x001F; } // Opraveno: 0x001F pro červenou v BGR

    //% block="zelená"
    //% group="Barvy" weight=88
    export function GREEN(): number { return 0x07E0; }

    //% block="modrá"
    //% group="Barvy" weight=87
    export function BLUE(): number { return 0xF800; } // Opraveno: 0xF800 pro modrou v BGR

    //% block="bílá"
    //% group="Barvy" weight=86
    export function WHITE(): number { return 0xFFFF; }

    //% block="žlutá"
    //% group="Barvy" weight=85
    export function YELLOW(): number { return 0x07FF; } // Opraveno: červená + zelená

    //% block="purpurová"
    //% group="Barvy" weight=84
    export function MAGENTA(): number { return 0xF81F; } // Opraveno: modrá + červená

    //% block="azurová"
    //% group="Barvy" weight=83
    export function CYAN(): number { return 0xFFE0; } // Opraveno: modrá + zelená

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
        // Oprava - Převod 24-bit RGB (8-8-8) na 16-bit BGR565 formát pro ST7735
        return ((b & 0xF8) << 8) | ((g & 0xFC) << 3) | (r >> 3);
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
    //% w.min=1 w.max=128 h.min=1 w.max=160
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

    // Font 8x10 pixelů (každý znak definován jako 10 bajtů - jeden pro každý řádek)
    // První bajt je horní řádek
    const FONT_8X10: number[][] = [
        // Mezera (32)
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        // ! (33)
        [0x00, 0x00, 0x18, 0x3C, 0x3C, 0x3C, 0x18, 0x00, 0x18, 0x00],
        // " (34)
        [0x00, 0x66, 0x66, 0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        // # (35)
        [0x00, 0x00, 0x6C, 0x6C, 0xFE, 0x6C, 0xFE, 0x6C, 0x6C, 0x00],
        // $ (36)
        [0x00, 0x10, 0x7C, 0xD6, 0xD0, 0x7C, 0x16, 0xD6, 0x7C, 0x10],
        // % (37)
        [0x00, 0x00, 0xC6, 0xC6, 0x0C, 0x18, 0x30, 0x66, 0x66, 0x00],
        // & (38)
        [0x00, 0x00, 0x38, 0x6C, 0x38, 0x76, 0xDC, 0xCC, 0x76, 0x00],
        // ' (39)
        [0x00, 0x18, 0x18, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        // ( (40)
        [0x00, 0x00, 0x0C, 0x18, 0x30, 0x30, 0x30, 0x18, 0x0C, 0x00],
        // ) (41)
        [0x00, 0x00, 0x30, 0x18, 0x0C, 0x0C, 0x0C, 0x18, 0x30, 0x00],
        // * (42)
        [0x00, 0x00, 0x00, 0x66, 0x3C, 0xFF, 0x3C, 0x66, 0x00, 0x00],
        // + (43)
        [0x00, 0x00, 0x00, 0x18, 0x18, 0x7E, 0x18, 0x18, 0x00, 0x00],
        // , (44)
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x30],
        // - (45)
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00],
        // . (46)
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00],
        // / (47)
        [0x00, 0x00, 0x06, 0x0C, 0x18, 0x30, 0x60, 0xC0, 0x80, 0x00],
        // 0 (48)
        [0x00, 0x00, 0x7C, 0xC6, 0xCE, 0xDE, 0xF6, 0xE6, 0x7C, 0x00],
        // 1 (49)
        [0x00, 0x00, 0x18, 0x38, 0x78, 0x18, 0x18, 0x18, 0x7E, 0x00],
        // 2 (50)
        [0x00, 0x00, 0x7C, 0xC6, 0x06, 0x0C, 0x18, 0x30, 0xFE, 0x00],
        // 3 (51)
        [0x00, 0x00, 0x7C, 0xC6, 0x06, 0x3C, 0x06, 0xC6, 0x7C, 0x00],
        // 4 (52)
        [0x00, 0x00, 0x0C, 0x1C, 0x3C, 0x6C, 0xCC, 0xFE, 0x0C, 0x00],
        // 5 (53)
        [0x00, 0x00, 0xFE, 0xC0, 0xC0, 0xFC, 0x06, 0xC6, 0x7C, 0x00],
        // 6 (54)
        [0x00, 0x00, 0x3C, 0x60, 0xC0, 0xFC, 0xC6, 0xC6, 0x7C, 0x00],
        // 7 (55)
        [0x00, 0x00, 0xFE, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x30, 0x00],
        // 8 (56)
        [0x00, 0x00, 0x7C, 0xC6, 0xC6, 0x7C, 0xC6, 0xC6, 0x7C, 0x00],
        // 9 (57)
        [0x00, 0x00, 0x7C, 0xC6, 0xC6, 0x7E, 0x06, 0x0C, 0x78, 0x00],
        // : (58)
        [0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x18, 0x18, 0x00],
        // ; (59)
        [0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x18, 0x18, 0x30],
        // < (60)
        [0x00, 0x00, 0x06, 0x0C, 0x18, 0x30, 0x18, 0x0C, 0x06, 0x00],
        // = (61)
        [0x00, 0x00, 0x00, 0x00, 0x7E, 0x00, 0x7E, 0x00, 0x00, 0x00],
        // > (62)
        [0x00, 0x00, 0x60, 0x30, 0x18, 0x0C, 0x18, 0x30, 0x60, 0x00],
        // ? (63)
        [0x00, 0x00, 0x7C, 0xC6, 0x0C, 0x18, 0x18, 0x00, 0x18, 0x00],
        // @ (64)
        [0x00, 0x00, 0x7C, 0xC6, 0xDE, 0xDE, 0xDE, 0xC0, 0x7C, 0x00],
        // A (65)
        [0x00, 0x00, 0x38, 0x6C, 0xC6, 0xC6, 0xFE, 0xC6, 0xC6, 0x00],
        // B (66)
        [0x00, 0x00, 0xFC, 0x66, 0x66, 0x7C, 0x66, 0x66, 0xFC, 0x00],
        // C (67)
        [0x00, 0x00, 0x3C, 0x66, 0xC0, 0xC0, 0xC0, 0x66, 0x3C, 0x00],
        // D (68)
        [0x00, 0x00, 0xF8, 0x6C, 0x66, 0x66, 0x66, 0x6C, 0xF8, 0x00],
        // E (69)
        [0x00, 0x00, 0xFE, 0x62, 0x68, 0x78, 0x68, 0x62, 0xFE, 0x00],
        // F (70)
        [0x00, 0x00, 0xFE, 0x62, 0x68, 0x78, 0x68, 0x60, 0xF0, 0x00],
        // G (71)
        [0x00, 0x00, 0x3C, 0x66, 0xC0, 0xC0, 0xCE, 0x66, 0x3E, 0x00],
        // H (72)
        [0x00, 0x00, 0xC6, 0xC6, 0xC6, 0xFE, 0xC6, 0xC6, 0xC6, 0x00],
        // I (73)
        [0x00, 0x00, 0x3C, 0x18, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00],
        // J (74)
        [0x00, 0x00, 0x1E, 0x0C, 0x0C, 0x0C, 0xCC, 0xCC, 0x78, 0x00],
        // K (75)
        [0x00, 0x00, 0xE6, 0x66, 0x6C, 0x78, 0x6C, 0x66, 0xE6, 0x00],
        // L (76)
        [0x00, 0x00, 0xF0, 0x60, 0x60, 0x60, 0x60, 0x62, 0xFE, 0x00],
        // M (77)
        [0x00, 0x00, 0xC6, 0xEE, 0xFE, 0xD6, 0xC6, 0xC6, 0xC6, 0x00],
        // N (78)
        [0x00, 0x00, 0xC6, 0xE6, 0xF6, 0xDE, 0xCE, 0xC6, 0xC6, 0x00],
        // O (79)
        [0x00, 0x00, 0x7C, 0xC6, 0xC6, 0xC6, 0xC6, 0xC6, 0x7C, 0x00],
        // P (80)
        [0x00, 0x00, 0xFC, 0x66, 0x66, 0x7C, 0x60, 0x60, 0xF0, 0x00],
        // Q (81)
        [0x00, 0x00, 0x7C, 0xC6, 0xC6, 0xC6, 0xD6, 0xDE, 0x7C, 0x06],
        // R (82)
        [0x00, 0x00, 0xFC, 0x66, 0x66, 0x7C, 0x6C, 0x66, 0xE6, 0x00],
        // S (83)
        [0x00, 0x00, 0x7C, 0xC6, 0x60, 0x38, 0x0C, 0xC6, 0x7C, 0x00],
        // T (84)
        [0x00, 0x00, 0x7E, 0x5A, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00],
        // U (85)
        [0x00, 0x00, 0xC6, 0xC6, 0xC6, 0xC6, 0xC6, 0xC6, 0x7C, 0x00],
        // V (86)
        [0x00, 0x00, 0xC6, 0xC6, 0xC6, 0xC6, 0x6C, 0x38, 0x10, 0x00],
        // W (87)
        [0x00, 0x00, 0xC6, 0xC6, 0xC6, 0xD6, 0xFE, 0xEE, 0xC6, 0x00],
        // X (88)
        [0x00, 0x00, 0xC6, 0xC6, 0x6C, 0x38, 0x6C, 0xC6, 0xC6, 0x00],
        // Y (89)
        [0x00, 0x00, 0xC6, 0xC6, 0x6C, 0x38, 0x18, 0x18, 0x3C, 0x00],
        // Z (90)
        [0x00, 0x00, 0xFE, 0xC6, 0x8C, 0x18, 0x32, 0x66, 0xFE, 0x00],
        // [ (91)
        [0x00, 0x00, 0x3C, 0x30, 0x30, 0x30, 0x30, 0x30, 0x3C, 0x00],
        // \ (92)
        [0x00, 0x00, 0x80, 0xC0, 0x60, 0x30, 0x18, 0x0C, 0x06, 0x00],
        // ] (93)
        [0x00, 0x00, 0x3C, 0x0C, 0x0C, 0x0C, 0x0C, 0x0C, 0x3C, 0x00],
        // ^ (94)
        [0x10, 0x38, 0x6C, 0xC6, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        // _ (95)
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF],
        // ` (96)
        [0x30, 0x18, 0x0C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        // a (97)
        [0x00, 0x00, 0x00, 0x00, 0x78, 0x0C, 0x7C, 0xCC, 0x76, 0x00],
        // b (98)
        [0x00, 0x00, 0xE0, 0x60, 0x7C, 0x66, 0x66, 0x66, 0xDC, 0x00],
        // c (99)
        [0x00, 0x00, 0x00, 0x00, 0x7C, 0xC6, 0xC0, 0xC6, 0x7C, 0x00],
        // d (100)
        [0x00, 0x00, 0x1C, 0x0C, 0x7C, 0xCC, 0xCC, 0xCC, 0x76, 0x00],
        // e (101)
        [0x00, 0x00, 0x00, 0x00, 0x7C, 0xC6, 0xFE, 0xC0, 0x7C, 0x00],
        // f (102)
        [0x00, 0x00, 0x3C, 0x66, 0x60, 0xF8, 0x60, 0x60, 0xF0, 0x00],
        // g (103)
        [0x00, 0x00, 0x00, 0x00, 0x76, 0xCC, 0xCC, 0x7C, 0x0C, 0xF8],
        // h (104)
        [0x00, 0x00, 0xE0, 0x60, 0x6C, 0x76, 0x66, 0x66, 0xE6, 0x00],
        // i (105)
        [0x00, 0x00, 0x18, 0x00, 0x38, 0x18, 0x18, 0x18, 0x3C, 0x00],
        // j (106)
        [0x00, 0x00, 0x06, 0x00, 0x06, 0x06, 0x06, 0x66, 0x66, 0x3C],
        // k (107)
        [0x00, 0x00, 0xE0, 0x60, 0x66, 0x6C, 0x78, 0x6C, 0xE6, 0x00],
        // l (108)
        [0x00, 0x00, 0x38, 0x18, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00],
        // m (109)
        [0x00, 0x00, 0x00, 0x00, 0xEC, 0xFE, 0xD6, 0xD6, 0xD6, 0x00],
        // n (110)
        [0x00, 0x00, 0x00, 0x00, 0xDC, 0x66, 0x66, 0x66, 0x66, 0x00],
        // o (111)
        [0x00, 0x00, 0x00, 0x00, 0x7C, 0xC6, 0xC6, 0xC6, 0x7C, 0x00],
        // p (112)
        [0x00, 0x00, 0x00, 0x00, 0xDC, 0x66, 0x66, 0x7C, 0x60, 0xF0],
        // q (113)
        [0x00, 0x00, 0x00, 0x00, 0x76, 0xCC, 0xCC, 0x7C, 0x0C, 0x1E],
        // r (114)
        [0x00, 0x00, 0x00, 0x00, 0xDC, 0x76, 0x60, 0x60, 0xF0, 0x00],
        // s (115)
        [0x00, 0x00, 0x00, 0x00, 0x7C, 0xC0, 0x7C, 0x06, 0xFC, 0x00],
        // t (116)
        [0x00, 0x00, 0x30, 0x30, 0xFC, 0x30, 0x30, 0x36, 0x1C, 0x00],
        // u (117)
        [0x00, 0x00, 0x00, 0x00, 0xCC, 0xCC, 0xCC, 0xCC, 0x76, 0x00],
        // v (118)
        [0x00, 0x00, 0x00, 0x00, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00],
        // w (119)
        [0x00, 0x00, 0x00, 0x00, 0xC6, 0xD6, 0xD6, 0xFE, 0x6C, 0x00],
        // x (120)
        [0x00, 0x00, 0x00, 0x00, 0xC6, 0x6C, 0x38, 0x6C, 0xC6, 0x00],
        // y (121)
        [0x00, 0x00, 0x00, 0x00, 0xC6, 0xC6, 0xC6, 0x7E, 0x06, 0xFC],
        // z (122)
        [0x00, 0x00, 0x00, 0x00, 0xFE, 0x8C, 0x18, 0x32, 0xFE, 0x00],
        // { (123)
        [0x00, 0x00, 0x0E, 0x18, 0x18, 0x70, 0x18, 0x18, 0x0E, 0x00],
        // | (124)
        [0x00, 0x00, 0x18, 0x18, 0x18, 0x00, 0x18, 0x18, 0x18, 0x00],
        // } (125)
        [0x00, 0x00, 0x70, 0x18, 0x18, 0x0E, 0x18, 0x18, 0x70, 0x00],
        // ~ (126)
        [0x00, 0x00, 0x76, 0xDC, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    ];

    /**
     * Univerzální funkce pro vykreslení textu
     * @param text text k vykreslení
     * @param x x pozice
     * @param y y pozice
     * @param color barva textu
     * @param size velikost textu (1-4)
     * @param rotation orientace textu (0-3)
     * @param bgColor barva pozadí
     * @param r červená složka (0-255)
     * @param g zelená složka (0-255)
     * @param b modrá složka (0-255)
     */
    //% block="text %text na x %x y %y || velikost %size orientace %rotation barva %color pozadí %bgColor RGB r %r g %g b %b"
    //% weight=85 group="Text"
    //% inlineInputMode=inline
    //% x.min=0 x.max=120 y.min=0 y.max=150
    //% size.min=1 size.max=4 size.defl=1
    //% rotation.min=0 rotation.max=3 rotation.defl=0
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    //% expandableArgumentMode="toggle"
    export function drawText(
        text: string, 
        x: number, 
        y: number, 
        size: number = 1, 
        rotation: number = 0, 
        color: number = WHITE(), 
        bgColor: number = BLACK(),
        r?: number,
        g?: number,
        b?: number
    ): void {
        // Pokud jsou zadány RGB hodnoty, použij je pro barvu textu
        if (r !== undefined && g !== undefined && b !== undefined) {
            color = color565(r, g, b);
        }
        
        // Omezte na platné hodnoty
        size = Math.max(1, Math.min(4, size));
        rotation = Math.max(0, Math.min(3, rotation));

        const textLength = text.length;
        const charWidth = 8 * size;
        const charHeight = 10 * size;
        const charSpacing = 2 * size; // Mezera mezi znaky
        const totalCharWidth = charWidth + charSpacing;
        
        // Proměnné pro pozici a směr
        let startX = x;
        let startY = y;
        let deltaX = 0;
        let deltaY = 0;
        
        // Nastavení směru podle orientace textu
        switch (rotation) {
            case 0: // Normální - zleva doprava
                deltaX = totalCharWidth;
                deltaY = 0;
                
                // Kontrola, zda text nepřesáhne okraj displeje
                if (startX + textLength * totalCharWidth > WIDTH) {
                    startX = Math.max(0, WIDTH - textLength * totalCharWidth);
                }
                break;
                
            case 1: // Otočený o 90° - shora dolů
                deltaX = 0;
                deltaY = totalCharWidth;
                
                // Kontrola, zda text nepřesáhne okraj displeje
                if (startY + textLength * totalCharWidth > HEIGHT) {
                    startY = Math.max(0, HEIGHT - textLength * totalCharWidth);
                }
                break;
                
            case 2: // Otočený o 180° - zprava doleva
                deltaX = -totalCharWidth;
                deltaY = 0;
                
                // Posun startovní pozice doleva
                startX += (textLength - 1) * totalCharWidth;
                
                // Kontrola, zda text nepřesáhne okraj displeje
                if (startX >= WIDTH) {
                    startX = WIDTH - 1;
                }
                if (startX - (textLength - 1) * totalCharWidth < 0) {
                    startX = (textLength - 1) * totalCharWidth;
                }
                break;
                
            case 3: // Otočený o 270° - zdola nahoru
                deltaX = 0;
                deltaY = -totalCharWidth;
                
                // Posun startovní pozice nahoru
                startY += (textLength - 1) * totalCharWidth;
                
                // Kontrola, zda text nepřesáhne okraj displeje
                if (startY >= HEIGHT) {
                    startY = HEIGHT - 1;
                }
                if (startY - (textLength - 1) * totalCharWidth < 0) {
                    startY = (textLength - 1) * totalCharWidth;
                }
                break;
        }
        
        // Vyplnění pozadí pro text
        if (bgColor !== color) {
            let bgWidth = 0;
            let bgHeight = 0;
            let bgX = 0;
            let bgY = 0;
            
            if (rotation === 0) {
                bgWidth = textLength * totalCharWidth - charSpacing;
                bgHeight = charHeight;
                bgX = startX;
                bgY = startY;
            } else if (rotation === 1) {
                bgWidth = charHeight;
                bgHeight = textLength * totalCharWidth - charSpacing;
                bgX = startX;
                bgY = startY;
            } else if (rotation === 2) {
                bgWidth = textLength * totalCharWidth - charSpacing;
                bgHeight = charHeight;
                bgX = startX - (textLength - 1) * totalCharWidth;
                bgY = startY;
            } else if (rotation === 3) {
                bgWidth = charHeight;
                bgHeight = textLength * totalCharWidth - charSpacing;
                bgX = startX;
                bgY = startY - (textLength - 1) * totalCharWidth;
            }
            
            fillRect(bgX, bgY, bgWidth, bgHeight, bgColor);
        }
        
        // Vykreslení textu
        let curX = startX;
        let curY = startY;
        
        for (let i = 0; i < textLength; i++) {
            const charCode = text.charCodeAt(i) - 32;  // ASCII 32 = mezera
            if (charCode < 0 || charCode >= FONT_8X10.length) continue;
            
            const fontData = FONT_8X10[charCode];
            
            // Vykreslení znaku pixel po pixelu se zvětšením
            for (let row = 0; row < 10; row++) {
                const rowData = fontData[row];
                
                for (let col = 0; col < 8; col++) {
                    const isPixelOn = (rowData & (1 << (7 - col))) !== 0;
                    
                    if (isPixelOn) {
                        // Výpočet základních souřadnic podle orientace (levý horní roh pixelu)
                        let baseX = 0;
                        let baseY = 0;
                        
                        switch (rotation) {
                            case 0:
                                baseX = curX + col * size;
                                baseY = curY + row * size;
                                break;
                            case 1:
                                baseX = curX + (9 - row) * size;
                                baseY = curY + col * size;
                                break;
                            case 2:
                                baseX = curX - col * size;
                                baseY = curY + (9 - row) * size;
                                break;
                            case 3:
                                baseX = curX - (9 - row) * size; 
                                baseY = curY - col * size;
                                break;
                        }
                        
                        // Vykreslení čtverce o velikosti size×size
                        for (let dy = 0; dy < size; dy++) {
                            for (let dx = 0; dx < size; dx++) {
                                // Výpočet finální pozice pixelu
                                let pixelX = baseX;
                                let pixelY = baseY;
                                
                                if (rotation === 0) {
                                    pixelX += dx;
                                    pixelY += dy;
                                } else if (rotation === 1) {
                                    pixelX += dy;
                                    pixelY += dx;
                                } else if (rotation === 2) {
                                    pixelX -= dx;
                                    pixelY += dy;
                                } else if (rotation === 3) {
                                    pixelX -= dy;
                                    pixelY -= dx;
                                }
                                
                                // Kreslení pixelu, pokud je v rozsahu displeje
                                if (pixelX >= 0 && pixelX < WIDTH && pixelY >= 0 && pixelY < HEIGHT) {
                                    drawPixel(pixelX, pixelY, color);
                                }
                            }
                        }
                    }
                }
            }
            
            // Posun na další znak
            curX += deltaX;
            curY += deltaY;
        }
    }

    /**
     * Vykreslení velkého textu - zkratka pro drawText s velikostí 2
     * @param text text k vykreslení
     * @param x x pozice
     * @param y y pozice
     * @param color barva textu
     * @param rotation orientace textu (0-3)
     * @param bgColor barva pozadí
     */
    //% block="velký text %text na x %x y %y || orientace %rotation barva %color pozadí %bgColor"
    //% weight=84 group="Text"
    //% inlineInputMode=inline
    //% x.min=0 x.max=120 y.min=0 y.max=150
    //% rotation.min=0 rotation.max=3 rotation.defl=0
    //% expandableArgumentMode="toggle"
    export function drawBigText(
        text: string, 
        x: number, 
        y: number, 
        rotation: number = 0,
        color: number = WHITE(), 
        bgColor: number = BLACK()
    ): void {
        // Použití univerzální funkce s velikostí 2
        drawText(text, x, y, 2, rotation, color, bgColor);
    }

    /**
     * Zobrazení hexadecimálních dat na displeji
     * @param hexString Řetězec s hexadecimálními hodnotami (např. "0x89, 0x50, 0x4E, 0x47")
     * @param x X pozice začátku zobrazení
     * @param y Y pozice začátku zobrazení
     * @param bytesPerRow Počet bajtů na řádek
     * @param color Barva textu
     * @param bgColor Barva pozadí
     * @param size Velikost textu (1-2)
     */
    //% block="hex data %hexString na x %x y %y || bytů/řádek %bytesPerRow barva %color pozadí %bgColor velikost %size"
    //% weight=82 group="Text"
    //% inlineInputMode=inline
    //% x.min=0 x.max=120 y.min=0 y.max=150
    //% bytesPerRow.min=1 bytesPerRow.max=8 bytesPerRow.defl=4
    //% size.min=1 size.max=2 size.defl=1
    //% expandableArgumentMode="toggle"
    export function displayHexData(
        hexString: string,
        x: number,
        y: number,
        bytesPerRow: number = 4,
        color: number = WHITE(),
        bgColor: number = BLACK(),
        size: number = 1
    ): void {
        // Ověření vstupů
        bytesPerRow = Math.max(1, Math.min(8, bytesPerRow));
        size = Math.max(1, Math.min(2, size));
        
        // Výška řádku v pixelech
        const lineHeight = 12 * size;
        
        // Odstranění bílých znaků a rozdělení na jednotlivé hex hodnoty
        let cleanString = "";
        for (let i = 0; i < hexString.length; i++) {
            // Přeskočíme bílé znaky (mezera, tab, nový řádek)
            if (hexString[i] !== ' ' && hexString[i] !== '\t' && hexString[i] !== '\n' && hexString[i] !== '\r') {
                cleanString += hexString[i];
            }
        }
        const hexValues = cleanString.split(',');
        
        // Převod na číselné hodnoty a odstranění neplatných hodnot
        const bytes: number[] = [];
        for (let i = 0; i < hexValues.length; i++) {
            let value = hexValues[i];
            let trimmedValue = "";
            
            // Vlastní implementace trim()
            let startIndex = 0;
            while (startIndex < value.length && 
                   (value[startIndex] === ' ' || value[startIndex] === '\t' || 
                    value[startIndex] === '\n' || value[startIndex] === '\r')) {
                startIndex++;
            }
            
            let endIndex = value.length - 1;
            while (endIndex >= 0 && 
                   (value[endIndex] === ' ' || value[endIndex] === '\t' || 
                    value[endIndex] === '\n' || value[endIndex] === '\r')) {
                endIndex--;
            }
            
            for (let j = startIndex; j <= endIndex; j++) {
                trimmedValue += value[j];
            }
            
            // Kontrola, zda hodnota začíná "0x" nebo "0X"
            if (trimmedValue.length >= 2 && (trimmedValue.substr(0, 2).toLowerCase() === "0x")) {
                // Převod z hex na číslo
                const numValue = parseInt(trimmedValue);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
                    bytes.push(numValue);
                }
            }
        }
        
        // Vymazání pozadí
        const totalRows = Math.ceil(bytes.length / bytesPerRow);
        const width = bytesPerRow * 6 * size; // Přibližná šířka jednoho bajtu v textu
        fillRect(x, y, width * 5, totalRows * lineHeight, bgColor);
        
        // Zobrazení dat po řádcích
        let currentX = x;
        let currentY = y;
        let counter = 0;
        
        for (let i = 0; i < bytes.length; i++) {
            // OPRAVA: Vlastní implementace toString(16)
            let hexValue = byteToHex(bytes[i]);
            const hexText = "0x" + hexValue;
            
            // Vykreslení hex hodnoty
            drawText(hexText, currentX, currentY, size, 0, color, bgColor);
            
            // Posun na další pozici
            counter++;
            if (counter >= bytesPerRow) {
                // Přejdi na nový řádek
                counter = 0;
                currentX = x;
                currentY += lineHeight;
            } else {
                // Pokračuj na stejném řádku
                currentX += hexText.length * 8 * size;
            }
        }
        
        // Přidání informace o velikosti dat
        currentY += lineHeight;
        drawText("Celkem: " + bytes.length + " bajtů", x, currentY, size, 0, color, bgColor);
    }

    // Pomocná funkce pro převod bytu na hexadecimální řetězec
    function byteToHex(value: number): string {
        const hexChars = "0123456789ABCDEF";
        const highNibble = (value >> 4) & 0xF;  // Horní 4 bity
        const lowNibble = value & 0xF;          // Dolní 4 bity
        return hexChars[highNibble] + hexChars[lowNibble];
    }

    /**
     * Zobrazení obrázku z hexadecimálních dat
     * @param hexString Řetězec s hexadecimálními hodnotami raw obrazových dat
     * @param x X pozice začátku zobrazení
     * @param y Y pozice začátku zobrazení
     * @param width Šířka obrázku v pixelech
     * @param height Výška obrázku v pixelech
     * @param format Formát obrázku (0: RGB565, 1: monochromatický)
     */
    //% block="zobrazit obrázek z hex dat %hexString na x %x y %y šířka %width výška %height || formát %format"
    //% weight=81 group="Kreslení"
    //% inlineInputMode=inline
    //% x.min=0 x.max=127 y.min=0 y.max=159
    //% width.min=1 width.max=128 height.min=1 height.max=160
    //% format.min=0 format.max=1 format.defl=0
    //% expandableArgumentMode="toggle"
    export function displayImageFromHex(
        hexString: string,
        x: number,
        y: number,
        width: number,
        height: number,
        format: number = 0
    ): void {
        // Odstranění bílých znaků a rozdělení na jednotlivé hex hodnoty
        // Oprava: Místo RegExp použijeme metodu s řetězci
        let cleanString = "";
        for (let i = 0; i < hexString.length; i++) {
            // Přeskočíme bílé znaky (mezera, tab, nový řádek)
            if (hexString[i] !== ' ' && hexString[i] !== '\t' && hexString[i] !== '\n' && hexString[i] !== '\r') {
                cleanString += hexString[i];
            }
        }
        const hexValues = cleanString.split(',');
        
        // Převod na číselné hodnoty a odstranění neplatných hodnot
        const bytes: number[] = [];
        for (let i = 0; i < hexValues.length; i++) {
            let value = hexValues[i].trim(); // Odstraní bílé znaky na začátku a konci
            
            // Kontrola, zda hodnota začíná "0x" nebo "0X"
            if (value.length >= 2 && (value.substr(0, 2).toLowerCase() === "0x")) {
                // Převod z hex na číslo
                const numValue = parseInt(value, 16);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
                    bytes.push(numValue);
                }
            }
        }
        
        // Kontrola rozměrů obrázku
        if (x + width > WIDTH) width = WIDTH - x;
        if (y + height > HEIGHT) height = HEIGHT - y;
        
        // Nastavení adresního okna pro obrázek
        setWindow(x, y, x + width - 1, y + height - 1);
        
        // Vykreslení obrázku podle formátu
        pins.digitalWritePin(TFT_CS, 0);
        pins.digitalWritePin(TFT_RS, 1);
        
        if (format === 0) {
            // RGB565 formát - každý pixel je 2 bajty
            for (let i = 0; i < bytes.length; i += 2) {
                if (i + 1 < bytes.length) {
                    pins.spiWrite(bytes[i]);      // Vyšší bajt
                    pins.spiWrite(bytes[i + 1]);  // Nižší bajt
                }
            }
        } else {
            // Monochromatický formát - každý bajt obsahuje 8 pixelů (1 bit na pixel)
            for (let i = 0; i < bytes.length; i++) {
                const byte = bytes[i];
                // Každý bit vykreslíme jako černý nebo bílý pixel
                for (let bit = 7; bit >= 0; bit--) {
                    const color = (byte & (1 << bit)) ? WHITE() : BLACK();
                    const hi = (color >> 8) & 0xFF;
                    const lo = color & 0xFF;
                    pins.spiWrite(hi);
                    pins.spiWrite(lo);
                }
            }
        }
        
        pins.digitalWritePin(TFT_CS, 1);
    }
}