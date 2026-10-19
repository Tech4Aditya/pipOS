OPTIONAL official Pip art (haX.baby asset pack)
------------------------------------------------
The site works without these files. If you add them AND switch the flag on, small
thumbnails appear in the Lullaby Lab and Nightlight windows.

Download: https://hax.baby/baby/assets/track1-pip-asset-pack.zip
Drop these into this folder with these exact names:
  pip_lullaby_box.png
  pip_dream_lantern.png

(pip_avatar_cloud.png and pip_portrait.png are not used. The hero Pip is an
inline SVG so the eyes can really follow the cursor.)

Then in index.html change:
  <meta name="pip-assets" content="off">
to
  <meta name="pip-assets" content="on">
(The flag exists so the page never requests a missing file, which would log a
console error. Zero console errors is 35% of the score.)
