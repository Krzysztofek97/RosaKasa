from PIL import Image

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for item in data:
        r, g, b, a = item
        # If the pixel is very close to white (background), make it transparent
        if r > 230 and g > 230 and b > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print("Saved transparent logo to", output_path)

if __name__ == "__main__":
    process_logo(
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_cropped.png",
        "c:\\Users\\Krzysztof\\antigravity\\RosaKasa\\public\\logo_transparent.png"
    )
