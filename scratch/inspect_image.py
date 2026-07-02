from PIL import Image

def analyze_borders():
    img_path = r'C:\Users\Krzysztof\.gemini\antigravity-ide\brain\99cdc558-9a4c-470b-b750-83812dd389d6\media__1782552960394.png'
    img = Image.open(img_path)
    width, height = img.size
    
    print("Top row (y=0) every 100th pixel:")
    for x in range(0, width, 100):
        print(f"x={x}: {img.getpixel((x, 0))}")
        
    print("\nBottom row (y=height-1) every 100th pixel:")
    for x in range(0, width, 100):
        print(f"x={x}: {img.getpixel((x, height - 1))}")
        
    print("\nLeft col (x=0) every 50th pixel:")
    for y in range(0, height, 50):
        print(f"y={y}: {img.getpixel((0, y))}")

if __name__ == '__main__':
    analyze_borders()
