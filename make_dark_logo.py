from PIL import Image

def perfect_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    new_data = []
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            
            # 1. Remove pure white / very light gray background everywhere
            if r > 230 and g > 230 and b > 230:
                new_data.append((255, 255, 255, 0))
            # 2. Invert dark text to white, BUT ONLY ON THE RIGHT SIDE of the image
            elif x > width * 0.4 and r < 100 and g < 100 and b < 100:
                # Text is dark, make it pure white for dark mode
                new_data.append((255, 255, 255, a))
            # 3. Everything else is completely untouched! (The envelope on the left remains 100% original)
            else:
                new_data.append((r, g, b, a))
                
    img2 = Image.new("RGBA", (width, height))
    img2.putdata(new_data)
    img2.save(output_path, "PNG")

if __name__ == "__main__":
    perfect_logo(
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_cropped.png",
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_dark.png"
    )
