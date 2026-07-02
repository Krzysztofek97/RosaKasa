import collections
from PIL import Image, ImageFilter

def create_logos():
    # Load the original image
    img_path = r'C:\Users\Krzysztof\.gemini\antigravity-ide\brain\99cdc558-9a4c-470b-b750-83812dd389d6\media__1782552960394.png'
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    
    # 1. Bounding box coordinates
    # Full logo bounding box (including tagline):
    # X: 163..860, Y: 142..411
    # Simple logo bounding box (excluding tagline):
    # X: 163..860, Y: 142..380
    
    padding = 20
    
    # Crop boxes
    box_full = (
        max(0, 163 - padding),
        max(0, 142 - padding),
        min(width, 860 + padding),
        min(height, 411 + padding)
    )
    box_simple = (
        max(0, 163 - padding),
        max(0, 142 - padding),
        min(width, 860 + padding),
        min(height, 380 + padding)
    )
    
    print(f"Full Crop Box: {box_full}")
    print(f"Simple Crop Box: {box_simple}")
    
    def process_and_save(crop_box, filename):
        cropped = img.crop(crop_box)
        c_width, c_height = cropped.size
        
        # Border samples for background reference
        border_pixels = []
        for x in range(c_width):
            border_pixels.append(cropped.getpixel((x, 0))[:3])
            border_pixels.append(cropped.getpixel((x, c_height - 1))[:3])
        for y in range(c_height):
            border_pixels.append(cropped.getpixel((0, y))[:3])
            border_pixels.append(cropped.getpixel((c_width - 1, y))[:3])
            
        avg_r = sum(p[0] for p in border_pixels) / len(border_pixels)
        avg_g = sum(p[1] for p in border_pixels) / len(border_pixels)
        avg_b = sum(p[2] for p in border_pixels) / len(border_pixels)
        ref_bg = (avg_r, avg_g, avg_b)
        
        visited = set()
        queue = collections.deque()
        
        # Add borders to queue
        for x in range(c_width):
            queue.append((x, 0))
            queue.append((x, c_height - 1))
            visited.add((x, 0))
            visited.add((x, c_height - 1))
        for y in range(1, c_height - 1):
            queue.append((0, y))
            queue.append((c_width - 1, y))
            visited.add((0, y))
            visited.add((c_width - 1, y))
            
        def is_pixel_bg(color):
            r, g, b = color[:3]
            dist = ((r - ref_bg[0])**2 + (g - ref_bg[1])**2 + (b - ref_bg[2])**2)**0.5
            is_gray = max(r, g, b) - min(r, g, b) < 22
            is_light = max(r, g, b) > 165
            return dist < 45 or (is_gray and is_light)
            
        bg_mask = Image.new('L', (c_width, c_height), 0)
        
        while queue:
            cx, cy = queue.popleft()
            color = cropped.getpixel((cx, cy))
            if is_pixel_bg(color):
                bg_mask.putpixel((cx, cy), 255)
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < c_width and 0 <= ny < c_height:
                        if (nx, ny) not in visited:
                            visited.add((nx, ny))
                            queue.append((nx, ny))
                            
        # Blur the mask for smooth anti-aliased edge
        bg_mask_blurred = bg_mask.filter(ImageFilter.GaussianBlur(radius=1.2))
        
        pixels = cropped.load()
        mask_pixels = bg_mask_blurred.load()
        
        for y in range(c_height):
            for x in range(c_width):
                r, g, b, a = pixels[x, y]
                bg_val = mask_pixels[x, y]
                new_a = int(max(0, min(255, 255 - bg_val)))
                pixels[x, y] = (r, g, b, min(a, new_a))
                
        cropped.save(f'public/{filename}', 'PNG')
        print(f"Saved public/{filename} ({c_width}x{c_height})")
        
    process_and_save(box_full, 'logo.png')
    process_and_save(box_simple, 'logo_simple.png')

if __name__ == '__main__':
    create_logos()
