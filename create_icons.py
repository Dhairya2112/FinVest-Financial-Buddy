from __future__ import annotations

import os
from dataclasses import dataclass
from PIL import Image, ImageDraw, ImageFilter

# ---- Reference-matched colors (sampled from the source icon) ----------
BG_COLOR = (10, 10, 10, 255)
DARK_GREEN = (4, 78, 59, 255)     # recessed back arms
NEON_GREEN = (34, 197, 94, 255)   # front spine
SHADOW_COLOR = (0, 0, 0, 150)

@dataclass(frozen=True)
class IconGeometry:
    """All coordinates are in a virtual 512x512 design space and get
    scaled to whatever the final render size is."""
    canvas: int = 512
    stroke_width: float = 68.0
    corner_radius_ratio: float = 0.22

    spine_top: tuple = (200, 128)
    spine_bottom: tuple = (200, 382)

    top_arm_start: tuple = (200, 160)
    top_arm_end: tuple = (345, 160)

    mid_arm_start: tuple = (200, 272)
    mid_arm_end: tuple = (300, 272)

    shadow_blur: float = 10.0
    shadow_offset: tuple = (6, 6)

def _draw_pill(draw: ImageDraw.ImageDraw, start, end, width: float, fill) -> None:
    """A pill = a straight line body + two circular end caps, so the
    caps are always mathematically perfect (no polygon approximation)."""
    x1, y1 = start
    x2, y2 = end
    r = width / 2
    draw.line([start, end], fill=fill, width=max(1, round(width)))
    draw.ellipse([x1 - r, y1 - r, x1 + r, y1 + r], fill=fill)
    draw.ellipse([x2 - r, y2 - r, x2 + r, y2 + r], fill=fill)

def render_icon(size: int, geometry: IconGeometry = IconGeometry(), supersample: int = 8) -> Image.Image:
    """Render the icon at `size`x`size` px, supersampled `supersample`x internally."""
    render = size * supersample
    scale = render / geometry.canvas

    def pt(p):
        return (p[0] * scale, p[1] * scale)

    width = geometry.stroke_width * scale
    corner_radius = render * geometry.corner_radius_ratio

    # 1. Rounded-rect background mask
    bg_mask = Image.new("L", (render, render), 0)
    ImageDraw.Draw(bg_mask).rounded_rectangle(
        [0, 0, render - 1, render - 1], radius=corner_radius, fill=255
    )
    canvas = Image.new("RGBA", (render, render), (0, 0, 0, 0))
    canvas.paste(Image.new("RGBA", (render, render), BG_COLOR), (0, 0), bg_mask)

    # 2. Back arms
    arms = Image.new("RGBA", (render, render), (0, 0, 0, 0))
    arms_draw = ImageDraw.Draw(arms)
    _draw_pill(arms_draw, pt(geometry.top_arm_start), pt(geometry.top_arm_end), width, DARK_GREEN)
    _draw_pill(arms_draw, pt(geometry.mid_arm_start), pt(geometry.mid_arm_end), width, DARK_GREEN)

    # 3. Soft shadow cast by the spine
    shadow = Image.new("RGBA", (render, render), (0, 0, 0, 0))
    _draw_pill(ImageDraw.Draw(shadow), pt(geometry.spine_top), pt(geometry.spine_bottom), width, SHADOW_COLOR)
    shadow = shadow.filter(ImageFilter.GaussianBlur(geometry.shadow_blur * scale))
    shadow_offset = Image.new("RGBA", (render, render), (0, 0, 0, 0))
    ox, oy = geometry.shadow_offset
    shadow_offset.paste(shadow, (round(ox * scale), round(oy * scale)), shadow)

    # 4. Front spine
    spine = Image.new("RGBA", (render, render), (0, 0, 0, 0))
    _draw_pill(ImageDraw.Draw(spine), pt(geometry.spine_top), pt(geometry.spine_bottom), width, NEON_GREEN)

    # Composite, then re-clip to the rounded mask so shadow can't escape the corners
    out = Image.alpha_composite(canvas, arms)
    out = Image.alpha_composite(out, shadow_offset)
    out = Image.alpha_composite(out, spine)
    clipped = Image.new("RGBA", (render, render), (0, 0, 0, 0))
    clipped.paste(out, (0, 0), bg_mask)

    # 5. Downsample -> real anti-aliasing
    return clipped.resize((size, size), Image.LANCZOS)

def create_icon(size: int, filename: str, out_dir: str = "out", supersample: int = 8) -> str:
    img = render_icon(size, supersample=supersample)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, filename)
    img.save(path, optimize=True)
    print(f"Created {path} ({size}x{size}, {supersample}x supersampled)")
    return path

if __name__ == "__main__":
    out_dir = "frontend/public"
    sizes = {
        192: "icon-192.png",   # PWA
        512: "icon-512.png",   # PWA / store listing
    }
    for size, name in sizes.items():
        create_icon(size, name, out_dir=out_dir)
