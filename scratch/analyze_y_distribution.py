from PIL import Image

def analyze_y():
    img_path = r'C:\Users\Krzysztof\.gemini\antigravity-ide\brain\99cdc558-9a4c-470b-b750-83812dd389d6\media__1782552960394.png'
    img = Image.open(img_path).convert('RGB')
    width, height = img.size
    
    # Let's count logo pixels in each row
    row_counts = []
    for y in range(height):
        count = 0
        for x in range(width):
            if x > 900 and y > 480:
                continue
            r, g, b = img.getpixel((x, y))
            is_logo = (max(r, g, b) - min(r, g, b) > 15) or (max(r, g, b) < 170)
            if is_logo:
                count += 1
        row_counts.append((y, count))
        
    # Print rows where count is non-zero
    for y, count in row_counts:
        if count > 0:
            print(f"Row {y}: {count} pixels")

if __name__ == '__main__':
    analyze_y()
