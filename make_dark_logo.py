from PIL import Image
import colorsys

def perfect_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for r, g, b, a in data:
        h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
        
        # If it's a bright, unsaturated pixel (white/gray background or JPEG noise)
        if v > 0.6 and s < 0.2:
            new_data.append((255, 255, 255, 0))
        # If it's a dark, unsaturated pixel (dark blue/black text)
        elif v < 0.5 and s < 0.3:
            # Change to white so it's readable on dark mode
            new_data.append((255, 255, 255, a))
        else:
            # Keep colored envelope
            new_data.append((r, g, b, a))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    perfect_logo(
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_cropped.png",
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_dark.png"
    )
