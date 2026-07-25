# STOPAZ Full Site — Final Institutional Build

Complete static deployment package for GitHub Pages. The build contains all 13 approved pages, the shared stylesheet and script, the supplied image assets, and the Exhibition music file. It uses only HTML, CSS, and vanilla JavaScript.

## Deploy to GitHub Pages

1. Upload the complete contents of this folder to the repository root. Keep the `assets` folder intact.
2. Commit the files to the branch used for GitHub Pages, normally `main`.
3. In **Repository Settings → Pages**, select **Deploy from a branch**, choose the deployment branch and the root folder, then save.
4. After deployment, open the published site and confirm that `index.html`, `about.html`, `exhibition.html`, the Antizionism room, the shared stylesheet, and every file in the `assets` folder load from the final Pages URL.

The included `.nojekyll` file tells GitHub Pages to publish the static files directly without Jekyll processing.


## Included production features

- Responsive institutional navigation with four desktop destinations
- Exhibition entrance transition and reduced-motion fallback
- Keyboard, pointer, and touch gallery controls
- Persistent Exhibition music preference and playback position
- Image-loading fades with error fallback
- Open Graph, Twitter card, favicon, and Apple touch icon metadata

Analytics, donation processing, partner logos, leadership portraits, and a custom domain are not fabricated in this package; those require approved service IDs, URLs, and image files.
