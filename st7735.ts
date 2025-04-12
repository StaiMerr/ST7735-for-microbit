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

    // Barvy (RGB565 formát)
    //% block="černá"
    //% group="Barvy" weight=90
    export const BLACK = 0x0000
    
    //% block="červená"
    //% group="Barvy" weight=89
    export const RED = 0xF800
    
    //% block="zelená"
    //% group="Barvy" weight=88
    export const GREEN = 0x07E0
    
    //% block="modrá"
    //% group="Barvy" weight=87
    export const BLUE = 0x001F
    
    //% block="bílá"
    //% group="Barvy" weight=86
    export const WHITE = 0xFFFF
    
    //% block="žlutá"
    //% group="Barvy" weight=85
    export const YELLOW = 0xFFE0
    
    //% block="purpurová"
    //% group="Barvy" weight=84
    export const MAGENTA = 0xF81F
    
    //% block="azurová"
    //% group="Barvy" weight=83
    export const CYAN = 0x07FF

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

    // Zjednodušené 3x5 písmena pro ultra-rychlé vykreslování textu
    // Každé písmeno je definováno jako bitmapa 3x5 pixelů v jediném bytu
    const FONT: number[] = [
        0x00, 0x00, 0x00, 0x00, 0x00, // mezera
        0x17, 0x00, 0x00, 0x00, 0x00, // !
        0x03, 0x00, 0x03, 0x00, 0x00, // "
        0x1F, 0x0A, 0x1F, 0x0A, 0x1F, // #
        0x0A, 0x1F, 0x1F, 0x0A, 0x00, // $
        0x09, 0x04, 0x0A, 0x00, 0x00, // %
        0x0E, 0x0A, 0x0E, 0x0A, 0x0C, // &
        0x03, 0x00, 0x00, 0x00, 0x00, // '
        0x0E, 0x11, 0x00, 0x00, 0x00, // (
        0x11, 0x0E, 0x00, 0x00, 0x00, // )
        0x05, 0x02, 0x05, 0x00, 0x00, // *
        0x04, 0x0E, 0x04, 0x00, 0x00, // +
        0x10, 0x08, 0x00, 0x00, 0x00, // ,
        0x04, 0x04, 0x04, 0x00, 0x00, // -
        0x10, 0x00, 0x00, 0x00, 0x00, // .
        0x18, 0x04, 0x03, 0x00, 0x00, // /
        0x1F, 0x11, 0x1F, 0x00, 0x00, // 0
        0x12, 0x1F, 0x10, 0x00, 0x00, // 1
        0x1D, 0x15, 0x17, 0x00, 0x00, // 2
        0x11, 0x15, 0x1F, 0x00, 0x00, // 3
        0x07, 0x04, 0x1F, 0x00, 0x00, // 4
        0x17, 0x15, 0x1D, 0x00, 0x00, // 5
        0x1F, 0x15, 0x1D, 0x00, 0x00, // 6
        0x01, 0x01, 0x1F, 0x00, 0x00, // 7
        0x1F, 0x15, 0x1F, 0x00, 0x00, // 8
        0x17, 0x15, 0x1F, 0x00, 0x00, // 9
        0x0A, 0x00, 0x00, 0x00, 0x00, // :
        0x10, 0x0A, 0x00, 0x00, 0x00, // ;
        0x04, 0x0A, 0x11, 0x00, 0x00, // <
        0x0A, 0x0A, 0x0A, 0x00, 0x00, // =
        0x11, 0x0A, 0x04, 0x00, 0x00, // >
        0x01, 0x15, 0x07, 0x00, 0x00, // ?
        0x1F, 0x11, 0x17, 0x15, 0x17, // @
        0x1F, 0x05, 0x1F, 0x00, 0x00, // A
        0x1F, 0x15, 0x0A, 0x00, 0x00, // B
        0x1F, 0x11, 0x11, 0x00, 0x00, // C
        0x1F, 0x11, 0x0E, 0x00, 0x00, // D
        0x1F, 0x15, 0x15, 0x00, 0x00, // E
        0x1F, 0x05, 0x05, 0x00, 0x00, // F
        0x1F, 0x11, 0x1D, 0x00, 0x00, // G
        0x1F, 0x04, 0x1F, 0x00, 0x00, // H
        0x11, 0x1F, 0x11, 0x00, 0x00, // I
        0x08, 0x10, 0x0F, 0x00, 0x00, // J
        0x1F, 0x04, 0x1B, 0x00, 0x00, // K
        0x1F, 0x10, 0x10, 0x00, 0x00, // L
        0x1F, 0x02, 0x1F, 0x00, 0x00, // M
        0x1F, 0x01, 0x1F, 0x00, 0x00, // N
        0x1F, 0x11, 0x1F, 0x00, 0x00, // O
        0x1F, 0x05, 0x07, 0x00, 0x00, // P
        0x0F, 0x09, 0x1F, 0x00, 0x00, // Q
        0x1F, 0x05, 0x1B, 0x00, 0x00, // R
        0x17, 0x15, 0x1D, 0x00, 0x00, // S
        0x01, 0x1F, 0x01, 0x00, 0x00, // T
        0x1F, 0x10, 0x1F, 0x00, 0x00, // U
        0x0F, 0x10, 0x0F, 0x00, 0x00, // V
        0x1F, 0x08, 0x1F, 0x00, 0x00, // W
        0x1B, 0x04, 0x1B, 0x00, 0x00, // X
        0x07, 0x18, 0x07, 0x00, 0x00, // Y
        0x19, 0x15, 0x13, 0x00, 0x00, // Z
        0x1F, 0x11, 0x00, 0x00, 0x00, // [
        0x03, 0x04, 0x18, 0x00, 0x00, // \
        0x11, 0x1F, 0x00, 0x00, 0x00, // ]
        0x02, 0x01, 0x02, 0x00, 0x00, // ^
        0x10, 0x10, 0x10, 0x00, 0x00  // _
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
    //% weight=80 group="Text"
    //% inlineInputMode=inline
    //% x.min=0 x.max=124 y.min=0 y.max=155
    //% expandableArgumentMode="toggle"
    export function drawText(text: string, x: number, y: number, color: number, bgColor?: number): void {
        // Pokud bgColor není definován, použij BLACK
        const bg = (bgColor === undefined) ? BLACK : bgColor;

        const textLength = text.length
        const totalWidth = textLength * 4  // 3 pixely na znak + 1 pixel mezera

        if (x + totalWidth > WIDTH) {
            x = WIDTH - totalWidth  // Zajistí, že se text vejde na obrazovku
        }

        // Nejprve vyplníme pozadí textu pro čistý vzhled
        fillRect(x, y, totalWidth, 5, bg)

        const hi = (color >> 8) & 0xFF
        const lo = color & 0xFF

        for (let charIdx = 0; charIdx < textLength; charIdx++) {
            const charCode = text.charCodeAt(charIdx) - 32  // 32 = mezera, první znak
            if (charCode < 0 || charCode >= FONT.length / 5) continue

            const fontOffset = charCode * 5
            const posX = x + charIdx * 4  // 4 pixely na znak včetně mezery

            // Nastavení okna pro tento znak
            setWindow(posX, y, posX + 2, y + 4)

            pins.digitalWritePin(TFT_CS, 0)
            pins.digitalWritePin(TFT_RS, 1)

            // Vykreslení znaku pixel po pixelu
            for (let row = 0; row < 5; row++) {
                const fontRow = FONT[fontOffset + row]

                for (let col = 0; col < 3; col++) {
                    if (fontRow & (1 << (2 - col))) {
                        pins.spiWrite(hi)
                        pins.spiWrite(lo)
                    } else {
                        pins.spiWrite(bg >> 8)
                        pins.spiWrite(bg & 0xFF)
                    }
                }
            }

            pins.digitalWritePin(TFT_CS, 1)
        }
    }
}