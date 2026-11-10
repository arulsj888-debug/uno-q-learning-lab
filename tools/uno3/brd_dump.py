"""List the elements of Arduino's official UNO R3 board file (UNO-TH_Rev3e.brd, CC BY-SA 4.0) with position, rotation and package."""
import sys, xml.etree.ElementTree as ET
root = ET.parse(sys.argv[1]).getroot()
brd = root.find('drawing/board')
for e in brd.find('elements'):
    print(f"{e.get('name'):10s} {e.get('value') or '':22s} {e.get('package'):28s} {float(e.get('x')):8.3f} {float(e.get('y')):8.3f} {e.get('rot') or 'R0'}")
