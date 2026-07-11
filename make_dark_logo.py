from PIL import Image

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for r, g, b, a in data:
        # If the pixel is dark and grayish (likely the dark blue/black text)
        if r < 120 and g < 120 and b < 120 and abs(r-g) < 30 and abs(g-b) < 30:
            # Make it light for dark mode, KEEP ORIGINAL ALPHA
            lightness = max(r, g, b)
            new_val = min(255, 255 - lightness + 50)  # make it nice and bright white
            new_data.append((new_val, new_val, new_val, a))
        else:
            # Keep all other pixels EXACTLY THE SAME (including original alpha)
            new_data.append((r, g, b, a))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print("Saved logo_dark.png with original alpha!")

if __name__ == "__main__":
    process_logo(
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_cropped.png",
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_dark.png"
    )
