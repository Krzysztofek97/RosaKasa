from PIL import Image

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for r, g, b, a in data:
        # Calculate perceived luminance (0-255)
        lum = (r * 299 + g * 587 + b * 114) / 1000
        
        # 1. Smoothly remove the white background
        new_a = a
        if lum > 240:
            new_a = 0
        elif lum > 180:
            # Smooth transition for anti-aliased edges
            # lum=240 -> a=0; lum=180 -> a=original_a
            factor = (240 - lum) / 60.0
            new_a = int(a * factor)
            
        # 2. Make dark text white for dark mode
        new_r, new_g, new_b = r, g, b
        if r < 120 and g < 120 and b < 120:
            # It's dark text. Convert to white, but keep its lightness variation
            # e.g. a pixel of (50,50,50) becomes (255,255,255)
            # A pixel of (100,100,100) becomes (200,200,200)
            lightness = max(r, g, b)
            new_val = 255 - lightness
            new_r, new_g, new_b = new_val, new_val, new_val
            
        new_data.append((new_r, new_g, new_b, new_a))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    process_logo(
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_cropped.png",
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_dark.png"
    )
