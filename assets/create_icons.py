#!/usr/bin/env python3
"""
Script pour créer des icônes placeholder pour MuslimGuard
Nécessite: pip install pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont

    def create_icon(size, filename):
        # Crée une image verte
        img = Image.new('RGB', (size, size), color='#059669')
        draw = ImageDraw.Draw(img)

        # Ajoute le texte "MG"
        font_size = size // 2
        try:
            # Essaie d'utiliser une font par défaut
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            font = ImageFont.load_default()

        text = "MG"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = (size - text_width) // 2
        y = (size - text_height) // 2

        draw.text((x, y), text, fill='white', font=font)

        img.save(filename)
        print(f"✓ {filename} créé ({size}x{size})")

    # Crée les 3 tailles
    create_icon(16, 'icon-16.png')
    create_icon(48, 'icon-48.png')
    create_icon(128, 'icon-128.png')

    print("\n✅ Icônes placeholder créées!")
    print("⚠️  Remplacez-les par de vraies icônes pour la production.")

except ImportError:
    print("❌ Pillow n'est pas installé.")
    print("Installation: pip install pillow")
    print("\nAlternativement, créez les icônes manuellement:")
    print("- icon-16.png (16x16)")
    print("- icon-48.png (48x48)")
    print("- icon-128.png (128x128)")
