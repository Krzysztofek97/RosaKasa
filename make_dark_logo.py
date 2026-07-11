from PIL import Image

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for r, g, b, a in data:
        # Check if pixel is gray/white (background)
        is_gray = abs(r-g) < 20 and abs(g-b) < 20 and abs(r-b) < 20
        
        if is_gray and r > 200:
            # Make white and light gray background transparent
            # Calculate alpha based on how dark it is (for anti-aliasing)
            # 255 -> 0 alpha. 200 -> 255 alpha.
            alpha = max(0, min(255, int((255 - r) * 4.6)))
            if r > 240:
                alpha = 0
            new_data.append((255, 255, 255, alpha))
        elif is_gray and r < 100:
            # Check if pixel is dark (text)
            # Invert dark colors to light, keep original alpha
            new_data.append((255 - r, 255 - g, 255 - b, a))
        else:
            # Keep colored pixels (envelope icon) exactly as they are
            new_data.append((r, g, b, a))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print("Saved logo_dark.png")

if __name__ == "__main__":
    process_logo(
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_cropped.png",
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_dark.png"
    )
