/**
 * Ultra-optimalizovaný driver pro ST7735 1.8" TFT displej
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

    // Iniciace přímého vykreslování na celou obrazovku
    function beginFullScreenDraw(): void {
        // Nastavení adresního okna pro celý displej
        cmd(ST7735_CASET)
        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)
        pins.spiWrite(0)
        pins.spiWrite(0)
        pins.spiWrite(0)
        pins.spiWrite(WIDTH - 1)
        pins.digitalWritePin(TFT_CS, 1)

        cmd(ST7735_RASET)
        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)
        pins.spiWrite(0)
        pins.spiWrite(0)
        pins.spiWrite(0)
        pins.spiWrite(HEIGHT - 1)
        pins.digitalWritePin(TFT_CS, 1)

        cmd(ST7735_RAMWR)
        pins.digitalWritePin(TFT_CS, 0)
        pins.digitalWritePin(TFT_RS, 1)
    }

    // Ukončení přímého vykreslování
    function endDraw(): void {
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
        // Začátek přímého vykreslování
        beginFullScreenDraw()

        // Komponenty barvy
        const hi = (color >> 8) & 0xFF
        const lo = color & 0xFF

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

        // Ukončení vykreslování
        endDraw()
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
     * Vykreslení obrysu obdélníku
     * @param x x pozice
     * @param y y pozice
     * @param w šířka
     * @param h výška
     * @param color barva v RGB565 formátu
     */
    //% block="vykreslit obrys obdélníku na x %x y %y šířka %w výška %h barva %color"
    //% weight=86 group="Kreslení"
    //% inlineInputMode=inline
    //% x.min=0 x.max=127 y.min=0 y.max=159
    //% w.min=1 w.max=128 h.min=1 h.max=160
    export function drawRect(x: number, y: number, w: number, h: number, color: number): void {
        // Optimalizace: Kreslíme pouze 4 čáry
        drawLine(x, y, x + w - 1, y, color);        // Horní horizontální
        drawLine(x, y + h - 1, x + w - 1, y + h - 1, color);  // Dolní horizontální
        drawLine(x, y, x, y + h - 1, color);        // Levá vertikální
        drawLine(x + w - 1, y, x + w - 1, y + h - 1, color);  // Pravá vertikální
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
     * Vykreslení čáry
     * @param x0 počáteční X souřadnice
     * @param y0 počáteční Y souřadnice
     * @param x1 koncová X souřadnice
     * @param y1 koncová Y souřadnice
     * @param color barva čáry
     */
    //% block="vykreslit čáru z x %x0 y %y0 do x %x1 y %y1 barva %color"
    //% weight=87 group="Kreslení"
    //% inlineInputMode=inline
    //% x0.min=0 x0.max=127 y0.min=0 y0.max=159
    //% x1.min=0 x1.max=127 y1.min=0 y1.max=159
    export function drawLine(x0: number, y0: number, x1: number, y1: number, color: number): void {
        let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0)
        if (steep) {
            let temp = x0; x0 = y0; y0 = temp;
            temp = x1; x1 = y1; y1 = temp;
        }

        if (x0 > x1) {
            let temp = x0; x0 = x1; x1 = temp;
            temp = y0; y0 = y1; y1 = temp;
        }

        let dx = x1 - x0
        let dy = Math.abs(y1 - y0)
        let err = dx / 2
        let ystep = y0 < y1 ? 1 : -1
        let y = y0

        for (let x = x0; x <= x1; x++) {
            if (steep) {
                drawPixel(y, x, color)
            } else {
                drawPixel(x, y, color)
            }
            err -= dy
            if (err < 0) {
                y += ystep
                err += dx
            }
        }
    }

    /**
     * Vykreslení kruhu
     * @param x0 X souřadnice středu
     * @param y0 Y souřadnice středu
     * @param r poloměr
     * @param color barva
     */
    //% block="vykreslit kruh střed x %x0 y %y0 poloměr %r barva %color"
    //% weight=84 group="Kreslení"
    //% inlineInputMode=inline
    //% x0.min=0 x0.max=127 y0.min=0 y0.max=159
    //% r.min=1 r.max=80
    export function drawCircle(x0: number, y0: number, r: number, color: number): void {
        let f = 1 - r
        let ddF_x = 1
        let ddF_y = -2 * r
        let x = 0
        let y = r

        // Optimalizace: Kreslíme jen 8 strategických bodů a využíváme symetrie
        drawPixel(x0, y0 + r, color)
        drawPixel(x0, y0 - r, color)
        drawPixel(x0 + r, y0, color)
        drawPixel(x0 - r, y0, color)

        while (x < y) {
            if (f >= 0) {
                y--
                ddF_y += 2
                f += ddF_y
            }
            x++
            ddF_x += 2
            f += ddF_x

            drawPixel(x0 + x, y0 + y, color)
            drawPixel(x0 - x, y0 + y, color)
            drawPixel(x0 + x, y0 - y, color)
            drawPixel(x0 - x, y0 - y, color)
            drawPixel(x0 + y, y0 + x, color)
            drawPixel(x0 - y, y0 + x, color)
            drawPixel(x0 + y, y0 - x, color)
            drawPixel(x0 - y, y0 - x, color)
        }
    }

    /**
     * Vykreslení vyplněného kruhu
     * @param x0 X souřadnice středu
     * @param y0 Y souřadnice středu
     * @param r poloměr
     * @param color barva
     */
    //% block="vykreslit vyplněný kruh střed x %x0 y %y0 poloměr %r barva %color"
    //% weight=83 group="Kreslení"
    //% inlineInputMode=inline
    //% x0.min=0 x0.max=127 y0.min=0 y0.max=159
    //% r.min=1 r.max=80
    export function fillCircle(x0: number, y0: number, r: number, color: number): void {
        // Optimalizace: Vykreslujeme horizontální čáry
        for (let y = -r; y <= r; y++) {
            // Pythagorova věta pro výpočet délky horizontální čáry
            let xLen = Math.floor(Math.sqrt(r * r - y * y))
            drawLine(x0 - xLen, y0 + y, x0 + xLen, y0 + y, color)
        }
    }

    /**
     * Vykreslení trojúhelníku
     * @param x0 X souřadnice prvního bodu
     * @param y0 Y souřadnice prvního bodu
     * @param x1 X souřadnice druhého bodu
     * @param y1 Y souřadnice druhého bodu
     * @param x2 X souřadnice třetího bodu
     * @param y2 Y souřadnice třetího bodu
     * @param color barva
     */
    //% block="vykreslit trojúhelník body x0 %x0 y0 %y0 x1 %x1 y1 %y1 x2 %x2 y2 %y2 barva %color"
    //% weight=82 group="Kreslení"
    //% inlineInputMode=inline
    //% x0.min=0 x0.max=127 y0.min=0 y0.max=159
    //% x1.min=0 x1.max=127 y1.min=0 y1.max=159
    //% x2.min=0 x2.max=127 y2.min=0 y2.max=159
    export function drawTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, color: number): void {
        drawLine(x0, y0, x1, y1, color);
        drawLine(x1, y1, x2, y2, color);
        drawLine(x2, y2, x0, y0, color);
    }

    /**
     * Vykreslení vyplněného trojúhelníku
     * @param x0 X souřadnice prvního bodu
     * @param y0 Y souřadnice prvního bodu
     * @param x1 X souřadnice druhého bodu
     * @param y1 Y souřadnice druhého bodu
     * @param x2 X souřadnice třetího bodu
     * @param y2 Y souřadnice třetího bodu
     * @param color barva
     */
    //% block="vykreslit vyplněný trojúhelník body x0 %x0 y0 %y0 x1 %x1 y1 %y1 x2 %x2 y2 %y2 barva %color"
    //% weight=81 group="Kreslení"
    //% inlineInputMode=inline
    //% x0.min=0 x0.max=127 y0.min=0 y0.max=159
    //% x1.min=0 x1.max=127 y1.min=0 y1.max=159
    //% x2.min=0 x2.max=127 y2.min=0 y2.max=159
    export function fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, color: number): void {
        // Seřazení bodů podle y-souřadnice
        if (y0 > y1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }
        if (y1 > y2) {
            [x1, x2] = [x2, x1];
            [y1, y2] = [y2, y1];
        }
        if (y0 > y1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }

        if (y0 == y2) return; // Plochý trojúhelník

        let dx01 = x1 - x0;
        let dy01 = y1 - y0;
        let dx02 = x2 - x0;
        let dy02 = y2 - y0;
        let dx12 = x2 - x1;
        let dy12 = y2 - y1;
        
        // Pro každý řádek trojúhelníku
        let sa = 0, sb = 0;
        
        // První část trojúhelníku
        if (y1 == y2) last = y1; // Speciální případ
        
        for (let y = y0; y <= y2; y++) {
            let a = x0 + Math.idiv(sa, dy02);
            sa += dx02;
            
            let b;
            if (y < y1) {
                b = x0 + Math.idiv(sb, dy01);
                sb += dx01;
            } else {
                b = x1 + Math.idiv((y - y1) * dx12, dy12);
            }
            
            if (a > b) [a, b] = [b, a];
            drawLine(a, y, b, y, color);
        }
    }

    /**
     * Nastavení orientace displeje
     * @param rotation orientace displeje (0-3)
     */
    //% block="nastavit orientaci displeje %rotation"
    //% weight=95 group="Základní"
    //% rotation.min=0 rotation.max=3
    export function setRotation(rotation: number): void {
        cmd(ST7735_MADCTL)
        
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
    export function fastDrawText(text: string, x: number, y: number, color: number, bgColor?: number): void {
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

    /**
     * Vykreslení textu ve větší velikosti
     * @param text text k vykreslení
     * @param x x pozice
     * @param y y pozice
     * @param size velikost textu (1-3)
     * @param color barva textu
     * @param bgColor barva pozadí, výchozí je černá
     */
    //% block="vykreslit velký text %text na x %x y %y velikost %size barva %color || barva pozadí %bgColor"
    //% weight=79 group="Text"
    //% inlineInputMode=inline
    //% x.min=0 x.max=124 y.min=0 y.max=155
    //% size.min=1 size.max=3
    //% expandableArgumentMode="toggle"
    export function drawBigText(text: string, x: number, y: number, size: number, color: number, bgColor?: number): void {
        // Pokud bgColor není definován, použij BLACK
        const bg = (bgColor === undefined) ? BLACK : bgColor;
        
        // Zvětšování písmen pomocí duplikace pixelů
        const textLength = text.length;
        const charWidth = 3 * size;
        const charHeight = 5 * size;
        const charSpacing = size;
        const totalWidth = textLength * (charWidth + charSpacing);
        
        if (x + totalWidth > WIDTH) {
            x = WIDTH - totalWidth;
        }
        
        // Vyplnění pozadí textu
        fillRect(x, y, totalWidth, charHeight, bg);
        
        for (let charIdx = 0; charIdx < textLength; charIdx++) {
            const charCode = text.charCodeAt(charIdx) - 32;
            if (charCode < 0 || charCode >= FONT.length / 5) continue;
            
            const fontOffset = charCode * 5;
            const posX = x + charIdx * (charWidth + charSpacing);
            
            // Vykreslení většího znaku
            for (let row = 0; row < 5; row++) {
                const fontRow = FONT[fontOffset + row];
                for (let col = 0; col < 3; col++) {
                    if (fontRow & (1 << (2 - col))) {
                        // Kreslení bloku pro větší velikost
                        fillRect(posX + col * size, y + row * size, size, size, color);
                    }
                }
            }
        }
    }

    /**
     * Ukázka rychlého textu
     */
    //% block="ukázka textu"
    //% weight=60 group="Základní"
    export function textDemo(): void {
        fillColor(BLACK)

        fastDrawText("HELLO!", 40, 10, RED)
        fastDrawText("ULTRA", 40, 20, GREEN)
        fastDrawText("FAST", 40, 30, BLUE)
        fastDrawText("TEXT", 40, 40, YELLOW)
        fastDrawText("ST7735", 40, 50, MAGENTA)
        fastDrawText("DISPLAY", 40, 60, CYAN)
    }

    /**
     * Ukázka barev
     */
    //% block="ukázka barev"
    //% weight=50 group="Základní"
    export function colorDemo(): void {
        // Nejprve červená
        fillColor(RED)
        basic.pause(300)

        // Pak zelená
        fillColor(GREEN)
        basic.pause(300)

        // Pak modrá
        fillColor(BLUE)
        basic.pause(300)

        // Nakonec všechny základní barvy
        fillRect(0, 0, WIDTH, 20, BLACK)
        fillRect(0, 20, WIDTH, 20, RED)
        fillRect(0, 40, WIDTH, 20, GREEN)
        fillRect(0, 60, WIDTH, 20, BLUE)
        fillRect(0, 80, WIDTH, 20, YELLOW)
        fillRect(0, 100, WIDTH, 20, MAGENTA)
        fillRect(0, 120, WIDTH, 20, CYAN)
        fillRect(0, 140, WIDTH, 20, WHITE)
    }

    /**
     * Grafické demo s animací
     */
    //% block="spustit rozšířené grafické demo"
    //% weight=40 group="Základní"
    export function graphicsDemo(): void {
        fillColor(BLACK);
        
        // 1. Demo kruhy
        for (let i = 0; i < 5; i++) {
            const r = Math.randomRange(5, 30);
            const x = Math.randomRange(r, WIDTH - r);
            const y = Math.randomRange(r, HEIGHT - r);
            const color = color565(
                Math.randomRange(100, 255),
                Math.randomRange(100, 255),
                Math.randomRange(100, 255)
            );
            
            for (let j = 3; j <= r; j += 3) {
                drawCircle(x, y, j, color);
                basic.pause(50);
            }
        }
        
        // 2. Demo čáry
        fillColor(BLACK);
        for (let i = 0; i < 15; i++) {
            const x0 = Math.randomRange(0, WIDTH);
            const y0 = Math.randomRange(0, HEIGHT);
            const x1 = Math.randomRange(0, WIDTH);
            const y1 = Math.randomRange(0, HEIGHT);
            const color = color565(
                Math.randomRange(100, 255),
                Math.randomRange(100, 255),
                Math.randomRange(100, 255)
            );
            
            drawLine(x0, y0, x1, y1, color);
            basic.pause(100);
        }
        
        // 3. Demo trojúhelníky
        fillColor(BLACK);
        for (let i = 0; i < 5; i++) {
            const x0 = Math.randomRange(10, WIDTH - 10);
            const y0 = Math.randomRange(10, HEIGHT - 10);
            const x1 = Math.randomRange(10, WIDTH - 10);
            const y1 = Math.randomRange(10, HEIGHT - 10);
            const x2 = Math.randomRange(10, WIDTH - 10);
            const y2 = Math.randomRange(10, HEIGHT - 10);
            const color = color565(
                Math.randomRange(100, 255),
                Math.randomRange(100, 255),
                Math.randomRange(100, 255)
            );
            
            drawTriangle(x0, y0, x1, y1, x2, y2, color);
            basic.pause(200);
        }
        
        // 4. Demo obdélníky
        fillColor(BLACK);
        for (let i = 0; i < 5; i++) {
            const x = Math.randomRange(10, WIDTH - 50);
            const y = Math.randomRange(10, HEIGHT - 50);
            const w = Math.randomRange(20, 50);
            const h = Math.randomRange(20, 50);
            const color = color565(
                Math.randomRange(100, 255),
                Math.randomRange(100, 255),
                Math.randomRange(100, 255)
            );
            
            drawRect(x, y, w, h, color);
            basic.pause(200);
        }
        
        // 5. Demo text s velikostmi
        fillColor(BLACK);
        drawBigText("MICRO", 20, 40, 2, RED);
        drawBigText("BIT", 40, 60, 3, BLUE);
        drawBigText("ST7735", 20, 90, 2, GREEN);
        drawBigText("DISPLEJ", 30, 110, 2, YELLOW);
        
        // 6. Demo sloupcový graf
        basic.pause(1000);
        fillColor(BLACK);
        
        const values = [5, 10, 15, 7, 12, 8, 3, 9];
        drawBarGraph(values, 10, 140, 100, 100, MAGENTA);
    }
}