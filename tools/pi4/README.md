# Raspberry Pi 4 texture + geometry pipeline

The Pi 4 has no official Gerber/STEP files, so the model combines:

1. **Geometry** from the official mechanical drawing (`raspberry-pi-4-mechanical-drawing.pdf`, datasheets.raspberrypi.com/rpi4/).
   `read_drawing.py <pdf>` dumps the vector paths; `drawing_outlines.py` converts them to board millimetres
   (scale from the four mounting holes: 58 × 49 mm apart, 3.5 mm from the edges) and prints each connector outline.
2. **Surface** from real CC BY-SA 4.0 photos (Wikimedia Commons):
   - top: "Raspberry Pi 4 Model B - Top.jpg" by Laserlicht
   - bottom: "Raspberry Pi 4, 2 GB RAM version 3.jpg" by Suyash Dwivedi
   Steps: `find_holes_hough.py` (top photo, Hough circles) or `find_pad_centres.py` (bottom photo, yellow pads) give the
   four mounting-hole centres in the photo → `rectify_photo.py <photo> <holes.npy> "<hole mm list>" <out.jpg> 36`
   straightens the photo onto x −4…89 mm, y −4…60 mm at 36 px/mm → `check_overlay.py` draws the official outline,
   holes, connector centres and the 40 GPIO pin positions on top so the fit can be checked by eye.
   Hole order for the top photo: (3.5,52.5) (61.5,52.5) (3.5,3.5) (61.5,3.5); for the bottom photo (seen from below):
   (61.5,3.5) (61.5,52.5) (3.5,3.5) (3.5,52.5).

Output files: `assets/pi4/pi4_top.jpg`, `assets/pi4/pi4_bottom.jpg` (CC BY-SA 4.0, derived from the photos above).
Python needs numpy, scipy, Pillow, scikit-image, PyMuPDF. Run with `python -I` from a work folder.
